import { Activity, Scenario } from '@/constants/data/types';
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
  devices: any[] | null;
  keywords: string[] | null;
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
  return raw.startsWith('s') ? raw : `s${raw}`;
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

export const fetchActivityTemplates = async () => {
  const { data, error } = await supabase
    .from('activity_templates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapActivityTemplate);
};

export const fetchScenarioTemplates = async () => {
  const { data, error } = await supabase
    .from('scenario_templates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapScenarioTemplate);
};

export const fetchActivityTemplateById = async (id: string) => {
  if (!id.startsWith('template:')) return null;

  const { data, error } = await supabase
    .from('activity_templates')
    .select('*')
    .eq('id', normalizeActivityTemplateId(id))
    .maybeSingle();

  if (error) throw error;
  return data ? mapActivityTemplate(data) : null;
};

export const fetchScenarioTemplateById = async (id: string) => {
  const { data, error } = await supabase
    .from('scenario_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapScenarioTemplate(data) : null;
};
