import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SmartDeviceType =
  | 'light'
  | 'speaker'
  | 'difuser'
  | 'purifier'
  | 'tv'
  | 'computer'
  | 'assistant'
  | 'outlet'
  | 'display'
  | 'router'
  | 'sensor'
  | 'appliance'
  | 'coffee'
  | 'ac'
  | 'heater'
  | 'heart'
  | 'unknown';

export type SmartDeviceStatus = 'On' | 'Off';

export interface DeviceRecord {
  id: number;
  name: string;
  type: string | null;
  source?: string | null;
  status?: string | null;
  room_id?: number | null;
  home_id?: number | null;
  external_id?: string | null;
  last_seen?: string | null;
  status_level?: number | null;
  connectivity_status?: string | null;
  discovery_method?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  room_hint?: string | null;
  metadata?: Record<string, unknown> | null;
  capabilities?: Record<string, unknown> | null;
}

export interface AppDevice {
  id: number;
  name: string;
  type: SmartDeviceType;
  status: SmartDeviceStatus;
  level: number;
  room_id: number | null;
  home_id: number | null;
  status_level: number;
  source?: string | null;
  external_id?: string | null;
  last_seen?: string | null;
  connectivity_status?: string | null;
  discovery_method?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  room_hint?: string | null;
}

const MOCK_EXTERNAL_IDS = new Set([
  'network:samsung-smart-tv',
  'network:google-nest-speaker',
  'network:hp-envy-laptop',
]);

const SEEDED_DEVICE_NAMES = new Set([
  'Bedroom Lights',
  'Bedroom Speakers',
  'Difuser',
  'Air Purifier',
  'Living Room Lights',
  'AC Unit',
  'Smart TV',
  'Kitchen Lights',
  'Smart Fridge',
  'Coffee Maker',
  'Bathroom Lights',
  'Water Heater',
]);

const PERSONAL_DEVICE_HINTS = [
  'iphone',
  'android',
  'smartphone',
  'phone',
  'mobile',
  'cellphone',
  'ipad',
  'tablet',
  'laptop',
  'macbook',
  'notebook',
  'desktop',
  'computer',
  'pc',
];

const TYPE_ALIASES: Record<string, SmartDeviceType> = {
  light: 'light',
  lamp: 'light',
  bulb: 'light',
  speaker: 'speaker',
  audio: 'speaker',
  tv: 'tv',
  television: 'tv',
  display: 'display',
  screen: 'display',
  computer: 'computer',
  laptop: 'computer',
  desktop: 'computer',
  purifier: 'purifier',
  air_purifier: 'purifier',
  airpurifier: 'purifier',
  difuser: 'difuser',
  diffuser: 'difuser',
  outlet: 'outlet',
  plug: 'outlet',
  smart_plug: 'outlet',
  assistant: 'assistant',
  alexa: 'assistant',
  google_home: 'assistant',
  nest: 'assistant',
  router: 'router',
  sensor: 'sensor',
  appliance: 'appliance',
  coffee: 'coffee',
  ac: 'ac',
  heater: 'heater',
  heart: 'heart',
};

export const isRealHomeDevice = (device: Partial<DeviceRecord>) => {
  const discoveryMethod = device.discovery_method?.toLowerCase();
  const source = device.source?.toLowerCase();
  const name = device.name?.trim();
  const externalId = device.external_id?.trim();
  const normalizedType = normalizeDeviceType(device.type);
  const searchable = [
    device.name,
    device.type,
    device.model,
    device.external_id,
  ]
    .map((value) => String(value ?? '').toLowerCase())
    .join(' ');

  if (discoveryMethod === 'mock' || source === 'seeded_mock') {
    return false;
  }

  if (source === 'network' && normalizedType === 'computer') {
    return false;
  }

  if (source === 'network' && PERSONAL_DEVICE_HINTS.some((hint) => searchable.includes(hint))) {
    return false;
  }

  if (externalId && MOCK_EXTERNAL_IDS.has(externalId)) {
    return false;
  }

  if (!externalId && name && SEEDED_DEVICE_NAMES.has(name)) {
    return false;
  }

  return true;
};

export const normalizeDeviceType = (value?: string | null): SmartDeviceType => {
  if (!value) return 'unknown';

  const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');
  return TYPE_ALIASES[normalized] ?? 'unknown';
};

export const normalizeDeviceStatus = (device: Partial<DeviceRecord>): SmartDeviceStatus => {
  const connectivity = device.connectivity_status?.toLowerCase();
  const status = device.status?.toLowerCase();

  if (connectivity === 'offline' || status === 'offline') {
    return 'Off';
  }

  if (
    status === 'on' ||
    status === 'connected' ||
    status === 'online' ||
    status === 'playing'
  ) {
    return 'On';
  }

  return 'Off';
};

export const mapDeviceRecordToAppDevice = (device: DeviceRecord): AppDevice => ({
  id: device.id,
  name: device.name,
  type: normalizeDeviceType(device.type),
  status: normalizeDeviceStatus(device),
  level: device.status_level ?? 100,
  room_id: device.room_id ?? null,
  home_id: device.home_id ?? null,
  status_level: device.status_level ?? 100,
  source: device.source ?? null,
  external_id: device.external_id ?? null,
  last_seen: device.last_seen ?? null,
  connectivity_status: device.connectivity_status ?? null,
  discovery_method: device.discovery_method ?? null,
  manufacturer: device.manufacturer ?? null,
  model: device.model ?? null,
  room_hint: device.room_hint ?? null,
});

export const sortDevicesByFreshness = <T extends Partial<DeviceRecord>>(devices: T[]) =>
  [...devices].sort((left, right) => {
    const leftTime = left.last_seen ? new Date(left.last_seen).getTime() : 0;
    const rightTime = right.last_seen ? new Date(right.last_seen).getTime() : 0;
    return rightTime - leftTime;
  });

export const subscribeToHomeDeviceChanges = (
  homeId: number,
  onChange: () => void,
): RealtimeChannel => {
  const channel = supabase
    .channel(`devices-home-${homeId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'devices',
        filter: `home_id=eq.${homeId}`,
      },
      onChange,
    )
    .subscribe();

  return channel;
};
