import { NativeModules, Platform } from 'react-native';

export type GoogleHomeSyncedDevice = {
  externalId: string;
  name: string;
  type: string;
  roomName?: string | null;
  roomHint?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  isOnline?: boolean;
  isOn?: boolean;
  traits?: string[];
  metadata?: Record<string, unknown> | null;
};

export type GoogleHomeStructureSummary = {
  id: string;
  name: string;
};

export type GoogleHomeRoomSummary = {
  id: string;
  name: string;
  structureId?: string | null;
};

export type GoogleHomeDiagnostics = {
  structureCount: number;
  roomCount: number;
  structures?: GoogleHomeStructureSummary[];
  rooms?: GoogleHomeRoomSummary[];
};

type GoogleHomeAccessResult = {
  granted: boolean;
  reason?: string | null;
  requiresNativeBuild?: boolean;
};

type GoogleHomeSyncResult = {
  devices: GoogleHomeSyncedDevice[];
  diagnostics?: GoogleHomeDiagnostics;
};

type GoogleHomeNativeModuleShape = {
  isConfigured?: () => Promise<boolean>;
  requestAccess?: () => Promise<GoogleHomeAccessResult>;
  syncDevices?: () => Promise<GoogleHomeSyncResult | GoogleHomeSyncedDevice[]>;
  setDevicePower?: (externalId: string, powerOn: boolean) => Promise<{ success: boolean }>;
  setDeviceBrightness?: (externalId: string, level: number) => Promise<{ success: boolean }>;
  setDeviceColor?: (externalId: string, colorHex: string) => Promise<{ success: boolean }>;
};

const GoogleHomeModule = NativeModules.GoogleHomeModule as GoogleHomeNativeModuleShape | undefined;

const getAndroidSupportIssue = () => {
  if (Platform.OS !== 'android') {
    return 'Google Home integration is currently available only on Android builds.';
  }

  if (!GoogleHomeModule) {
    return 'This app build does not include the Google Home native module yet. Rebuild the Android app with `npx expo run:android` or create a new dev/production build after adding the native integration.';
  }

  return null;
};

const ensureAndroidSupport = () => {
  const issue = getAndroidSupportIssue();
  if (issue) throw new Error(issue);
};

const normalizeSyncResult = (
  payload: GoogleHomeSyncResult | GoogleHomeSyncedDevice[] | null | undefined,
): GoogleHomeSyncedDevice[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.devices)) return payload.devices;
  return [];
};

const normalizeDetailedSyncResult = (
  payload: GoogleHomeSyncResult | GoogleHomeSyncedDevice[] | null | undefined,
): GoogleHomeSyncResult => {
  if (Array.isArray(payload)) {
    return { devices: payload, diagnostics: undefined };
  }

  if (payload?.devices) {
    return {
      devices: normalizeSyncResult(payload),
      diagnostics: payload.diagnostics,
    };
  }

  return {
    devices: [],
    diagnostics: undefined,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hasPendingPermissionPropagation = (message: string) =>
  message.toLowerCase().includes('permissions have not been granted yet')

const normalizeGoogleHomeMessage = (message: string) => {
  const normalized = message.trim();
  const lower = normalized.toLowerCase();

  if (
    lower.includes('unregistered_on_api_console') ||
    lower.includes('this android application is not registered to use oauth2.0') ||
    lower.includes('package name and sha-1 certificate fingerprint')
  ) {
    return [
      'O cliente OAuth Android ainda não está registado corretamente para esta app.',
      'No Google Cloud, cria ou corrige um OAuth Client do tipo Android com package name `com.nidush.app` e o SHA-1 da build instalada no telemóvel.',
      'Depois reinstala a app com `npx expo run:android` e testa novamente.',
    ].join(' ');
  }

  if (
    lower.includes('permission request was cancelled') ||
    lower.includes('permissions request was cancelled') ||
    lower.includes('cancelled')
  ) {
    const sdkDetails = normalized.match(/sdk details:\s*(.+)$/i)?.[1]?.trim();
    if (sdkDetails) {
      return normalizeGoogleHomeMessage(sdkDetails);
    }

    return [
      'A ligação ao Google Home foi cancelada antes de terminares o pedido de permissões.',
      'Verifica se aceitaste o ecrã da Google até ao fim, se o teu email Google foi adicionado como test user no OAuth consent screen, e se essa conta Google é a mesma que tens na app Google Home.',
      'Se eu tiver feito alterações nativas agora, precisas também de reinstalar a app com `npx expo run:android` antes de testar de novo.',
    ].join(' ');
  }

  if (lower.includes('test user') || lower.includes('oauth')) {
    return [
      'A conta Google usada neste telemóvel ainda não parece autorizada para o OAuth do Google Home.',
      'Adiciona esse email como test user no OAuth consent screen do Google Cloud e tenta novamente.',
    ].join(' ');
  }

  if (lower.includes('no activity')) {
    return 'Abre o ecrã Profile e tenta novamente com a app visível no telemóvel.';
  }

  if (lower.includes('permissions have not been granted yet')) {
    return 'A permissão Google Home foi aceite, mas ainda estava a ser aplicada. A app vai tentar sincronizar novamente automaticamente.';
  }

  if (
    lower.includes('command errors encountered') ||
    lower.includes('sub-errors:') ||
    lower.includes('primary error: code=19')
  ) {
    return [
      'O acesso ao Google Home foi concedido, mas a Google não devolveu uma lista válida de dispositivos para esta conta/casa.',
      'Confirma que estás na mesma conta Google dentro da app Google Home, que já tens pelo menos um dispositivo compatível adicionado a essa casa, e volta a sincronizar.',
      'Se continuar, envia o novo erro completo porque agora a app vai mostrar também os sub-erros reais do SDK.',
    ].join(' ');
  }

  if (lower.includes('native module') || lower.includes('android build')) {
    return normalized;
  }

  return normalized;
};

const toFriendlyError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message.trim()) {
    return new Error(normalizeGoogleHomeMessage(error.message));
  }

  if (typeof error === 'string' && error.trim()) {
    return new Error(normalizeGoogleHomeMessage(error));
  }

  return new Error(fallbackMessage);
};

export const isGoogleHomeConfigured = async () => {
  if (getAndroidSupportIssue()) return false;
  return Boolean(await GoogleHomeModule?.isConfigured?.());
};

export const requestGoogleHomeAccess = async () => {
  const issue = getAndroidSupportIssue();
  if (issue) {
    return {
      granted: false,
      reason: issue,
      requiresNativeBuild: true,
    };
  }

  const result = await GoogleHomeModule?.requestAccess?.();

  return {
    granted: Boolean(result?.granted),
    reason: result?.reason ? normalizeGoogleHomeMessage(result.reason) : null,
    requiresNativeBuild: Boolean(result?.requiresNativeBuild),
  };
};

export const syncGoogleHomeDevices = async () => {
  const result = await syncGoogleHomeSnapshot();
  return result.devices;
};

export const syncGoogleHomeSnapshot = async () => {
  ensureAndroidSupport();

  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = normalizeDetailedSyncResult(await GoogleHomeModule?.syncDevices?.());
      if (result.diagnostics) {
        console.log('[GoogleHome] diagnostics', result.diagnostics);
      }
      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';

      const shouldRetry = hasPendingPermissionPropagation(message) && attempt < maxAttempts;

      if (shouldRetry) {
        await sleep(600 * attempt);
        continue;
      }

      throw toFriendlyError(error, 'Could not sync Google Home devices.');
    }
  }

  throw new Error('Could not sync Google Home devices.');
};

export const setGoogleHomeDevicePower = async (externalId: string, powerOn: boolean) => {
  ensureAndroidSupport();

  if (!externalId.trim()) {
    throw new Error('Missing Google Home device id.');
  }

  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await GoogleHomeModule?.setDevicePower?.(externalId, powerOn);
      return Boolean(result?.success);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';

      if (hasPendingPermissionPropagation(message) && attempt < maxAttempts) {
        await sleep(600 * attempt);
        continue;
      }

      throw toFriendlyError(error, 'Could not control the Google Home device.');
    }
  }

  throw new Error('Could not control the Google Home device.');
};

export const setGoogleHomeDeviceBrightness = async (externalId: string, level: number) => {
  ensureAndroidSupport();

  if (!externalId.trim()) {
    throw new Error('Missing Google Home device id.');
  }

  const normalizedLevel = Math.max(0, Math.min(100, Math.round(level)));

  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await GoogleHomeModule?.setDeviceBrightness?.(externalId, normalizedLevel);
      return Boolean(result?.success);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';

      if (hasPendingPermissionPropagation(message) && attempt < maxAttempts) {
        await sleep(600 * attempt);
        continue;
      }

      throw toFriendlyError(error, 'Could not change the Google Home device brightness.');
    }
  }

  throw new Error('Could not change the Google Home device brightness.');
};

export const setGoogleHomeDeviceColor = async (externalId: string, colorHex: string) => {
  ensureAndroidSupport();

  if (!externalId.trim()) {
    throw new Error('Missing Google Home device id.');
  }

  if (!colorHex.trim()) {
    throw new Error('Missing Google Home color value.');
  }

  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await GoogleHomeModule?.setDeviceColor?.(externalId, colorHex.trim());
      return Boolean(result?.success);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : '';

      if (hasPendingPermissionPropagation(message) && attempt < maxAttempts) {
        await sleep(600 * attempt);
        continue;
      }

      throw toFriendlyError(error, 'Could not change the Google Home device color.');
    }
  }

  throw new Error('Could not change the Google Home device color.');
};
