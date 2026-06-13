import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';
import { Platform } from 'react-native';
import { logger } from './logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
const shouldLogSupabaseTraffic = typeof __DEV__ !== 'undefined' && __DEV__;

const webStorage =
  typeof window !== 'undefined' && window.sessionStorage
    ? window.sessionStorage
    : typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : null;

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = input instanceof Request ? input.url : input.toString();
  const method = init?.method || (input instanceof Request ? input.method : 'GET');
  
  if (shouldLogSupabaseTraffic) {
    logger.debug(`%c[SUPABASE REQUEST] %c${method} %c${url}`,
      'color: #5C8D58; font-weight: bold',
      'color: #3E545C; font-weight: bold',
      'color: #888'
    );
  }

  const response = await fetch(input, init);

  if (shouldLogSupabaseTraffic) {
    logger.debug(`%c[SUPABASE RESPONSE] %c${response.status} ${response.statusText}`,
      'color: #5C8D58; font-weight: bold',
      response.ok ? 'color: #2e7d32' : 'color: #d32f2f'
    );
  }

  return response;
};

const customStorage = Platform.OS === 'web' 
  ? {
      getItem: (key: string) => webStorage?.getItem(key) ?? null,
      setItem: (key: string, value: string) => { webStorage?.setItem(key, value); },
      removeItem: (key: string) => { webStorage?.removeItem(key); },
    }
  : AsyncStorage;

type LogPayload = Record<string, unknown> | string | number | boolean | null;

type FunctionInvokeBody = Record<string, unknown> | undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
  global: {
    fetch: customFetch as typeof fetch,
  }
});

const isInvalidRefreshTokenMessage = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('invalid refresh token') ||
    normalized.includes('refresh token') && normalized.includes('already used')
  );
};

export const isInvalidRefreshTokenError = (error: unknown) => {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String((error as { message?: unknown }).message || error);

  return isInvalidRefreshTokenMessage(message);
};

export const clearLocalSupabaseSession = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    logger.warn('Failed to clear local Supabase session.', error);
  }
};

export const getSessionUser = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        logger.warn('Supabase session refresh token became invalid. Clearing local session.');
        await clearLocalSupabaseSession();
        return null;
      }
      throw error;
    }

    return data.session?.user ?? null;
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      logger.warn('Supabase session refresh token was already used. Clearing local session.');
      await clearLocalSupabaseSession();
      return null;
    }

    throw error;
  }
};

export const apiLog = (method: string, table: string, data?: LogPayload) => {
  if (!shouldLogSupabaseTraffic) return;
  logger.debug(`%c[DEBUG] %c${method} on ${table}`, 'color: #5C8D58; font-weight: bold', 'color: #3E545C', data || '');
};

const decodeBase64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  let len = base64.length;
  let i;
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;

  if (base64.charCodeAt(base64.length - 1) === 61) {
    bufferLength--;
    if (base64.charCodeAt(base64.length - 2) === 61) {
      bufferLength--;
    }
  }

  const arraybuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arraybuffer;
};

export const uploadImage = async (
  base64OrUri: string,
  bucketName: string = 'activities',
  filePathOverride?: string,
): Promise<string | null> => {
  if (!base64OrUri || base64OrUri.startsWith('http')) return base64OrUri;

  try {
    const fileName = `${Date.now()}.jpg`;
    const filePath = filePathOverride?.trim() || fileName;

    let uploadData: ArrayBuffer | Blob;
    let contentType = 'image/jpeg';

    if (base64OrUri.startsWith('data:')) {
      const parts = base64OrUri.split(',');
      contentType = parts[0].split(':')[1].split(';')[0];
      uploadData = decodeBase64ToArrayBuffer(parts[1]);
    } else {
      const response = await fetch(base64OrUri);
      uploadData = await response.blob();
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, uploadData, {
        contentType,
        upsert: true
      });

    if (error) {
      apiLog('UPLOAD ERROR', bucketName, { message: error.message });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    apiLog('UPLOAD SUCCESS', bucketName, { publicUrl });
    return publicUrl;
  } catch (error) {
    logger.error('Error in uploadImage utility:', error);
    return null;
  }
};

export const invokeFunction = async <TResponse = unknown>(
  functionName: string,
  body?: FunctionInvokeBody,
): Promise<TResponse> => {
  apiLog('FUNCTION CALL', functionName, body);
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    apiLog('FUNCTION ERROR', functionName, error);
    throw error;
  }

  apiLog('FUNCTION SUCCESS', functionName, data);
  return data as TResponse;
};
