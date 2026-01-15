import { UserState } from '@/constants/data/types';

// Agora aceitamos também o EDA
export const inferStateFromData = (
  bpm: number,
  hrv: number,
  eda: number,
): UserState => {
  // ANXIOUS: Coração rápido, variabilidade baixa E pele a suar muito (EDA alto)
  // O EDA > 15 confirma que não é apenas exercício físico
  if (bpm > 110 && hrv < 30 && eda > 12) return 'ANXIOUS';

  // STRESSED: Sinais de tensão moderada
  if ((bpm > 90 || hrv < 45) && eda > 6) return 'STRESSED';

  // FOCUSED: O corpo está ativo, mas o HRV não está em colapso e o EDA é estável
  if (bpm > 70 && hrv < 75) return 'FOCUSED';

  // RELAXED: Tudo baixo e estável
  return 'RELAXED';
};
