import { ScenarioDeviceState } from '@/constants/data';
import { DeviceType } from '@/constants/devices';

type LinkedDeviceRow = {
  id: number;
  name: string;
  type: string | null;
  status?: string | null;
  status_level?: number | null;
};

export const normalizeScenarioDeviceType = (
  type: string | null | undefined,
): DeviceType | undefined => {
  const normalized = String(type ?? '').toLowerCase();

  if (['light', 'lamp', 'bulb'].includes(normalized)) return 'light';
  if (['speaker', 'assistant', 'audio'].includes(normalized)) return 'speaker';
  if (['tv', 'display', 'screen'].includes(normalized)) return 'tv';
  if (['purifier', 'air_purifier', 'airpurifier'].includes(normalized)) {
    return 'purifier';
  }
  if (['difuser', 'diffuser', 'humidifier'].includes(normalized)) {
    return 'diffuser';
  }
  if (['ac', 'heater', 'thermostat'].includes(normalized)) return 'thermostat';
  if (['blind', 'blinds'].includes(normalized)) return 'blind';

  return undefined;
};

export const mapLinkedDeviceToScenarioState = (
  device: LinkedDeviceRow,
): ScenarioDeviceState => {
  const normalizedType = normalizeScenarioDeviceType(device.type);
  const normalizedStatus = String(device.status ?? '')
    .toLowerCase()
    .trim();

  return {
    deviceId: `db-${device.id}`,
    state: normalizedStatus === 'off' ? 'off' : 'on',
    brightness:
      normalizedType === 'light' && Number.isFinite(device.status_level)
        ? `${Math.max(0, Math.min(100, Math.round(Number(device.status_level))))}%`
        : undefined,
    value:
      normalizedType === 'light' && Number.isFinite(device.status_level)
        ? `${Math.max(0, Math.min(100, Math.round(Number(device.status_level))))}%`
        : undefined,
    deviceName: device.name,
    deviceType: normalizedType ?? device.type ?? undefined,
  };
};

export const getScenarioDeviceMeta = (config: ScenarioDeviceState) => ({
  name: config.deviceName ?? config.deviceId,
  type: normalizeScenarioDeviceType(config.deviceType) ?? undefined,
});
