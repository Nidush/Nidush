import { UserState } from '@/constants/data/types';

export const inferStateFromData = (
  bpm: number,
  hrv: number,
  eda: number,
): UserState => {
  if (bpm > 110 && hrv < 30 && eda > 12) return 'ANXIOUS';

  if ((bpm > 90 || hrv < 45) && eda > 6) return 'STRESSED';

  if (bpm > 70 && hrv < 75) return 'FOCUSED';

  return 'RELAXED';
};
