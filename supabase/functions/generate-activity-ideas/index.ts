import { createClient } from '@supabase/supabase-js'
import {
  IMAGE_KEYS,
  type GeminiIdea,
  type RoomRow,
  type UserState,
  clampPositiveInteger,
  clampText,
  evaluateRateLimit,
  fallbackIdeas,
  getMoodDirective,
  normalizeIdeas,
  parseJsonObject,
  slugify,
} from './lib.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

type DeviceRow = {
  id: number
  name: string
  type: string | null
  room_id: number | null
  status: string | null
  connectivity_status?: string | null
  status_level?: number | null
}

type SpotifyPlaylistSummary = {
  id?: string
  name?: string
}

const normalizeActivityType = (value: unknown) => {
  const raw = String(value ?? '').toLowerCase()
  if (raw.includes('cook')) return 'cooking'
  if (raw.includes('meditat')) return 'meditation'
  if (raw.includes('workout') || raw.includes('stretch') || raw.includes('yoga')) return 'workout'
  if (raw.includes('audio') || raw.includes('read') || raw.includes('book')) return 'audiobooks'
  return 'other'
}

const getRelevantDeviceIds = (devices: DeviceRow[], activityType: string) => {
  const normalizedType = normalizeActivityType(activityType)
  const priorityByType: Record<string, string[]> = {
    meditation: ['speaker', 'assistant', 'light', 'difuser', 'diffuser', 'purifier', 'tv', 'display'],
    cooking: ['light', 'speaker', 'assistant', 'display', 'tv', 'appliance', 'coffee', 'outlet'],
    workout: ['speaker', 'tv', 'display', 'light', 'purifier'],
    audiobooks: ['speaker', 'assistant', 'light', 'tv', 'display'],
    other: ['speaker', 'light', 'tv', 'display', 'purifier'],
  }

  const priorities = priorityByType[normalizedType] ?? priorityByType.other
  const ranked = devices
    .map((device) => ({
      device,
      priority: priorities.findIndex((item) => item === String(device.type ?? '').toLowerCase()),
    }))
    .filter(({ priority }) => priority >= 0)
    .sort((left, right) => left.priority - right.priority)
    .map(({ device }) => device)

  const selected = ranked.length > 0 ? ranked : devices
  return selected.slice(0, 5).map((device) => device.id)
}

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== 'string') return fallback

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false
    default:
      return fallback
  }
}

class HttpError extends Error {
  status: number
  payload: Record<string, unknown>

  constructor(status: number, message: string, payload: Record<string, unknown> = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.payload = payload
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GOOGLE_AI_API_KEY') ?? ''
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
    const geminiEnabled = parseBooleanEnv(Deno.env.get('ENABLE_GEMINI_API'), true)
    const aiRateLimitEnabled = parseBooleanEnv(Deno.env.get('ENABLE_AI_RATE_LIMIT'), true)
    const maxRequestsPerHour = clampPositiveInteger(Deno.env.get('AI_IDEAS_MAX_REQUESTS_PER_HOUR'), 10, 1, 500)
    const minSecondsBetweenRequests = clampPositiveInteger(Deno.env.get('AI_IDEAS_MIN_SECONDS_BETWEEN_REQUESTS'), 30, 1, 3600)
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) throw new Error('Missing authorization header.')

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('Invalid session.')

    const body = await req.json().catch(() => ({}))
    const mood = clampText(body?.mood, 'RELAXED', 40) as UserState
    const activeFilter = clampText(body?.activeFilter, 'All', 40)
    const promptHint = clampText(body?.prompt, '', 220)
    const localTime = clampText(body?.localTime, new Date().toISOString(), 80)
    const source = clampText(body?.source, 'app', 40)
    const action = clampText(body?.action, 'generate', 20)
    const spotifyPlaylists = Array.isArray(body?.spotifyPlaylists)
      ? (body.spotifyPlaylists as SpotifyPlaylistSummary[])
          .slice(0, 20)
          .map((playlist) => ({
            id: clampText(playlist?.id, '', 120),
            name: clampText(playlist?.name, '', 120),
          }))
          .filter((playlist) => playlist.id && playlist.name)
      : []

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: homeAssoc, error: homeError } = await supabase
      .from('user_homes')
      .select('home_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (homeError) throw homeError
    if (!homeAssoc?.home_id) throw new Error('No home connected to this user.')

    const homeId = homeAssoc.home_id

    if (action === 'save') {
      const idea = body?.idea ?? {}
      const normalizedIdea = normalizeIdeas([idea], [])[0]
      const contentId = `ai_${homeId}_${user.id.slice(0, 8)}_${Date.now()}_${slugify(normalizedIdea.title)}`

      const { data: createdContent, error: contentError } = await supabase
        .from('contents')
        .insert({
          id: contentId,
          title: normalizedIdea.contentTitle,
          description: normalizedIdea.description,
          type: normalizedIdea.contentType,
          category: normalizedIdea.contentCategory,
          duration: `${normalizedIdea.durationMinutes} min`,
          image: normalizedIdea.image,
          instructions: normalizedIdea.instructions,
          ingredients: normalizedIdea.ingredients,
          author: 'Nidush AI',
        })
        .select('id')
        .single()

      if (contentError) throw contentError

      const roomDevices = normalizedIdea.roomId
        ? ((await supabase
            .from('devices')
            .select('id, name, type, room_id, status, connectivity_status, status_level')
            .eq('home_id', homeId)
            .eq('room_id', normalizedIdea.roomId)
            .limit(20)).data ?? []) as DeviceRow[]
        : []

      const linkedDeviceIds = getRelevantDeviceIds(roomDevices, normalizedIdea.type)

      let scenarioId: number | null = null
      const playlistId = normalizedIdea.playlistId ?? null
      const playlistName = normalizedIdea.playlistName ?? null

      if (normalizedIdea.roomId || playlistId || playlistName) {
        const baseScenarioPayload = {
          name: `${clampText(normalizedIdea.title, 'AI Activity', 50)} Scene`,
          room_id: normalizedIdea.roomId,
          playlist_id: playlistId,
        }

        const fullScenarioPayload = {
          ...baseScenarioPayload,
          description: clampText(
            `${normalizedIdea.description} ${normalizedIdea.devicePlan.join('. ')}`.trim(),
            normalizedIdea.description,
            220,
          ),
          playlist_name: playlistName,
          image: normalizedIdea.image,
          focus_mode_enabled: ['Meditation', 'Audiobooks', 'Reading', 'Yoga'].includes(normalizedIdea.type),
          shortcuts: false,
        }

        let scenarioInsert = await supabase
          .from('scenarios')
          .insert(fullScenarioPayload)
          .select('id')
          .single()

        if (
          scenarioInsert.error &&
          (scenarioInsert.error.code === '42703' || scenarioInsert.error.code === 'PGRST204')
        ) {
          scenarioInsert = await supabase
            .from('scenarios')
            .insert(baseScenarioPayload)
            .select('id')
            .single()
        }

        if (!scenarioInsert.error && scenarioInsert.data?.id) {
          scenarioId = Number(scenarioInsert.data.id)
        }
      }

      const { data: createdActivity, error: activityError } = await supabase
        .from('activities')
        .insert({
          title: normalizedIdea.title,
          description: normalizedIdea.description,
          image: normalizedIdea.image,
          category: 'My creations',
          type: normalizedIdea.type,
          content_id: createdContent.id,
          scenario_id: scenarioId,
          room_id: normalizedIdea.roomId,
          home_id: homeId,
          user_id: user.id,
          focus_mode_enabled: false,
          shortcuts: false,
        })
        .select('*, id')
        .single()

      if (activityError) throw activityError

      if (linkedDeviceIds.length > 0) {
        const { error: linkError } = await supabase
          .from('activity_devices')
          .insert(
            linkedDeviceIds.map((deviceId) => ({
              activity_id: createdActivity.id,
              device_id: deviceId,
            })),
          )

        if (linkError) {
          console.warn('Failed to link AI activity devices.', linkError)
        }
      }

      return new Response(
        JSON.stringify({
          homeId,
          content: createdContent,
          activity: createdActivity,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (aiRateLimitEnabled) {
      const oneHourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const [{ count: recentRequestCount, error: countError }, { data: lastRequest, error: lastError }] = await Promise.all([
        supabase
          .from('ai_generation_requests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', oneHourAgoIso),
        supabase
          .from('ai_generation_requests')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (countError) throw countError
      if (lastError) throw lastError

      const rateLimitDecision = evaluateRateLimit({
        recentRequestCount: recentRequestCount ?? 0,
        maxRequestsPerHour,
        minSecondsBetweenRequests,
        lastRequestAt: lastRequest?.created_at,
      })

      if (!rateLimitDecision.allowed) {
        throw new HttpError(
          429,
          rateLimitDecision.reason === 'hourly_quota'
            ? `Hourly AI limit reached. Try again in about ${Math.ceil(rateLimitDecision.retryAfterSeconds / 60)} minutes.`
            : `Please wait ${rateLimitDecision.retryAfterSeconds} seconds before requesting more AI ideas.`,
          {
            code: 'ai_rate_limit_exceeded',
            retryAfterSeconds: rateLimitDecision.retryAfterSeconds,
            reason: rateLimitDecision.reason,
            limits: {
              maxRequestsPerHour,
              minSecondsBetweenRequests,
            },
          },
        )
      }

      const { error: insertRateLogError } = await supabase
        .from('ai_generation_requests')
        .insert({
          user_id: user.id,
          home_id: homeId,
          source,
          request_action: action,
          model_requested: geminiEnabled && geminiApiKey ? geminiModel : 'local-fallback',
        })

      if (insertRateLogError) throw insertRateLogError
    }

    const [{ data: rooms }, { data: devices }, { data: recentActivities }, { data: profile }] = await Promise.all([
      supabase
        .from('rooms')
        .select('id, name')
        .eq('home_id', homeId)
        .order('id', { ascending: true }),
      supabase
        .from('devices')
        .select('id, name, type, room_id, status, connectivity_status, status_level')
        .eq('home_id', homeId)
        .limit(60),
      supabase
        .from('activities')
        .select('title, type, room_id')
        .eq('home_id', homeId)
        .order('id', { ascending: false })
        .limit(12),
      supabase
        .from('users')
        .select('hobbies, first_name')
        .eq('auth_uid', user.id)
        .maybeSingle(),
    ])

    const safeRooms = (rooms ?? []) as RoomRow[]
    const safeDevices = (devices ?? []) as DeviceRow[]
    const roomById = new Map(safeRooms.map((room) => [room.id, room.name]))
    const deviceSummary = safeDevices.map((device) => ({
      name: device.name,
      type: device.type,
      room: device.room_id ? roomById.get(device.room_id) ?? 'Unknown' : 'Unassigned',
      status: device.connectivity_status ?? device.status ?? 'unknown',
    }))

    let rawIdeas: GeminiIdea[] = []

    let modelUsed = 'local-fallback'
    const moodDirective = getMoodDirective(mood)

    if (geminiEnabled && geminiApiKey) {
      try {
        const prompt = [
          'You are Nidush, a smart home wellbeing assistant.',
          'Create exactly 5 personalized activity ideas for this home.',
          'Use the real rooms and devices. Avoid duplicating recent activity titles.',
          `Emotional state to optimize for: ${mood}. ${moodDirective.summary}`,
          'The emotional state is the main driver of your suggestions. Adapt intensity, duration, room choice, and wording to match it.',
          ...moodDirective.guidance,
          'When a Spotify playlist fits, choose one from the provided Spotify playlists and return both playlistId and playlistName.',
          'Use only the real device types available in the selected room when writing the devicePlan.',
          'Return JSON only with this shape:',
          '{"ideas":[{"title":"string","description":"string","type":"Cooking|Meditation|Workout|Audiobooks|Yoga|Reading|other","roomName":"one of the provided room names","durationMinutes":number,"image":"one of the allowed image keys","reason":"short reason","devicePlan":["short action"],"playlistId":"spotify playlist id when relevant","playlistName":"playlist name when relevant","contentTitle":"string","contentType":"recipe|audio|exercise|video","contentCategory":"cooking|meditation|workout|audiobook|general","ingredients":[{"item":"string","amount":"string"}],"instructions":[{"text":"string","duration":number}]}]}',
          `Allowed image keys: ${IMAGE_KEYS.join(', ')}`,
        `Current mood/state: ${mood}`,
        `Active app filter: ${activeFilter}`,
        `Local user time: ${localTime}`,
        `Recommendation surface: ${source}`,
        `User hobbies/preferences: ${JSON.stringify(profile?.hobbies ?? [])}`,
        promptHint ? `User hint: ${promptHint}` : '',
        `Rooms: ${JSON.stringify(safeRooms.map((room) => room.name))}`,
        `Devices: ${JSON.stringify(deviceSummary)}`,
        `Spotify playlists: ${JSON.stringify(spotifyPlaylists)}`,
        `Recent activities: ${JSON.stringify(recentActivities ?? [])}`,
        'For cooking ideas, include concrete ingredients and ordered recipe steps.',
        'For workout or yoga ideas, include ordered exercise steps with durations in seconds.',
        'For meditation, reading, or audiobook ideas, include ordered guidance steps.',
      ].filter(Boolean).join('\n')

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.85,
                responseMimeType: 'application/json',
              },
            }),
          },
        )

        if (!geminiResponse.ok) {
          const details = await geminiResponse.text()
          throw new Error(`Gemini request failed: ${details}`)
        }

        const geminiData = await geminiResponse.json()
        const text = geminiData?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? '')
          .join('')

        if (!text) throw new Error('Gemini returned an empty response.')

        const parsed = parseJsonObject(text)
        rawIdeas = Array.isArray(parsed?.ideas) ? parsed.ideas : []
        modelUsed = geminiModel
      } catch (error) {
        console.warn('Gemini generation failed; using local fallback ideas.', error)
        rawIdeas = fallbackIdeas(safeRooms, mood)
      }
    } else {
      rawIdeas = fallbackIdeas(safeRooms, mood)
    }

    const normalizedIdeas = normalizeIdeas(rawIdeas, safeRooms)
    const fallbackNormalizedIdeas = normalizeIdeas(fallbackIdeas(safeRooms, mood), safeRooms)

    return new Response(
      JSON.stringify({
        homeId,
        model: normalizedIdeas.length > 0 ? modelUsed : 'local-fallback',
        ideas: normalizedIdeas.length > 0 ? normalizedIdeas : fallbackNormalizedIdeas,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 400
    const message = error instanceof Error ? error.message : String(error)
    const extraPayload = error instanceof HttpError ? error.payload : {}
    return new Response(
      JSON.stringify({ error: message, ...extraPayload }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
