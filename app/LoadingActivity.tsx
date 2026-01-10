import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingActivity() {
  const { title } = useLocalSearchParams();

  // Refs de animação existentes
  const scaleCenter = useRef(new Animated.Value(1)).current;
  const scaleWave1 = useRef(new Animated.Value(1)).current;
  const scaleWave2 = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimReverse = useRef(new Animated.Value(0)).current;

  // === NOVA REF PARA O EFEITO LÍQUIDO (Squash & Stretch) ===
  const liquidWiggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Função de respiração (Mantida do anterior, fluida)
    const breathe = (
      anim: Animated.Value,
      toValue: number,
      duration: number,
      initialDelay: number = 0,
    ) => {
      const breathingCycle = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.sin),
          }),
        ]),
      );

      if (initialDelay > 0) {
        Animated.sequence([
          Animated.delay(initialDelay),
          breathingCycle,
        ]).start();
      } else {
        breathingCycle.start();
      }
    };

    // === NOVA FUNÇÃO: MOVIMENTO LÍQUIDO (Amassar e Esticar) ===
    const startLiquidMotion = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(liquidWiggleAnim, {
            toValue: 1,
            // Duração diferente da respiração e rotação para criar "caos orgânico"
            duration: 2500,
            useNativeDriver: true,
            // Easing.quad dá uma sensação mais elástica/gelatinosa
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(liquidWiggleAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
        ]),
      ).start();
    };

    // --- INICIALIZANDO AS ANIMAÇÕES ---

    // 1. Inicia o novo movimento líquido
    startLiquidMotion();

    // 2. Respirações (Mantidas)
    breathe(scaleCenter, 0.85, 3000); // Núcleo contrai
    breathe(scaleWave1, 1.28, 4000, 0); // Onda média expande muito
    breathe(scaleWave2, 1.15, 3500, 1000); // Onda externa expande

    // 3. Rotações (Acelerei *levemente* para o efeito líquido ficar mais dinâmico)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000, // De 12s para 10s
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(rotateAnimReverse, {
        toValue: 1,
        duration: 13000, // De 15s para 13s
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    const timer = setTimeout(() => {
      // router.replace('/ActiveSession');
    }, 7000);

    return () => clearTimeout(timer);
  }, [
    scaleCenter,
    scaleWave1,
    scaleWave2,
    rotateAnim,
    rotateAnimReverse,
    liquidWiggleAnim,
  ]);

  // --- INTERPOLAÇÕES ---

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinReverse = rotateAnimReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  // === NOVAS INTERPOLAÇÕES LÍQUIDAS PARA A CAMADA DO MEIO ===
  // Quando wiggle vai para 1, estica em X e achata em Y.
  const fluidScaleX = liquidWiggleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 0.95], // Estica um pouco, depois comprime
  });

  const fluidScaleY = liquidWiggleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.92, 1.08], // Comprime, depois estica (oposto de X)
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB] px-6 items-center justify-between py-10">
      <Text
        className="text-[#354F52] text-xl text-center"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        Initializing “{title || 'Gratitude Flow'}”...
      </Text>

      {/* ÁREA CENTRAL ANIMADA */}
      <View className="items-center justify-center w-full h-[450px] relative">
        {/* === CAMADA 1: DISFORME EXTERNA === */}
        <Animated.View
          style={{
            transform: [{ rotate: spinReverse }, { scale: scaleWave2 }],
            position: 'absolute',
            width: 350,
            height: 340,
            backgroundColor: '#DDE5D7',
            opacity: 0.5,
            borderTopLeftRadius: 120,
            borderTopRightRadius: 210,
            borderBottomLeftRadius: 190,
            borderBottomRightRadius: 130,
          }}
        />

        {/* === CAMADA 2: DISFORME INTERNA (ALVO DO EFEITO LÍQUIDO) === */}
        <Animated.View
          style={{
            // ADICIONAMOS scaleX e scaleY NO TRANSFORM
            // A ordem importa: primeiro gira, depois aplica a escala uniforme (respiração),
            // e por último aplica a distorção líquida (X e Y independentes).
            transform: [
              { rotate: spin },
              { scale: scaleWave1 },
              { scaleX: fluidScaleX },
              { scaleY: fluidScaleY },
            ],
            position: 'absolute',
            width: 245,
            height: 250,
            backgroundColor: '#BFD6BA',
            opacity: 0.6,
            borderTopLeftRadius: 130,
            borderTopRightRadius: 80,
            borderBottomLeftRadius: 90,
            borderBottomRightRadius: 140,
          }}
        />

        {/* === CAMADA 3: NÚCLEO === */}
        <Animated.View
          style={{
            transform: [{ scale: scaleCenter }],
            width: 230,
            height: 230,
            borderRadius: 115,
            backgroundColor: '#6A9969',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            zIndex: 10,
            shadowColor: '#548F53',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Text
            className="text-white text-center text-xl font-semibold leading-7"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            Preparing your environment
          </Text>
        </Animated.View>
      </View>

      <View className="items-center px-4 mb-4">
        <Text
          className="text-[#354F52] text-3xl mb-4"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Did you know?
        </Text>
        <Text
          className="text-[#354F52] text-center text-lg leading-6"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Using warm, dim lighting before meditation helps boost melatonin
          production.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        className="bg-[#548F53] w-52 py-4 rounded-full shadow-lg"
      >
        <Text
          className="text-white text-center text-xl"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
