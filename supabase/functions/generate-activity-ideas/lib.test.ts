import {
  fallbackIdeas,
  getMoodDirective,
  normalizeIdeas,
  parseJsonObject,
  type GeminiIdea,
  type RoomRow,
} from './lib.ts'

Deno.test('parseJsonObject handles fenced JSON responses', () => {
  const parsed = parseJsonObject('```json\n{"ideas":[{"title":"Calm reset"}]}\n```') as {
    ideas: Array<{ title: string }>
  }

  if (!Array.isArray(parsed.ideas)) {
    throw new Error('Expected ideas array.')
  }

  if (parsed.ideas[0]?.title !== 'Calm reset') {
    throw new Error('Expected to parse the JSON payload inside code fences.')
  }
})

Deno.test('fallbackIdeas adapts to the anxious state and available rooms', () => {
  const rooms: RoomRow[] = [
    { id: 1, name: 'Living Room' },
    { id: 2, name: 'Bedroom' },
  ]

  const ideas = fallbackIdeas(rooms, 'ANXIOUS')

  if (ideas.length !== 2) {
    throw new Error(`Expected 2 anxious fallback ideas, received ${ideas.length}.`)
  }

  if (ideas[0]?.roomName !== 'Bedroom') {
    throw new Error('Expected the first anxious idea to prefer the bedroom.')
  }

  if (!ideas[0]?.devicePlan?.includes('Dim lights')) {
    throw new Error('Expected anxious fallback ideas to include calming device guidance.')
  }
})

Deno.test('normalizeIdeas clamps unsafe values and resolves the room by name', () => {
  const rooms: RoomRow[] = [{ id: 42, name: 'Kitchen' }]
  const ideas: GeminiIdea[] = [
    {
      title: '  Very long cooking focus title that should be trimmed down to the supported length for the card UI  ',
      description: 'Short description',
      type: 'Cooking',
      roomName: 'Kitchen',
      durationMinutes: 300,
      image: 'not-allowed.png',
      reason: 'Recommended because there is a kitchen available.',
      devicePlan: ['Turn on kitchen lights', 'Start speaker', 'Extra step', 'Step 4', 'Step 5'],
    },
  ]

  const normalized = normalizeIdeas(ideas, rooms)
  const first = normalized[0]

  if (!first) {
    throw new Error('Expected one normalized idea.')
  }

  if (first.roomId !== 42 || first.roomName !== 'Kitchen') {
    throw new Error('Expected normalizeIdeas to match the provided room by name.')
  }

  if (first.durationMinutes !== 90) {
    throw new Error(`Expected duration to clamp to 90, received ${first.durationMinutes}.`)
  }

  if (first.image !== 'activities_for_you/sunrise_flow.png') {
    throw new Error('Expected invalid images to fall back to the default image key.')
  }

  if (first.devicePlan.length !== 4) {
    throw new Error(`Expected devicePlan to be limited to 4 items, received ${first.devicePlan.length}.`)
  }
})

Deno.test('focused mood directive keeps concentration-specific guidance', () => {
  const directive = getMoodDirective('FOCUSED')

  if (!directive.summary.toLowerCase().includes('productive')) {
    throw new Error('Expected the focused summary to mention productive energy.')
  }

  if (!directive.guidance.some((line) => line.toLowerCase().includes('concentration'))) {
    throw new Error('Expected focused guidance to mention concentration support.')
  }
})
