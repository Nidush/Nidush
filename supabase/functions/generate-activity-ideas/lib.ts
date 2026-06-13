export const IMAGE_KEYS = [
  'activities_for_you/sunrise_flow.png',
  'activities_for_you/evening_read.png',
  'activities_for_you/stretching.png',
  'meditation_content/video_sessions/morning_zen.png',
  'meditation_activities/recommended/visualization_for_success.png',
  'cooking_activities/recommended/eggs_benedict.png',
  'cooking_activities/recommended/brownies.png',
  'Scenarios/cinema_night.png',
  'Scenarios/morning_brew.png',
  'Scenarios/forest_bathing.png',
] as const

export type ActivityType =
  | 'Cooking'
  | 'Meditation'
  | 'Workout'
  | 'Audiobooks'
  | 'Yoga'
  | 'Reading'
  | 'other'

export type RoomRow = {
  id: number
  name: string
}

export type GeminiIdea = {
  title?: unknown
  description?: unknown
  type?: unknown
  roomId?: unknown
  roomName?: unknown
  durationMinutes?: unknown
  image?: unknown
  reason?: unknown
  devicePlan?: unknown
  contentTitle?: unknown
  contentType?: unknown
  contentCategory?: unknown
  playlistId?: unknown
  playlistName?: unknown
  instructions?: unknown
  ingredients?: unknown
}

export type UserState = 'RELAXED' | 'FOCUSED' | 'STRESSED' | 'ANXIOUS'

export type RateLimitDecision = {
  allowed: boolean
  retryAfterSeconds: number
  reason: 'cooldown' | 'hourly_quota' | null
}

export const clampText = (value: unknown, fallback: string, maxLength: number) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  return (text || fallback).slice(0, maxLength)
}

export const clampPositiveInteger = (value: unknown, fallback: number, min = 1, max = 100000) => {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

export const evaluateRateLimit = ({
  recentRequestCount,
  maxRequestsPerHour,
  minSecondsBetweenRequests,
  lastRequestAt,
  now = new Date(),
}: {
  recentRequestCount: number
  maxRequestsPerHour: number
  minSecondsBetweenRequests: number
  lastRequestAt?: string | Date | null
  now?: Date
}): RateLimitDecision => {
  if (minSecondsBetweenRequests > 0 && lastRequestAt) {
    const lastRequestTime = lastRequestAt instanceof Date ? lastRequestAt : new Date(lastRequestAt)
    const elapsedSeconds = Math.floor((now.getTime() - lastRequestTime.getTime()) / 1000)

    if (Number.isFinite(elapsedSeconds) && elapsedSeconds < minSecondsBetweenRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(minSecondsBetweenRequests - elapsedSeconds, 1),
        reason: 'cooldown',
      }
    }
  }

  if (maxRequestsPerHour > 0 && recentRequestCount >= maxRequestsPerHour) {
    return {
      allowed: false,
      retryAfterSeconds: 60 * 60,
      reason: 'hourly_quota',
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    reason: null,
  }
}

const normalizeType = (value: unknown): ActivityType => {
  const raw = String(value ?? '').toLowerCase()
  if (raw.includes('cook')) return 'Cooking'
  if (raw.includes('meditat') || raw.includes('breath')) return 'Meditation'
  if (raw.includes('workout') || raw.includes('fitness') || raw.includes('stretch')) return 'Workout'
  if (raw.includes('audio') || raw.includes('book')) return 'Audiobooks'
  if (raw.includes('yoga')) return 'Yoga'
  if (raw.includes('read')) return 'Reading'
  return 'other'
}

const normalizeImage = (value: unknown) => {
  const image = String(value ?? '')
  return IMAGE_KEYS.includes(image as typeof IMAGE_KEYS[number])
    ? image
    : 'activities_for_you/sunrise_flow.png'
}

export const slugify = (value: unknown) =>
  String(value ?? 'activity')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 42) || 'activity'

const normalizeContentType = (activityType: ActivityType, value: unknown) => {
  const raw = String(value ?? '').toLowerCase()
  if (['video', 'recipe', 'audio', 'workout', 'exercise'].includes(raw)) return raw
  if (activityType === 'Cooking') return 'recipe'
  if (activityType === 'Audiobooks' || activityType === 'Reading' || activityType === 'Meditation') return 'audio'
  if (activityType === 'Workout' || activityType === 'Yoga') return 'exercise'
  return 'audio'
}

const normalizeContentCategory = (activityType: ActivityType, value: unknown) => {
  const raw = String(value ?? '').toLowerCase()
  if (raw) return raw.slice(0, 40)
  if (activityType === 'Cooking') return 'cooking'
  if (activityType === 'Audiobooks' || activityType === 'Reading') return 'audiobook'
  if (activityType === 'Workout' || activityType === 'Yoga') return 'workout'
  if (activityType === 'Meditation') return 'meditation'
  return 'general'
}

const normalizeInstructions = (value: unknown, activityType: ActivityType) => {
  if (Array.isArray(value)) {
    const steps = value
      .slice(0, 8)
      .map((step) => {
        if (typeof step === 'string') return clampText(step, '', 160)
        if (typeof step === 'object' && step !== null) {
          const record = step as Record<string, unknown>
          const text = clampText(record.text ?? record.instruction ?? record.name, '', 160)
          const duration = Number(record.duration ?? record.seconds)
          return Number.isFinite(duration) && duration > 0
            ? { text, duration: Math.min(Math.round(duration), 3600) }
            : text
        }
        return ''
      })
      .filter(Boolean)

    if (steps.length > 0) return steps
  }

  if (activityType === 'Cooking') {
    return [
      'Prepare all ingredients before turning on the heat.',
      'Follow the recipe steps calmly and keep the workspace clear.',
      'Plate the dish and reset the kitchen devices when finished.',
    ]
  }

  if (activityType === 'Workout' || activityType === 'Yoga') {
    return [
      { text: 'Warm up with gentle mobility.', duration: 180 },
      { text: 'Move through the main sequence at a steady pace.', duration: 600 },
      { text: 'Cool down and breathe slowly.', duration: 180 },
    ]
  }

  return [
    { text: 'Settle into the room and remove distractions.', duration: 60 },
    { text: 'Follow the guided focus moment.', duration: 420 },
    { text: 'Close the activity with one small intention.', duration: 60 },
  ]
}

const normalizeIngredients = (value: unknown, activityType: ActivityType) => {
  if (activityType !== 'Cooking') return []

  if (Array.isArray(value)) {
    const ingredients = value
      .slice(0, 10)
      .map((ingredient) => {
        if (typeof ingredient === 'string') {
          return { item: clampText(ingredient, '', 70), amount: 'to taste' }
        }
        if (typeof ingredient === 'object' && ingredient !== null) {
          const record = ingredient as Record<string, unknown>
          return {
            item: clampText(record.item ?? record.name, '', 70),
            amount: clampText(record.amount ?? record.quantity, 'to taste', 50),
          }
        }
        return null
      })
      .filter((ingredient): ingredient is { item: string; amount: string } => Boolean(ingredient?.item))

    if (ingredients.length > 0) return ingredients
  }

  return [
    { item: 'Main ingredient', amount: '1 portion' },
    { item: 'Olive oil', amount: '1 tbsp' },
    { item: 'Salt and herbs', amount: 'to taste' },
  ]
}

export const parseJsonObject = (text: string) => {
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('Gemini did not return valid JSON.')
  }
}

const findRoom = (rooms: RoomRow[], roomName: unknown) => {
  if (rooms.length === 0) return null

  const normalized = String(roomName ?? '').trim().toLowerCase()
  const direct = rooms.find((room) => room.name.toLowerCase() === normalized)
  if (direct) return direct

  const partial = rooms.find((room) => normalized.includes(room.name.toLowerCase()))
  return partial ?? rooms[0]
}

export const getMoodDirective = (state: UserState) => {
  switch (state) {
    case 'ANXIOUS':
      return {
        summary: 'Prioritize emotional regulation, grounding, safety, and low stimulation.',
        guidance: [
          'Prefer calming activities such as meditation, gentle reading, soft audiobooks, or very light stretching.',
          'Avoid intense workouts, competitive framing, urgency, loud devices, or cognitively heavy tasks.',
          'Favor short activities between 5 and 20 minutes with clear, reassuring steps.',
          'Use bedrooms or quiet living spaces when possible and suggest dimmer lights or softer sound.',
        ],
      }
    case 'STRESSED':
      return {
        summary: 'Prioritize decompression, tension release, and a smooth transition out of stress.',
        guidance: [
          'Prefer recovery-focused activities like breathing, stretching, calming cooking, yoga, or quiet reading.',
          'Avoid high-pressure productivity language and avoid very intense or noisy activities.',
          'Favor activities around 10 to 30 minutes that reduce stimulation and feel achievable.',
          'Use rooms and devices in a way that lowers sensory load and helps the person reset.',
        ],
      }
    case 'FOCUSED':
      return {
        summary: 'Prioritize structured momentum, clarity, and productive energy.',
        guidance: [
          'Prefer goal-oriented activities like focused reading, audiobooks, cooking prep, organized workouts, or purposeful yoga.',
          'Avoid sleepy wind-down ideas unless explicitly requested by the user.',
          'Favor activities around 15 to 45 minutes with ordered steps and a clear outcome.',
          'Use devices and rooms to support concentration, bright light, and minimal distraction.',
        ],
      }
    case 'RELAXED':
    default:
      return {
        summary: 'Prioritize enjoyment, comfort, and balanced wellbeing.',
        guidance: [
          'Prefer pleasant, easy-to-start activities such as enjoyable cooking, relaxed reading, meditation, or light movement.',
          'Avoid stress-heavy framing, but it is okay to mix calm and mildly active ideas.',
          'Favor activities around 10 to 40 minutes that feel restorative or cozy.',
          'Use the home setup to create atmosphere and comfort rather than urgency.',
        ],
      }
  }
}

export const fallbackIdeas = (rooms: RoomRow[], state: UserState) => {
  const livingRoom = rooms.find((room) => /living|sala/i.test(room.name)) ?? rooms[0]
  const kitchen = rooms.find((room) => /kitchen|cozinha/i.test(room.name)) ?? rooms[0]
  const bedroom = rooms.find((room) => /bed|quarto/i.test(room.name)) ?? rooms[0]

  if (state === 'ANXIOUS') {
    return [
      {
        title: 'Grounding Breath Reset',
        description: 'A very gentle grounding pause with slower breathing, low lights, and minimal stimulation.',
        type: 'Meditation',
        roomName: bedroom?.name ?? livingRoom?.name,
        durationMinutes: 8,
        image: 'meditation_content/video_sessions/morning_zen.png',
        reason: 'Designed to help someone who feels anxious settle their body and attention.',
        devicePlan: ['Dim lights', 'Keep the room quiet'],
        contentTitle: 'Grounding Breath Reset',
        contentType: 'audio',
        contentCategory: 'meditation',
        instructions: [
          { text: 'Sit somewhere supported and place both feet on the floor.', duration: 60 },
          { text: 'Breathe in gently for four counts and out for six counts.', duration: 300 },
          { text: 'Name three things you can see and one thing you can hear.', duration: 120 },
        ],
        ingredients: [],
      },
      {
        title: 'Comfort Reading Corner',
        description: 'A soft reading or audiobook break that keeps the environment quiet and reassuring.',
        type: 'Reading',
        roomName: bedroom?.name ?? livingRoom?.name,
        durationMinutes: 12,
        image: 'activities_for_you/evening_read.png',
        reason: 'Useful when the person needs something calm, familiar, and low effort.',
        devicePlan: ['Lower lights', 'Keep screens optional'],
        contentTitle: 'Comfort Reading Corner',
        contentType: 'audio',
        contentCategory: 'audiobook',
        instructions: [
          { text: 'Settle into a comfortable seat or bed and relax your shoulders.', duration: 60 },
          { text: 'Read or listen to something familiar and gentle.', duration: 540 },
          { text: 'Finish by taking one longer exhale.', duration: 60 },
        ],
        ingredients: [],
      },
    ]
  }

  if (state === 'STRESSED') {
    return [
      {
        title: 'Calm Reset',
        description: 'A short reset with soft breathing, low lights, and a quiet room transition.',
        type: 'Meditation',
        roomName: livingRoom?.name,
        durationMinutes: 10,
        image: 'meditation_content/video_sessions/morning_zen.png',
        reason: 'A simple recovery moment for your current home setup.',
        devicePlan: ['Dim lights', 'Use nearby speaker if available'],
        contentTitle: 'Calm Reset Guide',
        contentType: 'audio',
        contentCategory: 'meditation',
        instructions: [
          { text: 'Sit comfortably and soften your shoulders.', duration: 60 },
          { text: 'Breathe in for four counts and out for six counts.', duration: 420 },
          { text: 'Open your eyes and set one small intention.', duration: 60 },
        ],
        ingredients: [],
      },
      {
        title: 'Slow Kitchen Reset',
        description: 'A practical but calming kitchen activity that turns stress into one manageable sequence.',
        type: 'Cooking',
        roomName: kitchen?.name,
        durationMinutes: 20,
        image: 'cooking_activities/recommended/eggs_benedict.png',
        reason: 'Good for releasing tension through a simple hands-on routine.',
        devicePlan: ['Turn on kitchen lights', 'Keep speaker volume low'],
        contentTitle: 'Slow Kitchen Reset Recipe',
        contentType: 'recipe',
        contentCategory: 'cooking',
        ingredients: [
          { item: 'Eggs or protein', amount: '2 portions' },
          { item: 'Bread or base', amount: '2 slices' },
          { item: 'Fresh herbs', amount: '1 handful' },
        ],
        instructions: [
          'Prepare ingredients and clear the counter.',
          'Cook one step at a time without rushing the heat.',
          'Plate everything and leave the space tidy.',
        ],
      },
    ]
  }

  if (state === 'FOCUSED') {
    return [
      {
        title: 'Kitchen Focus Prep',
        description: 'A practical cooking prep session with light music and one focused recipe step at a time.',
        type: 'Cooking',
        roomName: kitchen?.name,
        durationMinutes: 25,
        image: 'cooking_activities/recommended/eggs_benedict.png',
        reason: 'Good for turning kitchen devices into a guided routine.',
        devicePlan: ['Turn on kitchen lights', 'Keep speaker available'],
        contentTitle: 'Kitchen Focus Prep Recipe',
        contentType: 'recipe',
        contentCategory: 'cooking',
        ingredients: [
          { item: 'Eggs or protein', amount: '2 portions' },
          { item: 'Bread or base', amount: '2 slices' },
          { item: 'Fresh herbs', amount: '1 handful' },
        ],
        instructions: [
          'Prepare ingredients and clear the counter.',
          'Cook the main component slowly and keep the heat steady.',
          'Plate everything and finish with herbs.',
        ],
      },
      {
        title: 'Deep Reading Sprint',
        description: 'A focused reading or audiobook block designed for clarity and momentum.',
        type: 'Reading',
        roomName: livingRoom?.name ?? bedroom?.name,
        durationMinutes: 20,
        image: 'activities_for_you/evening_read.png',
        reason: 'Fits a focused state without overloading the person.',
        devicePlan: ['Brighten lights', 'Silence distractions'],
        contentTitle: 'Deep Reading Sprint',
        contentType: 'audio',
        contentCategory: 'audiobook',
        instructions: [
          { text: 'Choose one topic and set distractions aside.', duration: 60 },
          { text: 'Read or listen with full attention for one uninterrupted block.', duration: 1020 },
          { text: 'Note one useful takeaway before stopping.', duration: 120 },
        ],
        ingredients: [],
      },
    ]
  }

  return [
    {
      title: 'Easy Morning Prep',
      description: 'A light cooking moment that keeps the relaxed mood going without asking too much.',
      type: 'Cooking',
      roomName: kitchen?.name,
      durationMinutes: 20,
      image: 'cooking_activities/recommended/eggs_benedict.png',
      reason: 'Fits a relaxed state with something pleasant and simple to do.',
      devicePlan: ['Turn on kitchen lights', 'Keep speaker available'],
      contentTitle: 'Easy Morning Prep Recipe',
      contentType: 'recipe',
      contentCategory: 'cooking',
      ingredients: [
        { item: 'Eggs or protein', amount: '2 portions' },
        { item: 'Bread or base', amount: '2 slices' },
        { item: 'Fresh herbs', amount: '1 handful' },
      ],
      instructions: [
        'Prepare ingredients and clear the counter.',
        'Cook the main component slowly and keep the heat steady.',
        'Plate everything and finish with herbs.',
      ],
    },
    {
      title: 'Evening Wind Down',
      description: 'A gentle reading or audio moment designed to slow the house down before sleep.',
      type: 'Reading',
      roomName: bedroom?.name,
      durationMinutes: 15,
      image: 'activities_for_you/evening_read.png',
      reason: 'A low-friction routine for the end of the day.',
      devicePlan: ['Lower lights', 'Keep screens optional'],
      contentTitle: 'Evening Wind Down Reading',
      contentType: 'audio',
      contentCategory: 'audiobook',
      instructions: [
        { text: 'Choose a comfortable spot and lower the lights.', duration: 60 },
        { text: 'Read or listen without checking the phone.', duration: 780 },
        { text: 'Write down one sentence to remember.', duration: 60 },
      ],
      ingredients: [],
    },
    {
      title: 'Soft Stretch Flow',
      description: 'A light mobility break that keeps the body loose without raising intensity too much.',
      type: 'Yoga',
      roomName: livingRoom?.name ?? bedroom?.name,
      durationMinutes: 12,
      image: 'activities_for_you/stretching.png',
      reason: 'A good fit when the person already feels calm and wants gentle movement.',
      devicePlan: ['Clear floor space', 'Keep lights warm'],
      contentTitle: 'Soft Stretch Flow',
      contentType: 'exercise',
      contentCategory: 'workout',
      instructions: [
        { text: 'Start with a slow neck and shoulder release.', duration: 180 },
        { text: 'Move through light standing stretches and side bends.', duration: 420 },
        { text: 'Finish with slower breathing and a full-body reach.', duration: 120 },
      ],
      ingredients: [],
    },
  ]
}

export const normalizeIdeas = (rawIdeas: GeminiIdea[], rooms: RoomRow[]) =>
  rawIdeas.slice(0, 5).map((idea, index) => {
    const room = findRoom(rooms, idea.roomName)
    const title = clampText(idea.title, `AI Activity ${index + 1}`, 70)
    const description = clampText(
      idea.description,
      'A personalized activity for your home.',
      220,
    )
    const duration = Number(idea.durationMinutes)

    return {
      id: `ai-${Date.now()}-${index}`,
      title,
      description,
      type: normalizeType(idea.type),
      roomId: room?.id ?? (Number.isFinite(Number(idea.roomId)) ? Number(idea.roomId) : null),
      roomName: room?.name ?? clampText(idea.roomName, 'Home', 60),
      durationMinutes: Number.isFinite(duration) ? Math.min(Math.max(Math.round(duration), 5), 90) : 15,
      image: normalizeImage(idea.image),
      reason: clampText(idea.reason, 'Recommended for your current home setup.', 150),
      devicePlan: Array.isArray(idea.devicePlan)
        ? idea.devicePlan.slice(0, 4).map((item) => clampText(item, '', 60)).filter(Boolean)
        : [],
      contentTitle: clampText(idea.contentTitle, `${title} Guide`, 80),
      contentType: normalizeContentType(normalizeType(idea.type), idea.contentType),
      contentCategory: normalizeContentCategory(normalizeType(idea.type), idea.contentCategory),
      playlistId: clampText(idea.playlistId, '', 120) || undefined,
      playlistName: clampText(idea.playlistName, '', 120) || undefined,
      instructions: normalizeInstructions(idea.instructions, normalizeType(idea.type)),
      ingredients: normalizeIngredients(idea.ingredients, normalizeType(idea.type)),
    }
  })
