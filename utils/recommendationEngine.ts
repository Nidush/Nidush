import { Activity, Scenario } from '@/constants/data/types';

// Tipos de hora do dia
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const TIME_KEYWORDS: Record<TimeOfDay, string[]> = {
  morning: [
    'morning',
    'sunrise',
    'breakfast',
    'brunch',
    'energy',
    'start',
    'yoga',
    'zen',
    'coffee',
    'wake',
  ],
  afternoon: [
    'afternoon',
    'lunch',
    'focus',
    'work',
    'power',
    'gym',
    'snack',
    'study',
    'productivity',
    'office',
  ],
  // 18h - 22h: Jantar e Relaxar
  evening: [
    'evening',
    'dinner',
    'sunset',
    'wine',
    'jazz',
    'party',
    'cooking',
    'movie',
    'social',
    'romantic',
    'pasta',
    'dessert',
  ],
  // 22h - 05h: Dormir
  night: [
    'night',
    'sleep',
    'bed',
    'moon',
    'dream',
    'midnight',
    'insomnia',
    'silent',
    'dark',
    'stars',
    'recovery',
    'calm',
  ],
};

/**
 * Determina a hora atual (usado apenas internamente para ordenar)
 */
export const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

/**
 * Título Fixo (conforme pedido)
 */
export const getRecommendationTitle = (): string => {
  return 'Recommended';
};

/**
 * Calcula pontuação de relevância
 */
const calculateRelevanceScore = (
  item: Activity | Scenario,
  activeKeywords: string[],
): number => {
  let score = 0;

  // 1. Keywords explícitas (Peso: 5)
  if (item.keywords) {
    item.keywords.forEach((k) => {
      if (activeKeywords.includes(k.toLowerCase())) score += 5;
    });
  }

  // 2. Texto (Peso: 1)
  const text = `${item.title} ${item.description} ${item.room}`.toLowerCase();
  activeKeywords.forEach((k) => {
    if (text.includes(k)) score += 1;
  });

  return score;
};

/**
 * Retorna a lista ordenada por relevância temporal
 */
export const getDynamicRecommendations = (items: (Activity | Scenario)[]) => {
  const time = getTimeOfDay();
  const currentKeywords = TIME_KEYWORDS[time];

  return [...items].sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, currentKeywords);
    const scoreB = calculateRelevanceScore(b, currentKeywords);
    return scoreB - scoreA;
  });
};
