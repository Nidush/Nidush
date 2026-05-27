import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    makeRedirectUri,
    ResponseType,
    useAuthRequest
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { SPOTIFY_CONFIG } from '../constants/spotify-config';
import { logger } from '../utils/logger';

WebBrowser.maybeCompleteAuthSession();

// Spotify Discovery
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const REDIRECT_URI = makeRedirectUri({
  scheme: SPOTIFY_CONFIG.scheme,
  path: 'spotify-auth',
});

logger.debug('[Spotify] Redirect URI configured:', REDIRECT_URI);

type SpotifyUserProfile = {
  display_name?: string;
  email?: string;
  id?: string;
  images?: Array<{ url: string }>;
};

type SpotifyPlaylist = {
  id: string;
  name: string;
  uri?: string;
};

type SpotifyDevice = {
  id?: string;
  name?: string;
  type?: string;
  is_restricted?: boolean;
};

interface SpotifyContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  userProfile: SpotifyUserProfile | null;
  currentTrack: { title: string; artist: string } | null;
  isLoading: boolean;
  getUserPlaylists: () => Promise<SpotifyPlaylist[]>;
  playPlaylist: (playlistId: string, options?: SpotifyPlaybackOptions) => Promise<void>;
  pausePlayback: () => Promise<void>;
  resumePlayback: () => Promise<void>;
}

type SpotifyPlaybackOptions = {
  preferredDeviceTypes?: string[];
  preferredDeviceNameIncludes?: string[];
};

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<SpotifyUserProfile | null>(null);
  const [currentTrack, setCurrentTrack] = useState<{ title: string; artist: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Code,
      clientId: SPOTIFY_CONFIG.clientId,
      scopes: SPOTIFY_CONFIG.scopes,
      usePKCE: true,
      redirectUri: REDIRECT_URI,
    },
    discovery
  );

  useEffect(() => {
    loadSavedToken();
  }, []);

  useEffect(() => {
    if (response) {
      logger.debug('[Spotify] Response received:', response.type, response);
    }
    if (response?.type === 'success') {
      const { code } = response.params;
      logger.debug('[Spotify] Auth successful. Exchanging code response.');
      if (code && request?.codeVerifier) {
        exchangeCodeForToken(code, request.codeVerifier);
      } else {
        logger.warn('[Spotify] Missing code or codeVerifier. Request ready:', !!request);
      }
    } else if (response?.type === 'error') {
      logger.error('[Spotify] Auth response error:', response.error);
    }
  }, [response]);

  const fetchCurrentTrack = async () => {
    if (!token) return;
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Spotify retorna 204 quando não há nada a tocar. .json() daria erro aqui.
      if (response.status === 204) {
        setCurrentTrack(null);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        logger.warn('[Spotify] Token invalid or insufficient permissions. Logging out.');
        logout();
        return;
      }

      if (response.status === 200) {
        const data = await response.json();
        if (data && data.item) {
          setCurrentTrack({
            title: data.item.name,
            artist: data.item.artists[0]?.name || 'Unknown',
          });
        }
      } else {
        setCurrentTrack(null);
      }
    } catch (e) {
      logger.error('Error fetching current track:', e);
    }
  };

  useEffect(() => {
    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', REDIRECT_URI);
      params.append('client_id', SPOTIFY_CONFIG.clientId);
      params.append('code_verifier', codeVerifier);

      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.error('[Spotify] Token exchange failed:', res.status, errorText);
        return;
      }

      const data = await res.json();
      if (data.access_token) {
        logger.debug('[Spotify] Token exchanged successfully.');
        saveToken(data.access_token);
        fetchUserProfile(data.access_token);
      } else if (data.error) {
        logger.error('[Spotify] Token exchange error:', data.error, data.error_description);
      } else {
        logger.error('Error exchanging code for token:', data);
      }
    } catch (e) {
      logger.error('Failed to exchange code:', e);
    }
  };

  const loadSavedToken = async () => {
    setIsLoading(true);
    try {
      const savedToken = await AsyncStorage.getItem('@spotify_token');

      if (savedToken && typeof savedToken === 'string') {
        const tokenStr: string = savedToken;
        setToken(tokenStr);
        await fetchUserProfile(tokenStr);
      }
    } catch (e) {
      logger.error('Error loading saved token:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToken = async (newToken: string) => {
    await AsyncStorage.setItem('@spotify_token', newToken);
    setToken(newToken);

    // Sincronizar com o Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({
            spotify_connected: true
          })
          .eq('auth_uid', user.id);
        logger.debug('[Spotify] Spotify connection state synced to Supabase.');
      }
    } catch (e) {
      logger.error('[Spotify] Failed to sync Spotify connection state:', e);
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.status === 401 || res.status === 403) {
        logger.warn('[Spotify] Token invalid, expired, or insufficient permissions. Logging out.');
        logout();
        return;
      }

      if (!res.ok) {
        logger.warn('[Spotify] API returned error status:', res.status);
        return;
      }

      const text = await res.text();
      if (!text) {
        logger.warn('[Spotify] Empty response from API.');
        return;
      }

      const data = JSON.parse(text) as SpotifyUserProfile;
      setUserProfile(data);
    } catch (e) {
      logger.error('Error fetching Spotify profile:', e);
      logout();
    }
  };

  const login = async () => {
    if (!request) {
      logger.warn('[Spotify] Auth request is not ready yet. Please try again in a moment.');
      return;
    }

    try {
      await AsyncStorage.removeItem('expo-auth-session-state');
    } catch (e) { }

    if (Platform.OS === 'web') {
      await promptAsync({ windowName: '_self' });
    } else {
      await promptAsync();
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@spotify_token');
    setToken(null);
    setUserProfile(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ spotify_connected: false })
          .eq('auth_uid', user.id);
      }
    } catch (e) {
      logger.error('[Spotify] Error clearing Spotify state in Supabase:', e);
    }
  };

  const getUserPlaylists = async () => {
    if (!token) return [];
    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        logger.warn('[Spotify] Token invalid or insufficient permissions. Logging out.');
        logout();
        return [];
      }

      const data = await res.json() as { items?: SpotifyPlaylist[] };
      return data.items || [];
    } catch (e) {
      logger.error('Error fetching playlists:', e);
      return [];
    }
  };

  const findPreferredSpotifyDevice = (devices: SpotifyDevice[], options?: SpotifyPlaybackOptions) => {
    const availableDevices = devices.filter((device) => !device.is_restricted);
    const preferredTypes = options?.preferredDeviceTypes?.map((type) => type.toLowerCase()) ?? [];
    const preferredNames = options?.preferredDeviceNameIncludes?.map((name) => name.toLowerCase()) ?? [];

    return (
      availableDevices.find((device) =>
        preferredTypes.includes(String(device.type || '').toLowerCase()),
      ) ||
      availableDevices.find((device) =>
        preferredNames.some((name) => String(device.name || '').toLowerCase().includes(name)),
      ) ||
      availableDevices.find((device) => device.type === 'Smartphone') ||
      availableDevices[0]
    );
  };

  const playPlaylist = async (playlistId: string, options?: SpotifyPlaybackOptions) => {
    logger.debug('[Spotify] playPlaylist called:', playlistId);
    if (!token) {
      logger.warn('[Spotify] Cannot play playlist because the token is missing.');
      return;
    }
    try {
      const context_uri = playlistId.startsWith('spotify:')
        ? playlistId
        : `spotify:playlist:${playlistId}`;

      const doPlay = async (deviceId?: string) => {
        // 1. Se tivermos um ID, tentamos primeiro "transferir" o controlo total para esse aparelho
        if (deviceId) {
          logger.debug('[Spotify] Transferring playback to device:', deviceId);
          await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ device_ids: [deviceId], play: true }),
          });
        }

        const url = deviceId
          ? `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
          : 'https://api.spotify.com/v1/me/player/play';

        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ context_uri }),
        });

        logger.debug('[Spotify] Player API result:', response.status);

        if (response.status === 204 || response.status === 200) {
          fetch('https://api.spotify.com/v1/me/player/volume?volume_percent=70', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => { });
        }

        return response;
      };

      // Antes de tocar, vamos tentar ver qual é o dispositivo ativo para te avisar
      const checkRes = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (checkRes.status === 401 || checkRes.status === 403) {
        logger.warn('[Spotify] Token invalid or insufficient permissions. Logging out.');
        logout();
        return;
      }

      if (checkRes.status === 200) {
        const checkData = await checkRes.json();
        logger.debug('[Spotify] Active playback device:', checkData.device?.name, checkData.device?.type);
      }

      let res = await doPlay();

      if (res.status === 404 || options?.preferredDeviceTypes?.length || options?.preferredDeviceNameIncludes?.length) {
        logger.warn('[Spotify] Fetching available Spotify devices.');
        const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const devicesData = await devicesRes.json() as { devices?: SpotifyDevice[] };

        if (devicesData.devices && devicesData.devices.length > 0) {
          const target = findPreferredSpotifyDevice(devicesData.devices, options);
          if (!target) {
            logger.warn('[Spotify] No unrestricted Spotify devices available.');
            return;
          }
          logger.debug('[Spotify] Forcing playback activation on:', target.name);

          await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: [target.id], play: true }),
          });

          // 🔄 RETRY LOOP MAIS LENTO: Dar tempo ao S24 para estabilizar
          let attempt = 0;
          const forcePlayback = async () => {
            if (attempt < 3) {
              const res = await doPlay(target.id);

              if (res.status === 204 || res.status === 200) {
                logger.debug('[Spotify] Playback succeeded. Syncing UI.');
                // Forçar atualização da interface após 2 segundos
                setTimeout(() => fetchCurrentTrack(), 2000);
              } else {
                attempt++;
                logger.debug('[Spotify] Device still not responding. Retry:', attempt);
                setTimeout(forcePlayback, 3500); // 3.5 segundos de intervalo
              }
            }
          };
          setTimeout(forcePlayback, 3000); // Esperar 3s após transferir
        } else {
          logger.debug('[Spotify] No active device. Attempting to open Spotify.');
          // Tentar abrir a app do Spotify. Infelizmente, o Android exige que a app esteja 
          // em primeiro plano pelo menos uma vez para "reativar" o recetor de áudio.
          Linking.openURL('spotify:').catch(() => {
            Alert.alert(
              'Spotify em Suspensão',
              'O teu telemóvel desligou o Spotify. Por favor, abre o Spotify uma vez e certifica-te que a Bateria está em "Não Restrito".'
            );
          });
        }
      }
    } catch (e) {
      logger.error('Error playing playlist:', e);
    }
  };

  const pausePlayback = async () => {
    if (!token) return;
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        logger.warn('[Spotify] Token invalid or insufficient permissions. Logging out.');
        logout();
      }
    } catch (e) {
      logger.error('Error pausing playback:', e);
    }
  };

  const resumePlayback = async () => {
    if (!token) return;
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        logger.warn('[Spotify] Token invalid or insufficient permissions. Logging out.');
        logout();
        return;
      }

      if (response.status === 404) {
        logger.debug('[Spotify] No active device for resume. Trying to find one.');
        const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (devicesRes.status === 401 || devicesRes.status === 403) {
          logger.warn('[Spotify] Token invalid or insufficient permissions. Logging out.');
          logout();
          return;
        }

        const devicesData = await devicesRes.json() as { devices?: SpotifyDevice[] };
        const target = devicesData.devices?.find((device) => device.type === 'Smartphone') || devicesData.devices?.[0];

        if (target) {
          const transferRes = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: [target.id], play: true }),
          });

          if (transferRes.status === 401 || transferRes.status === 403) {
            logger.warn('[Spotify] Token invalid or insufficient permissions. Logging out.');
            logout();
          }
        }
      }
    } catch (e) {
      logger.error('Error resuming playback:', e);
    }
  };

  return (
    <SpotifyContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        login,
        logout,
        userProfile,
        currentTrack,
        isLoading,
        getUserPlaylists,
        playPlaylist,
        pausePlayback,
        resumePlayback,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
