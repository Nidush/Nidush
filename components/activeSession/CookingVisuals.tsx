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
  isIngredientsStep?: boolean;
};

type Ingredient = {
  item: string;
  amount: string;
};

interface CookingVisualsProps {
  step: FormattedInstruction;
  ingredients: Ingredient[];
  stepIndex: number;
  contentOpacity: SharedValue<number>;
}

// 1. Tipos de animação possíveis
type AnimationType = 'chop' | 'mix' | 'heat' | 'static';

// 2. Componente com a física de movimento melhorada
const AnimatedCookingIcon = ({
  name,
  color,
  size,
  type,
}: {
  name: any;
  color: string;
  size: number;
  type: AnimationType;
}) => {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (type === 'chop') {
      // FACA: Corte realista - bate rápido para baixo e levanta mais devagar inclinando
      translateY.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 120, easing: Easing.in(Easing.cubic) }), // Bate na tábua
          withTiming(-8, { duration: 250, easing: Easing.out(Easing.cubic) }), // Levanta
        ),
        -1,
        true,
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 120, easing: Easing.in(Easing.cubic) }), // Ponta para baixo
          withTiming(-5, { duration: 250, easing: Easing.out(Easing.cubic) }), // Levanta o cabo
        ),
        -1,
        true,
      );
    } else if (type === 'mix') {
      // MEXER: Movimento circular (combinação de X, Y e Rotação)
      translateX.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 350, easing: Easing.inOut(Easing.sin) }),
          withTiming(-8, { duration: 350, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      translateY.value = withRepeat(
        withSequence(
          withTiming(4, { duration: 175, easing: Easing.out(Easing.sin) }),
          withTiming(-4, { duration: 350, easing: Easing.inOut(Easing.sin) }),
          withTiming(4, { duration: 175, easing: Easing.in(Easing.sin) }),
        ),
        -1,
        true,
      );
      rotation.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 350, easing: Easing.inOut(Easing.sin) }),
          withTiming(-15, { duration: 350, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else if (type === 'heat') {
      // FERVURA: Pulsa de tamanho e dá pequenos saltos a imitar uma tampa a tremer
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      translateY.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 80 }), // Tremor rápido 1
          withTiming(0, { duration: 80 }),
          withTiming(-1.5, { duration: 80 }), // Tremor rápido 2
          withTiming(0, { duration: 600 }), // Pausa entre as bolhas
        ),
        -1,
        true,
      );
    }
  }, [type]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
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

// 3. Atualizado com a correção do ícone "pan"
const getStepIconsData = (text: string) => {
  const lowerText = text.toLowerCase();
  const iconsData: { id: string; name: string; type: AnimationType }[] = [];

  // FORNO / ASSAR
  if (
    lowerText.includes('bake') ||
    lowerText.includes('oven') ||
    lowerText.includes('roast')
  ) {
    iconsData.push({ id: 'bake', name: 'stove', type: 'heat' });
  }

  // PANELA (Pot) - Ferver, estufar, cozer
  if (
    lowerText.includes('boil') ||
    lowerText.includes('simmer') ||
    lowerText.includes('pot') ||
    lowerText.includes('stew') ||
    lowerText.includes('saucepan')
  ) {
    iconsData.push({ id: 'pot', name: 'pot-steam', type: 'heat' });
  }

  // FRIGIDEIRA / TACHO (Frying Pan) - Fritar, saltear
  if (
    lowerText.includes('fry') ||
    lowerText.includes('pan') ||
    lowerText.includes('skillet') ||
    lowerText.includes('sauté') ||
    lowerText.includes('sear')
  ) {
    // Substituímos o 'pan' (setas de câmara) pelo 'pot-mix' (tacho a ser mexido)
    iconsData.push({ id: 'fry', name: 'pot-mix', type: 'mix' });
  }

  // CORTAR / PICAR
  if (
    lowerText.includes('chop') ||
    lowerText.includes('cut') ||
    lowerText.includes('slice') ||
    lowerText.includes('dice')
  ) {
    iconsData.push({ id: 'cut', name: 'knife', type: 'chop' });
  }

  // MEXER (Colher)
  if (
    lowerText.includes('mix') ||
    lowerText.includes('stir') ||
    lowerText.includes('whisk') ||
    lowerText.includes('blend')
  ) {
    iconsData.push({ id: 'mix', name: 'silverware-spoon', type: 'mix' });
  }

  // TAÇA
  if (lowerText.includes('bowl')) {
    iconsData.push({ id: 'bowl', name: 'bowl-mix', type: 'static' });
  }

  // MICROONDAS
  if (lowerText.includes('microwave')) {
    iconsData.push({ id: 'microwave', name: 'microwave', type: 'heat' });
  }

  // CALOR / LUME
  if (lowerText.includes('heat')) {
    iconsData.push({ id: 'heat', name: 'fire', type: 'heat' });
  }

  // SERVIR / PRATO
  if (
    lowerText.includes('serve') ||
    lowerText.includes('plate') ||
    lowerText.includes('enjoy')
  ) {
    iconsData.push({
      id: 'serve',
      name: 'silverware-fork-knife',
      type: 'static',
    });
  }

  return iconsData.slice(0, 3);
};

export const CookingVisuals = ({
  step,
  ingredients,
  stepIndex,
  contentOpacity,
}: CookingVisualsProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const isIngredientsStep = step.isIngredientsStep;

  // VISTA A: Passo Exclusivo de Ingredientes
  if (isIngredientsStep) {
    return (
      <Animated.View
        style={[animatedStyle]}
        className="flex-1 px-8 justify-center items-center w-full"
      >
        <Text
          className="text-[#354F52] text-3xl text-center mb-2"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Ingredients
        </Text>
        <Text
          className="text-[#548F53] text-sm text-center mb-6 px-4"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {step.text}
        </Text>

        {ingredients && ingredients.length > 0 && (
          <View className=" w-full ">
            <Text
              className="text-[#354F52] text-lg mb-4 border-b border-[#7DA87B]/10 pb-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Ingredients Needed:
            </Text>
            {ingredients.map((ing, idx) => (
              <Text
                key={idx}
                className="text-[#354F52] mb-2 text-base"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                • {ing.amount} {ing.item}
              </Text>
            ))}
          </View>
        )}
      </Animated.View>
    );
  }

  // VISTA B: Passos de Preparação (Instruções Reais)
  const iconsData = getStepIconsData(step.text);
  const iconColor = '#548F53';
  const iconSize = 80;

  // Se houver um ecrã inicial de ingredientes, o passo real 1 começa no index 1
  const displayStepNumber = ingredients.length > 0 ? stepIndex : stepIndex + 1;

  return (
    <Animated.View
      style={[animatedStyle]}
      className="flex-1 px-8 justify-center items-center"
    >
      <Text
        className="text-[#354F52] text-4xl text-center mb-6"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Step {displayStepNumber}
      </Text>

      {iconsData.length > 0 && (
        <View className="flex-row justify-center space-x-4 mb-12 h-20 items-center">
          {iconsData.map((data) => (
            <View key={data.id} className="mx-2">
              <AnimatedCookingIcon
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
        className="text-[#354F52] text-2xl text-center mb-8"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {step.text}
      </Text>
    </Animated.View>
  );
};
