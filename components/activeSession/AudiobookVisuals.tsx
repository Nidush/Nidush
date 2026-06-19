import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
  audio_url?: string;
  isChapterListStep?: boolean;
};

interface AudiobookVisualsProps {
  step: FormattedInstruction;
  instructions: FormattedInstruction[];
  stepIndex: number;
  contentOpacity: SharedValue<number>;
  imageUrl?: string | null;
  isActive: boolean;
  onSelectChapter: (index: number) => void;
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// === COMPONENTE DA BARRA ANIMADA ===
const AnimatedBar = ({
  isActive,
  delay,
  duration,
  maxHeight,
}: {
  isActive: boolean;
  delay: number;
  duration: number;
  maxHeight: number;
}) => {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isActive) {
      height.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(maxHeight, {
              duration,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(8, { duration, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        ),
      );
    } else {
      height.value = withTiming(4, { duration: 300 });
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={style}
      className="w-1.5 bg-[#548F53] rounded-full mx-[3px]"
    />
  );
};

// === COMPONENTE DO CONJUNTO DE ONDAS ===
const VoiceWave = ({ isActive }: { isActive: boolean }) => {
  const waveConfig = [
    { delay: 0, duration: 400, maxH: 24 },
    { delay: 100, duration: 300, maxH: 40 },
    { delay: 50, duration: 500, maxH: 32 },
    { delay: 200, duration: 350, maxH: 52 },
    { delay: 150, duration: 450, maxH: 36 },
    { delay: 0, duration: 300, maxH: 28 },
    { delay: 100, duration: 500, maxH: 16 },
  ];

  return (
    <View className="flex-row items-center justify-center h-16 mt-4">
      {waveConfig.map((config, index) => (
        <AnimatedBar
          key={index}
          isActive={isActive}
          delay={config.delay}
          duration={config.duration}
          maxHeight={config.maxH}
        />
      ))}
    </View>
  );
};

export const AudiobookVisuals = ({
  step,
  instructions,
  stepIndex,
  contentOpacity,
  imageUrl,
  isActive,
  onSelectChapter,
}: AudiobookVisualsProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (step.isChapterListStep) {
    const chapters = instructions
      .map((inst, index) => ({ ...inst, originalIndex: index }))
      .filter((inst) => !inst.isChapterListStep);

    return (
      <Animated.View style={[animatedStyle]} className="flex-1 px-6 w-full">
        <Text
          className="text-[#354F52] text-3xl text-center mb-6"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Table of Contents
        </Text>

        <FlatList
          data={chapters}
          keyExtractor={(_, i) => i.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={{ gap: 16, marginBottom: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => onSelectChapter(item.originalIndex)}
              className="flex-1 aspect-square bg-white p-4 rounded-3xl border border-[#548F53]/20 shadow-sm justify-between items-center"
            >
              <View className="w-12 h-12 bg-[#548F53]/10 rounded-full items-center justify-center mt-2">
                <Text className="text-[#548F53] font-bold text-lg">
                  {index + 1}
                </Text>
              </View>

              <Text
                className="text-[#354F52] text-center"
                style={{ fontFamily: 'Nunito_700Bold', fontSize: 15 }}
                numberOfLines={3} // Limita o texto para não estragar o quadrado
              >
                {item.text}
              </Text>

              <View className="flex-row items-center mb-2 opacity-80">
                <MaterialIcons
                  name="play-circle-outline"
                  size={18}
                  color="#548F53"
                />
                <Text
                  className="text-[#7DA87B] ml-1 text-xs"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {formatDuration(item.duration)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[animatedStyle]}
      className="flex-1 px-8 justify-center items-center"
    >
      {imageUrl ? (
        <View className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-[#548F53]/20 bg-[#F1F4EE]">
          <Image
            source={{ uri: imageUrl }}
            className="w-56 h-56"
            resizeMode="cover"
          />
        </View>
      ) : (
        <View className="mb-8 w-56 h-56 rounded-2xl items-center justify-center bg-[#548F53]/10 border border-[#548F53]/20">
          <Ionicons name="book" size={80} color="#548F53" />
        </View>
      )}

      <Text
        className="text-[#548F53] text-lg font-bold tracking-widest uppercase mb-2"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Chapter {stepIndex}
      </Text>

      <Text
        className="text-[#354F52] text-3xl text-center mb-2"
        style={{ fontFamily: 'Nunito_700Bold' }}
        numberOfLines={2}
      >
        {step.text}
      </Text>

      <VoiceWave isActive={isActive} />
    </Animated.View>
  );
};
