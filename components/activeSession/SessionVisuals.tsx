import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

// Removida a propriedade audioUrl porque já não é necessária aqui
interface SessionVisualsProps {
  text: string;
  stepIndex: number;
  pulseScale: SharedValue<number>;
  contentOpacity: SharedValue<number>;
}

// === FUNÇÃO PARA DETETAR ÍCONES DE MEDITAÇÃO ===
const getMeditationIcon = (text: string) => {
  const lowerText = text.toLowerCase();
  const iconColor = '#354F52';
  const iconSize = 80;

  if (
    lowerText.includes('breath') ||
    lowerText.includes('inhale') ||
    lowerText.includes('exhale') ||
    lowerText.includes('air')
  ) {
    return (
      <MaterialCommunityIcons
        name="weather-windy"
        size={iconSize}
        color={iconColor}
      />
    );
  }

  if (
    lowerText.includes('body') ||
    lowerText.includes('scan') ||
    lowerText.includes('tension') ||
    lowerText.includes('relax')
  ) {
    return (
      <MaterialCommunityIcons
        name="human-handsdown"
        size={iconSize}
        color={iconColor}
      />
    );
  }

  if (
    lowerText.includes('mind') ||
    lowerText.includes('thought') ||
    lowerText.includes('focus') ||
    lowerText.includes('observe') ||
    lowerText.includes('notice')
  ) {
    return (
      <MaterialCommunityIcons
        name="head-lightbulb-outline"
        size={iconSize}
        color={iconColor}
      />
    );
  }

  if (
    lowerText.includes('heart') ||
    lowerText.includes('love') ||
    lowerText.includes('compassion') ||
    lowerText.includes('feel')
  ) {
    return (
      <MaterialCommunityIcons
        name="heart-outline"
        size={iconSize}
        color={iconColor}
      />
    );
  }

  if (
    lowerText.includes('smile') ||
    lowerText.includes('joy') ||
    lowerText.includes('peace')
  ) {
    return <Feather name="smile" size={iconSize} color={iconColor} />;
  }

  if (
    lowerText.includes('support') ||
    lowerText.includes('help') ||
    lowerText.includes('guide')
  ) {
    return <FontAwesome5 name="hands-helping" size={70} color={iconColor} />;
  }

  return (
    <MaterialCommunityIcons
      name="meditation"
      size={iconSize}
      color={iconColor}
    />
  );
};

export const SessionVisuals = ({
  text,
  pulseScale,
  contentOpacity,
}: SessionVisualsProps) => {
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.08], [1, 0.9]),
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View className="flex-1 items-center justify-center px-10">
      <Animated.View
        style={[animatedIconStyle, animatedContentStyle]}
        className="items-center"
        accessible={true}
      >
        <View
          className=" mb-10"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          {getMeditationIcon(text)}
        </View>
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-[#354F52] text-2xl text-center leading-10"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};
