import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Adaptador de Storage seguro para Web e Local (resolve o erro "window is not defined" no Expo Web SSR)
const customStorage = Platform.OS === 'web' 
  ? {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    }
  : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * Supports both Base64 (Web) and Local URI (Mobile).
 */
export const uploadImage = async (base64OrUri: string, bucketName: string = 'activities'): Promise<string | null> => {
  if (!base64OrUri || base64OrUri.startsWith('http')) return base64OrUri;

  try {
    const fileName = `${Date.now()}.jpg`;
    const filePath = `${fileName}`;

    let uploadData: any;
    let contentType = 'image/jpeg';

    if (base64OrUri.startsWith('data:')) {
      const parts = base64OrUri.split(',');
      contentType = parts[0].split(':')[1].split(';')[0];
      uploadData = decodeBase64ToArrayBuffer(parts[1]);
    } else {
      // Para local URIs (Mobile file://)
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
      console.error('Storage Upload Error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully. Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImage utility:', error);
    return null;
  }
};
