import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
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

import { ExitModal } from '@/components/activeSession/ExitModal';
import { SessionControls } from '@/components/activeSession/SessionControls';
import { SessionHeader } from '@/components/activeSession/SessionHeader';
import { SessionVideo } from '@/components/activeSession/SessionVideo';
import { SessionVisuals } from '@/components/activeSession/SessionVisuals';
import { SessionWave } from '@/components/activeSession/SessionWave';
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
  parseUserScenarioDbId,
} from '@/utils/catalogTemplates';
import { getScenarioDeviceMeta, mapLinkedDeviceToScenarioState } from '@/utils/activityDeviceConfigs';
import { applyScenarioDeviceStates } from '@/utils/deviceExecution';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
};

type SessionData = {
  title: string;
  room: string;
  playlistName: string;
  image?: ImageSourcePropType;
  instructions: FormattedInstruction[];
  type: 'audio' | 'video' | 'mixed';
  videoUrl?: string;
  devices: ScenarioDeviceState[];
  tvDeviceName?: string;
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
  instructions?: unknown;
  video_url?: string | null;
};

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

const isStoredActivityLike = (value: unknown): value is StoredActivityLike =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'id' in value &&
      'title' in value,
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

const splitInstructionText = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .split(/(?:\r?\n)+|;\s+|[.!?],\s*|(?<=[.!?])\s+(?=[A-Z0-9])|(?<=\d\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

const normalizeInstructionSteps = (
  rawInstructions: Array<FormattedInstruction | string>,
): FormattedInstruction[] =>
  rawInstructions.flatMap((step) => {
    if (typeof step === 'string') {
      return splitInstructionText(step).map((text) => ({
        text,
        duration: undefined,
        description: undefined,
      }));
    }

    const text = String(step.text ?? '').trim();
    const splitText = splitInstructionText(text);
    if (splitText.length <= 1) return [step];

    return splitText.map((part, index) => ({
      text: part,
      duration: index === 0 ? step.duration : undefined,
      description: step.description,
    }));
  });

const getActivityType = (item: Partial<Activity> | Partial<Scenario>) =>
  String(('type' in item ? item.type : '') ?? '').toLowerCase();

const getActivityRoom = (item: StoredActivityLike | Activity | Scenario) =>
  item.room ?? (typeof item.room_id === 'string' ? item.room_id : 'Living Room');

const getScenarioId = (item: StoredActivityLike | Activity | Scenario) =>
  'scenario_id' in item ? item.scenario_id : undefined;

const getContentId = (item: StoredActivityLike | Activity | Scenario) =>
  'content_id' in item ? item.content_id : undefined;

const getPlaylistId = (item: StoredActivityLike | Activity | Scenario) =>
  'playlist_id' in item ? item.playlist_id : undefined;

const getItemDevices = (item: StoredActivityLike | Activity | Scenario) =>
  ('devices' in item && Array.isArray(item.devices) ? item.devices : []) as ScenarioDeviceState[];

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
    nextTrack,
    previousTrack,
    openCurrentTrack,
    currentTrack,
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

  const isVideoSession = sessionData?.type === 'video';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let foundItem: Activity | Scenario | StoredActivityLike | null | undefined =
        await fetchActivityTemplateById(id);
      if (!foundItem) {
        const stored = await AsyncStorage.getItem('@myActivities');
        if (stored) {
          const parsedStored = parseArrayValue<unknown>(stored).filter(isStoredActivityLike);
          foundItem = parsedStored.find((activity) => activity.id === id);
        }
      }
      if (!foundItem) foundItem = await fetchScenarioTemplateById(id);

       // Se não encontrou localmente, tentar no Supabase (atividades criadas pelo user)
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
        // Fetch content from Supabase
        const { data: contentRows } = await supabase
          .from('contents')
          .select('*')
          .eq('id', contentId)
          .limit(1);

        contentData = contentRows && contentRows.length > 0 ? contentRows[0] : null;

        if (contentData) {
          playlistName = contentData.title || localContent?.title || playlistName;
          if (contentData.type === 'video' || localContent?.type === 'video') {
            contentType = 'video';
            videoUrl = localContent?.videoUrl || contentData.video_url || undefined;
          }
        } else {
          // Fallback to local CONTENTS
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
      relatedScenario = sId ? await fetchScenarioTemplateById(String(sId)) : null;
      if (!relatedScenario && sId) {
        const scenarioDbId = parseUserScenarioDbId(sId);
        const { data: scenData } = await supabase
          .from('scenarios')
          .select('id, name, description, image, playlist_id, playlist_name, focus_mode_enabled, devices, rooms(name)')
          .eq('id', scenarioDbId)
          .maybeSingle();

        if (scenData) {
          relatedScenario = {
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
      if (contentType !== 'video' && relatedScenario?.playlist) {
        playlistName = relatedScenario.playlist;
      }

      const { data: { user } } = await supabase.auth.getUser();
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
        contentData?.instructions ||
        localContent?.instructions ||
        []
      );

      const formattedInstructions = normalizeInstructionSteps(rawInstructions.map((step) => {
        if (typeof step === 'string') {
          return { text: step, duration: undefined, description: undefined };
        }
        return step;
      }));

      if (formattedInstructions.length === 0) {
        formattedInstructions.push({
          text: foundItem.description || 'Enjoy your session',
          duration: undefined,
          description: undefined,
        });
      }

      const configuredDevices = resolveConfiguredDevices(
        getItemDevices(foundItem),
        Array.isArray(relatedScenario?.devices) ? relatedScenario.devices : [],
      );

      setSessionData({
        title: foundItem.title || 'Session',
        room: getActivityRoom(foundItem),
        playlistName: playlistName,
        image: foundItem.image,
        instructions: formattedInstructions,
        type: contentType,
        videoUrl: videoUrl,
        devices: configuredDevices,
        tvDeviceName: connectedTvName,
      });

      // Tocar música no Spotify só em sessões sem vídeo.
      if (isAuthenticated && contentType !== 'video') {
        let pId = getPlaylistId(foundItem) || relatedScenario?.playlist_id;
        
        if (!pId) {
          const type = getActivityType(foundItem);
          let sId = getScenarioId(foundItem);
          
          if (!sId || sId === 'null') {
             // Tentar mapear o tipo para um cenário padrão local
             if (type === 'workout') sId = '1';
             else if (type === 'cooking') sId = '2';
             else if (type === 'meditation') sId = '3';
             else sId = '1';
          }

          console.log(`[Spotify] Traduzindo tipo "${type}" para cenário: ${sId}`);
          
          // 1. Tentar catálogo de cenários
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

          // 3. Fallback Final (Workout)
          if (!pId) pId = '37i9dQZF1DX76W9kuv1Z0g';
        }
        
        const sessionDevices = resolveConfiguredDevices(
          getItemDevices(foundItem),
          Array.isArray(relatedScenario?.devices) ? relatedScenario.devices : [],
        );
        const hasScenarioTv = sessionDevices.some((config: ScenarioDeviceState) => {
          const device = SMART_HOME_DEVICES[config.deviceId];
          const fallbackMeta = getScenarioDeviceMeta(config);
          return device?.type === 'tv' || fallbackMeta.type === 'tv';
        });
        const shouldPreferTv =
          hasScenarioTv &&
          ['meditation', 'yoga', 'general', 'other'].includes(
            getActivityType(foundItem),
          );
        const basePlaybackOptions = {
          suppressAppOpen: true,
        };
        const tvPlaybackOptions = shouldPreferTv
          ? {
              ...basePlaybackOptions,
              preferredDeviceTypes: ['TV'],
              preferredDeviceNameIncludes: [
                connectedTvName || '',
                'tv',
                'samsung',
                'lg',
                'android tv',
                'chromecast',
              ].filter(Boolean),
            }
          : basePlaybackOptions;

        if (pId && startedPlaybackForSessionRef.current !== String(id)) {
          startedPlaybackForSessionRef.current = String(id);
          console.log('[Spotify] A iniciar música no momento do Exercício:', pId);
          playPlaylist(pId, tvPlaybackOptions);
        } else {
          // Fallback por tipo de atividade
          const type = getActivityType(foundItem);
          const fallbacks: Record<string, string> = {
            workout: '37i9dQZF1DX76W9kuv1Z0g',
            cooking: '37i9dQZF1DXdbChS9879u9',
            meditation: '37i9dQZF1DWZ0XmS6AnY9s'
          };
          if (fallbacks[type] && startedPlaybackForSessionRef.current !== String(id)) {
            startedPlaybackForSessionRef.current = String(id);
            console.log('[Spotify] A usar fallback no Exercício:', type);
            playPlaylist(fallbacks[type], tvPlaybackOptions);
          }
        }
      } else if (contentType !== 'video') {
        console.log('[Spotify] Utilizador não autenticado.');
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

  const handleToggleSession = () => {
    const newState = !isActive;
    setIsActive(newState);
    setIsMusicPlaying(newState);
  };

  const handleToggleMusic = () => {
    if (isMusicPlaying) {
      pausePlayback();
    } else {
      resumePlayback();
    }
    setIsMusicPlaying((prev) => !prev);
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
      console.error('Failed to turn off session devices on exit:', error);
    } finally {
      cleanedUpSessionRef.current = true;
    }
  }, [sessionData]);

  const exitSession = useCallback(async () => {
    setIsActive(false);
    setIsMusicPlaying(false);
    await cleanupSessionDevices();
    router.replace('/Activities');
  }, [cleanupSessionDevices]);

  const handleNextStep = useCallback(() => {
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
    let interval: ReturnType<typeof setInterval> | null = null;
    const currentStep = sessionData?.instructions[currentStepIndex];
    const isTimedStep = currentStep?.duration !== undefined;

    if (isActive && isTimedStep && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    } else if (isActive && isTimedStep && secondsLeft === 0) {
      handleNextStep();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isActive,
    secondsLeft,
    sessionData,
    currentStepIndex,
    handleNextStep,
    isVideoSession,
  ]);

  useEffect(() => {
    if (sessionData && !isVideoSession && sessionData.instructions.length > 0) {
      const percent =
        ((currentStepIndex + 1) / sessionData.instructions.length) * 100;

      progress.value = withTiming(percent, { duration: 500 });
    }
  }, [currentStepIndex, sessionData, isVideoSession, progress]);

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
    return (
      <View className="flex-1 justify-center items-center bg-[#F1F4EE]">
        <ActivityIndicator
          size="large"
          color="#5E8C5D"
          accessibilityLabel="Loading session data"
        />
      </View>
    );
  }

  const currentStep = sessionData.instructions[currentStepIndex];

  if (!currentStep && !isVideoSession) return null;

  const isLastStep = currentStepIndex === sessionData.instructions.length - 1;

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
        onResume={handleResume}
        onEnd={() => {
          void exitSession();
        }}
      />

      <SessionHeader
        title={sessionData.title}
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
          <SessionVisuals
            text={currentStep.text}
            stepIndex={currentStepIndex}
            pulseScale={pulseScale}
            contentOpacity={contentOpacity}
          />

          <SessionWave />

          <SessionControls
            isActive={isActive}
            isMusicPlaying={isMusicPlaying}
            secondsLeft={secondsLeft}
            isManualStep={currentStep.duration === undefined}
            isLastStep={isLastStep}
            onNextStep={handleNextStep}
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
          />
        </>
      )}
    </SafeAreaView>
  );
}
