import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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
  const titleGap = 32;
  const shouldForceMarquee = title.trim().length > 24;
  const measuredOverflow = titleTextWidth - titleContainerWidth;
  const isOverflowing = shouldForceMarquee || measuredOverflow > 12;

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: titleTranslateX.value }],
  }));

  useEffect(() => {
    cancelAnimation(titleTranslateX);
    titleTranslateX.value = 0;

    if (!isOverflowing || titleTextWidth <= 0) return;

    const loopDistance =
      Math.max(titleTextWidth, titleContainerWidth + 40) + titleGap;

    titleTranslateX.value = withRepeat(
      withTiming(-loopDistance, {
        duration: Math.max(loopDistance * 35, 4500),
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(titleTranslateX);
      titleTranslateX.value = 0;
    };
  }, [
    isOverflowing,
    title,
    titleContainerWidth,
    titleGap,
    titleTextWidth,
    titleTranslateX,
  ]);

  return (
    <View className="flex-row items-center px-6 py-2">
      <View className="w-20 items-start justify-center">
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
      </View>

      <View className="flex-1 mx-4 overflow-hidden">
        <View
          className="overflow-hidden"
          onLayout={(event) =>
            setTitleContainerWidth(event.nativeEvent.layout.width)
          }
        >
          <Animated.View
            accessible
            accessibilityRole="header"
            accessibilityLabel={title}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: isOverflowing ? 'flex-start' : 'center',
                width: isOverflowing ? titleTextWidth * 2 + titleGap : undefined,
              },
              titleAnimatedStyle,
            ]}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              ellipsizeMode={isOverflowing ? 'clip' : 'tail'}
              style={{
                fontFamily: 'Nunito_600SemiBold',
                fontSize: 20,
                color: '#354F52',
                textAlign: isOverflowing ? 'left' : 'center',
                alignSelf: isOverflowing ? 'flex-start' : 'center',
                width: isOverflowing ? titleTextWidth : undefined,
              }}
            >
              {title}
            </Text>
            {isOverflowing ? (
              <Text
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
                ellipsizeMode="clip"
                style={{
                  marginLeft: titleGap,
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: 20,
                  color: '#354F52',
                  textAlign: 'left',
                  alignSelf: 'flex-start',
                  width: titleTextWidth,
                }}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                {title}
              </Text>
            ) : null}
          </Animated.View>
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

      <View className="w-20 items-end justify-center">
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
    </View>
  );
};
