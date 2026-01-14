import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Componentes Visuais
import { ExitModal } from '@/components/activeSession/ExitModal';
import { SessionControls } from '@/components/activeSession/SessionControls';
import { SessionHeader } from '@/components/activeSession/SessionHeader';
import { SessionVideo } from '@/components/activeSession/SessionVideo';
import { SessionVisuals } from '@/components/activeSession/SessionVisuals';
import { SessionWave } from '@/components/activeSession/SessionWave';

// Dados
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
  const { id } = useLocalSearchParams<{ id: string }>();

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

  // --- 2. ANIMATION VALUES ---
  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const isVideoSession = sessionData?.type === 'video';

  // --- 3. LOAD DATA ---
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

      if (!foundItem) {
        console.error('Item not found:', id);
        router.replace('/Activities');
        return;
      }

      let rawInstructions: any[] = [];
      let playlistName = 'Relaxing Music';
      let contentType: 'audio' | 'video' | 'mixed' = 'audio';
      let videoUrl: string | undefined = undefined;

      if ('contentId' in foundItem && foundItem.contentId) {
        const content = CONTENTS[foundItem.contentId];
        if (content) {
          rawInstructions = content.instructions || [];
          playlistName = content.title;
          if (content.type === 'video') {
            contentType = 'video';
            videoUrl = (content as any).videoUrl;
          }
        }
      }

      if (contentType !== 'video') {
        const relatedScenario =
          'scenarioId' in foundItem
            ? SCENARIOS.find((s) => s.id === foundItem.scenarioId)
            : !('type' in foundItem)
              ? foundItem
              : undefined;
        if (relatedScenario?.playlist) playlistName = relatedScenario.playlist;
      }

      const formattedInstructions = rawInstructions.map((step) => {
        if (typeof step === 'string')
          return { text: step, duration: undefined, description: undefined };
        return step;
      });

      setSessionData({
        title: foundItem.title,
        room: foundItem.room || 'Living Room',
        playlistName: playlistName,
        image: foundItem.image,
        instructions: formattedInstructions,
        type: contentType,
        videoUrl: videoUrl,
      });

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

  // --- 4. ANIMATIONS & TIMER ---
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

  // --- 5. HANDLERS ---
  const handleToggleSession = () => {
    const newState = !isActive;
    setIsActive(newState);
    setIsMusicPlaying(newState);
  };

  const handleToggleMusic = () => {
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

  // --- 6. RENDER SEGURO ---
  // IMPORTANTE: Esta verificação acontece ANTES de qualquer acesso a sessionData
  if (loading || !sessionData) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F1F4EE]">
        <ActivityIndicator size="large" color="#5E8C5D" />
      </View>
    );
  }

  // AGORA é seguro aceder a sessionData e calcular variáveis
  const currentStep = sessionData.instructions[currentStepIndex];

  // VERIFICAÇÃO DE SEGURANÇA para array vazio (embora o loadData previna)
  if (!currentStep) return null;

  const isLastStep = currentStepIndex === sessionData.instructions.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-[#F1F4EE]">
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
            isLastStep={isLastStep} // <--- Passamos agora para aqui
            onNextStep={handleNextStep}
            playlistName={sessionData.playlistName}
            room={sessionData.room}
            image={sessionData.image}
            progress={progress}
            onToggleSession={handleToggleSession}
            onToggleMusic={handleToggleMusic}
          />
        </>
      )}
    </SafeAreaView>
  );
}