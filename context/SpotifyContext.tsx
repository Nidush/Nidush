import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    makeRedirectUri,
    ResponseType,
    useAuthRequest
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  is_active?: boolean;
};

type SpotifyCurrentTrack = {
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string | null;
  externalUrl?: string | null;
};

type SpotifyAuthState = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null;
};

const SPOTIFY_AUTH_STORAGE_KEY = '@spotify_auth';
const isSpotifyAuthExpiredStatus = (status: number) => status === 401;

interface SpotifyContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  userProfile: SpotifyUserProfile | null;
  currentTrack: SpotifyCurrentTrack | null;
  isLoading: boolean;
  getUserPlaylists: () => Promise<SpotifyPlaylist[]>;
  playPlaylist: (playlistId: string, options?: SpotifyPlaybackOptions) => Promise<void>;
  pausePlayback: () => Promise<void>;
  resumePlayback: () => Promise<void>;
  setPlaybackVolume: (volumePercent: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  openCurrentTrack: () => Promise<void>;
}

type SpotifyPlaybackOptions = {
  preferredDeviceTypes?: string[];
  preferredDeviceNameIncludes?: string[];
  suppressAppOpen?: boolean;
};

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<SpotifyUserProfile | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyCurrentTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeDeviceIdRef = useRef<string | null>(null);
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);
  const lastHandledAuthCodeRef = useRef<string | null>(null);
  const authExchangeInFlightRef = useRef(false);

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

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['@spotify_token', SPOTIFY_AUTH_STORAGE_KEY]);
    setToken(null);
    setUserProfile(null);
    setCurrentTrack(null);
    activeDeviceIdRef.current = null;

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
  }, []);

  const persistAuthState = useCallback(async (authState: SpotifyAuthState) => {
    await AsyncStorage.setItem(SPOTIFY_AUTH_STORAGE_KEY, JSON.stringify(authState));
    await AsyncStorage.setItem('@spotify_token', authState.accessToken);
    setToken(authState.accessToken);
  }, []);

  const saveAuthState = useCallback(async (authState: SpotifyAuthState) => {
    await persistAuthState(authState);

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
  }, [persistAuthState]);

  const refreshAccessToken = useCallback(async (refreshToken: string) => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }

    const refreshPromise = (async () => {
      try {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        params.append('client_id', SPOTIFY_CONFIG.clientId);

        const res = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!res.ok) {
          const errorText = await res.text();
          logger.error('[Spotify] Token refresh failed:', res.status, errorText);
          await logout();
          return null;
        }

        const data = await res.json();
        if (!data.access_token) {
          logger.error('[Spotify] Refresh response missing access token.');
          await logout();
          return null;
        }

        const nextAuthState: SpotifyAuthState = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? refreshToken,
          expiresAt: typeof data.expires_in === 'number'
            ? Date.now() + data.expires_in * 1000
            : null,
        };

        await persistAuthState(nextAuthState);
        return nextAuthState.accessToken;
      } catch (e) {
        logger.error('[Spotify] Failed to refresh token:', e);
        await logout();
        return null;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = refreshPromise;
    return refreshPromise;
  }, [logout, persistAuthState]);

  const getValidAccessToken = useCallback(async () => {
    const raw = await AsyncStorage.getItem(SPOTIFY_AUTH_STORAGE_KEY);
    if (!raw) {
      return token;
    }

    try {
      const authState = JSON.parse(raw) as SpotifyAuthState;
      const hasAccessToken = typeof authState.accessToken === 'string' && authState.accessToken.length > 0;
      if (!hasAccessToken) {
        return null;
      }

      const expiresSoon =
        typeof authState.expiresAt === 'number' &&
        authState.expiresAt > 0 &&
        Date.now() >= authState.expiresAt - 60_000;

      if (expiresSoon && authState.refreshToken) {
        return await refreshAccessToken(authState.refreshToken);
      }

      if (!token || token !== authState.accessToken) {
        setToken(authState.accessToken);
      }

      return authState.accessToken;
    } catch (e) {
      logger.error('[Spotify] Failed to parse saved auth state:', e);
      return token;
    }
  }, [refreshAccessToken, token]);

  const spotifyFetch = useCallback(async (url: string, init?: RequestInit) => {
    let accessToken = await getValidAccessToken();
    if (!accessToken) return null;

    const doFetch = (bearer: string) =>
      fetch(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${bearer}`,
        },
      });

    let response = await doFetch(accessToken);

    if (isSpotifyAuthExpiredStatus(response.status)) {
      const raw = await AsyncStorage.getItem(SPOTIFY_AUTH_STORAGE_KEY);
      const authState = raw ? (JSON.parse(raw) as SpotifyAuthState) : null;
      if (authState?.refreshToken) {
        const refreshed = await refreshAccessToken(authState.refreshToken);
        if (refreshed) {
          accessToken = refreshed;
          response = await doFetch(accessToken);
        }
      }
    }

    if (isSpotifyAuthExpiredStatus(response.status)) {
      logger.warn('[Spotify] Token invalid. Logging out.');
      await logout();
      return null;
    }

    return response;
  }, [getValidAccessToken, logout, refreshAccessToken]);

  const fetchCurrentTrack = useCallback(async () => {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      setCurrentTrack(null);
      return;
    }
    try {
      const mapTrack = (item: any) => ({
        title: item?.name || 'Music',
        artist: item?.artists?.[0]?.name || 'Unknown',
        album: item?.album?.name || undefined,
        imageUrl: item?.album?.images?.[0]?.url || null,
        externalUrl: item?.external_urls?.spotify || null,
      });

      const currentlyPlayingResponse = await spotifyFetch(
        'https://api.spotify.com/v1/me/player/currently-playing',
      );

      if (!currentlyPlayingResponse) {
        setCurrentTrack(null);
        return;
      }

      if (currentlyPlayingResponse.status === 200) {
        const currentlyPlayingData = await currentlyPlayingResponse.json();
        if (currentlyPlayingData?.item) {
          setCurrentTrack(mapTrack(currentlyPlayingData.item));
          return;
        }
      }

      const playbackStateResponse = await spotifyFetch(
        'https://api.spotify.com/v1/me/player',
      );

      if (!playbackStateResponse) {
        setCurrentTrack(null);
        return;
      }

      if (playbackStateResponse.status === 200) {
        const playbackStateData = await playbackStateResponse.json();
        if (playbackStateData?.item) {
          setCurrentTrack(mapTrack(playbackStateData.item));
          return;
        }
      }

      setCurrentTrack(null);
    } catch (e) {
      logger.error('Error fetching current track:', e);
    }
  }, [getValidAccessToken, spotifyFetch]);

  const fetchUserProfile = useCallback(async (authToken?: string) => {
    try {
      const res = authToken
        ? await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${authToken}` },
          })
        : await spotifyFetch('https://api.spotify.com/v1/me');

      if (!res) return;

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
      await logout();
    }
  }, [logout, spotifyFetch]);

  const exchangeCodeForToken = useCallback(async (code: string, codeVerifier: string) => {
    if (!code.trim() || !codeVerifier.trim()) {
      return;
    }

    if (lastHandledAuthCodeRef.current === code || authExchangeInFlightRef.current) {
      logger.debug('[Spotify] Skipping duplicate authorization code exchange.');
      return;
    }

    authExchangeInFlightRef.current = true;
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
        const isDuplicateGrant =
          res.status === 400 &&
          /invalid authorization code|invalid_grant/i.test(errorText);

        if (isDuplicateGrant) {
          logger.warn('[Spotify] Ignoring reused/expired authorization code from callback.');
          lastHandledAuthCodeRef.current = code;
          return;
        }

        logger.error('[Spotify] Token exchange failed:', res.status, errorText);
        return;
      }

      const data = await res.json();
      if (data.access_token) {
        logger.debug('[Spotify] Token exchanged successfully.');
        lastHandledAuthCodeRef.current = code;
        await saveAuthState({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? null,
          expiresAt: typeof data.expires_in === 'number'
            ? Date.now() + data.expires_in * 1000
            : null,
        });
        await fetchUserProfile(data.access_token);
      } else if (data.error) {
        logger.error('[Spotify] Token exchange error:', data.error, data.error_description);
      } else {
        logger.error('Error exchanging code for token:', data);
      }
    } catch (e) {
      logger.error('Failed to exchange code:', e);
    } finally {
      authExchangeInFlightRef.current = false;
    }
  }, [fetchUserProfile, saveAuthState]);

  useEffect(() => {
    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 5000);
    return () => clearInterval(interval);
  }, [fetchCurrentTrack]);

  const loadSavedToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedAuth = await AsyncStorage.getItem(SPOTIFY_AUTH_STORAGE_KEY);
      const legacyToken = await AsyncStorage.getItem('@spotify_token');

      if (savedAuth) {
        const validToken = await getValidAccessToken();
        if (validToken) {
          setToken(validToken);
          await fetchUserProfile(validToken);
        }
      } else if (legacyToken && typeof legacyToken === 'string') {
        setToken(legacyToken);
        await fetchUserProfile(legacyToken);
      }
    } catch (e) {
      logger.error('Error loading saved token:', e);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile, getValidAccessToken]);

  useEffect(() => {
    loadSavedToken();
  }, [loadSavedToken]);

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
      const errorCode =
        typeof response.error === 'string'
          ? response.error
          : response.params && typeof response.params.error === 'string'
            ? response.params.error
            : '';

      if (errorCode === 'access_denied') {
        logger.info('[Spotify] Authorization was denied or cancelled by the user.');
        return;
      }

      logger.error('[Spotify] Auth response error:', response.error);
    }
  }, [exchangeCodeForToken, request, response]);

  const login = useCallback(async () => {
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
  }, [promptAsync, request]);

  const getUserPlaylists = useCallback(async () => {
    if (!token) return [];
    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isSpotifyAuthExpiredStatus(res.status)) {
        logger.warn('[Spotify] Token invalid while fetching playlists. Logging out.');
        logout();
        return [];
      }

      if (res.status === 403) {
        logger.warn('[Spotify] Access forbidden while fetching playlists.');
        return [];
      }

      const data = await res.json() as { items?: SpotifyPlaylist[] };
      return data.items || [];
    } catch (e) {
      logger.error('Error fetching playlists:', e);
      return [];
    }
  }, [logout, token]);

  const findPreferredSpotifyDevice = (devices: SpotifyDevice[], options?: SpotifyPlaybackOptions) => {
    const availableDevices = devices.filter((device) => !device.is_restricted);
    const preferredTypes = options?.preferredDeviceTypes?.map((type) => type.toLowerCase()) ?? [];
    const preferredNames = options?.preferredDeviceNameIncludes?.map((name) => name.toLowerCase()) ?? [];
    const smartphoneDevice = availableDevices.find(
      (device) => String(device.type || '').toLowerCase() === 'smartphone',
    );

    return (
      availableDevices.find((device) =>
        preferredTypes.includes(String(device.type || '').toLowerCase()),
      ) ||
      availableDevices.find((device) =>
        preferredNames.some((name) => String(device.name || '').toLowerCase().includes(name)),
      ) ||
      smartphoneDevice ||
      availableDevices[0]
    );
  };

  const fetchAvailableDevices = useCallback(async () => {
    if (!token) return [];

    const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (isSpotifyAuthExpiredStatus(devicesRes.status)) {
      logger.warn('[Spotify] Token invalid while fetching devices. Logging out.');
      logout();
      return [];
    }

    if (devicesRes.status === 403) {
      logger.warn('[Spotify] Access forbidden while fetching devices.');
      return [];
    }

    const devicesData = await devicesRes.json() as { devices?: SpotifyDevice[] };
    return devicesData.devices ?? [];
  }, [logout, token]);

  const resolveControllableDeviceId = useCallback(async () => {
    if (!token) return null;

    try {
      const playbackStateResponse = await fetch(
        'https://api.spotify.com/v1/me/player',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (isSpotifyAuthExpiredStatus(playbackStateResponse.status)) {
        logger.warn('[Spotify] Token invalid while resolving device. Logging out.');
        logout();
        return null;
      }

      if (playbackStateResponse.status === 403) {
        logger.warn('[Spotify] Access forbidden while resolving controllable device.');
        return activeDeviceIdRef.current;
      }

      if (playbackStateResponse.status === 200) {
        const playbackStateData = await playbackStateResponse.json();
        const currentDeviceId = playbackStateData?.device?.id;
        if (typeof currentDeviceId === 'string' && currentDeviceId) {
          activeDeviceIdRef.current = currentDeviceId;
          return currentDeviceId;
        }
      }

      if (activeDeviceIdRef.current) {
        return activeDeviceIdRef.current;
      }

      const devices = await fetchAvailableDevices();
      const activeDevice =
        devices.find((device) => device.is_active && device.id) ||
        devices.find((device) => String(device.type || '').toLowerCase() === 'smartphone' && device.id) ||
        devices.find((device) => device.id);

      if (activeDevice?.id) {
        activeDeviceIdRef.current = activeDevice.id;
        return activeDevice.id;
      }
    } catch (e) {
      logger.error('[Spotify] Error resolving controllable device:', e);
    }

    return null;
  }, [fetchAvailableDevices, logout, token]);

  const setPlaybackVolume = useCallback(async (volumePercent: number) => {
    if (!token) return;

    const normalizedVolume = Math.max(0, Math.min(100, Math.round(volumePercent)));

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${normalizedVolume}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (isSpotifyAuthExpiredStatus(response.status)) {
        logger.warn('[Spotify] Token invalid while setting volume. Logging out.');
        logout();
      } else if (response.status === 403) {
        logger.warn('[Spotify] Access forbidden while setting Spotify volume.');
      }
    } catch (e) {
      logger.error('Error setting Spotify playback volume:', e);
    }
  }, [logout, token]);

  const playPlaylist = useCallback(async (playlistId: string, options?: SpotifyPlaybackOptions) => {
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
          activeDeviceIdRef.current = deviceId;
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
          if (deviceId) {
            activeDeviceIdRef.current = deviceId;
          }
          setPlaybackVolume(70).catch(() => { });
          setTimeout(() => fetchCurrentTrack(), 800);
        }

        return response;
      };

      // Antes de tocar, vamos tentar ver qual é o dispositivo ativo para te avisar
      const checkRes = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (isSpotifyAuthExpiredStatus(checkRes.status)) {
        logger.warn('[Spotify] Token invalid while checking playback device. Logging out.');
        logout();
        return;
      }

      if (checkRes.status === 403) {
        logger.warn('[Spotify] Access forbidden while checking playback device.');
      }

      if (checkRes.status === 200) {
        const checkData = await checkRes.json();
        if (checkData.device?.id) {
          activeDeviceIdRef.current = String(checkData.device.id);
        }
        logger.debug('[Spotify] Active playback device:', checkData.device?.name, checkData.device?.type);
      }

      let res = await doPlay();

      if (res.status === 404 || options?.preferredDeviceTypes?.length || options?.preferredDeviceNameIncludes?.length) {
        logger.warn('[Spotify] Fetching available Spotify devices.');
        const devices = await fetchAvailableDevices();

        if (devices.length > 0) {
          const target = findPreferredSpotifyDevice(devices, options);
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
        } else if (!options?.suppressAppOpen) {
          logger.debug('[Spotify] No active device. Attempting to open Spotify.');
          Linking.openURL('spotify:').catch(() => {
            Alert.alert(
              'Spotify Paused by System',
              'Your phone suspended Spotify. Please open Spotify once and make sure Battery is set to "Unrestricted".'
            );
          });
        } else {
          logger.debug('[Spotify] No active Spotify device available and app auto-open is disabled.');
        }
      }
    } catch (e) {
      logger.error('Error playing playlist:', e);
    }
  }, [fetchAvailableDevices, fetchCurrentTrack, logout, setPlaybackVolume, token]);

  const pausePlayback = useCallback(async () => {
    if (!token) return;
    try {
      const deviceId = await resolveControllableDeviceId();
      const query = deviceId ? `?device_id=${deviceId}` : '';
      const response = await fetch(`https://api.spotify.com/v1/me/player/pause${query}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isSpotifyAuthExpiredStatus(response.status)) {
        logger.warn('[Spotify] Token invalid while pausing playback. Logging out.');
        logout();
      } else if (response.status === 403) {
        logger.warn('[Spotify] Access forbidden while pausing playback.');
      }
      setTimeout(() => fetchCurrentTrack(), 400);
    } catch (e) {
      logger.error('Error pausing playback:', e);
    }
  }, [fetchCurrentTrack, logout, resolveControllableDeviceId, token]);

  const resumePlayback = useCallback(async () => {
    if (!token) return;
    try {
      const deviceId = await resolveControllableDeviceId();
      const query = deviceId ? `?device_id=${deviceId}` : '';
      const response = await fetch(`https://api.spotify.com/v1/me/player/play${query}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isSpotifyAuthExpiredStatus(response.status)) {
        logger.warn('[Spotify] Token invalid while resuming playback. Logging out.');
        logout();
        return;
      }

      if (response.status === 403) {
        logger.warn('[Spotify] Access forbidden while resuming playback.');
        return;
      }

      if (response.status === 404) {
        logger.debug('[Spotify] No active device for resume. Trying to find one.');
        const devices = await fetchAvailableDevices();
        const target =
          devices.find((device) => String(device.type || '').toLowerCase() === 'smartphone') ||
          devices[0];

        if (target) {
          activeDeviceIdRef.current = target.id ?? null;
          const transferRes = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: [target.id], play: true }),
          });

          if (isSpotifyAuthExpiredStatus(transferRes.status)) {
            logger.warn('[Spotify] Token invalid while transferring playback. Logging out.');
            logout();
          } else if (transferRes.status === 403) {
            logger.warn('[Spotify] Access forbidden while transferring playback.');
          }
        }
      }
      setTimeout(() => fetchCurrentTrack(), 800);
    } catch (e) {
      logger.error('Error resuming playback:', e);
    }
  }, [fetchAvailableDevices, fetchCurrentTrack, logout, resolveControllableDeviceId, token]);

  const nextTrack = useCallback(async () => {
    if (!token) return;
    try {
      const deviceId = await resolveControllableDeviceId();
      const query = deviceId ? `?device_id=${deviceId}` : '';
      const response = await fetch(`https://api.spotify.com/v1/me/player/next${query}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isSpotifyAuthExpiredStatus(response.status)) {
        logger.warn('[Spotify] Token invalid while skipping to next track. Logging out.');
        logout();
        return;
      }

      if (response.status === 403) {
        logger.warn('[Spotify] Access forbidden while skipping to next track.');
        return;
      }

      setTimeout(() => fetchCurrentTrack(), 900);
    } catch (e) {
      logger.error('Error skipping to next track:', e);
    }
  }, [fetchCurrentTrack, logout, resolveControllableDeviceId, token]);

  const previousTrack = useCallback(async () => {
    if (!token) return;
    try {
      const deviceId = await resolveControllableDeviceId();
      const query = deviceId ? `?device_id=${deviceId}` : '';
      const response = await fetch(`https://api.spotify.com/v1/me/player/previous${query}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (isSpotifyAuthExpiredStatus(response.status)) {
        logger.warn('[Spotify] Token invalid while going to previous track. Logging out.');
        logout();
        return;
      }

      if (response.status === 403) {
        logger.warn('[Spotify] Access forbidden while going to previous track.');
        return;
      }

      setTimeout(() => fetchCurrentTrack(), 900);
    } catch (e) {
      logger.error('Error going to previous track:', e);
    }
  }, [fetchCurrentTrack, logout, resolveControllableDeviceId, token]);

  const openCurrentTrack = useCallback(async () => {
    const targetUrl = currentTrack?.externalUrl;
    if (!targetUrl) return;

    try {
      await Linking.openURL(targetUrl);
    } catch (e) {
      logger.error('Error opening current Spotify track:', e);
    }
  }, [currentTrack?.externalUrl]);

  const contextValue = useMemo(() => ({
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
    setPlaybackVolume,
    nextTrack,
    previousTrack,
    openCurrentTrack,
  }), [
    token,
    login,
    logout,
    userProfile,
    currentTrack,
    isLoading,
    getUserPlaylists,
    playPlaylist,
    pausePlayback,
    resumePlayback,
    setPlaybackVolume,
    nextTrack,
    previousTrack,
    openCurrentTrack,
  ]);

  return (
    <SpotifyContext.Provider
      value={contextValue}
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
