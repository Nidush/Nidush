import { createClient } from '@supabase/supabase-js'
import {
  IMAGE_KEYS,
  type GeminiIdea,
  type RoomRow,
  type UserState,
  clampText,
  fallbackIdeas,
  getMoodDirective,
  normalizeIdeas,
  parseJsonObject,
  slugify,
} from '../generate-activity-ideas/lib.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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

type RoutineRow = {
  id: number
  name: string
  execution_time: string | null
  days_of_week: string | null
  home_id: number
  user_id: string | null
}

type CandidateUser = {
  userId: string
  homeId: number
  routines: RoutineRow[]
}

type SavedSuggestion = {
  activityId: number
  scenarioId: number | null
  contentId: string
  title: string
}

type UserProfile = {
  hobbies: string | null
  first_name: string | null
  last_app_active_at?: string | null
}

type SerializableError = {
  message: string
  code?: string
  details?: string
  hint?: string
  name?: string
  raw?: unknown
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

const getRecentPresenceWindowMinutes = () => {
  const raw = Number.parseInt(Deno.env.get('AUTO_AI_ACTIVE_WINDOW_MINUTES') ?? '15', 10)
  if (!Number.isFinite(raw) || raw < 1) return 15
  return Math.min(raw, 180)
}

const isUserRecentlyActive = (value: string | null | undefined, now: Date, windowMinutes: number) => {
  if (!value) return false
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return false
  return now.getTime() - timestamp <= windowMinutes * 60 * 1000
}

const serializeError = (error: unknown): SerializableError => {
  if (error instanceof Error) {
    const errorWithFields = error as Error & {
      code?: string
      details?: string
      hint?: string
    }

    return {
      name: error.name,
      message: error.message,
      code: errorWithFields.code,
      details: errorWithFields.details,
      hint: errorWithFields.hint,
    }
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    return {
      message: String(record.message ?? record.error_description ?? record.error ?? 'Unknown object error'),
      code: typeof record.code === 'string' ? record.code : undefined,
      details: typeof record.details === 'string' ? record.details : undefined,
      hint: typeof record.hint === 'string' ? record.hint : undefined,
      raw: record,
    }
  }

  return {
    message: String(error),
  }
}

const dayLabelForDate = (date: Date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()] ?? 'Mon'

const getTimeBucket = (date: Date) => {
  const hour = date.getUTCHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

const getBucketHours = (bucket: string) => {
  switch (bucket) {
    case 'morning':
      return [5, 11]
    case 'afternoon':
      return [12, 16]
    case 'evening':
      return [17, 21]
    default:
      return [22, 4]
  }
}

const hourMatchesBucket = (hour: number, bucket: string) => {
  const [start, end] = getBucketHours(bucket)
  if (bucket === 'night') return hour >= start || hour <= end
  return hour >= start && hour <= end
}

const parseRoutineHour = (value: string | null) => {
  const match = String(value ?? '').match(/^(\d{1,2}):/)
  if (!match) return null
  const hour = Number.parseInt(match[1], 10)
  return Number.isFinite(hour) ? hour : null
}

const routineRunsToday = (routine: RoutineRow, date: Date) => {
  const rawDays = String(routine.days_of_week ?? '').trim()
  if (!rawDays) return true
  const days = rawDays.split(',').map((item) => item.trim()).filter(Boolean)
  return days.includes(dayLabelForDate(date))
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

const chooseStateForBucket = (bucket: string, routines: RoutineRow[], hobbies: string | null): UserState => {
  const context = `${routines.map((routine) => routine.name).join(' ')} ${hobbies ?? ''}`.toLowerCase()

  if (/(calm|sleep|wind down|relax|read|meditat)/i.test(context)) return 'RELAXED'
  if (/(focus|study|work|productiv|plan)/i.test(context)) return 'FOCUSED'
  if (/(gym|workout|run|train|cardio|stretch|yoga)/i.test(context)) return bucket === 'night' ? 'RELAXED' : 'FOCUSED'
  if (bucket === 'morning' || bucket === 'afternoon') return 'FOCUSED'
  return 'RELAXED'
}

const chooseAnchorRoutine = (routines: RoutineRow[], bucket: string, date: Date) => {
  const eligible = routines.filter((routine) => {
    if (!routineRunsToday(routine, date)) return false
    const hour = parseRoutineHour(routine.execution_time)
    return hour === null ? false : hourMatchesBucket(hour, bucket)
  })

  return eligible[0] ?? null
}

const shouldProcessUser = (candidate: CandidateUser, bucket: string, now: Date) => {
  if (candidate.routines.length === 0) return bucket === 'evening'
  return Boolean(chooseAnchorRoutine(candidate.routines, bucket, now))
}

const createIdeasPrompt = ({
  mood,
  localTime,
  profile,
  rooms,
  devices,
  recentActivities,
  routines,
  bucket,
  promptHint,
}: {
  mood: UserState
  localTime: string
  profile: UserProfile | null
  rooms: RoomRow[]
  devices: DeviceRow[]
  recentActivities: Array<Record<string, unknown>>
  routines: RoutineRow[]
  bucket: string
  promptHint: string
}) => {
  const roomById = new Map(rooms.map((room) => [room.id, room.name]))
  const deviceSummary = devices.map((device) => ({
    name: device.name,
    type: device.type,
    room: device.room_id ? roomById.get(device.room_id) ?? 'Unknown' : 'Unassigned',
    status: device.connectivity_status ?? device.status ?? 'unknown',
  }))
  const moodDirective = getMoodDirective(mood)

  return [
    'You are Nidush, a smart home wellbeing assistant.',
    'Create exactly 1 personalized activity idea for this home.',
    'The suggestion will be automatically created as a scenario and activity, so it must be practical and realistic.',
    'Use the real rooms and devices. Avoid duplicating recent activity titles.',
    `Time of day bucket: ${bucket}.`,
    `Emotional state to optimize for: ${mood}. ${moodDirective.summary}`,
    'The emotional state is the main driver of your suggestion. Adapt intensity, duration, room choice, and wording to match it.',
    ...moodDirective.guidance,
    'Prefer rooms and devices that match the user routines when they are available.',
    'Return JSON only with this shape:',
    '{"ideas":[{"title":"string","description":"string","type":"Cooking|Meditation|Workout|Audiobooks|Yoga|Reading|other","roomName":"one of the provided room names","durationMinutes":number,"image":"one of the allowed image keys","reason":"short reason","devicePlan":["short action"]}]}',
    `Allowed image keys: ${IMAGE_KEYS.join(', ')}`,
    `Local user time: ${localTime}`,
    `User first name: ${profile?.first_name ?? ''}`,
    `User hobbies/preferences: ${JSON.stringify(profile?.hobbies ?? [])}`,
    `Rooms: ${JSON.stringify(rooms.map((room) => room.name))}`,
    `Devices: ${JSON.stringify(deviceSummary)}`,
    `Recent activities: ${JSON.stringify(recentActivities)}`,
    `Active routines for inspiration: ${JSON.stringify(routines.map((routine) => ({
      name: routine.name,
      execution_time: routine.execution_time,
      days_of_week: routine.days_of_week,
    })))}`,
    promptHint ? `Extra personalization hint: ${promptHint}` : '',
  ].filter(Boolean).join('\\n')
}

const generateIdea = async ({
  geminiEnabled,
  geminiApiKey,
  geminiModel,
  rooms,
  devices,
  recentActivities,
  profile,
  routines,
  bucket,
  promptHint,
  mood,
}: {
  geminiEnabled: boolean
  geminiApiKey: string
  geminiModel: string
  rooms: RoomRow[]
  devices: DeviceRow[]
  recentActivities: Array<Record<string, unknown>>
  profile: UserProfile | null
  routines: RoutineRow[]
  bucket: string
  promptHint: string
  mood: UserState
}) => {
  let rawIdeas: GeminiIdea[] = []

  if (geminiEnabled && geminiApiKey) {
    try {
      const prompt = createIdeasPrompt({
        mood,
        localTime: new Date().toISOString(),
        profile,
        rooms,
        devices,
        recentActivities,
        routines,
        bucket,
        promptHint,
      })

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
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
    } catch (error) {
      console.warn('[auto-generate-activity-suggestions] Gemini failed, using fallback.', error)
      rawIdeas = fallbackIdeas(rooms, mood)
    }
  } else {
    rawIdeas = fallbackIdeas(rooms, mood)
  }

  const normalized = normalizeIdeas(rawIdeas, rooms)
  if (normalized.length > 0) return normalized[0]

  return normalizeIdeas(fallbackIdeas(rooms, mood), rooms)[0] ?? null
}

const saveIdea = async ({
  supabase,
  idea,
  homeId,
  userId,
  roomDevices,
}: {
  // deno-lint-ignore no-explicit-any
  supabase: any
  idea: ReturnType<typeof normalizeIdeas>[number]
  homeId: number
  userId: string
  roomDevices: DeviceRow[]
}): Promise<SavedSuggestion> => {
  const { data: matchedContents } = await supabase
    .from('contents')
    .select('id')
    .eq('category', idea.contentCategory)
    .limit(50)

  let finalContentId = ''
  if (matchedContents && matchedContents.length > 0) {
    finalContentId = matchedContents[Math.floor(Math.random() * matchedContents.length)].id
  } else {
    const { data: fallbackContents } = await supabase.from('contents').select('id').limit(50)
    if (fallbackContents && fallbackContents.length > 0) {
      finalContentId = fallbackContents[Math.floor(Math.random() * fallbackContents.length)].id
    } else {
      throw new Error('No existing contents found in DB')
    }
  }

  const linkedDeviceIds = getRelevantDeviceIds(roomDevices, idea.type)

  let scenarioId: number | null = null

  if (idea.roomId) {
    const baseScenarioPayload = {
      name: `${clampText(idea.title, 'AI Activity', 50)} Scene`,
      room_id: idea.roomId,
      playlist_id: idea.playlistId ?? null,
    }

    const fullScenarioPayload = {
      ...baseScenarioPayload,
      description: clampText(
        `${idea.description} ${idea.devicePlan.join('. ')}`.trim(),
        idea.description,
        220,
      ),
      playlist_name: idea.playlistName ?? null,
      image: idea.image,
      focus_mode_enabled: ['Meditation', 'Audiobooks', 'Reading', 'Yoga'].includes(idea.type),
      shortcuts: false,
    }

    let scenarioInsert = await supabase
      .from('scenarios')
      .insert(fullScenarioPayload)
      .select('id')
      .single()

    if (scenarioInsert.error && (scenarioInsert.error.code === '42703' || scenarioInsert.error.code === 'PGRST204')) {
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
      title: idea.title,
      description: idea.description,
      image: idea.image,
      category: 'AI For You',
      type: idea.type,
      content_id: finalContentId,
      scenario_id: scenarioId,
      room_id: idea.roomId,
      home_id: homeId,
      user_id: userId,
      focus_mode_enabled: false,
      shortcuts: false,
    })
    .select('id')
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
      console.warn('[auto-generate-activity-suggestions] Failed to link devices.', linkError)
    }
  }

  return {
    activityId: Number(createdActivity.id),
    scenarioId,
    contentId: finalContentId,
    title: idea.title,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const expectedSecret = Deno.env.get('AUTO_AI_GENERATION_SECRET') || Deno.env.get('CRON_SECRET')
  const providedSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (!expectedSecret) {
    return new Response(JSON.stringify({ error: 'Cron secret not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GOOGLE_AI_API_KEY') ?? ''
  const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
  const geminiEnabled = parseBooleanEnv(Deno.env.get('ENABLE_GEMINI_API'), true)
  const activeWindowMinutes = getRecentPresenceWindowMinutes()

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase service configuration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const now = new Date()
  const bucket = getTimeBucket(now)
  const scheduledDate = now.toISOString().slice(0, 10)
  const body = await req.json().catch(() => ({}))
  const source = clampText(body?.source, 'pg_cron', 40)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let runId: number | null = null
  const details: Record<string, unknown> = {
    source,
    bucket,
    scheduledDate,
    created: [] as Array<Record<string, unknown>>,
    skipped: [] as Array<Record<string, unknown>>,
    errors: [] as string[],
  }

  try {
    const { data: run } = await supabase
      .from('ai_auto_generation_runs')
      .insert({ status: 'running', started_at: now.toISOString(), details: { source, bucket, scheduledDate } })
      .select('id')
      .maybeSingle()
    runId = run?.id ?? null

    const [{ data: userHomes, error: userHomesError }, { data: routines, error: routinesError }] = await Promise.all([
      supabase
        .from('user_homes')
        .select('user_id, home_id'),
      supabase
        .from('routines')
        .select('id, name, execution_time, days_of_week, home_id, user_id')
        .eq('is_active', true),
    ])

    if (userHomesError) throw userHomesError
    if (routinesError) throw routinesError

    const routinesByUserHome = new Map<string, RoutineRow[]>()
    ;((routines ?? []) as RoutineRow[]).forEach((routine) => {
      if (!routine.user_id) return
      const key = `${routine.user_id}::${routine.home_id}`
      const current = routinesByUserHome.get(key) ?? []
      current.push(routine)
      routinesByUserHome.set(key, current)
    })

    const candidates: CandidateUser[] = ((userHomes ?? []) as Array<{ user_id: string; home_id: number }>)
      .map((row) => ({
        userId: row.user_id,
        homeId: row.home_id,
        routines: routinesByUserHome.get(`${row.user_id}::${row.home_id}`) ?? [],
      }))
      .filter((candidate) => shouldProcessUser(candidate, bucket, now))

    let usersProcessed = 0
    let generatedCount = 0
    let skippedCount = 0

    for (const candidate of candidates) {
      usersProcessed += 1

      const anchorRoutine = chooseAnchorRoutine(candidate.routines, bucket, now)

      const { data: existingRecord, error: existingError } = await supabase
        .from('ai_auto_generated_activities')
        .select('id')
        .eq('user_id', candidate.userId)
        .eq('scheduled_for_date', scheduledDate)
        .eq('time_bucket', bucket)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingRecord?.id) {
        skippedCount += 1
        ;(details.skipped as Array<Record<string, unknown>>).push({
          userId: candidate.userId,
          reason: 'already_generated_for_bucket',
        })
        continue
      }

      const [{ data: profile }, { data: rooms }, { data: devices }, { data: recentActivities }] = await Promise.all([
        supabase
          .from('users')
          .select('hobbies, first_name, last_app_active_at')
          .eq('auth_uid', candidate.userId)
          .maybeSingle(),
        supabase
          .from('rooms')
          .select('id, name')
          .eq('home_id', candidate.homeId)
          .order('id', { ascending: true }),
        supabase
          .from('devices')
          .select('id, name, type, room_id, status, connectivity_status, status_level')
          .eq('home_id', candidate.homeId)
          .limit(60),
        supabase
          .from('activities')
          .select('title, type, room_id')
          .eq('home_id', candidate.homeId)
          .eq('user_id', candidate.userId)
          .order('created_at', { ascending: false })
          .limit(12),
      ])

      const safeRooms = (rooms ?? []) as RoomRow[]
      const safeProfile = (profile ?? null) as UserProfile | null

      if (!isUserRecentlyActive(safeProfile?.last_app_active_at, now, activeWindowMinutes)) {
        skippedCount += 1
        ;(details.skipped as Array<Record<string, unknown>>).push({
          userId: candidate.userId,
          reason: 'user_not_active_in_app',
        })
        continue
      }

      if (safeRooms.length === 0) {
        skippedCount += 1
        ;(details.skipped as Array<Record<string, unknown>>).push({
          userId: candidate.userId,
          reason: 'no_rooms',
        })
        continue
      }

      const safeDevices = (devices ?? []) as DeviceRow[]
      const mood = chooseStateForBucket(bucket, candidate.routines, safeProfile?.hobbies ?? null)
      const promptHint = [
        anchorRoutine ? `Try to align with this routine: ${anchorRoutine.name}.` : '',
        safeProfile?.hobbies ? `Lean into these hobbies when relevant: ${safeProfile.hobbies}.` : '',
        bucket === 'morning' ? 'Make it easy to start and energizing.' : '',
        bucket === 'evening' || bucket === 'night' ? 'Make it calming, cozy, and low friction.' : '',
      ].filter(Boolean).join(' ')

      const idea = await generateIdea({
        geminiEnabled,
        geminiApiKey,
        geminiModel,
        rooms: safeRooms,
        devices: safeDevices,
        recentActivities: (recentActivities ?? []) as Array<Record<string, unknown>>,
        profile: safeProfile,
        routines: candidate.routines,
        bucket,
        promptHint,
        mood,
      })

      if (!idea) {
        skippedCount += 1
        ;(details.skipped as Array<Record<string, unknown>>).push({
          userId: candidate.userId,
          reason: 'no_idea_generated',
        })
        continue
      }

      const targetRoomDevices = idea.roomId
        ? safeDevices.filter((device) => device.room_id === idea.roomId)
        : safeDevices

      const saved = await saveIdea({
        supabase,
        idea,
        homeId: candidate.homeId,
        userId: candidate.userId,
        roomDevices: targetRoomDevices,
      })

      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: candidate.userId,
        title: 'New activity ready',
        message: `"${saved.title}" was created for your ${bucket} routine.`,
        type: 'creation',
        read: false,
      })
      if (notificationError) throw notificationError

      const { error: historyError } = await supabase.from('ai_auto_generated_activities').insert({
        user_id: candidate.userId,
        home_id: candidate.homeId,
        routine_id: anchorRoutine?.id ?? null,
        scenario_id: saved.scenarioId,
        activity_id: saved.activityId,
        content_id: saved.contentId,
        scheduled_for_date: scheduledDate,
        time_bucket: bucket,
        metadata: {
          source,
          title: saved.title,
          mood,
          routines: candidate.routines.map((routine) => routine.name),
        },
      })
      if (historyError) throw historyError

      const { error: requestLogError } = await supabase.from('ai_generation_requests').insert({
        user_id: candidate.userId,
        home_id: candidate.homeId,
        source: 'automation',
        request_action: 'auto-save',
        model_requested: geminiEnabled && geminiApiKey ? geminiModel : 'local-fallback',
      })
      if (requestLogError) throw requestLogError

      generatedCount += 1
      ;(details.created as Array<Record<string, unknown>>).push({
        userId: candidate.userId,
        activityId: saved.activityId,
        scenarioId: saved.scenarioId,
        title: saved.title,
      })
    }

    if (runId) {
      await supabase
        .from('ai_auto_generation_runs')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          users_processed: usersProcessed,
          generated_count: generatedCount,
          skipped_count: skippedCount,
          details,
        })
        .eq('id', runId)
    }

    return new Response(JSON.stringify({
      status: 'success',
      bucket,
      scheduledDate,
      usersProcessed,
      generatedCount,
      skippedCount,
      details,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const serializedError = serializeError(error)
    ;(details.errors as Array<unknown>).push(serializedError)

    if (runId) {
      await supabase
        .from('ai_auto_generation_runs')
        .update({
          status: 'error',
          finished_at: new Date().toISOString(),
          error_message: serializedError.message,
          details,
        })
        .eq('id', runId)
    }

    return new Response(JSON.stringify({ error: serializedError.message, errorDetails: serializedError, details }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
