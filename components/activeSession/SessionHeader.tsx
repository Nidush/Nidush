import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SessionHeaderProps {
  title: string;
  onBack: () => void;
  onCancel: () => void;
}

export const SessionHeader = ({
  title,
  onBack,
  onCancel,
}: SessionHeaderProps) => {
  const [titleContainerWidth, setTitleContainerWidth] = useState(0);
  const [titleTextWidth, setTitleTextWidth] = useState(0);
  const titleTranslateX = useSharedValue(0);
  const shouldForceMarquee = title.trim().length > 24;
  const measuredOverflow = titleTextWidth - titleContainerWidth;
  const isOverflowing = shouldForceMarquee || measuredOverflow > 12;

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: titleTranslateX.value }],
  }));

  useEffect(() => {
    const overflow = shouldForceMarquee
      ? Math.max(titleTextWidth - titleContainerWidth, 80)
      : titleTextWidth - titleContainerWidth;

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
  }, [shouldForceMarquee, title, titleContainerWidth, titleTextWidth, titleTranslateX]);

  return (
    <View className="flex-row justify-between items-center px-6 py-2">
      <TouchableOpacity
        onPress={onBack}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons
          name="chevron-back"
          size={30}
          color="#354F52"
          importantForAccessibility="no"
        />
      </TouchableOpacity>

      <View className="flex-1 mx-4 overflow-hidden">
        <View
          className="overflow-hidden"
          onLayout={(event) =>
            setTitleContainerWidth(event.nativeEvent.layout.width)
          }
        >
          <Animated.Text
            maxFontSizeMultiplier={1.2}
            accessibilityRole="header"
            numberOfLines={1}
            ellipsizeMode={isOverflowing ? 'clip' : 'tail'}
            style={[
              {
                fontFamily: 'Nunito_600SemiBold',
                fontSize: 20,
                color: '#354F52',
                textAlign: 'left',
                alignSelf: 'flex-start',
                width: isOverflowing ? titleTextWidth : undefined,
              },
              titleAnimatedStyle,
            ]}
          >
            {title}
          </Animated.Text>
        </View>
        <Text
          maxFontSizeMultiplier={1.2}
          onTextLayout={(event) => {
            const measuredWidth = Math.max(
              0,
              ...event.nativeEvent.lines.map((line) => line.width ?? 0),
            );
            if (measuredWidth > 0) {
              setTitleTextWidth(measuredWidth);
            }
          }}
          style={{
            position: 'absolute',
            opacity: 0,
            left: -10000,
            fontFamily: 'Nunito_600SemiBold',
            fontSize: 20,
            color: '#354F52',
          }}
          pointerEvents="none"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          {title}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onCancel}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        accessibilityHint="Ends the current session"
      >
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-[#7DA87B] text-lg"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};
