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

// Ícones mapeados
const ICON_MAP = [
  <MaterialCommunityIcons
    key="1"
    name="meditation"
    size={80}
    color="#354F52"
  />,
  <FontAwesome5 key="2" name="hands-helping" size={70} color="#354F52" />,
  <Feather key="3" name="smile" size={80} color="#354F52" />,
  <MaterialCommunityIcons
    key="4"
    name="weather-windy"
    size={80}
    color="#354F52"
  />,
];

interface SessionVisualsProps {
  text: string;
  stepIndex: number;
  pulseScale: SharedValue<number>;
  contentOpacity: SharedValue<number>;
}

export const SessionVisuals = ({
  text,
  stepIndex,
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
      >
        <View className=" mb-10">{ICON_MAP[stepIndex % ICON_MAP.length]}</View>
        <Text
          className="text-[#354F52] text-3xl text-center leading-10"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
};
