import { Activity, Scenario, UserState } from '@/constants/data/types';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const STATE_KEYWORDS: Record<UserState, string[]> = {
  RELAXED: [
    'relaxed',
    'relax',
    'chill',
    'slow',
    'calm',
    'quiet',
    'cooking',
    'pasta',
    'italian',
    'wine',
    'dinner',
    'brunch',
    'breakfast',
    'baking',
    'chocolate',
    'dessert',
    'coffee',
    'acoustic',
    'jazz',
    'entertainment',
    'movie',
    'cinema',
    'fun',
    'creative',
    'cozy',
    'warm',
    'heat',
    'sunset',
    'romantic',
    'date',
    'love',
    'comfortable',
    'reading',
    'book',
    'hobby',
    'garden',
    'floral',
    'spring',
  ],
  FOCUSED: [
    'focus',
    'focused',
    'productivity',
    'deep',
    'work',
    'study',
    'learning',
    'goals',
    'success',
    'confidence',
    'mindset',
    'visualization',
    'office',
    'library',
    'reading',
    'book',
    'audiobook',
    'coding',
    'write',
    'quick',
    'start',
    'energy',
    'crisp',
    'clear',
    'precision',
    'white',
  ],
  STRESSED: [
    'stressed',
    'stress',
    'recovery',
    'break',
    'pause',
    'nature',
    'forest',
    'green',
    'garden',
    'floral',
    'rose',
    'pine',
    'meditation',
    'zen',
    'breathing',
    'mindfulness',
    'stretch',
    'flexibility',
    'release',
    'tension',
    'body',
    'quiet',
    'silence',
    'calm',
    'sanctuary',
    'escape',
  ],
  ANXIOUS: [
    'anxious',
    'anxiety',
    'panic',
    'overwhelmed',
    'water',
    'ocean',
    'rain',
    'waves',
    'blue',
    'bath',
    'sleep',
    'bed',
    'night',
    'dream',
    'lavender',
    'sleepy',
    'safety',
    'safe',
    'comfort',
    'cozy',
    'warm',
    'grounding',
    'soft',
    'slow',
    'breathe',
    'spiritual',
    'inner',
    'productivity',
  ],
};

const NEGATIVE_KEYWORDS: Record<UserState, string[]> = {
  RELAXED: ['work', 'gym', 'stress', 'deadline', 'rush'],
  FOCUSED: ['party', 'sleep', 'distraction', 'noise', 'entertainment', 'movie'],
  STRESSED: [
    'work',
    'focus',
    'deadline',
    'party',
    'loud',
    'gym',
    'horror',
    'intensity',
  ],
  ANXIOUS: ['work', 'horror', 'loud', 'party', 'intensity', 'fast', 'sprint'],
};

const TIME_KEYWORDS: Record<TimeOfDay, string[]> = {
  morning: [
    'morning',
    'sunrise',
    'breakfast',
    'brunch',
    'coffee',
    'brew',
    'start',
    'energy',
    'wake',
    'yoga',
    'stretch',
    'sun',
  ],
  afternoon: [
    'afternoon',
    'lunch',
    'focus',
    'work',
    'power',
    'gym',
    'study',
    'quick',
    'active',
  ],
  evening: [
    'evening',
    'dinner',
    'sunset',
    'wine',
    'jazz',
    'party',
    'cooking',
    'pasta',
    'italian',
    'romantic',
    'cozy',
    'relax',
  ],
  night: [
    'night',
    'sleep',
    'bed',
    'moon',
    'dream',
    'midnight',
    'silent',
    'dark',
    'stars',
    'movie',
    'cinema',
    'lavender',
  ],
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

  const rawKeywords = item.keywords || [];
  const itemKeywords = rawKeywords.map((k) => k.toLowerCase());

  stateKeywords.forEach((k) => {
    if (itemKeywords.includes(k)) score += 30;
  });

  timeKeywords.forEach((k) => {
    if (itemKeywords.includes(k)) score += 5;
  });

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
