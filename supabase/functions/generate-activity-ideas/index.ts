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

      const { data: createdActivity, error: activityError } = await supabase
        .from('activities')
        .insert({
          title: normalizedIdea.title,
          description: normalizedIdea.description,
          image: normalizedIdea.image,
          category: 'My creations',
          type: normalizedIdea.type,
          content_id: createdContent.id,
          scenario_id: null,
          room_id: normalizedIdea.roomId,
          home_id: homeId,
          user_id: user.id,
          focus_mode_enabled: false,
          shortcuts: false,
        })
        .select('*, id')
        .single()

      if (activityError) throw activityError

      return new Response(
        JSON.stringify({
          homeId,
          content: createdContent,
          activity: createdActivity,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const [{ data: rooms }, { data: devices }, { data: recentActivities }, { data: profile }] = await Promise.all([
      supabase
        .from('rooms')
        .select('id, name')
        .eq('home_id', homeId)
        .order('id', { ascending: true }),
      supabase
        .from('devices')
        .select('id, name, type, room_id, status, connectivity_status')
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

    if (geminiApiKey) {
      try {
        const prompt = [
          'You are Nidush, a smart home wellbeing assistant.',
          'Create exactly 5 personalized activity ideas for this home.',
          'Use the real rooms and devices. Avoid duplicating recent activity titles.',
          `Emotional state to optimize for: ${mood}. ${moodDirective.summary}`,
          'The emotional state is the main driver of your suggestions. Adapt intensity, duration, room choice, and wording to match it.',
          ...moodDirective.guidance,
          'Return JSON only with this shape:',
          '{"ideas":[{"title":"string","description":"string","type":"Cooking|Meditation|Workout|Audiobooks|Yoga|Reading|other","roomName":"one of the provided room names","durationMinutes":number,"image":"one of the allowed image keys","reason":"short reason","devicePlan":["short action"],"contentTitle":"string","contentType":"recipe|audio|exercise|video","contentCategory":"cooking|meditation|workout|audiobook|general","ingredients":[{"item":"string","amount":"string"}],"instructions":[{"text":"string","duration":number}]}]}',
          `Allowed image keys: ${IMAGE_KEYS.join(', ')}`,
        `Current mood/state: ${mood}`,
        `Active app filter: ${activeFilter}`,
        `Local user time: ${localTime}`,
        `Recommendation surface: ${source}`,
        `User hobbies/preferences: ${JSON.stringify(profile?.hobbies ?? [])}`,
        promptHint ? `User hint: ${promptHint}` : '',
        `Rooms: ${JSON.stringify(safeRooms.map((room) => room.name))}`,
        `Devices: ${JSON.stringify(deviceSummary)}`,
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
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
