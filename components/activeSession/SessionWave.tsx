import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
// Math.ceil garante que a largura é um número inteiro para evitar o "pulo" no loop
const waveLength = Math.ceil(width);
const svgWidth = waveLength * 4;

export const SessionWave = () => {
  const translateX1 = useSharedValue(0);
  const translateY1 = useSharedValue(0);
  const translateX2 = useSharedValue(0);
  const translateY2 = useSharedValue(0);

  useEffect(() => {
    const flowEasing = Easing.linear;
    const tideEasing = Easing.inOut(Easing.sin);

    // 1. Horizontal (Velocidade Média - Nem muito rápida, nem parada)
    translateX1.value = withRepeat(
      // Ajustado para 12 segundos (estava 16s)
      withTiming(-waveLength, { duration: 12000, easing: flowEasing }),
      -1,
      false,
    );
    translateX2.value = withRepeat(
      // Ajustado para 8 segundos (estava 10s)
      withTiming(-waveLength, { duration: 8000, easing: flowEasing }),
      -1,
      false,
    );

    // 2. Vertical (Boiar suave)
    // Ajustado para um ritmo de respiração normal
    translateY1.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 5000, easing: tideEasing }),
        withTiming(-15, { duration: 6000, easing: tideEasing }),
      ),
      -1,
      true,
    );

    translateY2.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 3500, easing: tideEasing }),
        withTiming(-8, { duration: 4500, easing: tideEasing }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX1.value },
      { translateY: translateY1.value },
    ],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX2.value },
      { translateY: translateY2.value },
    ],
  }));

  // --- FUNÇÃO GERADORA DE ONDAS ---
  const getWavePath = (amplitude: number, yOffset: number) => {
    let d = `M 0 ${yOffset}`;
    const cycles = 4;

    for (let i = 0; i < cycles; i++) {
      const startX = i * waveLength;
      // Curvas Cúbicas para suavidade
      d += `
        Q ${startX + waveLength * 0.25} ${yOffset - amplitude} ${startX + waveLength * 0.5} ${yOffset}
        Q ${startX + waveLength * 0.75} ${yOffset + amplitude} ${startX + waveLength} ${yOffset}
      `;
    }

    d += ` L ${svgWidth} 250 L 0 250 Z`;
    return d;
  };

  const wavePathBack = getWavePath(45, 90);
  const wavePathFront = getWavePath(25, 110);

  return (
    <View style={styles.container}>
      <View style={styles.waveContainer}>
        {/* Onda de trás */}
        <Animated.View style={[styles.waveWrapper, animatedStyle1]}>
          <Svg height="200" width={svgWidth} style={styles.svg}>
            <Path fill="#4ADE80" fillOpacity={0.15} d={wavePathBack} />
          </Svg>
        </Animated.View>

        {/* Onda da frente */}
        <Animated.View style={[styles.waveWrapper, animatedStyle2]}>
          <Svg height="200" width={svgWidth} style={styles.svg}>
            <Path fill="#4ADE80" fillOpacity={0.25} d={wavePathFront} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    marginBottom: 20, // Mantém o espaço em relação às horas
  },
  waveContainer: {
    height: 180,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  waveWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: svgWidth,
    height: 200,
  },
  svg: {
    transform: [{ translateY: 10 }],
  },
});
