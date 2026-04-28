import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, View } from 'react-native';
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
  ACTIVITIES,
  Activity,
  CONTENTS,
  Scenario,
  SCENARIOS,
} from '@/constants/data';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
};

export default function ActiveSession() {
  const { id, musicStarted } = useLocalSearchParams<{ id: string; musicStarted?: string }>();
  const { playPlaylist, pausePlayback, resumePlayback, currentTrack, isAuthenticated } = useSpotify();

  // --- 1. STATE ---
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    title: string;
    room: string;
    playlistName: string;
    image?: any;
    instructions: FormattedInstruction[];
    type: 'audio' | 'video' | 'mixed';
    videoUrl?: string;
  } | null>(null);

  const [isActive, setIsActive] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);

  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const isVideoSession = sessionData?.type === 'video';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let foundItem: Activity | Scenario | undefined = ACTIVITIES.find(
        (a) => a.id === id,
      );
      if (!foundItem) {
        const stored = await AsyncStorage.getItem('@myActivities');
        if (stored)
          foundItem = JSON.parse(stored).find((a: any) => a.id === id);
      }
      if (!foundItem) foundItem = SCENARIOS.find((s) => s.id === id);

       // Se não encontrou localmente, tentar no Supabase (atividades criadas pelo user)
      if (!foundItem) {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          foundItem = {
            id: data.id.toString(),
            title: data.title,
            description: data.description,
            room_id: data.room_id,
            image: data.image,
            category: data.category,
            type: data.type,
            content_id: data.content_id,
            scenario_id: data.scenario_id,
            shortcuts: data.shortcuts === true || data.shortcuts === 'true',
          } as Activity;
        }
      }

      if (!foundItem) {
        console.error('Item not found:', id);
        router.replace('/Activities');
        return;
      }

      let rawInstructions: any[] = [];
      let playlistName = 'Relaxing Music';
      let contentType: 'audio' | 'video' | 'mixed' = 'audio';
      let videoUrl: string | undefined = undefined;

      if (foundItem) {
        console.log('Found Item:', foundItem);
      }

      if (foundItem && (foundItem as any).content_id) {
        console.log('Fetching content for ID:', (foundItem as any).content_id);
        // Fetch content from Supabase
        const { data: contentRows, error: contentError } = await supabase
          .from('contents')
          .select('*')
          .eq('id', (foundItem as any).content_id)
          .limit(1);

        const contentData =
          contentRows && contentRows.length > 0 ? contentRows[0] : null;
        console.log('Content Data from DB:', contentData);

        if (contentData && !contentError) {
          rawInstructions = contentData.instructions || [];
          playlistName = contentData.title;
          if (contentData.type === 'video') {
            contentType = 'video';
            videoUrl = contentData.video_url;
          }
        } else {
          // Fallback to local CONTENTS
          const cId = (foundItem as any).content_id;
          const content = cId ? CONTENTS[cId] : null;
          if (content) {
            rawInstructions = content.instructions || [];
            playlistName = content.title;
            if (content.type === 'video') {
              contentType = 'video';
              videoUrl = content.videoUrl;
            }
          }
        }
      }

      if (contentType !== 'video') {
        const sId = (foundItem as any).scenario_id;
        const relatedScenario = sId ? SCENARIOS.find((s) => s.id === sId) : null;
        if (relatedScenario?.playlist) playlistName = relatedScenario.playlist;
      }

      const formattedInstructions = rawInstructions.map((step) => {
        if (typeof step === 'string')
          return { text: step, duration: undefined, description: undefined };
        return step;
      });

      if (formattedInstructions.length === 0) {
        formattedInstructions.push({
          text: foundItem.description || 'Enjoy your session',
          duration: undefined,
          description: undefined,
        });
      }


      setSessionData({
        title: foundItem.title || 'Session',
        room: (foundItem as any).room_id || (foundItem as any).room || 'Living Room',
        playlistName: playlistName,
        image: foundItem.image,
        instructions: formattedInstructions,
        type: contentType === 'video' ? 'mixed' : contentType, // Force 'mixed' to show visuals even for video types
        videoUrl: videoUrl,
      });

      // Tocar música no Spotify se houver um playlist_id (Mock ou DB)
      if (isAuthenticated) {
        let pId = (foundItem as any).playlist_id;
        
        if (!pId) {
          const type = (foundItem as any).type?.toLowerCase() || '';
          let sId = (foundItem as any).scenario_id;
          
          if (!sId || sId === 'null') {
             // Tentar mapear o tipo para um cenário padrão local
             if (type === 'workout') sId = '1';
             else if (type === 'cooking') sId = '2';
             else if (type === 'meditation') sId = '3';
             else sId = '1';
          }

          console.log(`[Spotify] Traduzindo tipo "${type}" para cenário: ${sId}`);
          
          // 1. Tentar DB
          const { data: scenData } = await supabase
            .from('scenarios')
            .select('playlist_id')
            .eq('id', sId)
            .maybeSingle();
          pId = scenData?.playlist_id;

          // 2. Tentar Local
          if (!pId) {
            const localScen = SCENARIOS.find(s => s.id === sId.toString());
            pId = localScen?.playlist_id;
          }

          // 3. Fallback Final (Workout)
          if (!pId) pId = '37i9dQZF1DX76W9kuv1Z0g';
        }
        
        if (pId) {
          console.log('[Spotify] A iniciar música no momento do Exercício:', pId);
          playPlaylist(pId);
        } else {
          // Fallback por tipo de atividade
          const type = (foundItem as any).type?.toLowerCase();
          const fallbacks: Record<string, string> = {
            workout: '37i9dQZF1DX76W9kuv1Z0g',
            cooking: '37i9dQZF1DXdbChS9879u9',
            meditation: '37i9dQZF1DWZ0XmS6AnY9s'
          };
          if (fallbacks[type]) {
            console.log('[Spotify] A usar fallback no Exercício:', type);
            playPlaylist(fallbacks[type]);
          }
        }
      } else {
        console.log('[Spotify] Utilizador não autenticado.');
      }

      setSecondsLeft(formattedInstructions[0]?.duration || 0);
    } catch (e) {
      console.error('Error loading session:', e);
      router.replace('/Activities');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      router.replace('/Activities');
    }
  }, [currentStepIndex, sessionData, contentOpacity]);

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
    let interval: any = null;
    const currentStep = sessionData?.instructions[currentStepIndex];
    const isTimedStep = currentStep?.duration !== undefined;

    if (isActive && isTimedStep && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    } else if (isActive && isTimedStep && secondsLeft === 0) {
      handleNextStep();
    }
    return () => clearInterval(interval);
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
        onEnd={() => router.replace('/Activities')}
      />

      <SessionHeader
        title={sessionData.title}
        onBack={() => router.back()}
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
            currentTrack={currentTrack}
          />
        </>
      )}
    </SafeAreaView>
  );
}
