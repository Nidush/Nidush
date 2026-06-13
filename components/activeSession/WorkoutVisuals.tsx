import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
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

// 1. Tipos de animação para os exercícios
type WorkoutAnimationType =
  | 'run'
  | 'lift'
  | 'squat'
  | 'jump'
  | 'stretch'
  | 'static';

// 2. Componente com a física do movimento desportivo
const AnimatedWorkoutIcon = ({
  name,
  color,
  size,
  type,
}: {
  name: any;
  color: string;
  size: number;
  type: WorkoutAnimationType;
}) => {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (type === 'run') {
      // CORRIDA / MOVIMENTO RÁPIDO: Saltos curtos e rápidos
      translateY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 150, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (type === 'lift') {
      // BRAÇOS / OMBROS / PESOS: Movimento de curl (contração do músculo/rotação)
      rotation.value = withRepeat(
        withSequence(
          withTiming(-35, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      translateY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (type === 'squat') {
      // PERNAS / JOELHOS / PEITO (FLEXÕES): Desce devagar, sobe mais rápido
      translateY.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 600, easing: Easing.inOut(Easing.quad) }), // Desce
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.quad) }), // Sobe
        ),
        -1,
        true,
      );
    } else if (type === 'jump') {
      // SALTO: Salto alto e explosivo
      translateY.value = withRepeat(
        withSequence(
          withTiming(-22, { duration: 300, easing: Easing.out(Easing.cubic) }), // Salto alto
          withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }), // Aterragem
          withTiming(0, { duration: 150 }), // Pausa no chão
        ),
        -1,
        true,
      );
    } else if (type === 'stretch') {
      // COSTAS / CORE / ALONGAMENTO: Respiração profunda e lenta (pulsa o tamanho)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    }
  }, [type]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={iconAnimatedStyle}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Animated.View>
  );
};

// 3. Mapear o texto em inglês para PARTES DO CORPO e exercícios
const getWorkoutIconsData = (text: string) => {
  const lowerText = text.toLowerCase();
  const iconsData: { id: string; name: string; type: WorkoutAnimationType }[] =
    [];

  // BRAÇOS / OMBROS / BÍCEPS / TRÍCEPS
  if (
    lowerText.includes('arm') ||
    lowerText.includes('shoulder') ||
    lowerText.includes('bicep') ||
    lowerText.includes('tricep') ||
    lowerText.includes('elbow')
  ) {
    // Ícone de braço a fletir o músculo
    iconsData.push({ id: 'arms', name: 'arm-flex', type: 'lift' });
  }

  // PERNAS / JOELHOS / COXAS / GLÚTEOS / AGACHAMENTOS
  if (
    lowerText.includes('leg') ||
    lowerText.includes('knee') ||
    lowerText.includes('thigh') ||
    lowerText.includes('calf') ||
    lowerText.includes('calves') ||
    lowerText.includes('glute') ||
    lowerText.includes('squat') ||
    lowerText.includes('lunge')
  ) {
    // Ícone simulando as pernas a fletir (movimento de agachamento)
    iconsData.push({ id: 'legs', name: 'human-handsdown', type: 'squat' });
  }

  // CORE / ABS / ABDÓMEN
  if (
    lowerText.includes('core') ||
    lowerText.includes(' ab ') ||
    lowerText.includes('abs ') ||
    lowerText.includes('stomach') ||
    lowerText.includes('oblique') ||
    lowerText.includes('plank')
  ) {
    // Ícone de Yoga/Core com movimento respiratório focado no tronco
    iconsData.push({ id: 'core', name: 'yoga', type: 'stretch' });
  }

  // COSTAS / LOMBAR
  if (
    lowerText.includes('back') ||
    lowerText.includes('spine') ||
    lowerText.includes('lat ')
  ) {
    // Ícone de braços abertos a alongar as costas
    iconsData.push({ id: 'back', name: 'human-greeting', type: 'stretch' });
  }

  // PEITO / FLEXÕES
  if (
    lowerText.includes('chest') ||
    lowerText.includes('pec ') ||
    lowerText.includes('pushup') ||
    lowerText.includes('push-up')
  ) {
    iconsData.push({ id: 'chest', name: 'human-handsup', type: 'squat' });
  }

  // CORRIDA / CARDIO
  if (
    lowerText.includes('run') ||
    lowerText.includes('jog') ||
    lowerText.includes('sprint') ||
    lowerText.includes('cardio')
  ) {
    iconsData.push({ id: 'run', name: 'run', type: 'run' });
  }

  // SALTOS / BURPEES
  if (
    lowerText.includes('jump') ||
    lowerText.includes('burpee') ||
    lowerText.includes('jack')
  ) {
    iconsData.push({ id: 'jump', name: 'human-handsup', type: 'jump' });
  }

  // PESOS GENÉRICOS (Halteres)
  if (lowerText.includes('dumbbell') || lowerText.includes('weight')) {
    // Só adiciona o haltere se não houver já um ícone de braço, para não duplicar visualmente
    if (!iconsData.some((i) => i.id === 'arms')) {
      iconsData.push({ id: 'weights', name: 'dumbbell', type: 'lift' });
    }
  }

  // FALLBACK GENÉRICO (Se o texto não referir nenhuma zona do corpo)
  if (iconsData.length === 0) {
    iconsData.push({ id: 'generic', name: 'heart-pulse', type: 'stretch' });
  }

  // Retorna os 2 principais grupos musculares encontrados na instrução
  return iconsData.slice(0, 2);
};

export const WorkoutVisuals = ({
  step,
  stepIndex,
  contentOpacity,
}: WorkoutVisualsProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const iconsData = getWorkoutIconsData(step.text);
  const iconColor = '#548F53'; // Cor da App
  const iconSize = 70; // Mantém um tamanho imponente para o exercício

  return (
    <Animated.View
      style={[animatedStyle]}
      className="flex-1 px-8 justify-center items-center"
    >
      <Text
        className="text-[#548F53] text-lg font-bold tracking-widest uppercase mb-6"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Exercise {stepIndex + 1}
      </Text>

      {/* ÁREA DOS ÍCONES ANIMADOS DO EXERCÍCIO */}
      {iconsData.length > 0 && (
        <View className="flex-row justify-center space-x-6 mb-8 h-24 items-center">
          {iconsData.map((data) => (
            <View key={data.id} className="mx-3">
              <AnimatedWorkoutIcon
                name={data.name}
                color={iconColor}
                size={iconSize}
                type={data.type}
              />
            </View>
          ))}
        </View>
      )}

      <Text
        className="text-[#354F52] text-4xl text-center mb-6"
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
