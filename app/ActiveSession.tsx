import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  ImageSourcePropType,
  View,
} from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudiobookVisuals } from '@/components/activeSession/AudiobookVisuals';
import { CookingVisuals } from '@/components/activeSession/CookingVisuals';
import { ExitModal } from '@/components/activeSession/ExitModal';
import { MeditationVisuals } from '@/components/activeSession/MeditationVisuals';
import { ScenarioControls } from '@/components/activeSession/ScenarioControls';
import { ScenarioVisuals } from '@/components/activeSession/ScenarioVisuals';
import { SessionControls } from '@/components/activeSession/SessionControls';
import { SessionHeader } from '@/components/activeSession/SessionHeader';
import { SessionVideo } from '@/components/activeSession/SessionVideo';
import { SessionWave } from '@/components/activeSession/SessionWave';
import { WorkoutVisuals } from '@/components/activeSession/WorkoutVisuals';
import { useSpotify } from '@/context/SpotifyContext';

import {
  Activity,
  CONTENTS,
  Scenario,
  ScenarioDeviceState,
} from '@/constants/data';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import { SMART_HOME_DEVICES } from '@/constants/devices';
import {
  fetchActivityTemplateById,
  fetchScenarioTemplateById,
  mapUserActivity,
  normalizeScenarioTemplateId,
  resolvePossibleUserScenarioDbIds,
} from '@/utils/catalogTemplates';
import { getScenarioDeviceMeta, mapLinkedDeviceToScenarioState } from '@/utils/activityDeviceConfigs';
import {
  applyScenarioDeviceStates,
  isTransientDeviceExecutionNetworkError,
} from '@/utils/deviceExecution';
import { isGoogleHomeUnavailableDeviceListError } from '@/utils/googleHome';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
  isIngredientsStep?: boolean;
  audio_url?: string;
  isChapterListStep?: boolean;
};

type SessionData = {
  title: string;
  room: string;
  isScenario: boolean;
  playlistName: string;
  image?: ImageSourcePropType;
  instructions: FormattedInstruction[];
  type: 'audio' | 'video' | 'mixed';
  videoUrl?: string;
  devices: ScenarioDeviceState[];
  tvDeviceName?: string;
  activityType: string;
  ingredients?: any[];
  contentImageUrl?: string;
};

type StoredActivityLike = Partial<Activity> & {
  id: string;
  title: string;
  description?: string;
  room_id?: string | number | null;
  room?: string;
  content_id?: string | null;
  scenario_id?: string | number | null;
  devices?: ScenarioDeviceState[];
  playlist_id?: string | null;
  image?: ImageSourcePropType;
  type?: string;
};

type ContentRow = {
  title?: string | null;
  type?: string | null;
  category?: string | null;
  instructions?: unknown;
  video_url?: string | null;
  ingredients?: unknown;
  image?: string | null;
};

const resolveInstructionAudioUrl = (step: Record<string, unknown>) => {
  const candidates = [
    step.audio_url,
    step.audioUrl,
    step.url,
    step.voice_url,
    step.voiceUrl,
    step.sound_url,
    step.soundUrl,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
};

const DEVICE_ENFORCEMENT_INTERVAL_MS = 15000;

const getJoinedRoomName = (value: unknown) => {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === 'object' && 'name' in first
      ? String((first as { name?: unknown }).name ?? '')
      : '';
  }

  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name?: unknown }).name ?? '');
  }

  return '';
};

const getEnforcedLightDevices = (devices: ScenarioDeviceState[]) =>
  devices.filter((config) => {
    const device = SMART_HOME_DEVICES[config.deviceId];
    const fallbackMeta = getScenarioDeviceMeta(config);
    const isLight = device?.type === 'light' || fallbackMeta.type === 'light';
    const hasConfiguredVisualState =
      typeof config.color === 'string' ||
      typeof config.brightness === 'string' ||
      typeof config.value === 'string' ||
      typeof config.value === 'number';

    return isLight && hasConfiguredVisualState;
  });

const fetchScenarioFromDbCandidates = async (rawScenarioId: string) => {
  const candidateIds = resolvePossibleUserScenarioDbIds(rawScenarioId);

  for (const candidateId of candidateIds) {
    const { data: scenData } = await supabase
      .from('scenarios')
      .select('id, name, description, image, playlist_id, playlist_name, focus_mode_enabled, devices, rooms(name)')
      .eq('id', candidateId)
      .maybeSingle();

    if (scenData) {
      return {
        id: `scenario:${scenData.id}`,
        title: scenData.name,
        description: scenData.description || '',
        playlist: scenData.playlist_name || (scenData.playlist_id ? 'Spotify Music' : undefined),
        playlist_id: scenData.playlist_id || undefined,
        focusMode: scenData.focus_mode_enabled === true,
        shortcuts: false,
        devices: Array.isArray(scenData.devices) ? scenData.devices : [],
        room: getJoinedRoomName(scenData.rooms) || undefined,
        image: resolveCatalogImage(scenData.image || 'Scenarios/moonlight_bay.png'),
      } as Scenario;
    }
  }

  return null;
};

const isStoredActivityLike = (value: unknown): value is StoredActivityLike =>
  Boolean(
    value && typeof value === 'object' && 'id' in value && 'title' in value,
  );

const parseArrayValue = <T,>(value: unknown): T[] => {
  if (!value) return [];

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [parsed as T];
    } catch {
      return [value as T];
    }
  }

  return Array.isArray(value) ? (value as T[]) : [value as T];
};

const normalizeIngredients = (value: unknown): any[] => {
  const parsed = parseArrayValue<any>(value);

  return parsed.map((entry) => {
    if (entry && typeof entry === 'object' && 'item' in entry) {
      return {
        item: String((entry as { item?: unknown }).item ?? ''),
        amount: String((entry as { amount?: unknown }).amount ?? ''),
      };
    }

    const text = String(entry ?? '');
    const spaceIdx = text.indexOf(' ');

    if (spaceIdx === -1) return { item: text, amount: '' };

    return { amount: text.slice(0, spaceIdx), item: text.slice(spaceIdx + 1) };
  });
};

const getActivityType = (item: Partial<Activity> | Partial<Scenario>) =>
  String(('type' in item ? item.type : '') ?? '').toLowerCase();

const DEFAULT_SESSION_PLAYLISTS: Record<string, string> = {
  workout: '37i9dQZF1DX76W9kuv1Z0g',
  cooking: '37i9dQZF1DXdbChS9879u9',
  meditation: '37i9dQZF1DWZ0XmS6AnY9s',
  yoga: '37i9dQZF1DWVFeEut75IAL',
  reading: '37i9dQZF1DX4E3UdUs7fUx',
  general: '37i9dQZF1DX3Ogo9pFvBkY',
  other: '37i9dQZF1DX3Ogo9pFvBkY',
};

const inferSessionActivityType = ({
  foundItem,
  relatedScenario,
  contentCategory,
  contentType,
}: {
  foundItem: StoredActivityLike | Activity | Scenario;
  relatedScenario: Scenario | null;
  contentCategory?: string | null;
  contentType?: string | null;
}): Activity['type'] => {
  const directType = getActivityType(foundItem);
  if (directType) {
    return directType as Activity['type'];
  }

  const normalizedCategory = String(contentCategory ?? '').toLowerCase();
  if (normalizedCategory === 'audiobook') return 'audiobooks';
  if (
    ['cooking', 'meditation', 'workout', 'audiobooks', 'general', 'reading', 'yoga', 'other'].includes(
      normalizedCategory,
    )
  ) {
    return normalizedCategory as Activity['type'];
  }

  const normalizedContentType = String(contentType ?? '').toLowerCase();
  if (normalizedContentType === 'workout') return 'workout';

  const scenarioHints = [
    foundItem.title,
    foundItem.description,
    relatedScenario?.title,
    relatedScenario?.description,
    ...(relatedScenario?.keywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    /meditat|breath|calm|relax|zen|mindful|gratitude|sleep/.test(
      scenarioHints,
    )
  ) {
    return 'meditation';
  }

  if (/cook|kitchen|recipe|dinner|baking|pasta|food/.test(scenarioHints)) {
    return 'cooking';
  }

  if (/workout|train|exercise|fitness|cardio|gym/.test(scenarioHints)) {
    return 'workout';
  }

  if (/book|audiobook|chapter|reading/.test(scenarioHints)) {
    return 'audiobooks';
  }

  if (/yoga|stretch|flow/.test(scenarioHints)) {
    return 'yoga';
  }

  return 'general';
};

const getActivityRoom = (item: StoredActivityLike | Activity | Scenario) =>
  item.room ??
  (typeof item.room_id === 'string' ? item.room_id : 'Living Room');

const getScenarioId = (item: any) => item.scenario_id ?? item.scenarioId;
const getContentId = (item: any) => item.content_id ?? item.contentId;
const getPlaylistId = (item: any) => item.playlist_id ?? item.playlistId;

const getItemDevices = (item: StoredActivityLike | Activity | Scenario) =>
  ('devices' in item && Array.isArray(item.devices)
    ? item.devices
    : []) as ScenarioDeviceState[];

const resolveConfiguredDevices = (
  activityDevices: ScenarioDeviceState[],
  scenarioDevices: ScenarioDeviceState[],
) => (scenarioDevices.length > 0 ? scenarioDevices : activityDevices);

const getNumericRoomId = (item: StoredActivityLike | Activity | Scenario) => {
  if (typeof item.room_id === 'number') return item.room_id;

  const parsed = Number(item.room_id);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeLinkedDevice = (value: unknown) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

export default function ActiveSession() {
  const { id } = useLocalSearchParams<{ id: string; musicStarted?: string }>();
  const {
    playPlaylist,
    pausePlayback,
    resumePlayback,
    currentTrack,
    nextTrack,
    previousTrack,
    openCurrentTrack,
    isAuthenticated,
  } = useSpotify();

  // --- 1. STATE ---
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const [isActive, setIsActive] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const startedPlaybackForSessionRef = useRef<string | null>(null);
  const cleanedUpSessionRef = useRef(false);

  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const [isMediaReady, setIsMediaReady] = useState(false);

  const isVideoSession = sessionData?.type === 'video';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let foundItem:
        | Activity
        | Scenario
        | StoredActivityLike
        | null
        | undefined = await fetchActivityTemplateById(id);
      if (!foundItem) {
        const stored = await AsyncStorage.getItem('@myActivities');
        if (stored) {
          const parsedStored =
            parseArrayValue<unknown>(stored).filter(isStoredActivityLike);
          foundItem = parsedStored.find((activity) => activity.id === id);
        }
      }
      if (!foundItem) foundItem = await fetchScenarioTemplateById(id);
      if (!foundItem) {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          const mappedActivity = mapUserActivity(data);
          const { data: linkedRows } = await supabase
            .from('activity_devices')
            .select('device_id, devices(id, name, type, status, status_level)')
            .eq('activity_id', id);

          foundItem = {
            ...mappedActivity,
            devices: (linkedRows ?? [])
              .map((row) => normalizeLinkedDevice(row.devices))
              .filter(Boolean)
              .map((device) =>
                mapLinkedDeviceToScenarioState(device as {
                  id: number;
                  name: string;
                  type: string | null;
                  status?: string | null;
                  status_level?: number | null;
                }),
              ),
          };
        }
      }

      if (!foundItem) {
        console.error('Item not found:', id);
        router.replace('/Activities');
        return;
      }

      let playlistName = 'Relaxing Music';
      let contentType: 'audio' | 'video' | 'mixed' = 'audio';
      let videoUrl: string | undefined = undefined;
      let contentData: ContentRow | null = null;
      let relatedScenario: Scenario | null = null;
      let connectedTvName: string | undefined = undefined;

      const contentId = getContentId(foundItem);
      const localContent = contentId ? CONTENTS[String(contentId)] : null;

      if (foundItem && contentId) {
        const { data: contentRows } = await supabase
          .from('contents')
          .select('*')
          .eq('id', contentId)
          .limit(1);

        contentData =
          contentRows && contentRows.length > 0 ? contentRows[0] : null;

        if (contentData) {
          playlistName =
            contentData.title || localContent?.title || playlistName;
          if (contentData.type === 'video' || localContent?.type === 'video') {
            contentType = 'video';
            videoUrl =
              localContent?.videoUrl || contentData.video_url || undefined;
          }
        } else {
          if (localContent) {
            playlistName = localContent.title;
            if (localContent.type === 'video') {
              contentType = 'video';
              videoUrl = localContent.videoUrl;
            }
          }
        }
      }

      const sId = getScenarioId(foundItem);
      if (sId) {
        relatedScenario = await fetchScenarioFromDbCandidates(String(sId));
      }
      if (!relatedScenario && sId) {
        relatedScenario = await fetchScenarioTemplateById(String(sId));
      }
      if (contentType !== 'video' && relatedScenario?.playlist) {
        playlistName = relatedScenario.playlist;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: homeAssoc } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .maybeSingle();

        let tvQuery = supabase
          .from('devices')
          .select('name')
          .in('type', ['tv', 'display'])
          .limit(1);

        if (homeAssoc?.home_id) {
          tvQuery = tvQuery.eq('home_id', homeAssoc.home_id);

          const activityRoomId = getNumericRoomId(foundItem);

          if (Number.isFinite(activityRoomId)) {
            tvQuery = tvQuery.eq('room_id', activityRoomId);
          }
        } else {
          tvQuery = tvQuery.eq('user_id', user.id);
        }

        const { data: tvDevice } = await tvQuery.maybeSingle();

        connectedTvName = tvDevice?.name;
      }

      const rawInstructions = parseArrayValue<FormattedInstruction | string>(
        contentData?.instructions || localContent?.instructions || [],
      );

      const formattedInstructions: FormattedInstruction[] = rawInstructions
        .map((step: any) => {
          if (typeof step === 'string') {
            return { text: step, duration: undefined, description: undefined };
          }
          return {
            text: String(step.text ?? ''),
            duration: step.duration,
            description: step.description,
            audio_url: resolveInstructionAudioUrl(step),
          };
        })
        .flatMap((stepObj) => {
          if (!stepObj.text) return [];

          const sentences = stepObj.text
            .split('.')
            .map((sentence) => sentence.trim())
            .filter((sentence) => sentence.length > 0);

          if (sentences.length <= 1) {
            return [stepObj];
          }

          return sentences.map((sentence, index) => ({
            text: sentence + '.',
            duration: index === 0 ? stepObj.duration : undefined,
            description: stepObj.description,
            audio_url: index === 0 ? stepObj.audio_url : undefined,
          }));
        });

      if (formattedInstructions.length === 0) {
        formattedInstructions.push({
          text: foundItem.description || 'Enjoy your session',
          duration: undefined,
          description: undefined,
        });
      }

      const robustIngredients =
        contentData?.ingredients ??
        (foundItem as any)?.content?.ingredients ??
        (foundItem as any)?.contents?.ingredients ??
        (foundItem as any)?.ingredients ??
        localContent?.ingredients ??
        [];

      const parsedIngredients = normalizeIngredients(robustIngredients);
      const activityType = inferSessionActivityType({
        foundItem,
        relatedScenario,
        contentCategory: contentData?.category ?? localContent?.category,
        contentType: contentData?.type ?? localContent?.type,
      });
      const configuredDevices = resolveConfiguredDevices(
        getItemDevices(foundItem),
        relatedScenario ? getItemDevices(relatedScenario) : [],
      );

      if (activityType === 'cooking' && parsedIngredients.length > 0) {
        formattedInstructions.unshift({
          text: 'Check and prepare all the required ingredients before starting the preparation.',
          duration: undefined,
          description: undefined,
          isIngredientsStep: true,
        });
      }
      if (activityType === 'audiobooks' && formattedInstructions.length > 0) {
        formattedInstructions.unshift({
          text: 'Table of Contents',
          duration: undefined,
          description: undefined,
          isChapterListStep: true,
        });
      }

      setSessionData({
        title: foundItem.title || 'Session',
        room: getActivityRoom(foundItem),
        isScenario:
          String(foundItem.id ?? '').startsWith('scenario:') ||
          (!('type' in foundItem) && !getContentId(foundItem)),
        playlistName: playlistName,
        image: foundItem.image,
        instructions: formattedInstructions,
        type: contentType,
        videoUrl: videoUrl,
        devices: configuredDevices,
        tvDeviceName: connectedTvName,
        activityType: activityType,
        ingredients: parsedIngredients,
        contentImageUrl: contentData?.image || undefined,
      });

      if (
        isAuthenticated &&
        contentType !== 'video' &&
        activityType !== 'audiobooks'
      ) {
        let pId = getPlaylistId(foundItem) || relatedScenario?.playlist_id;

        if (!pId) {
          const type = activityType;
          let sId = getScenarioId(foundItem);

          if (!sId || sId === 'null') {
            if (type === 'workout') sId = '1';
            else if (type === 'cooking') sId = '2';
            else if (type === 'meditation') sId = '3';
            else sId = '1';
          }

          console.log(
            `[Spotify] Traduzindo tipo "${type}" para cenário: ${sId}`,
          );

          const templateScenarioId = normalizeScenarioTemplateId(sId);
          const templateScenario = templateScenarioId
            ? await fetchScenarioTemplateById(templateScenarioId)
            : null;
          pId = templateScenario?.playlist_id;

          // 2. Tentar DB legacy
          const numericScenarioId = String(sId).replace(/\D/g, '');
          const { data: scenData } = await supabase
            .from('scenarios')
            .select('playlist_id')
            .eq('id', numericScenarioId || sId)
            .maybeSingle();
          if (!pId) pId = scenData?.playlist_id;

          if (!pId) pId = DEFAULT_SESSION_PLAYLISTS[type] || DEFAULT_SESSION_PLAYLISTS.general;
        }

        const playbackOptions = {
          suppressAppOpen: false,
        };

        if (pId) {
          console.log(
            '[Spotify] Starting music at workout moment:',
            pId,
          );
          playPlaylist(pId, playbackOptions);
        } else {
          const fallbackPlaylistId =
            DEFAULT_SESSION_PLAYLISTS[activityType] ||
            DEFAULT_SESSION_PLAYLISTS.general;
          if (
            fallbackPlaylistId &&
            startedPlaybackForSessionRef.current !== String(id)
          ) {
            startedPlaybackForSessionRef.current = String(id);
            console.log('[Spotify] Using workout fallback:', activityType);
            playPlaylist(fallbackPlaylistId, playbackOptions);
          }
        }
      } else if (contentType !== 'video') {
        console.log('[Spotify] User not authenticated.');
      }

      setSecondsLeft(formattedInstructions[0]?.duration || 0);
    } catch (e) {
      console.error('Error loading session:', e);
      router.replace('/Activities');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, playPlaylist]);

  useEffect(() => {
    startedPlaybackForSessionRef.current = null;
    cleanedUpSessionRef.current = false;
    loadData();
  }, [id, loadData]);

  useEffect(() => {
    if (isVideoSession) return;
    if (isActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000 }),
          withTiming(1, { duration: 2000 }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isActive, isVideoSession, pulseScale]);

  const handleToggleSession = async () => {
    const newState = !isActive;

    if (sessionData?.type !== 'video') {
      if (newState) {
        await resumePlayback();
        setIsMusicPlaying(true);
      } else {
        await pausePlayback();
        setIsMusicPlaying(false);
      }
    }

    setIsActive(newState);
  };

  const handleToggleMusic = async () => {
    if (isMusicPlaying) {
      await pausePlayback();
      setIsMusicPlaying(false);
    } else {
      await resumePlayback();
      setIsMusicPlaying(true);
    }
  };

  const cleanupSessionDevices = useCallback(async () => {
    if (cleanedUpSessionRef.current) return;
    if (!sessionData?.devices?.length) {
      cleanedUpSessionRef.current = true;
      return;
    }

    try {
      await applyScenarioDeviceStates(sessionData.devices, { forcePowerOn: false });
    } catch (error) {
      if (isGoogleHomeUnavailableDeviceListError(error)) {
        console.warn(
          'Skipped turning off session devices on exit because Google Home returned no valid device list for the connected account/home.',
        );
      } else if (isTransientDeviceExecutionNetworkError(error)) {
        console.warn(
          'Skipped turning off session devices on exit because the network was temporarily unavailable.',
        );
      } else {
        console.error('Failed to turn off session devices on exit:', error);
      }
    } finally {
      cleanedUpSessionRef.current = true;
    }
  }, [sessionData]);

  useEffect(() => {
    if (!isActive || !sessionData?.devices?.length) return;

    const devicesToEnforce = getEnforcedLightDevices(sessionData.devices).map((device) => ({
      ...device,
      state: 'on' as const,
    }));

    if (devicesToEnforce.length === 0) return;

    let cancelled = false;
    let shouldStopRetrying = false;

    const enforceLightingState = async () => {
      if (shouldStopRetrying) return;

      try {
        await applyScenarioDeviceStates(devicesToEnforce, { forcePowerOn: true });
      } catch (error) {
        if (!cancelled) {
          if (isGoogleHomeUnavailableDeviceListError(error)) {
            shouldStopRetrying = true;
            console.warn(
              'Stopped reapplying session lighting state because Google Home returned no valid device list for the connected account/home.',
            );
            return;
          }

          if (isTransientDeviceExecutionNetworkError(error)) {
            console.warn(
              'Skipped reapplying session lighting state because the network was temporarily unavailable.',
            );
            return;
          }

          console.error('Failed to reapply session lighting state:', error);
        }
      }
    };

    void enforceLightingState();
    const interval = setInterval(() => {
      void enforceLightingState();
    }, DEVICE_ENFORCEMENT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isActive, sessionData]);

  const exitSession = useCallback(async () => {
    setIsActive(false);
    setIsMusicPlaying(false);
    await cleanupSessionDevices();
    router.replace('/Activities');
  }, [cleanupSessionDevices]);

  const handleNextStep = useCallback(() => {
    setIsMediaReady(false);
    if (!sessionData) return;
    const totalSteps = sessionData.instructions.length;

    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      contentOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      );
      setTimeout(() => {
        setCurrentStepIndex(nextIndex);
        const nextDuration = sessionData.instructions[nextIndex].duration;
        setSecondsLeft(nextDuration || 0);
      }, 300);
    } else {
      void exitSession();
    }
  }, [currentStepIndex, sessionData, contentOpacity, exitSession]);

  const handlePreviousStep = useCallback(() => {
    setIsMediaReady(false);
    if (!sessionData || currentStepIndex === 0) return;

    const prevIndex = currentStepIndex - 1;

    contentOpacity.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(1, { duration: 300 }),
    );

    setTimeout(() => {
      setCurrentStepIndex(prevIndex);
      const prevDuration = sessionData.instructions[prevIndex].duration;
      setSecondsLeft(prevDuration || 0);
    }, 300);
  }, [currentStepIndex, sessionData, contentOpacity]);
  const handleJumpToStep = useCallback(
    (index: number) => {
      setIsMediaReady(false);
      setIsActive(true);
      setIsMusicPlaying(false);

      if (!sessionData) return;

      contentOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      );

      setTimeout(() => {
        setCurrentStepIndex(index);
        const targetDuration = sessionData.instructions[index].duration;
        setSecondsLeft(targetDuration || 0);
      }, 300);
    },
    [sessionData, contentOpacity],
  );
  const handleShowChapters = useCallback(() => {
    if (!sessionData) return;

    setIsMediaReady(false);
    setIsActive(false);

    contentOpacity.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(1, { duration: 300 }),
    );

    setTimeout(() => {
      setCurrentStepIndex(0);
      setSecondsLeft(0);
    }, 300);
  }, [sessionData, contentOpacity]);
  useEffect(() => {
    if (sessionData && currentStepIndex > 0 && !isVideoSession) {
      const currentInstruction =
        sessionData.instructions[currentStepIndex].text;
      AccessibilityInfo.announceForAccessibility(
        `Next step: ${currentInstruction}`,
      );
    }
  }, [currentStepIndex, sessionData, isVideoSession]);

  useEffect(() => {
    if (isVideoSession) return;
    const currentStep = sessionData?.instructions[currentStepIndex];
    const isTimedStep = currentStep?.duration !== undefined;

    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && isTimedStep && isMediaReady) {
      if (secondsLeft > 0) {
        interval = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              if (interval) clearInterval(interval);
              setTimeout(() => handleNextStep(), 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Se já for zero
        handleNextStep();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isActive,
    isMediaReady,
    isVideoSession,
    currentStepIndex,
    sessionData,
    handleNextStep,
    secondsLeft,
  ]);

  useEffect(() => {
    if (sessionData && !isVideoSession && sessionData.instructions.length > 0) {
      const percent =
        ((currentStepIndex + 1) / sessionData.instructions.length) * 100;

      progress.value = withTiming(percent, { duration: 500 });
    }
  }, [currentStepIndex, sessionData, isVideoSession, progress]);

  const handleAudioReady = useCallback(() => {
    setIsMediaReady(true);
  }, []);

  const handleCancel = () => {
    setIsActive(false);
    setIsMusicPlaying(false);
    setShowExitModal(true);
  };

  const handleResume = () => {
    setShowExitModal(false);
    setIsActive(true);
    setIsMusicPlaying(true);
  };

  if (loading || !sessionData) {
    const isScenarioLoading = String(id ?? '').startsWith('scenario:');
    return (
      <View className="flex-1 justify-center items-center bg-[#F1F4EE]">
        <ActivityIndicator
          size="large"
          color="#5E8C5D"
          accessibilityLabel={
            isScenarioLoading
              ? 'Loading scenario session'
              : 'Loading activity session'
          }
        />
      </View>
    );
  }

  const currentStep = sessionData.instructions[currentStepIndex];
  if (!currentStep && !isVideoSession) return null;
  const isLastStep = currentStepIndex === sessionData.instructions.length - 1;

  // Variáveis auxiliares para legibilidade do fluxo condicional
  const isCooking = sessionData.activityType === 'cooking';
  const isWorkout = sessionData.activityType === 'workout';
  const isAudiobook = sessionData.activityType === 'audiobooks';
  const isMeditation = sessionData.activityType === 'meditation';
  const isScenarioSession = sessionData.isScenario;

  return (
    <SafeAreaView className="flex-1 bg-[#F1F4EE]" accessibilityLanguage="en-US">
      <Stack.Screen
        options={{
          title: `Active Session: ${sessionData.title}`,
          headerShown: false,
        }}
      />
      <ExitModal
        visible={showExitModal}
        itemLabel={isScenarioSession ? 'scenario' : 'activity'}
        onResume={handleResume}
        onEnd={() => {
          void exitSession();
        }}
      />

      <SessionHeader
        title={isScenarioSession ? 'Active Scenario' : sessionData.title}
        onBack={() => {
          void exitSession();
        }}
        onCancel={handleCancel}
      />

      {isVideoSession ? (
        <SessionVideo
          videoUrl={sessionData.videoUrl}
          poster={sessionData.image}
        />
      ) : (
        <>
          {isScenarioSession ? (
            <View className="flex-1">
              <ScenarioVisuals
                title={sessionData.title}
                room={sessionData.room}
                devices={sessionData.devices}
              />
              <ScenarioControls
                isActive={isActive}
                isMusicPlaying={isMusicPlaying}
                image={sessionData.image}
                onToggleSession={handleToggleSession}
                onToggleMusic={handleToggleMusic}
                onNextTrack={nextTrack}
                onPreviousTrack={previousTrack}
                currentTrack={currentTrack}
              />
            </View>
          ) : isCooking ? (
            <CookingVisuals
              step={currentStep}
              ingredients={sessionData.ingredients ?? []}
              stepIndex={currentStepIndex}
              contentOpacity={contentOpacity}
            />
          ) : isAudiobook ? (
            <AudiobookVisuals
              step={currentStep}
              instructions={sessionData.instructions}
              stepIndex={currentStepIndex}
              contentOpacity={contentOpacity}
              isActive={isActive}
              imageUrl={
                sessionData.contentImageUrl ||
                (typeof sessionData.image === 'string'
                  ? sessionData.image
                  : undefined)
              }
              onSelectChapter={handleJumpToStep}
            />
          ) : isWorkout ? (
            <WorkoutVisuals
              step={currentStep}
              stepIndex={currentStepIndex}
              contentOpacity={contentOpacity}
              imageUrl={
                sessionData.contentImageUrl ||
                (typeof sessionData.image === 'string'
                  ? sessionData.image
                  : undefined)
              }
            />
          ) : (
            <MeditationVisuals
              step={currentStep}
              stepIndex={currentStepIndex}
              pulseScale={pulseScale}
              contentOpacity={contentOpacity}
            />
          )}

          {isScenarioSession ? (
            <View
              className="absolute bottom-0 left-0 right-0"
              pointerEvents="none"
              style={{ zIndex: 0 }}
            >
              <SessionWave />
            </View>
          ) : (
            <SessionControls
              isActive={isActive}
              isMusicPlaying={isMusicPlaying}
              secondsLeft={secondsLeft}
              isManualStep={currentStep.duration === undefined}
              isLastStep={isLastStep}
              onNextStep={handleNextStep}
              isFirstStep={currentStepIndex === 0}
              onPrevStep={handlePreviousStep}
              playlistName={sessionData.playlistName}
              room={sessionData.room}
              image={sessionData.image}
              progress={progress}
              onToggleSession={handleToggleSession}
              onToggleMusic={handleToggleMusic}
              onNextTrack={nextTrack}
              onPreviousTrack={previousTrack}
              onOpenSpotify={openCurrentTrack}
              currentTrack={currentTrack}
              stepIndex={currentStepIndex}
              showPauseButton={
                !isCooking && !isWorkout && !currentStep.isChapterListStep
              }
              guideText={isMeditation ? currentStep.text : undefined}
              guideAudioUrl={currentStep.audio_url}
              onAudioReady={handleAudioReady}
              showChaptersButton={isAudiobook && !currentStep.isChapterListStep}
              onShowChapters={handleShowChapters}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
