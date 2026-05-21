import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

type ContentPayload = {
  id: string
  title: string
  description: string | null
  type: string
  category: string
  duration?: string | null
  image?: string | null
  instructions?: unknown[] | null
  ingredients?: unknown[] | null
  video_url?: string | null
  author: string
}

type MealDbMeal = {
  idMeal: string
  strMeal: string
  strArea?: string | null
  strCategory?: string | null
  strMealThumb?: string | null
  strInstructions?: string | null
  strYoutube?: string | null
  [key: `strIngredient${number}`]: string | null | undefined
  [key: `strMeasure${number}`]: string | null | undefined
}

type ApiNinjasExercise = {
  name: string
  type?: string | null
  muscle?: string | null
  equipment?: string | null
  difficulty?: string | null
  instructions?: string | null
}

const THE_MEAL_DB_RANDOM_URL = 'https://www.themealdb.com/api/json/v1/1/random.php'
const API_NINJAS_EXERCISE_URL = 'https://api.api-ninjas.com/v1/exercises'
const MUSCLES = [
  'biceps',
  'triceps',
  'chest',
  'abdominals',
  'glutes',
  'hamstrings',
  'calves',
  'lats',
  'forearms',
  'middle_back',
  'quadriceps',
]

const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Request failed ${response.status}: ${body}`)
  }

  return await response.json() as T
}

const fetchMealContent = async (): Promise<ContentPayload | null> => {
  const data = await fetchJson<{ meals: MealDbMeal[] | null }>(THE_MEAL_DB_RANDOM_URL)
  const meal = data.meals?.[0]
  if (!meal?.idMeal || !meal?.strMeal) return null

  const ingredients: string[] = []
  for (let i = 1; i <= 20; i += 1) {
    const ingredient = String(meal[`strIngredient${i}`] ?? '').trim()
    const measure = String(meal[`strMeasure${i}`] ?? '').trim()
    if (ingredient) ingredients.push(`${measure} ${ingredient}`.trim())
  }

  const instructions = String(meal.strInstructions ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    id: `api_mealdb_${meal.idMeal}`,
    title: meal.strMeal,
    description: `${meal.strArea || 'Recipe'} recipe. ${meal.strCategory ? `Original category: ${meal.strCategory}.` : ''}`.trim(),
    type: 'recipe',
    category: 'cooking',
    duration: '30 min',
    image: meal.strMealThumb || null,
    instructions,
    ingredients,
    video_url: meal.strYoutube || null,
    author: 'TheMealDB',
  }
}

const fetchExerciseContent = async (apiKey: string, muscle: string): Promise<ContentPayload | null> => {
  const data = await fetchJson<ApiNinjasExercise[]>(`${API_NINJAS_EXERCISE_URL}?muscle=${encodeURIComponent(muscle)}`, {
    headers: { 'X-Api-Key': apiKey },
  })

  if (!Array.isArray(data) || data.length === 0) return null

  const exercise = data[Math.floor(Math.random() * data.length)]
  if (!exercise?.name) return null

  const idSeed = slugify(exercise.name)
  const instructions = String(exercise.instructions ?? '')
    .split(/\.\s+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    id: `api_ninjas_exercise_${idSeed}`,
    title: exercise.name,
    description: [
      exercise.difficulty ? `Difficulty: ${exercise.difficulty}` : null,
      exercise.muscle ? `Muscle: ${exercise.muscle}` : null,
      exercise.equipment ? `Equipment: ${exercise.equipment}` : null,
    ].filter(Boolean).join(' | ') || null,
    type: 'exercise',
    category: 'workout',
    duration: '10 min',
    image: `https://picsum.photos/seed/api_ninjas_${idSeed}/400/600`,
    instructions,
    ingredients: null,
    video_url: null,
    author: 'API Ninjas',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const startedAt = new Date().toISOString()
  let runId: number | null = null

  try {
    const expectedSecret = Deno.env.get('API_CONTENT_SYNC_SECRET') || Deno.env.get('CRON_SECRET')
    const providedSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (expectedSecret && providedSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase service configuration')

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: run } = await supabase
      .from('api_content_sync_runs')
      .insert({ status: 'running', started_at: startedAt })
      .select('id')
      .maybeSingle()
    runId = run?.id ?? null

    const requestedMeals = Number(Deno.env.get('API_CONTENT_SYNC_MEALS') ?? 5)
    const requestedExercises = Number(Deno.env.get('API_CONTENT_SYNC_EXERCISES') ?? 5)
    const apiNinjasKey = Deno.env.get('API_NINJAS_KEY')
    const collected = new Map<string, ContentPayload>()
    const errors: string[] = []

    for (let i = 0; i < requestedMeals; i += 1) {
      try {
        const meal = await fetchMealContent()
        if (meal) collected.set(meal.id, meal)
      } catch (error) {
        errors.push(`TheMealDB: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (apiNinjasKey) {
      for (let i = 0; i < requestedExercises; i += 1) {
        const muscle = MUSCLES[(new Date().getUTCDate() + i) % MUSCLES.length]
        try {
          const exercise = await fetchExerciseContent(apiNinjasKey, muscle)
          if (exercise) collected.set(exercise.id, exercise)
        } catch (error) {
          errors.push(`API Ninjas: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    } else {
      errors.push('API_NINJAS_KEY not configured; skipped exercises')
    }

    const contents = Array.from(collected.values())

    if (contents.length > 0) {
      const titles = Array.from(new Set(contents.map((item) => item.title)))
      const authors = Array.from(new Set(contents.map((item) => item.author)))
      const { data: matchingRows, error: matchingError } = await supabase
        .from('contents')
        .select('id, title, author')
        .in('title', titles)
        .in('author', authors)

      if (matchingError) throw matchingError

      const existingByAuthorAndTitle = new Map(
        matchingRows?.map((row) => [`${row.author}::${row.title}`, row.id]) ?? [],
      )

      contents.forEach((item) => {
        const existingId = existingByAuthorAndTitle.get(`${item.author}::${item.title}`)
        if (existingId) item.id = existingId
      })
    }

    const ids = contents.map((item) => item.id)
    const existingIds = new Set<string>()

    if (ids.length > 0) {
      const { data: existing, error: existingError } = await supabase
        .from('contents')
        .select('id')
        .in('id', ids)

      if (existingError) throw existingError
      existing?.forEach((row) => existingIds.add(row.id))

      const { error: upsertError } = await supabase
        .from('contents')
        .upsert(contents, { onConflict: 'id' })

      if (upsertError) throw upsertError
    }

    const updatedCount = contents.filter((item) => existingIds.has(item.id)).length
    const insertedCount = contents.length - updatedCount
    const details = {
      insertedIds: contents.filter((item) => !existingIds.has(item.id)).map((item) => item.id),
      updatedIds: contents.filter((item) => existingIds.has(item.id)).map((item) => item.id),
      errors,
    }
    const status = errors.length > 0 && contents.length === 0 ? 'failed' : 'success'

    if (runId) {
      await supabase
        .from('api_content_sync_runs')
        .update({
          status,
          finished_at: new Date().toISOString(),
          inserted_count: insertedCount,
          updated_count: updatedCount,
          skipped_count: errors.length,
          error_message: errors.length ? errors.join('\n').slice(0, 2000) : null,
          details,
        })
        .eq('id', runId)
    }

    return new Response(JSON.stringify({
      status,
      insertedCount,
      updatedCount,
      skippedCount: errors.length,
      details,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status === 'failed' ? 500 : 200,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[weekly-api-content-sync]', message)

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (runId && supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey)
        await supabase
          .from('api_content_sync_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: message,
          })
          .eq('id', runId)
      }
    } catch {
      // The HTTP response below is the source of truth if logging also fails.
    }

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
