import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
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
}: SessionControlsProps) => {
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const imageSource =
    typeof image === 'string'
      ? { uri: image }
      : image || { uri: 'https://picsum.photos/seed/meditate/100/100' };

  return (
    <View className="bg-[#F1F4EE] px-10 pb-8">
      {/* ÁREA DOS BOTÕES E TEMPORIZADOR */}
      <View className="items-center mb-6 h-20 justify-center w-full">
        <View className="flex-row items-center justify-between w-full relative h-full">
          {/* TEMPORIZADOR (Centrado em absoluto para não desalinhar os botões) */}
          {!isManualStep && (
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#354F52] text-4xl tabular-nums"
                style={{ fontFamily: 'Nunito_700Bold' }}
                accessible={true}
                accessibilityRole="timer"
              >
                {Math.floor(secondsLeft / 60)}:
                {(secondsLeft % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}

          {/* ÁREA ESQUERDA: BOTÃO PREVIOUS */}
          <View className="flex-1 items-start z-10">
            {!isFirstStep && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPrevStep}
                className="px-5 py-3 rounded-full flex-row items-center shadow-sm bg-[#548F53]"
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go to previous step"
              >
                <MaterialIcons name="arrow-back" size={24} color="white" />
                <Text
                  maxFontSizeMultiplier={1.2}
                  className="text-white text-lg ml-1"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ÁREA DIREITA: BOTÃO NEXT / SKIP */}
          <View className="flex-1 items-end z-10">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onNextStep}
              className="px-5 py-3 rounded-full flex-row items-center shadow-sm bg-[#548F53]"
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                isLastStep ? 'Finish session' : 'Go to next step'
              }
            >
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-white text-lg mr-1"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {isLastStep ? 'Finish' : isManualStep ? 'Next' : 'Skip'}
              </Text>
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
                importantForAccessibility="no"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Progresso */}
        <View
          className="w-full h-1.5 bg-[#DDE5D7] mt-6 rounded-full overflow-hidden"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <Animated.View
            style={[animatedProgressStyle]}
            className="h-full bg-[#548F53]"
          />
        </View>
      </View>

      {/* Info Card (Player de Música) */}
      <View
        className="flex-row items-center border border-[#7DA87B]/20 p-4 rounded-3xl mb-8"
        accessible={false}
      >
        <Image
          source={imageSource}
          className="w-12 h-12 rounded-lg"
          importantForAccessibility="no"
        />
        <View
          className="flex-1 ml-4"
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Background music: 'Music'}`}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#354F52]"
            style={{ fontFamily: 'Nunito_700Bold' }}
            importantForAccessibility="no-hide-descendants"
          >
            {currentTrack?.title || 'Music'}
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#354F52]/60 text-xs"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            importantForAccessibility="no-hide-descendants"
          >
            {currentTrack?.artist || 'Artist'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onToggleMusic}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isMusicPlaying ? 'Pause background music' : 'Play background music'
          }
        >
          <MaterialIcons
            name={isMusicPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
            size={44}
            color="#548F53"
            importantForAccessibility="no"
          />
        </TouchableOpacity>
      </View>

      {/* Botão Grande (Pause/Resume Sessão) */}
      {showPauseButton && (
        <TouchableOpacity
          onPress={onToggleSession}
          className="bg-[#548F53] py-4 rounded-full items-center w-52 self-center shadow-lg flex-row justify-center"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isActive ? 'Pause session' : 'Resume session'}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-white text-2xl mr-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {isActive ? 'Pause' : 'Play'}
          </Text>
          <MaterialIcons
            name={isActive ? 'pause' : 'play-arrow'}
            size={28}
            color="white"
            importantForAccessibility="no"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};
