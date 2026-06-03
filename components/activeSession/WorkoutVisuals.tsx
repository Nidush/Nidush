import React from 'react';
import { Text } from 'react-native';
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
}

export const WorkoutVisuals = ({
  step,
  stepIndex,
  contentOpacity,
}: WorkoutVisualsProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle]}
      className="flex-1 px-8 justify-center items-center"
    >
      <Text
        className="text-[#548F53] text-lg font-bold tracking-widest uppercase mb-2"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Exercício {stepIndex + 1}
      </Text>

      <Text
        className="text-[#354F52] text-4xl text-center mb-4"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        {step.text}
      </Text>

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
