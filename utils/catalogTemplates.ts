import { Activity, Scenario, ScenarioDeviceState } from '@/constants/data/types';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import { supabase } from '@/utils/supabase';

type ActivityTemplateRow = {
  id: string;
  title: string;
  description: string | null;
  room: string | null;
  image: string | null;
  category: string | null;
  type: Activity['type'] | string | null;
  content_id: string | null;
  scenario_id: string | null;
  shortcuts: boolean | null;
  keywords: string[] | null;
};

type ScenarioTemplateRow = {
  id: string;
  title: string;
  description: string | null;
  room: string | null;
  image: string | null;
  category: string | null;
  playlist: string | null;
  playlist_id: string | null;
  focus_mode: boolean | null;
  shortcuts: boolean | null;
  devices: ScenarioDeviceState[] | null;
  keywords: string[] | null;
};

type UserScenarioRow = {
  id: number | string;
  name: string;
  description?: string | null;
  room_id?: number | string | null;
  image?: string | null;
  playlist_id?: string | null;
  playlist_name?: string | null;
  focus_mode_enabled?: boolean | null;
  shortcuts?: boolean | string | null;
  rooms?: { name?: string | null } | null;
};

type UserActivityRow = {
  id: number | string;
  title: string;
  description: string | null;
  room_id?: string | null;
  image?: string | null;
  category?: string | null;
  type?: string | null;
  content_id?: string | null;
  scenario_id?: number | string | null;
  shortcuts?: boolean | string | null;
  created_at?: string;
  updated_at?: string;
};

type FetchCatalogOptions = {
  forceRefresh?: boolean;
};

let activityTemplatesCache: Activity[] | null = null;
let scenarioTemplatesCache: Scenario[] | null = null;
let activityTemplatesPromise: Promise<Activity[]> | null = null;
let scenarioTemplatesPromise: Promise<Scenario[]> | null = null;

export const USER_SCENARIO_ID_PREFIX = 'scenario:';

const LOCAL_SCENARIO_TEMPLATES: Scenario[] = [
  {
    id: 's900',
    title: 'TV Relaxation',
    description:
      'A living room wind-down scene that uses the TV as the main ambient device.',
    room: 'Living Room',
    room_id: 'Living Room',
    image: resolveCatalogImage('Scenarios/moonlight_bay.png'),
    category: 'My creations',
    devices: [
      {
        deviceId: 'dev_tv_living',
        state: 'on',
        value: 'Ocean visuals',
      },
      {
        deviceId: 'dev_speaker_living',
        state: 'on',
        value: 'Calm music',
      },
    ],
    playlist: 'Peaceful Meditation',
    playlist_id: '37i9dQZF1DWZ0XmS6AnY9s',
    focusMode: true,
    shortcuts: false,
    keywords: ['tv', 'relax', 'meditation', 'living room'],
  },
];

const normalizeActivityType = (type: string | null | undefined): Activity['type'] => {
  const normalized = String(type ?? 'other').toLowerCase();
  if (normalized === 'audiobook') return 'audiobooks';
  if (['cooking', 'meditation', 'workout', 'audiobooks', 'general', 'reading', 'yoga', 'other'].includes(normalized)) {
    return normalized as Activity['type'];
  }
  return 'other';
};

export const normalizeScenarioTemplateId = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return undefined;
  const raw = String(value);
  if (raw.startsWith(USER_SCENARIO_ID_PREFIX)) return raw;
  return raw.startsWith('s') ? raw : `s${raw}`;
};

export const isUserScenarioRouteId = (value: unknown) =>
  String(value ?? '').startsWith(USER_SCENARIO_ID_PREFIX);

export const toUserScenarioRouteId = (value: number | string) =>
  `${USER_SCENARIO_ID_PREFIX}${value}`;

export const parseUserScenarioDbId = (value: unknown) => {
  const raw = String(value ?? '');
  return isUserScenarioRouteId(raw)
    ? raw.slice(USER_SCENARIO_ID_PREFIX.length)
    : raw;
};

const normalizeActivityTemplateId = (id: string) =>
  id.startsWith('template:') ? id.replace(/^template:/, '') : id;

const LOCAL_ACTIVITY_TEMPLATE_ROWS: ActivityTemplateRow[] = [
  {
    id: '1',
    title: 'Italian Night',
    description: 'A cozy cooking session with italian vibes.',
    room: 'Kitchen',
    image: 'cooking_activities/my_creations_cooking/italian_night.png',
    category: 'My creations',
    type: 'cooking',
    content_id: 'c1',
    scenario_id: 's4',
    shortcuts: false,
    keywords: ['evening', 'dinner', 'italian', 'pasta', 'relaxed'],
  },
  {
    id: '2',
    title: 'Sunrise Flow',
    description: 'Start your day with energy.',
    room: 'Living Room',
    image: 'activities_for_you/sunrise_flow.png',
    category: 'My creations',
    type: 'meditation',
    content_id: 'c9',
    scenario_id: 's1',
    shortcuts: false,
    keywords: ['morning', 'energy', 'meditation', 'stressed'],
  },
  {
    id: '3',
    title: 'Gratitude Flow',
    description:
      'With a gentle voice guiding you, focus for 8 minutes on things you are grateful for.',
    room: 'Bedroom',
    image: 'meditation_activities/my_creations/gratitude_flow.png',
    category: 'My creations',
    type: 'meditation',
    content_id: 'c2',
    scenario_id: 's5',
    shortcuts: false,
    keywords: ['morning', 'gratitude', 'zen', 'relaxed'],
  },
  {
    id: '4',
    title: 'Brownies',
    description: 'Easy homemade brownies that are fudgy and delicious.',
    room: 'Kitchen',
    image: 'cooking_activities/recommended/brownies.png',
    category: null,
    type: 'cooking',
    content_id: 'c3',
    scenario_id: 's3',
    shortcuts: false,
    keywords: ['chocolate', 'dessert', 'baking', 'relaxed'],
  },
  {
    id: '5',
    title: 'Morning Zen',
    description: 'Quick meditation session.',
    room: 'Living Room',
    image: 'meditation_content/video_sessions/morning_zen.png',
    category: null,
    type: 'meditation',
    content_id: 'c2',
    scenario_id: 's5',
    shortcuts: false,
    keywords: ['morning', 'zen', 'meditation', 'stressed'],
  },
  {
    id: '6',
    title: 'Eggs Benedict',
    description:
      'Master the art of the perfect brunch with crispy muffins, tender poached eggs, and rich Hollandaise sauce.',
    room: 'Kitchen',
    image: 'cooking_activities/recommended/eggs_benedict.png',
    category: null,
    type: 'cooking',
    content_id: 'c10',
    scenario_id: 's4',
    shortcuts: false,
    keywords: ['morning', 'breakfast', 'brunch', 'relaxed'],
  },
  {
    id: '7',
    title: 'Vodka Pasta',
    description:
      'A rich and creamy tomato sauce infused with a splash of vodka.',
    room: 'Kitchen',
    image: 'cooking_activities/simple_recipes/vodka_pasta.png',
    category: 'Simple recipes',
    type: 'cooking',
    content_id: 'c14',
    scenario_id: null,
    shortcuts: false,
    keywords: ['evening', 'dinner', 'pasta', 'cooking'],
  },
  {
    id: '8',
    title: 'Evening Read',
    description:
      'Unwind after a long day with an engaging audiobook summary.',
    room: 'Bedroom',
    image: 'activities_for_you/evening_read.png',
    category: null,
    type: 'audiobooks',
    content_id: 'c8',
    scenario_id: 's2',
    shortcuts: false,
    keywords: ['evening', 'reading', 'relax', 'focus'],
  },
  {
    id: '9',
    title: 'Chocolate Cake',
    description:
      'A rich, moist, and decadent chocolate cake for a special celebration.',
    room: 'Kitchen',
    image: 'cooking_activities/simple_recipes/chocolate_cake.png',
    category: 'Simple recipes',
    type: 'cooking',
    content_id: 'c13',
    scenario_id: null,
    shortcuts: false,
    keywords: ['dessert', 'chocolate', 'baking', 'relaxed'],
  },
  {
    id: '10',
    title: 'Pasta Primo',
    description:
      'A simple pasta dish for a quick lunch or hassle-free weeknight dinner.',
    room: 'Kitchen',
    image: 'cooking_activities/simple_recipes/pasta.png',
    category: 'Simple recipes',
    type: 'cooking',
    content_id: 'c12',
    scenario_id: null,
    shortcuts: false,
    keywords: ['lunch', 'dinner', 'quick', 'pasta'],
  },
  {
    id: '11',
    title: 'Stretching',
    description:
      'Release tension and improve flexibility with this gentle full-body routine.',
    room: 'Bedroom',
    image: 'activities_for_you/stretching.png',
    category: 'My creations',
    type: 'workout',
    content_id: 'c11',
    scenario_id: 's6',
    shortcuts: false,
    keywords: ['morning', 'stretch', 'relax', 'anxious'],
  },
  {
    id: '15',
    title: 'Visualization for Success',
    description:
      'Boost your confidence and clarity by mentally rehearsing your goals.',
    room: 'Bedroom',
    image: 'meditation_activities/recommended/visualization_for_success.png',
    category: 'Meditation',
    type: 'meditation',
    content_id: 'c15',
    scenario_id: 's2',
    shortcuts: false,
    keywords: ['focus', 'success', 'confidence', 'anxious'],
  },
  {
    id: '16',
    title: 'Cooking Time',
    description:
      'Transform your kitchen into a culinary studio and create something delicious from scratch.',
    room: 'Kitchen',
    image: 'shortcuts/cooking_time.png',
    category: 'My creations',
    type: 'cooking',
    content_id: 'c16',
    scenario_id: 's12',
    shortcuts: true,
    keywords: ['cooking', 'kitchen', 'creative', 'focus'],
  },
  {
    id: '17',
    title: 'Meditation Time',
    description:
      'Dedicate time to stillness and reconnect with your inner peace through guided breathwork.',
    room: 'Bedroom',
    image: 'shortcuts/meditation_time.png',
    category: 'Meditation',
    type: 'meditation',
    content_id: 'c17',
    scenario_id: 's13',
    shortcuts: true,
    keywords: ['meditation', 'calm', 'breathing', 'stressed'],
  },
];

export const mapActivityTemplate = (row: ActivityTemplateRow): Activity => ({
  id: `template:${row.id}`,
  title: row.title,
  description: row.description ?? '',
  room: row.room ?? undefined,
  room_id: row.room ?? undefined,
  image: resolveCatalogImage(row.image),
  category: row.category ?? undefined,
  type: normalizeActivityType(row.type),
  content_id: row.content_id ?? undefined,
  contentId: row.content_id ?? undefined,
  scenario_id: row.scenario_id ?? undefined,
  scenarioId: row.scenario_id ?? undefined,
  shortcuts: row.shortcuts === true,
  keywords: row.keywords ?? [],
});

const LOCAL_ACTIVITY_TEMPLATES = LOCAL_ACTIVITY_TEMPLATE_ROWS.map(mapActivityTemplate);

export const mapScenarioTemplate = (row: ScenarioTemplateRow): Scenario => ({
  id: row.id,
  title: row.title,
  description: row.description ?? '',
  room: row.room ?? undefined,
  room_id: row.room ?? undefined,
  image: resolveCatalogImage(row.image),
  category: row.category ?? undefined,
  devices: Array.isArray(row.devices) ? row.devices : [],
  playlist: row.playlist ?? undefined,
  playlist_id: row.playlist_id ?? undefined,
  focusMode: row.focus_mode === true,
  shortcuts: row.shortcuts === true,
  keywords: row.keywords ?? [],
});

export const mapUserScenario = (row: UserScenarioRow): Scenario => ({
  id: toUserScenarioRouteId(row.id),
  title: row.name,
  description: row.description ?? '',
  room: row.rooms?.name ?? undefined,
  room_id: row.room_id !== null && row.room_id !== undefined ? String(row.room_id) : undefined,
  image: resolveCatalogImage(row.image || 'Scenarios/moonlight_bay.png'),
  category: 'My creations',
  devices: [],
  playlist: row.playlist_name ?? (row.playlist_id ? 'Spotify Music' : undefined),
  playlist_id: row.playlist_id ?? undefined,
  focusMode: row.focus_mode_enabled === true,
  shortcuts: row.shortcuts === true || row.shortcuts === 'true',
  keywords: [],
});

export const mapUserActivity = (row: UserActivityRow): Activity => ({
  id: String(row.id),
  title: row.title,
  description: row.description ?? '',
  room_id: row.room_id ?? undefined,
  room: row.room_id ?? undefined,
  image: resolveCatalogImage(row.image),
  category: row.category ?? undefined,
  type: normalizeActivityType(row.type),
  content_id: row.content_id ?? undefined,
  contentId: row.content_id ?? undefined,
  scenario_id: normalizeScenarioTemplateId(row.scenario_id),
  scenarioId: normalizeScenarioTemplateId(row.scenario_id),
  shortcuts: row.shortcuts === true || row.shortcuts === 'true',
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const clearCatalogTemplateCache = () => {
  activityTemplatesCache = null;
  scenarioTemplatesCache = null;
  activityTemplatesPromise = null;
  scenarioTemplatesPromise = null;
};

export const fetchActivityTemplates = async ({ forceRefresh = false }: FetchCatalogOptions = {}): Promise<Activity[]> => {
  if (!forceRefresh && activityTemplatesCache) return activityTemplatesCache;
  if (!forceRefresh && activityTemplatesPromise) return activityTemplatesPromise;

  const request = (async () => {
    const { data, error } = await supabase
      .from('activity_templates')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Falling back to local activity templates:', error);
      activityTemplatesCache = LOCAL_ACTIVITY_TEMPLATES;
      return LOCAL_ACTIVITY_TEMPLATES;
    }

    const remoteTemplates = (data ?? []).map(mapActivityTemplate);
    const remoteIds = new Set(
      remoteTemplates.map((activity) => normalizeActivityTemplateId(activity.id)),
    );
    const templates = [
      ...remoteTemplates,
      ...LOCAL_ACTIVITY_TEMPLATES.filter(
        (activity) => !remoteIds.has(normalizeActivityTemplateId(activity.id)),
      ),
    ];
    activityTemplatesCache = templates;
    return templates;
  })();

  activityTemplatesPromise = request;
  try {
    return await request;
  } finally {
    if (activityTemplatesPromise === request) {
      activityTemplatesPromise = null;
    }
  }
};

export const fetchScenarioTemplates = async ({ forceRefresh = false }: FetchCatalogOptions = {}): Promise<Scenario[]> => {
  if (!forceRefresh && scenarioTemplatesCache) return scenarioTemplatesCache;
  if (!forceRefresh && scenarioTemplatesPromise) return scenarioTemplatesPromise;

  const request = (async () => {
    const { data, error } = await supabase
      .from('scenario_templates')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    const remoteTemplates = (data ?? []).map(mapScenarioTemplate);
    const remoteIds = new Set(remoteTemplates.map((scenario) => scenario.id));
    const templates = [
      ...remoteTemplates,
      ...LOCAL_SCENARIO_TEMPLATES.filter((scenario) => !remoteIds.has(scenario.id)),
    ];
    scenarioTemplatesCache = templates;
    return templates;
  })();

  scenarioTemplatesPromise = request;
  try {
    return await request;
  } finally {
    if (scenarioTemplatesPromise === request) {
      scenarioTemplatesPromise = null;
    }
  }
};

export const fetchUserScenarios = async (): Promise<Scenario[]> => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('id, name, description, room_id, image, playlist_id, playlist_name, focus_mode_enabled, shortcuts, rooms(name)')
    .order('id', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapUserScenario(row as UserScenarioRow));
};

export const fetchActivityTemplateById = async (id: string) => {
  if (!id.startsWith('template:')) return null;
  const templateId = normalizeActivityTemplateId(id);
  const cachedTemplate = activityTemplatesCache?.find((item) => normalizeActivityTemplateId(item.id) === templateId);
  if (cachedTemplate) return cachedTemplate;

  const localTemplate = LOCAL_ACTIVITY_TEMPLATES.find(
    (item) => normalizeActivityTemplateId(item.id) === templateId,
  );

  const { data, error } = await supabase
    .from('activity_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();

  if (error) {
    console.warn('Falling back to local activity template:', error);
    return localTemplate ?? null;
  }
  return data ? mapActivityTemplate(data) : localTemplate ?? null;
};

export const fetchScenarioTemplateById = async (id: string) => {
  if (isUserScenarioRouteId(id)) {
    const scenarioId = parseUserScenarioDbId(id);
    const { data, error } = await supabase
      .from('scenarios')
      .select('id, name, description, room_id, image, playlist_id, playlist_name, focus_mode_enabled, shortcuts, rooms(name)')
      .eq('id', scenarioId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapUserScenario(data as UserScenarioRow) : null;
  }

  const normalizedId = normalizeScenarioTemplateId(id) ?? id;
  const cachedScenario = scenarioTemplatesCache?.find((item) => item.id === normalizedId);
  if (cachedScenario) return cachedScenario;

  const localScenario = LOCAL_SCENARIO_TEMPLATES.find((item) => item.id === normalizedId);
  if (localScenario) return localScenario;

  const { data, error } = await supabase
    .from('scenario_templates')
    .select('*')
    .eq('id', normalizedId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapScenarioTemplate(data) : null;
};
