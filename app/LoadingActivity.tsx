import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LoadingActivity() {
  const { title, id } = useLocalSearchParams<{ title: string; id: string }>();
  
  // Refs para animações independentes
  const scaleCenter = useRef(new Animated.Value(1)).current;
  const scaleWave1 = useRef(new Animated.Value(1)).current;
  const scaleWave2 = useRef(new Animated.Value(1)).current;
  const scaleWave3 = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Função para criar o efeito de "respiração" orgânica
    const breathe = (anim: Animated.Value, toValue: number, duration: number, delay = 0) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue, duration, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ])
      ).start();
    };

    // Iniciar as animações
    breathe(scaleCenter, 1.05, 2000); 
    breathe(scaleWave1, 1.12, 3500, 500); 
    breathe(scaleWave2, 1.18, 4500, 200);
    breathe(scaleWave3, 1.25, 5500, 800);

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(() => {
      router.replace({
        pathname: '/ActiveSession',
        params: { id: id }
      });
    }, 7000);

    return () => clearTimeout(timer);
  }, [id]); 

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB] px-6 items-center justify-between py-10">
      <Text className="text-[#354F52] text-xl font-medium text-center opacity-60">
        Initializing “{title || 'Activity'}”...
      </Text>

      {/* CONTAINER DAS ONDAS MULTICAMADAS */}
      <View className="items-center justify-center w-full h-[450px]">
        
        {/* Onda 3 */}
        <Animated.View 
          style={{ 
            transform: [{ rotate: spin }, { scale: scaleWave3 }],
            borderRadius: 180,
            borderTopLeftRadius: 240,
            borderBottomRightRadius: 200,
          }}
          className="absolute w-[380px] h-[360px] bg-[#DDE5D7] opacity-20" 
        />

        {/* Onda 2 */}
        <Animated.View 
          style={{ 
            transform: [{ rotate: '-30deg' }, { scale: scaleWave2 }],
            borderRadius: 160,
            borderTopRightRadius: 220,
            borderBottomLeftRadius: 180,
          }}
          className="absolute w-[320px] h-[310px] bg-[#D4E2D0] opacity-40" 
        />

        {/* Onda 1 */}
        <Animated.View 
          style={{ 
            transform: [{ rotate: '15deg' }, { scale: scaleWave1 }],
            borderRadius: 140,
            borderBottomRightRadius: 190,
            borderTopLeftRadius: 160,
          }}
          className="absolute w-[260px] h-[250px] bg-[#C5D8C1] opacity-60" 
        />

        {/* Círculo Central Sólido */}
        <Animated.View 
          style={{ transform: [{ scale: scaleCenter }] }}
          className="w-52 h-52 rounded-full bg-[#6A9969] items-center justify-center p-8 z-10 shadow-2xl shadow-[#548F53]/30"
        >
          <Text className="text-white text-center text-xl font-semibold leading-7">
            Preparing your environment
          </Text>
        </Animated.View>
      </View>

      {/* DID YOU KNOW */}
      <View className="items-center px-4">
        <Text className="text-[#354F52] text-3xl font-bold mb-4">Did you know?</Text>
        <Text className="text-[#6A7D5B] text-center text-[16px] leading-6">
          Using warm, dim lighting before meditation helps boost melatonin production, 
          signaling your brain that it is time to unwind and focus.
        </Text>
      </View>

      {/* BOTÃO CANCELAR */}
      <TouchableOpacity 
        onPress={() => router.back()}
        activeOpacity={0.8}
        className="bg-[#548F53] w-64 py-4 rounded-full shadow-lg"
      >
        <Text className="text-white text-center text-xl font-bold">Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}