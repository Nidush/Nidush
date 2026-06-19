import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
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
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onOpenSpotify: () => void;
  onNextStep: () => void;
  currentTrack?: { title: string; artist: string; imageUrl?: string | null } | null;
  showPauseButton?: boolean;
  guideText?: string;
  guideAudioUrl?: string;
  onAudioReady?: () => void;
  stepIndex: number;
  showChaptersButton?: boolean;
  onShowChapters?: () => void;
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
  onNextTrack,
  onPreviousTrack,
  onOpenSpotify,
  onNextStep,
  currentTrack,
  showPauseButton = true,
  guideText,
  guideAudioUrl,
  onAudioReady,
  stepIndex,
  showChaptersButton,
  onShowChapters,
}: SessionControlsProps) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const playerRef = useRef<any>(null);
  const [titleContainerWidth, setTitleContainerWidth] = useState(0);
  const [titleTextWidth, setTitleTextWidth] = useState(0);
  const titleTranslateX = useSharedValue(0);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: titleTranslateX.value }],
  }));

  const imageSource =
    currentTrack?.imageUrl
      ? { uri: currentTrack.imageUrl }
      : typeof image === 'string'
        ? { uri: image }
        : image || { uri: 'https://picsum.photos/seed/meditate/100/100' };

  const minutesLeft = Math.floor(secondsLeft / 60);
  const remainingSeconds = (secondsLeft % 60).toString().padStart(2, '0');
  const currentTitle = currentTrack?.title || 'Music';

  useEffect(() => {
    const overflow = titleTextWidth - titleContainerWidth;

    cancelAnimation(titleTranslateX);
    titleTranslateX.value = 0;

    if (overflow <= 12) return;

    titleTranslateX.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200 }),
        withTiming(-overflow, {
          duration: Math.max(overflow * 45, 3500),
          easing: Easing.linear,
        }),
        withTiming(-overflow, { duration: 1000 }),
        withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false,
    );

    return () => {
      cancelAnimation(titleTranslateX);
      titleTranslateX.value = 0;
    };
  }, [currentTitle, titleContainerWidth, titleTextWidth, titleTranslateX]);

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

        <View className="flex-1 ml-4 pr-3">
          <View
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Background music: ${currentTrack?.title || 'Music'} by ${currentTrack?.artist || 'Artist'}`}
          >
            <View
              className="overflow-hidden"
              onLayout={(event) =>
                setTitleContainerWidth(event.nativeEvent.layout.width)
              }
            >
              <Animated.Text
                maxFontSizeMultiplier={1.2}
                className="text-[#354F52] text-[17px]"
                style={[{ fontFamily: 'Nunito_700Bold' }, titleAnimatedStyle]}
                importantForAccessibility="no-hide-descendants"
                numberOfLines={1}
                onLayout={(event) =>
                  setTitleTextWidth(event.nativeEvent.layout.width)
                }
              >
                {currentTitle}
              </Animated.Text>
            </View>
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[#354F52]/70 text-sm"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              importantForAccessibility="no-hide-descendants"
              numberOfLines={1}
            >
              {currentTrack?.artist || 'Artist'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center shrink-0">
          <TouchableOpacity
            onPress={onPreviousTrack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Play previous Spotify track"
            className="px-1 py-1"
          >
            <Ionicons
              name="play-skip-back-sharp"
              size={26}
              color="#5A9A57"
              importantForAccessibility="no"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleMusic}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isMusicPlaying ? 'Pause background music' : 'Play background music'
            }
            className="mx-2"
          >
            <View className="w-12 h-12 rounded-full border-[2.5px] border-[#5A9A57] items-center justify-center">
              <MaterialIcons
                name={isMusicPlaying ? 'pause' : 'play-arrow'}
                size={28}
                color="#5A9A57"
                importantForAccessibility="no"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNextTrack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Play next Spotify track"
            className="px-1 py-1"
          >
            <Ionicons
              name="play-skip-forward-sharp"
              size={26}
              color="#5A9A57"
              importantForAccessibility="no"
            />
          </TouchableOpacity>
        </View>
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
        {showChaptersButton && (
          <TouchableOpacity
            onPress={onShowChapters}
            className="bg-[#548F53] p-4 rounded-full shadow-lg justify-center items-center"
            accessibilityRole="button"
            accessibilityLabel="Show Table of Contents"
          >
            <MaterialIcons
              name="format-list-bulleted"
              size={28}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
