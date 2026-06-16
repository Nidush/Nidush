import React from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
};

interface WorkoutVisualsProps {
  step: FormattedInstruction;
  stepIndex: number;
  contentOpacity: SharedValue<number>;
  imageUrl?: string | null; // <-- Nova propriedade para receber o GIF do Supabase
}

export const WorkoutVisuals = ({
  step,
  stepIndex,
  contentOpacity,
  imageUrl,
}: WorkoutVisualsProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle]}
      className="flex-1 px-8 justify-center items-center"
    >
      {/* 2. GIF / IMAGEM DO SUPABASE */}
      {imageUrl && (
        <View className="mb-8 rounded-3xl overflow-hidden shadow-sm border border-[#548F53]/20 bg-[#F1F4EE]">
          <Image
            source={{ uri: imageUrl }}
            className="w-64 h-64" // Podes ajustar o tamanho conforme o rácio dos teus GIFs
            resizeMode="cover"
          />
        </View>
      )}

      {/* 3. TÍTULO DO PASSO / INSTRUÇÃO PRINCIPAL */}
      <Text
        className="text-[#354F52] text-2xl text-center mb-4"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        {step.text}
      </Text>

      {/* 4. DESCRIÇÃO DETALHADA (Se existir) */}
      {step.description && (
        <Text
          className="text-[#354F52]/80 text-lg text-center px-4"
          style={{ fontFamily: 'Nunito_400Regular' }}
        >
          {step.description}
        </Text>
      )}
    </Animated.View>
  );
};
