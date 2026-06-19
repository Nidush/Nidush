import { ScenarioDeviceState } from '@/constants/data';
import {
  setGoogleHomeDeviceBrightness,
  setGoogleHomeDeviceColor,
  setGoogleHomeDevicePower,
} from '@/utils/googleHome';
import { supabase } from '@/utils/supabase';

const clampPercentage = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const parseScenarioDeviceDbId = (value: string | undefined) => {
  const raw = String(value ?? '').trim();
  const normalized = raw.startsWith('db-') ? raw.slice(3) : raw;
  const numericId = Number(normalized);
  return Number.isFinite(numericId) ? numericId : null;
};

export const parseScenarioLevel = (config: ScenarioDeviceState) => {
  const candidates = [config.brightness, config.value];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return clampPercentage(candidate);
    }

    if (typeof candidate === 'string') {
      const parsed = Number.parseInt(candidate.replace(/[^0-9-]/g, ''), 10);
      if (Number.isFinite(parsed)) {
        return clampPercentage(parsed);
      }
    }
  }

  return null;
};

export const parseScenarioColor = (config: ScenarioDeviceState) => {
  const candidate = typeof config.color === 'string' && config.color.trim()
    ? config.color.trim()
    : typeof config.value === 'string' && config.value.trim().startsWith('#')
      ? config.value.trim()
      : null;

  if (!candidate) return null;

  const normalized = candidate.startsWith('#') ? candidate : `#${candidate}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toUpperCase() : null;
};

type DeviceStatePatchOptions = {
  powerOn?: boolean;
  level?: number | null;
};

export const buildDeviceStatePatch = ({ powerOn, level }: DeviceStatePatchOptions) => {
  const patch: Record<string, unknown> = {
    last_seen: new Date().toISOString(),
  };

  const normalizedLevel = typeof level === 'number' && Number.isFinite(level)
    ? clampPercentage(level)
    : null;

  const resolvedPower =
    typeof powerOn === 'boolean'
      ? powerOn
      : normalizedLevel == null
        ? null
        : normalizedLevel > 0;

  if (resolvedPower !== null) {
    patch.status = resolvedPower ? 'On' : 'Off';
    patch.connectivity_status = resolvedPower ? 'online' : 'offline';
  }

  if (normalizedLevel != null) {
    patch.status_level = normalizedLevel;
  }

  return patch;
};

export const updateDeviceStateRecord = async (
  deviceId: number,
  options: DeviceStatePatchOptions,
) => {
  const patch = buildDeviceStatePatch(options);
  const { error } = await supabase
    .from('devices')
    .update(patch)
    .eq('id', deviceId);

  if (error) throw error;
};

type ApplyScenarioDeviceStatesOptions = {
  forcePowerOn?: boolean;
};

export const isTransientDeviceExecutionNetworkError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String((error as { message?: unknown })?.message ?? '');

  const lower = message.toLowerCase();

  return (
    lower.includes('network request failed') ||
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch')
  );
};

const isUnsupportedGoogleHomeControlError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const lower = message.toLowerCase();

  return (
    lower.includes('does not support on/off control yet') ||
    lower.includes('does not support brightness control yet') ||
    lower.includes('does not support color control yet')
  );
};

export const applyScenarioDeviceStates = async (
  configs: ScenarioDeviceState[],
  options?: ApplyScenarioDeviceStatesOptions,
) => {
  const updates = configs
    .map((config) => {
      const deviceId = parseScenarioDeviceDbId(config.deviceId);
      if (deviceId == null) return null;

      return {
        deviceId,
        powerOn: options?.forcePowerOn ?? (config.state !== 'off'),
        level: parseScenarioLevel(config),
        color: parseScenarioColor(config),
      };
    })
    .filter((entry): entry is { deviceId: number; powerOn: boolean; level: number | null; color: string | null } => Boolean(entry));

  let skippedUnsupportedControls = 0;

  for (const update of updates) {
    const { data: deviceRow, error: loadError } = await supabase
      .from('devices')
      .select('source, external_id')
      .eq('id', update.deviceId)
      .maybeSingle();

    if (loadError) throw loadError;

    if (deviceRow?.source === 'google_home' && deviceRow.external_id) {
      try {
        await setGoogleHomeDevicePower(String(deviceRow.external_id), update.powerOn);
        if (update.powerOn && update.level != null) {
          await setGoogleHomeDeviceBrightness(String(deviceRow.external_id), update.level);
        }
        if (update.powerOn && update.color) {
          await setGoogleHomeDeviceColor(String(deviceRow.external_id), update.color);
        }
      } catch (error) {
        if (isUnsupportedGoogleHomeControlError(error)) {
          skippedUnsupportedControls += 1;
        } else {
          throw error;
        }
      }
    }

    await updateDeviceStateRecord(update.deviceId, {
      powerOn: update.powerOn,
      level: update.level,
    });
  }

  return {
    appliedCount: updates.length - skippedUnsupportedControls,
    skippedUnsupportedControls,
  };
};
