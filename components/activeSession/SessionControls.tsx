import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';
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
  currentTrack?: {
    title: string;
    artist: string;
    album?: string;
    imageUrl?: string | null;
    externalUrl?: string | null;
  } | null;
}

export const SessionControls = ({
  isActive,
  isMusicPlaying,
  secondsLeft,
  isManualStep,
  isLastStep,
  image,
  progress,
  onToggleSession,
  onToggleMusic,
  onNextTrack,
  onPreviousTrack,
  onOpenSpotify,
  onNextStep,
  currentTrack,
}: SessionControlsProps) => {
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const imageSource =
    currentTrack?.imageUrl
      ? { uri: currentTrack.imageUrl }
      : typeof image === 'string'
        ? { uri: image }
        : image || { uri: 'https://picsum.photos/seed/meditate/100/100' };

  const minutesLeft = Math.floor(secondsLeft / 60);
  const remainingSeconds = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <View className="bg-[#F1F4EE] px-10 pb-8">
      {/* ÁREA CENTRAL: Timer OU Botão Next */}
      <View className="items-center mb-6 min-h-[108px] justify-center">
        {isManualStep ? (
          // --- MODO MANUAL: MOSTRA O BOTÃO ---
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onNextStep}
            className={`px-8 py-3 rounded-full flex-row items-center shadow-sm bg-[#548F53]`}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isLastStep ? 'Finish session' : 'Go to next step'
            }
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-white text-xl mr-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {isLastStep ? 'Finish' : 'Next Step'}
            </Text>
            <MaterialIcons
              name={isLastStep ? 'check-circle' : 'arrow-forward'}
              size={24}
              color="white"
              importantForAccessibility="no"
            />
          </TouchableOpacity>
        ) : (
          // --- MODO TEMPO: MOSTRA O CRONÓMETRO ---
          <View
            className="items-center"
            accessible={true}
            accessibilityRole="timer"
          >
            <View className="flex-row items-end">
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#354F52] text-6xl tabular-nums leading-[64px]"
                style={{ fontFamily: 'Nunito_700Bold' }}
                importantForAccessibility="no-hide-descendants"
              >
                {minutesLeft}:{remainingSeconds}
              </Text>
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#354F52] text-2xl ml-2 mb-1"
                style={{ fontFamily: 'Nunito_700Bold' }}
                importantForAccessibility="no-hide-descendants"
              >
                min
              </Text>
            </View>
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[#354F52]/85 text-lg -mt-1"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              importantForAccessibility="no-hide-descendants"
            >
              remaining
            </Text>
          </View>
        )}

        {/* Barra de Progresso (Sempre visível para contextualizar) */}
        <View
          className="w-full h-1.5 bg-[#D7D9D5] mt-6 rounded-full overflow-hidden"
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
        className="border border-[#9DC598] px-4 py-4 rounded-[20px] mb-10 bg-[#F8FAF6]"
        accessible={false}
      >
        <View className="flex-row items-center">
          <Image
            source={imageSource}
            className="w-14 h-14 rounded-xl"
            importantForAccessibility="no"
          />

          <View className="flex-1 ml-4 pr-3">
            <View
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Background music: ${currentTrack?.title || 'Music'} by ${currentTrack?.artist || 'Artist'}`}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#354F52] text-[17px]"
                style={{ fontFamily: 'Nunito_700Bold' }}
                importantForAccessibility="no-hide-descendants"
                numberOfLines={1}
              >
                {currentTrack?.title || 'Music'}
              </Text>
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

      </View>

      {/* Botão Grande (Pause/Resume Sessão) */}
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
    </View>
  );
};
