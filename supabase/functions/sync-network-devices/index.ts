import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-sync-token, x-device-sync-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

type IncomingDevice = {
  name?: string
  type?: string | null
  external_id?: string | null
  source?: string | null
  status?: string | null
  connectivity_status?: string | null
  room_id?: number | null
  room_name?: string | null
  room_hint?: string | null
  manufacturer?: string | null
  model?: string | null
  ip_address?: string | null
  mac_address?: string | null
  metadata?: Record<string, unknown> | null
  capabilities?: Record<string, unknown> | null
  status_level?: number | null
}

const ROOM_ALIASES: Record<string, string[]> = {
  'living room': ['living room', 'sala', 'salon', 'lounge', 'tv room'],
  bedroom: ['bedroom', 'quarto', 'master bedroom', 'guest room'],
  kitchen: ['kitchen', 'cozinha'],
  bathroom: ['bathroom', 'casa de banho', 'wc', 'toilet'],
}

const DEVICE_TYPE_ROOM_FALLBACKS: Record<string, string[]> = {
  tv: ['living room'],
  display: ['living room'],
  speaker: ['living room', 'bedroom'],
  assistant: ['living room', 'kitchen', 'bedroom'],
  coffee: ['kitchen'],
  appliance: ['kitchen'],
  heater: ['bathroom', 'bedroom'],
}

const normalizeSource = (value?: string | null) =>
  String(value ?? 'network').trim().toLowerCase() || 'network'

const normalizeStatus = (value?: string | null) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (['on', 'playing', 'connected', 'online'].includes(normalized)) return 'On'
  if (['off', 'offline', 'disconnected'].includes(normalized)) return 'Off'
  return 'Off'
}

const normalizeConnectivity = (value?: string | null, status?: string | null) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'online' || normalized === 'offline') return normalized

  const normalizedStatus = String(status ?? '').trim().toLowerCase()
  if (['connected', 'online', 'on', 'playing'].includes(normalizedStatus)) return 'online'
  if (['offline', 'disconnected', 'off'].includes(normalizedStatus)) return 'offline'
  return 'unknown'
}

const PERSONAL_DEVICE_HINTS = [
  'iphone',
  'android',
  'smartphone',
  'phone',
  'mobile',
  'cellphone',
  'ipad',
  'tablet',
  'laptop',
  'macbook',
  'notebook',
  'desktop',
  'computer',
  ' pc ',
]

const shouldIgnoreIncomingDevice = (device: IncomingDevice) => {
  const normalizedType = String(device.type ?? '').trim().toLowerCase()
  if (normalizedType === 'computer') return true

  const searchable = [
    device.name,
    device.type,
    device.manufacturer,
    device.model,
    device.external_id,
    JSON.stringify(device.metadata ?? {}),
  ]
    .map((value) => ` ${String(value ?? '').toLowerCase()} `)
    .join(' ')

  return PERSONAL_DEVICE_HINTS.some((hint) => searchable.includes(` ${hint} `))
}

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    }
  }

  if (typeof error === 'object' && error !== null) {
    return error
  }

  return { message: String(error) }
}

const inferRoomId = (
  device: IncomingDevice,
  roomNameToId: Map<string, number>,
  existingRoomId?: number | null,
) => {
  if (device.room_id) return device.room_id

  const candidates = [device.room_name, device.room_hint, device.name]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean)

  for (const candidate of candidates) {
    for (const [canonicalRoomName, aliases] of Object.entries(ROOM_ALIASES)) {
      if (!aliases.some((alias) => candidate.includes(alias))) continue

      for (const [roomName, roomId] of roomNameToId.entries()) {
        if (roomName === canonicalRoomName || aliases.includes(roomName)) {
          return roomId
        }
      }
    }
  }

  for (const candidate of candidates) {
    for (const [roomName, roomId] of roomNameToId.entries()) {
      if (candidate.includes(roomName)) return roomId
    }
  }

  const normalizedType = String(device.type ?? '').trim().toLowerCase()
  const preferredRooms = DEVICE_TYPE_ROOM_FALLBACKS[normalizedType] ?? []
  for (const preferredRoom of preferredRooms) {
    for (const [roomName, roomId] of roomNameToId.entries()) {
      if (roomName === preferredRoom) return roomId
    }
  }

  return existingRoomId ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const expectedSharedSecret = Deno.env.get('DEVICE_SYNC_SHARED_SECRET') ?? ''

    const tokenFromHeader = req.headers.get('x-device-sync-token')
    const payload = await req.json()
    const syncToken = String(tokenFromHeader ?? '').trim()
    const providedSharedSecret = String(req.headers.get('x-device-sync-secret') ?? '').trim()
    const syncSource = String(payload?.syncSource ?? 'ssdp').trim().toLowerCase()
    const mode = payload?.mode === 'upsert-only' ? 'upsert-only' : 'snapshot'
    const devices = Array.isArray(payload?.devices) ? payload.devices as IncomingDevice[] : []

    if (!syncToken) throw new Error('Missing device sync token.')
    if (expectedSharedSecret && providedSharedSecret !== expectedSharedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: home, error: homeError } = await supabase
      .from('homes')
      .select('id, name')
      .eq('device_sync_token', syncToken)
      .maybeSingle()

    if (homeError || !home) throw new Error('Invalid device sync token.')

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('home_id', home.id)

    if (roomsError) throw roomsError

    const roomNameToId = new Map<string, number>()
    for (const room of rooms ?? []) {
      roomNameToId.set(String(room.name).trim().toLowerCase(), room.id)
    }

    let { data: existingDevices, error: existingError } = await supabase
      .from('devices')
      .select('id, external_id, room_id, source')
      .eq('home_id', home.id)
      .eq('sync_source', syncSource)

    if (existingError?.code === '42703') {
      const fallbackExisting = await supabase
        .from('devices')
        .select('id, external_id, room_id, source')
        .eq('home_id', home.id)

      existingDevices = fallbackExisting.data
      existingError = fallbackExisting.error
    }

    if (existingError) throw existingError

    const existingByKey = new Map<string, { id: number; room_id: number | null }>()
    for (const device of existingDevices ?? []) {
      const key = `${normalizeSource(device.source)}::${String(device.external_id ?? '')}`
      existingByKey.set(key, { id: device.id, room_id: device.room_id })
    }

    const now = new Date().toISOString()
    const seenExternalIds = new Set<string>()
    const upserts = []
    let ignored = 0

    for (const device of devices) {
      const externalId = String(device.external_id ?? '').trim()
      const name = String(device.name ?? '').trim()

      if (!externalId || !name) continue
      if (shouldIgnoreIncomingDevice(device)) {
        ignored += 1
        continue
      }

      const source = normalizeSource(device.source)
      const existing = existingByKey.get(`${source}::${externalId}`)
      const roomId = inferRoomId(device, roomNameToId, existing?.room_id)
      const status = normalizeStatus(device.status)
      const connectivityStatus = normalizeConnectivity(device.connectivity_status, device.status)

      seenExternalIds.add(externalId)
      upserts.push({
        id: existing?.id,
        name,
        type: device.type ?? 'unknown',
        source,
        status,
        connectivity_status: connectivityStatus,
        user_id: null,
        home_id: home.id,
        external_id: externalId,
        room_id: roomId,
        room_hint: device.room_hint ?? device.room_name ?? null,
        manufacturer: device.manufacturer ?? null,
        model: device.model ?? null,
        ip_address: device.ip_address ?? null,
        mac_address: device.mac_address ?? null,
        metadata: device.metadata ?? {},
        capabilities: device.capabilities ?? {},
        status_level: device.status_level ?? 0,
        discovery_method: syncSource === 'ssdp' ? 'ssdp' : 'integration',
        sync_source: syncSource,
        last_seen: now,
        last_state_at: now,
      })
    }

    let synced = 0
    if (upserts.length > 0) {
      for (const device of upserts) {
        let operation

        if (device.id) {
          operation = supabase
            .from('devices')
            .update(device)
            .eq('id', device.id)
            .select('id')
            .single()
        } else {
          operation = supabase
            .from('devices')
            .insert(device)
            .select('id')
            .single()
        }

        let { error: writeError } = await operation

        if (writeError?.code === '42703') {
          const legacyDevice = {
            name: device.name,
            type: device.type,
            source: device.source,
            status: device.status,
            user_id: device.user_id,
            home_id: device.home_id,
            external_id: device.external_id,
            room_id: device.room_id,
            manufacturer: device.manufacturer,
            model: device.model,
            ip_address: device.ip_address,
            mac_address: device.mac_address,
            status_level: device.status_level,
            last_seen: device.last_seen,
          }

          const fallbackOperation = device.id
            ? supabase
                .from('devices')
                .update(legacyDevice)
                .eq('id', device.id)
                .select('id')
                .single()
            : supabase
                .from('devices')
                .insert(legacyDevice)
                .select('id')
                .single()

          const fallbackResult = await fallbackOperation
          writeError = fallbackResult.error
        }

        if (writeError) throw writeError
        synced += 1
      }
    }

    let offlineMarked = 0
    if (mode === 'snapshot') {
      const unseenIds = (existingDevices ?? [])
        .filter((device) => {
          const externalId = String(device.external_id ?? '').trim()
          return externalId && !seenExternalIds.has(externalId)
        })
        .map((device) => device.id)

      if (unseenIds.length > 0) {
        let { data: offlineDevices, error: offlineError } = await supabase
          .from('devices')
          .update({
            status: 'Off',
            connectivity_status: 'offline',
            last_state_at: now,
          })
          .in('id', unseenIds)
          .select('id')

        if (offlineError?.code === '42703') {
          const fallbackOffline = await supabase
            .from('devices')
            .update({
              status: 'Off',
            })
            .in('id', unseenIds)
            .select('id')

          offlineDevices = fallbackOffline.data
          offlineError = fallbackOffline.error
        }

        if (offlineError) throw offlineError
        offlineMarked = offlineDevices?.length ?? 0
      }
    }

    return new Response(
      JSON.stringify({
        homeId: home.id,
        syncSource,
        synced,
        offlineMarked,
        ignored,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: serializeError(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
