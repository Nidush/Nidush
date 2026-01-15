import { Activity, Scenario, UserState } from '@/constants/data/types';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const STATE_KEYWORDS: Record<UserState, string[]> = {
  RELAXED: [
    'relaxed',
    'yoga',
    'reading',
    'cooking',
    'music',
    'garden',
    'chill',
    'slow',
    'hobby',
    'book',
  ],
  FOCUSED: [
    'focus',
    'work',
    'study',
    'productivity',
    'learning',
    'office',
    'coding',
    'write',
    'deep',
  ],
  STRESSED: [
    'stressed',
    'meditation',
    'breathing',
    'stretch',
    'nature',
    'calm',
    'break',
    'forest',
    'zen',
    'relax',
    'quiet',
    'recovery',
  ],
  ANXIOUS: [
    'anxious',
    'calming',
    'zen',
    'moonlight',
    'soft',
    'recovery',
    'water',
    'ocean',
    'sleep',
    'breathe',
    'safety',
    'comfort',
    'slow',
  ],
};

// 2. NOVAS KEYWORDS NEGATIVAS (O que evitar em cada estado)
const NEGATIVE_KEYWORDS: Record<UserState, string[]> = {
  RELAXED: ['work', 'gym', 'stress'],
  FOCUSED: ['party', 'sleep', 'distraction'],
  STRESSED: ['work', 'focus', 'deadline', 'party', 'loud', 'gym'],
  ANXIOUS: ['work', 'horror', 'loud', 'party', 'intensity'],
};

const TIME_KEYWORDS: Record<TimeOfDay, string[]> = {
  morning: [
    'morning',
    'sunrise',
    'breakfast',
    'energy',
    'start',
    'yoga',
    'wake',
  ],
  afternoon: ['afternoon', 'lunch', 'focus', 'work', 'power', 'gym', 'study'],
  evening: ['evening', 'dinner', 'sunset', 'wine', 'jazz', 'party', 'cooking'],
  night: ['night', 'sleep', 'bed', 'moon', 'dream', 'midnight', 'silent'],
};

export const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

const calculateRelevanceScore = (
  item: Activity | Scenario,
  timeKeywords: string[],
  stateKeywords: string[],
  negativeKeywords: string[],
): number => {
  let score = 0;

  // Proteção contra itens sem keywords
  const rawKeywords = item.keywords || [];
  const itemKeywords = rawKeywords.map((k) => k.toLowerCase());

  // --- AQUI ESTÁ A MUDANÇA PRINCIPAL ---

  // 1. Match de Estado (AUMENTÁMOS O PESO PARA 30)
  // Isto garante que o Estado ganha sempre à Hora do dia
  stateKeywords.forEach((k) => {
    if (itemKeywords.includes(k)) score += 30;
  });

  // 2. Match de Hora (Mantivemos a 5)
  // Serve apenas para desempatar atividades que servem para o mesmo estado
  timeKeywords.forEach((k) => {
    if (itemKeywords.includes(k)) score += 5;
  });

  // 3. Penalização (SUBTRAIMOS PONTOS)
  // Se estou stressado e a atividade é "Trabalho", perde 50 pontos e vai para o fundo da lista
  negativeKeywords.forEach((k) => {
    if (itemKeywords.includes(k)) score -= 50;
  });

  return score;
};

export const getDynamicRecommendations = (
  items: (Activity | Scenario)[],
  currentState: UserState = 'RELAXED',
) => {
  const time = getTimeOfDay();
  const timeKeywords = TIME_KEYWORDS[time];

  const safeState = currentState || 'RELAXED';
  const stateKeywords = STATE_KEYWORDS[safeState];
  const negativeKeywords = NEGATIVE_KEYWORDS[safeState] || [];

  return [...items].sort((a, b) => {
    const scoreA = calculateRelevanceScore(
      a,
      timeKeywords,
      stateKeywords,
      negativeKeywords,
    );
    const scoreB = calculateRelevanceScore(
      b,
      timeKeywords,
      stateKeywords,
      negativeKeywords,
    );
    return scoreB - scoreA;
  });
};

export const getRecommendationTitle = (): string => {
  return 'Recommended';
};
