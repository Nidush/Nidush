import { WearableData } from '@/constants/data/types';
import { inferStateFromData } from './biometricLogic';

const randomRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const generateBiometricsFromStress = (
  stressLevel: number,
): WearableData => {
  const now = Date.now();
  const safeStress = Math.max(0, Math.min(100, stressLevel));

  const bpmBase = 60 + safeStress * 0.7;
  const bpm = Math.floor(bpmBase + randomRange(-5, 5));

  const hrvBase = 100 - safeStress * 0.85;
  const hrv = Math.floor(hrvBase + randomRange(-5, 5));

  let eda = randomRange(1, 3);
  if (safeStress > 50) eda = randomRange(5, 15);
  if (safeStress > 80) eda = randomRange(15, 30);

  const detectedState = inferStateFromData(bpm, hrv, eda);

  return {
    deviceId: 'mock_apple_watch_s9',
    timestamp: now,
    heartRate: bpm,
    hrv: Math.max(5, hrv),
    skinTemperature: 36.5,
    eda: eda,
    stressScore: safeStress,
    detectedState: detectedState,
  };
};
