import React from 'react';
import { SharedValue } from 'react-native-reanimated';
import { SessionVisuals } from './SessionVisuals';
import { SessionWave } from './SessionWave';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
  audio_url?: string; // <-- 1. ADICIONADO AQUI PARA O TYPESCRIPT NÃO RECLAMAR
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
  return (
    <>
      <SessionVisuals
        text={step.text}
        audioUrl={step.audio_url} // <-- 2. AGORA PASSA CORRETAMENTE
        stepIndex={stepIndex}
        pulseScale={pulseScale}
        contentOpacity={contentOpacity}
      />
      <SessionWave />
    </>
  );
};
