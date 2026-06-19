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

type WorkoutXExercise = {
  id?: string | number | null
  exerciseId?: string | number | null
  name?: string | null
  bodyPart?: string | null
  target?: string | null
  equipment?: string | null
  difficulty?: string | null
  description?: string | null
  instructions?: string | null
  gifUrl?: string | null
  gif_url?: string | null
}

type LibrivoxAuthor = {
  id?: string | number | null
  first_name?: string | null
  last_name?: string | null
  dob?: string | null
  dod?: string | null
}

type LibrivoxGenre = {
  id?: string | number | null
  name?: string | null
}

type LibrivoxBook = {
  id?: string | number | null
  title?: string | null
  description?: string | null
  language?: string | null
  copyright_year?: string | number | null
  num_sections?: string | number | null
  totaltime?: string | null
  totaltimesecs?: string | number | null
  url_librivox?: string | null
  url_zip_file?: string | null
  coverart_jpg?: string | null
  coverart_thumbnail?: string | null
  authors?: LibrivoxAuthor[] | null
  genre?: string | null
  genres?: LibrivoxGenre[] | string[] | null
}

type LibrivoxTrack = {
  id?: string | number | null
  section_number?: string | number | null
  title?: string | null
  listen_url?: string | null
  language?: string | null
  playtime?: string | number | null
  file_name?: string | null
}

const THE_MEAL_DB_RANDOM_URL = 'https://www.themealdb.com/api/json/v1/1/random.php'
const WORKOUTX_EXERCISES_URL = 'https://api.workoutxapp.com/v1/exercises'
const WORKOUTX_GIFS_URL = 'https://api.workoutxapp.com/v1/gifs'
const LIBRIVOX_AUDIOBOOKS_URL = 'https://librivox.org/api/feed/audiobooks'
const LIBRIVOX_AUDIOTRACKS_URL = 'https://librivox.org/api/feed/audiotracks'
const WORKOUTX_AUTHOR = 'WorkoutX'
const API_MEDIA_BUCKET = 'api-content-media'

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

const currentWeekSeed = () => {
  const now = new Date()
  const utcDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor(utcDate / (7 * 24 * 60 * 60 * 1000))
}

const createSeededRandom = (seed: number) => {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646

  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

const shuffleWithSeed = <T>(items: T[], seed: number) => {
  const copy = [...items]
  const random = createSeededRandom(seed)

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

const splitInstructionText = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .split(/(?:\r?\n)+|;\s+|[.!?],\s*|(?<=[.!?])\s+(?=[A-Z0-9])|(?<=\d\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean)

const parseInstructions = (value: string | null | undefined) =>
  splitInstructionText(value).map((line) => line.replace(/\s+/g, ' ').trim())

const stripHtml = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()

const summarizePayloadShape = (value: unknown) => {
  if (Array.isArray(value)) return `array(${value.length})`
  if (!value || typeof value !== 'object') return typeof value
  return `object keys: ${Object.keys(value as Record<string, unknown>).slice(0, 12).join(', ')}`
}

const extractWorkoutXExercises = (payload: unknown): WorkoutXExercise[] => {
  if (Array.isArray(payload)) return payload as WorkoutXExercise[]
  if (!payload || typeof payload !== 'object') return []

  const record = payload as Record<string, unknown>
  const candidates = [
    record.exercises,
    record.results,
    record.data,
    record.items,
    record.rows,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as WorkoutXExercise[]
  }

  return []
}

const normalizeExerciseId = (exercise: WorkoutXExercise) => {
  const rawId = exercise.id ?? exercise.exerciseId
  const name = String(exercise.name ?? '').trim()

  if (rawId !== null && rawId !== undefined && String(rawId).trim()) {
    return String(rawId).trim()
  }

  return name ? slugify(name) : ''
}

const normalizeLibrivoxBookId = (book: LibrivoxBook) => {
  const rawId = book.id
  const title = String(book.title ?? '').trim()

  if (rawId !== null && rawId !== undefined && String(rawId).trim()) {
    return String(rawId).trim()
  }

  return title ? slugify(title) : ''
}

const formatLibrivoxAuthor = (author: LibrivoxAuthor) => {
  const name = [author.first_name, author.last_name]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' ')

  return name || 'LibriVox'
}

const formatLibrivoxAuthors = (authors: LibrivoxAuthor[] | null | undefined) => {
  const names = (authors ?? [])
    .map(formatLibrivoxAuthor)
    .filter(Boolean)

  return names.length > 0 ? names.join(', ') : 'LibriVox'
}

const formatLibrivoxGenre = (book: LibrivoxBook) => {
  const directGenre = String(book.genre ?? '').trim()
  if (directGenre) return directGenre

  const genreNames = (book.genres ?? [])
    .map((genre) => {
      if (typeof genre === 'string') return genre.trim()
      return String(genre?.name ?? '').trim()
    })
    .filter(Boolean)

  return genreNames[0] || 'Audiobooks'
}

const isEnglishLibrivoxBook = (book: LibrivoxBook) =>
  String(book.language ?? '').trim().toLowerCase() === 'english'

const buildLibrivoxDescription = (book: LibrivoxBook, author: string, trackCount: number) => {
  const summary = stripHtml(book.description)
  const metadata = [
    author ? `Author: ${author}` : null,
    book.copyright_year ? `Year: ${book.copyright_year}` : null,
    book.language ? `Language: ${book.language}` : null,
    trackCount > 0 ? `Tracks: ${trackCount}` : null,
  ].filter(Boolean)

  if (!summary) return metadata.join(' | ') || null
  if (metadata.length === 0) return summary
  return `${summary} | ${metadata.join(' | ')}`
}

const fetchLibrivoxTracks = async (projectId: string): Promise<unknown[]> => {
  const params = new URLSearchParams({
    project_id: projectId,
    format: 'json',
  })

  const payload = await fetchJson<{ sections?: LibrivoxTrack[] | null }>(
    `${LIBRIVOX_AUDIOTRACKS_URL}/?${params.toString()}`,
  )

  return (payload.sections ?? [])
    .map((track) => {
      const sectionNumber = String(track.section_number ?? '').trim()
      const title = String(track.title ?? '').trim() || `Track ${sectionNumber || '?'}`
      const duration = Number(track.playtime ?? 0)
      const cleanDuration = Number.isFinite(duration) && duration > 0 ? duration : undefined
      const listenUrl = String(track.listen_url ?? '').trim() || undefined

      return {
        text: sectionNumber ? `Track ${sectionNumber}: ${title}` : title,
        duration: cleanDuration,
        url: listenUrl,
      }
    })
    .filter((track) => String((track as { text?: string }).text ?? '').trim())
}

const fetchLibrivoxAudiobooks = async (
  requestedAudiobooks: number,
  existingAudiobookIds: Set<string> = new Set(),
): Promise<ContentPayload[]> => {
  if (requestedAudiobooks <= 0) return []

  const weekSeed = currentWeekSeed()
  const pageSize = Math.max(requestedAudiobooks * 4, 20)
  const baseOffset = weekSeed % 2000
  const candidates = new Map<string, LibrivoxBook>()

  for (let page = 0; page < 4 && candidates.size < requestedAudiobooks * 2; page += 1) {
    const params = new URLSearchParams({
      format: 'json',
      extended: '1',
      coverart: '1',
      limit: String(pageSize),
      offset: String(baseOffset + page * pageSize),
    })

    params.append('fields[]', 'id')
    params.append('fields[]', 'title')
    params.append('fields[]', 'description')
    params.append('fields[]', 'language')
    params.append('fields[]', 'copyright_year')
    params.append('fields[]', 'num_sections')
    params.append('fields[]', 'totaltime')
    params.append('fields[]', 'totaltimesecs')
    params.append('fields[]', 'url_librivox')
    params.append('fields[]', 'url_zip_file')
    params.append('fields[]', 'coverart_jpg')
    params.append('fields[]', 'coverart_thumbnail')
    params.append('fields[]', 'authors')
    params.append('fields[]', 'genre')
    params.append('fields[]', 'genres')

    const payload = await fetchJson<{ books?: LibrivoxBook[] | null }>(
      `${LIBRIVOX_AUDIOBOOKS_URL}/?${params.toString()}`,
    )

    const books = (payload.books ?? []).filter(isEnglishLibrivoxBook)
    for (const book of books) {
      const bookId = normalizeLibrivoxBookId(book)
      const title = String(book.title ?? '').trim()
      if (!bookId || !title) continue
      candidates.set(bookId, book)
    }
  }

  const shuffledBooks = shuffleWithSeed(Array.from(candidates.values()), weekSeed)
  const unseenBooks = shuffledBooks.filter((book) => {
    const bookId = normalizeLibrivoxBookId(book)
    return !existingAudiobookIds.has(`librivox_audiobook_${bookId}`)
  })

  const selectedBooks = [...unseenBooks, ...shuffledBooks]
    .filter((book, index, array) => {
      const bookId = normalizeLibrivoxBookId(book)
      return array.findIndex((candidate) => normalizeLibrivoxBookId(candidate) === bookId) === index
    })
    .slice(0, requestedAudiobooks)

  return await Promise.all(selectedBooks.map(async (book) => {
    const bookId = normalizeLibrivoxBookId(book)
    const author = formatLibrivoxAuthors(book.authors)
    const genre = formatLibrivoxGenre(book)
    const tracks = await fetchLibrivoxTracks(bookId)

    return {
      id: `librivox_audiobook_${bookId}`,
      title: String(book.title ?? '').trim(),
      description: buildLibrivoxDescription(book, author, tracks.length),
      type: 'audiobooks',
      category: genre,
      duration: String(book.totaltime ?? '').trim() || null,
      image: String(book.coverart_thumbnail ?? book.coverart_jpg ?? '').trim() || null,
      instructions: tracks,
      ingredients: null,
      video_url: String(book.url_librivox ?? '').trim() || null,
      author,
    }
  }))
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
    description: `${meal.strArea || 'Recipe'} recipe.`.trim(),
    type: 'recipe',
    category: String(meal.strCategory ?? '').trim() || 'cooking',
    duration: '30 min',
    image: meal.strMealThumb || null,
    instructions,
    ingredients,
    video_url: meal.strYoutube || null,
    author: 'TheMealDB',
  }
}

const fetchWorkoutXExercises = async (
  apiKey: string,
  requestedExercises: number,
): Promise<ContentPayload[]> => {
  const weekSeed = currentWeekSeed()
  const limit = Math.max(requestedExercises * 3, 30)
  const offset = weekSeed % 40

  const payload = await fetchJson<unknown>(
    `${WORKOUTX_EXERCISES_URL}?limit=${limit}&offset=${offset}`,
    {
      headers: { 'X-WorkoutX-Key': apiKey },
    },
  )

  const data = extractWorkoutXExercises(payload)
  if (data.length === 0) {
    throw new Error(`WorkoutX returned no exercises. Payload shape: ${summarizePayloadShape(payload)}`)
  }

  const uniqueExercises = new Map<string, WorkoutXExercise>()
  data.forEach((exercise) => {
    const exerciseId = normalizeExerciseId(exercise)
    const exerciseName = String(exercise.name ?? '').trim()
    if (!exerciseId || !exerciseName) return
    uniqueExercises.set(exerciseId, exercise)
  })

  return shuffleWithSeed(Array.from(uniqueExercises.values()), weekSeed)
    .slice(0, requestedExercises)
    .map((exercise) => {
      const exerciseId = normalizeExerciseId(exercise)
      const directGifUrl = [exercise.gifUrl, exercise.gif_url]
        .find((value) => typeof value === 'string' && value.trim()) ?? null

      return {
        id: `workoutx_exercise_${exerciseId}`,
        title: String(exercise.name ?? '').trim(),
        description: [
          exercise.description ? String(exercise.description).trim() : null,
          exercise.difficulty ? `Difficulty: ${exercise.difficulty}` : null,
          exercise.bodyPart ? `Body part: ${exercise.bodyPart}` : null,
          exercise.target ? `Target: ${exercise.target}` : null,
          exercise.equipment ? `Equipment: ${exercise.equipment}` : null,
        ].filter(Boolean).join(' | ') || null,
        type: 'exercise',
        category: 'workout',
        duration: '10 min',
        image: directGifUrl,
        instructions: parseInstructions(exercise.instructions),
        ingredients: null,
        video_url: null,
        author: WORKOUTX_AUTHOR,
      }
    })
}

const uploadGifToStorage = async (
  // deno-lint-ignore no-explicit-any
  supabase: any,
  apiKey: string,
  exerciseId: string,
): Promise<string | null> => {
  const gifResponse = await fetch(`${WORKOUTX_GIFS_URL}/${encodeURIComponent(exerciseId)}`, {
    headers: { 'X-WorkoutX-Key': apiKey },
    signal: AbortSignal.timeout(20000),
  })

  if (!gifResponse.ok) {
    const body = await gifResponse.text().catch(() => '')
    throw new Error(`WorkoutX GIF request failed ${gifResponse.status}: ${body}`)
  }

  const contentType = gifResponse.headers.get('content-type') || ''
  const uploadPath = `workoutx/${exerciseId}.gif`

  if (contentType.includes('application/json')) {
    const payload = await gifResponse.json().catch(() => null) as Record<string, unknown> | null
    const directUrl = [
      payload?.gifUrl,
      payload?.gif_url,
      payload?.url,
      payload?.image,
    ].find((value) => typeof value === 'string' && value.trim()) as string | undefined

    if (!directUrl) return null

    const directResponse = await fetch(directUrl, {
      signal: AbortSignal.timeout(20000),
    })

    if (!directResponse.ok) {
      throw new Error(`WorkoutX GIF asset request failed ${directResponse.status}`)
    }

    const buffer = await directResponse.arrayBuffer()
    const uploadContentType = directResponse.headers.get('content-type') || 'image/gif'

    const { error: uploadError } = await supabase.storage
      .from(API_MEDIA_BUCKET)
      .upload(uploadPath, buffer, {
        contentType: uploadContentType,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(API_MEDIA_BUCKET).getPublicUrl(uploadPath)
    return data.publicUrl
  }

  const buffer = await gifResponse.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from(API_MEDIA_BUCKET)
    .upload(uploadPath, buffer, {
      contentType: contentType || 'image/gif',
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(API_MEDIA_BUCKET).getPublicUrl(uploadPath)
  return data.publicUrl
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
    if (!expectedSecret) {
      return new Response(JSON.stringify({ error: 'Cron secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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
    const requestedExercises = Number(Deno.env.get('API_CONTENT_SYNC_EXERCISES') ?? 10)
    const requestedAudiobooks = Number(Deno.env.get('API_CONTENT_SYNC_AUDIOBOOKS') ?? 10)
    const workoutXKey = Deno.env.get('WORKOUTX_API_KEY')
    const collected = new Map<string, ContentPayload>()
    const errors: string[] = []
    const existingAudiobookIds = new Set<string>()

    if (requestedAudiobooks > 0) {
      const { data: existingAudiobooks, error: existingAudiobooksError } = await supabase
        .from('contents')
        .select('id')
        .eq('type', 'audiobooks')

      if (existingAudiobooksError) throw existingAudiobooksError
      existingAudiobooks?.forEach((row) => {
        if (row.id) existingAudiobookIds.add(String(row.id))
      })
    }

    for (let i = 0; i < requestedMeals; i += 1) {
      try {
        const meal = await fetchMealContent()
        if (meal) collected.set(meal.id, meal)
      } catch (error) {
        errors.push(`TheMealDB: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (workoutXKey) {
      try {
        const exercises = await fetchWorkoutXExercises(workoutXKey, requestedExercises)
        exercises.forEach((exercise) => collected.set(exercise.id, exercise))
      } catch (error) {
        errors.push(`WorkoutX: ${error instanceof Error ? error.message : String(error)}`)
      }
    } else {
      errors.push('WORKOUTX_API_KEY not configured; skipped exercises')
    }

    try {
      const audiobooks = await fetchLibrivoxAudiobooks(requestedAudiobooks, existingAudiobookIds)
      audiobooks.forEach((audiobook) => collected.set(audiobook.id, audiobook))
    } catch (error) {
      errors.push(`LibriVox: ${error instanceof Error ? error.message : String(error)}`)
    }

    const contents = Array.from(collected.values())

    if (contents.length > 0) {
      const titles = Array.from(new Set(contents.map((item) => item.title)))
      const authors = Array.from(new Set(contents.map((item) => item.author)))
      const { data: matchingRows, error: matchingError } = await supabase
        .from('contents')
        .select('id, title, author, image')
        .in('title', titles)
        .in('author', authors)

      if (matchingError) throw matchingError

      const existingByAuthorAndTitle = new Map(
        matchingRows?.map((row) => [`${row.author}::${row.title}`, row]) ?? [],
      )

      for (const item of contents) {
        const existingRow = existingByAuthorAndTitle.get(`${item.author}::${item.title}`)
        if (!existingRow) continue
        item.id = existingRow.id
        if (item.author === WORKOUTX_AUTHOR && existingRow.image) {
          item.image = existingRow.image
        }
      }
    }

    if (workoutXKey) {
      for (const item of contents) {
        if (item.author !== WORKOUTX_AUTHOR) continue
        if (item.image?.includes('/storage/v1/object/public/')) continue

        const exerciseId = item.id.replace(/^workoutx_exercise_/, '')
        try {
          const uploadedGifUrl = await uploadGifToStorage(supabase, workoutXKey, exerciseId)
          if (uploadedGifUrl) item.image = uploadedGifUrl
        } catch (error) {
          errors.push(`WorkoutX GIF ${exerciseId}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
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
