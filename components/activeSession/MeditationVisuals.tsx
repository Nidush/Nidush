import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import BreathingExercise from './BreathingExercise';
import { SessionVisuals } from './SessionVisuals';
import { SessionWave } from './SessionWave';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
  audio_url?: string;
};

interface MeditationVisualsProps {
  step: FormattedInstruction;
  stepIndex: number;
  pulseScale: SharedValue<number>;
  contentOpacity: SharedValue<number>;
}

export const MeditationVisuals = ({
  step,
  stepIndex,
  pulseScale,
  contentOpacity,
}: MeditationVisualsProps) => {
  // Estado para controlar se mostramos as animações de respiração
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);

  useEffect(() => {
    // 1. Sempre que o passo muda, escondemos o exercício e voltamos ao texto normal
    setShowBreathingExercise(false);

    // 2. Procuramos por palavras-chave relacionadas com respiração
    const lowerText = step.text.toLowerCase();
    const hasBreathingKeywords =
      lowerText.includes('breath') ||
      lowerText.includes('inhale') ||
      lowerText.includes('exhale');

    let timer: ReturnType<typeof setTimeout>;

    // 3. Se tiver as palavras, disparamos um temporizador de 10 segundos
    if (hasBreathingKeywords) {
      timer = setTimeout(() => {
        setShowBreathingExercise(true);
      }, 10000); // 10.000 ms = 10 segundos
    }

    // 4. Limpeza de segurança caso o utilizador passe para o passo seguinte antes dos 10s
    return () => clearTimeout(timer);
  }, [step.text]); // A dependência no step.text garante que o ciclo reinicia a cada passo

  return (
    <View className="flex-1 w-full relative">
      {/* Renderização Condicional: 
        Se for para mostrar a respiração, o SessionVisuals e as Waves desaparecem! 
      */}
      {showBreathingExercise ? (
        <BreathingExercise />
      ) : (
        <>
          <SessionVisuals
            text={step.text}
            stepIndex={stepIndex}
            pulseScale={pulseScale}
            contentOpacity={contentOpacity}
          />
          <SessionWave />
        </>
      )}
    </View>
  );
};
