import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://jawmnnwdxfoiirzsyobv.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_jnY2SOyOCCyWVHIGNPrG7Q_Wsq60E1Q";

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

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * Supports both Base64 (Web) and Local URI (Mobile).
 */
export const uploadImage = async (base64OrUri: string): Promise<string | null> => {
  if (!base64OrUri || base64OrUri.startsWith('http')) return base64OrUri;

  try {
    const fileName = `${Date.now()}.jpg`;
    const filePath = `${fileName}`;

    // Converter para Blob
    let blob: Blob;
    if (base64OrUri.startsWith('data:')) {
      // Conversão manual para Base64 (mais estável em Web/Mobile do que fetch em alguns casos)
      const parts = base64OrUri.split(',');
      const contentType = parts[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: contentType });
    } else {
      // Para local URIs (Mobile file://)
      const response = await fetch(base64OrUri);
      blob = await response.blob();
    }

    const { data, error } = await supabase.storage
      .from('activities')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('activities')
      .getPublicUrl(filePath);

    console.log('✅ Image uploaded successfully. Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('❌ Error in uploadImage utility:', error);
    return null;
  }
};
