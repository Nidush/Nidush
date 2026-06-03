import React from 'react';
import { SharedValue } from 'react-native-reanimated';
import { SessionVisuals } from './SessionVisuals';
import { SessionWave } from './SessionWave';

type FormattedInstruction = {
  text: string;
  duration?: number;
  description?: string;
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
        stepIndex={stepIndex}
        pulseScale={pulseScale}
        contentOpacity={contentOpacity}
      />
      <SessionWave />
    </>
  );
};
