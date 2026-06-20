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
  devices?: ScenarioDeviceState[] | null;
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
  playlist_id?: string | null;
  shortcuts?: boolean | string | null;
  created_at?: string;
  updated_at?: string;
  rooms?: { name?: string | null } | null;
};

type FetchCatalogOptions = {
  forceRefresh?: boolean;
};

let activityTemplatesCache: Activity[] | null = null;
let scenarioTemplatesCache: Scenario[] | null = null;
let activityTemplatesPromise: Promise<Activity[]> | null = null;
let scenarioTemplatesPromise: Promise<Scenario[]> | null = null;

export const USER_SCENARIO_ID_PREFIX = 'scenario:';

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

export const resolvePossibleUserScenarioDbIds = (value: unknown) => {
  const raw = String(value ?? '').trim();
  if (!raw) return [];

  const candidates = new Set<string>();
  const direct = parseUserScenarioDbId(raw).trim();
  if (direct) candidates.add(direct);

  if (/^s\d+$/i.test(raw)) {
    candidates.add(raw.slice(1));
  }

  return Array.from(candidates);
};

const normalizeActivityTemplateId = (id: string) =>
  id.startsWith('template:') ? id.replace(/^template:/, '') : id;


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
  devices: Array.isArray(row.devices) ? row.devices : [],
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
  room_id: row.room_id !== null && row.room_id !== undefined ? String(row.room_id) : undefined,
  room: row.rooms?.name ?? (row.room_id !== null && row.room_id !== undefined ? String(row.room_id) : undefined),
  image: resolveCatalogImage(row.image),
  category: row.category ?? undefined,
  type: normalizeActivityType(row.type),
  content_id: row.content_id ?? undefined,
  contentId: row.content_id ?? undefined,
  scenario_id: normalizeScenarioTemplateId(row.scenario_id),
  scenarioId: normalizeScenarioTemplateId(row.scenario_id),
  playlist_id: row.playlist_id ?? undefined,
  playlistId: row.playlist_id ?? undefined,
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

    if (error) throw error;

    const templates = (data ?? []).map(mapActivityTemplate);
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
    const templates = (data ?? []).map(mapScenarioTemplate);
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
    .select('id, name, description, room_id, image, playlist_id, playlist_name, focus_mode_enabled, shortcuts, devices, rooms(name)')
    .order('id', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapUserScenario(row as UserScenarioRow));
};

export const fetchActivityTemplateById = async (id: string) => {
  if (!id.startsWith('template:')) return null;
  const templateId = normalizeActivityTemplateId(id);
  const cachedTemplate = activityTemplatesCache?.find((item) => normalizeActivityTemplateId(item.id) === templateId);
  if (cachedTemplate) return cachedTemplate;

  const { data, error } = await supabase
    .from('activity_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load activity template by id:', error);
    return null;
  }
  return data ? mapActivityTemplate(data) : null;
};

export const fetchScenarioTemplateById = async (id: string) => {
  if (isUserScenarioRouteId(id)) {
    const scenarioId = parseUserScenarioDbId(id);
    const { data, error } = await supabase
      .from('scenarios')
      .select('id, name, description, room_id, image, playlist_id, playlist_name, focus_mode_enabled, shortcuts, devices, rooms(name)')
      .eq('id', scenarioId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapUserScenario(data as UserScenarioRow) : null;
  }

  const normalizedId = normalizeScenarioTemplateId(id) ?? id;
  const cachedScenario = scenarioTemplatesCache?.find((item) => item.id === normalizedId);
  if (cachedScenario) return cachedScenario;

  const { data, error } = await supabase
    .from('scenario_templates')
    .select('*')
    .eq('id', normalizedId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load scenario template by id:', error);
    return null;
  }
  return data ? mapScenarioTemplate(data) : null;
};
