import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

const BreathingExercise = () => {
  const [isExhaling, setIsExhaling] = useState(false);
  const breathAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimReverse = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isCancelled = false;

    // Função que sincroniza a respiração e a mudança de texto "Inhale/Exhale"
    const runBreathingCycle = () => {
      if (isCancelled) return;

      // 1. INHALE (Expande)
      setIsExhaling(false);
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.timing(breathAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        if (isCancelled) return;

        // Troca de texto suave
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (isCancelled) return;
          setIsExhaling(true);
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });

        // 2. EXHALE (Retrai)
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(() => {
          if (!isCancelled) {
            // Esconde o texto e repete o ciclo
            Animated.timing(textOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              runBreathingCycle();
            });
          }
        });
      });
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

    runBreathingCycle();
    startRotation();

    return () => {
      isCancelled = true;
      breathAnim.stopAnimation();
      rotateAnim.stopAnimation();
      rotateAnimReverse.stopAnimation();
    };
  }, [breathAnim, rotateAnim, rotateAnimReverse, textOpacity]);

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
    <View className="flex-1 items-center justify-center w-full relative">
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
            maxFontSizeMultiplier={1.2}
            className="text-white text-center text-3xl font-semibold tracking-wider"
            style={{ fontFamily: 'Nunito_600SemiBold', opacity: textOpacity }}
          >
            {isExhaling ? 'Exhale' : 'Inhale'}
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export default BreathingExercise;
