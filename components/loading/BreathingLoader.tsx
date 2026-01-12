import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { MESSAGES } from '../../constants/loadingData';

const BreathingLoader = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const breathAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimReverse = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const textInterval = setInterval(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(textInterval);
  }, [textOpacity]);

  useEffect(() => {
    const startBreathing = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
          }),
          Animated.timing(breathAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
          }),
        ]),
      ).start();
    };

    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      Animated.loop(
        Animated.timing(rotateAnimReverse, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    };

    startBreathing();
    startRotation();
  }, [breathAnim, rotateAnim, rotateAnimReverse]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const spinReverse = rotateAnimReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });
  const coreScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.0],
  });
  const midScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.25],
  });
  const outerScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.3],
  });
  const breathingOpacity = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.1],
  });

  return (
    <View className="items-center justify-center w-full h-[450px] relative">
      <Animated.View
        style={{
          transform: [{ rotate: spinReverse }, { scale: outerScale }],
          position: 'absolute',
          width: 320,
          height: 310,
          backgroundColor: '#4ADE80',
          opacity: breathingOpacity,
          borderRadius: 160,
          borderTopLeftRadius: 140,
          borderTopRightRadius: 200,
          borderBottomLeftRadius: 200,
          borderBottomRightRadius: 150,
        }}
      />
      <Animated.View
        style={{
          transform: [{ rotate: spin }, { scale: midScale }],
          position: 'absolute',
          width: 260,
          height: 260,
          backgroundColor: '#4ADE80',
          opacity: 0.2,
          borderRadius: 130,
          borderTopLeftRadius: 150,
          borderTopRightRadius: 110,
          borderBottomLeftRadius: 120,
          borderBottomRightRadius: 160,
        }}
      />
      <Animated.View
        style={{
          transform: [{ scale: coreScale }],
          width: 230,
          height: 230,
          zIndex: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LinearGradient
          colors={['#7ECA7C', '#548F53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 115,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Animated.Text
            className="text-white text-center text-2xl font-semibold leading-7"
            style={{ fontFamily: 'Nunito_600SemiBold', opacity: textOpacity }}
          >
            {MESSAGES[messageIndex]}
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default BreathingLoader;
