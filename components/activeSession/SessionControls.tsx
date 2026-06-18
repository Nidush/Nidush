import { MaterialIcons } from '@expo/vector-icons';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface SessionControlsProps {
  isActive: boolean;
  isMusicPlaying: boolean;
  secondsLeft: number;
  isManualStep: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;
  onPrevStep: () => void;
  playlistName: string;
  room: string;
  image: ImageSourcePropType | string | null | undefined;
  progress: SharedValue<number>;
  onToggleSession: () => void;
  onToggleMusic: () => void;
  onNextStep: () => void;
  currentTrack?: { title: string; artist: string } | null;
  showPauseButton?: boolean;
  guideText?: string;
  guideAudioUrl?: string;
  onAudioReady?: () => void;
  stepIndex: number; // <--- 1. NOVA PROP AQUI
}

export const SessionControls = ({
  isActive,
  isMusicPlaying,
  secondsLeft,
  isManualStep,
  isLastStep,
  image,
  progress,
  isFirstStep,
  onPrevStep,
  onToggleSession,
  onToggleMusic,
  onNextStep,
  currentTrack,
  showPauseButton = true,
  guideText,
  guideAudioUrl,
  onAudioReady,
  stepIndex, // <--- EXTRAÍDA AQUI
}: SessionControlsProps) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const playerRef = useRef<any>(null);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const imageSource =
    typeof image === 'string'
      ? { uri: image }
      : image || { uri: 'https://picsum.photos/seed/meditate/100/100' };

  // === 1. EFEITO DE SINCRONIZAÇÃO (Pausa/Play) ===
  useEffect(() => {
    if (playerRef.current) {
      if (!isActive || !isVoiceEnabled) {
        playerRef.current.pause();
      } else if (isActive && isVoiceEnabled) {
        playerRef.current.play();
      }
    }
  }, [isActive, isVoiceEnabled]);

  // === 2. CARREGAMENTO DE ÁUDIO ===
  useEffect(() => {
    if (!guideAudioUrl) {
      if (onAudioReady) onAudioReady();
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.release();
      playerRef.current = null;
    }

    const playAudioSequence = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });

        const newPlayer = createAudioPlayer(guideAudioUrl);
        playerRef.current = newPlayer;

        if (isVoiceEnabled && isActive) {
          newPlayer.play();
        }

        if (onAudioReady) onAudioReady();
      } catch (error) {
        console.log('Erro ao carregar áudio:', error);
        if (onAudioReady) onAudioReady();
      }
    };

    timer = setTimeout(() => {
      playAudioSequence();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.release();
        playerRef.current = null;
      }
    };
  }, [guideAudioUrl, onAudioReady, stepIndex]); // <--- 2. ADICIONADO O stepIndex AQUI!

  return (
    <View className="bg-[#F1F4EE] px-10 pb-8">
      {/* ÁREA DOS BOTÕES E TEMPORIZADOR */}
      <View className="items-center mb-6 h-20 justify-center w-full">
        <View className="flex-row items-center justify-between w-full relative h-full">
          {/* TEMPORIZADOR */}
          {!isManualStep && (
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#354F52] text-5xl tabular-nums"
                style={{ fontFamily: 'Nunito_700Bold' }}
                accessible={true}
                accessibilityRole="timer"
              >
                {Math.floor(secondsLeft / 60)}:
                {(secondsLeft % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}

          {/* BOTÃO PREVIOUS */}
          <View className="flex-1 items-start z-10">
            {!isFirstStep && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPrevStep}
                className="px-5 py-3 rounded-full flex-row items-center shadow-sm bg-[#548F53]"
              >
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* BOTÃO NEXT / SKIP */}
          <View className="flex-1 items-end z-10">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onNextStep}
              className="px-5 py-3 rounded-full flex-row items-center shadow-sm bg-[#548F53]"
            >
              <MaterialIcons
                name={
                  isLastStep
                    ? 'check-circle'
                    : isManualStep
                      ? 'arrow-forward'
                      : 'skip-next'
                }
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Progresso */}
        <View className="w-full h-1.5 bg-[#DDE5D7] mt-6 rounded-full overflow-hidden">
          <Animated.View
            style={[animatedProgressStyle]}
            className="h-full bg-[#548F53]"
          />
        </View>
      </View>

      {/* Info Card (Player de Música) */}
      <View className="flex-row items-center border border-[#7DA87B]/20 p-4 rounded-3xl mb-8">
        <Image source={imageSource} className="w-12 h-12 rounded-lg" />
        <View className="flex-1 ml-4">
          <Text
            className="text-[#354F52]"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {currentTrack?.title || 'Music'}
          </Text>
          <Text
            className="text-[#354F52]/60 text-xs"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {currentTrack?.artist || 'Artist'}
          </Text>
        </View>
        <TouchableOpacity onPress={onToggleMusic}>
          <MaterialIcons
            name={isMusicPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
            size={44}
            color="#548F53"
          />
        </TouchableOpacity>
      </View>

      {/* ÁREA CENTRAL INFERIOR: Botão Play/Pause E Botão de Voz */}
      <View className="flex-row items-center justify-center w-full gap-8">
        {/* Botão Principal da Sessão */}
        {showPauseButton && (
          <TouchableOpacity
            onPress={onToggleSession}
            className="bg-[#548F53] py-4 rounded-full items-center w-52 shadow-lg flex-row justify-center"
          >
            <Text
              className="text-white text-2xl mr-3"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {isActive ? 'Pause' : 'Play'}
            </Text>
            <MaterialIcons
              name={isActive ? 'pause' : 'play-arrow'}
              size={28}
              color="white"
            />
          </TouchableOpacity>
        )}

        {/* Botão de Controlo de Voz */}
        {guideText && (
          <TouchableOpacity
            onPress={() => setIsVoiceEnabled((prev) => !prev)}
            className="bg-[#548F53] p-4 rounded-full shadow-lg justify-center items-center"
            accessibilityRole="button"
            accessibilityLabel={
              isVoiceEnabled ? 'Mute guide voice' : 'Enable guide voice'
            }
          >
            <MaterialIcons
              name={isVoiceEnabled ? 'record-voice-over' : 'voice-over-off'}
              size={28}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
