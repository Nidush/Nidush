import { UserState } from '@/constants/data/types';

export const inferStateFromData = (bpm: number, hrv: number): UserState => {
  if (bpm > 115 && hrv < 25) return 'ANXIOUS';
  if (bpm > 95 || hrv < 40) return 'STRESSED';
  if (bpm > 72 && hrv < 70) return 'FOCUSED';
  return 'RELAXED';
};
