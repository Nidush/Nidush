import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
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
  image: any;
  progress: SharedValue<number>;
  onToggleSession: () => void;
  onToggleMusic: () => void;
  onNextStep: () => void;
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
  onNextStep,
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
      {/* ÁREA CENTRAL: Timer OU Botão Next */}
      <View className="items-center mb-6 h-20 justify-center">
        {isManualStep ? (
          // --- MODO MANUAL: MOSTRA O BOTÃO ---
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onNextStep}
            className={`px-8 py-3 rounded-full flex-row items-center shadow-sm bg-[#548F53]`}
          >
            <Text
              className="text-white text-xl mr-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {isLastStep ? 'Finish' : 'Next Step'}
            </Text>
            <MaterialIcons
              name={isLastStep ? 'check-circle' : 'arrow-forward'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        ) : (
          // --- MODO TEMPO: MOSTRA O CRONÓMETRO ---
          <Text
            className="text-[#354F52] text-6xl tabular-nums"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {Math.floor(secondsLeft / 60)}:
            {(secondsLeft % 60).toString().padStart(2, '0')}
          </Text>
        )}

        {/* Barra de Progresso (Sempre visível para contextualizar) */}
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
            Music
          </Text>
          <Text
            className="text-[#354F52]/60 text-xs"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            Artist
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

      {/* Botão Grande (Pause/Resume Sessão) */}
      <TouchableOpacity
        onPress={onToggleSession}
        className="bg-[#548F53] py-4 rounded-full items-center w-52 self-center shadow-lg flex-row justify-center"
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
    </View>
  );
};
