import React from 'react';
import { Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
};

type Ingredient = {
  item: string;
  amount: string;
};

interface CookingVisualsProps {
  step: FormattedInstruction;
  ingredients: Ingredient[];
  stepIndex: number;
  contentOpacity: SharedValue<number>;
}

export const CookingVisuals = ({
  step,
  ingredients,
  stepIndex,
  contentOpacity,
}: CookingVisualsProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle]}
      className="flex-1 px-8 justify-center items-center"
    >
      <Text
        className="text-[#354F52] text-3xl text-center mb-6"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Passo {stepIndex + 1}
      </Text>

      <Text
        className="text-[#354F52] text-xl text-center mb-8"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {step.text}
      </Text>

      {/* Exibir a lista de ingredientes apenas no primeiro passo, se existirem */}
      {stepIndex === 0 && ingredients && ingredients.length > 0 && (
        <View className="bg-white/60 p-5 rounded-3xl w-full border border-[#7DA87B]/10 shadow-sm">
          <Text
            className="text-[#354F52] text-lg mb-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Ingredientes Necessários:
          </Text>
          {ingredients.map((ing, idx) => (
            <Text
              key={idx}
              className="text-[#354F52] mb-1.5 text-base"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              • {ing.amount} {ing.item}
            </Text>
          ))}
        </View>
      )}
    </Animated.View>
  );
};
