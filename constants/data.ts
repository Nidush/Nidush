import { ImageSourcePropType } from 'react-native';

// ==========================================
// 1. INTERFACES (TIPOS)
// ==========================================

// Ingredientes (para Receitas)
export interface Ingredient {
  item: string;
  amount: string;
}

// Conteúdo (A fonte da verdade para a Duração)
export interface Content {
  id: string;
  title: string;
  type: 'video' | 'recipe' | 'audio';
  duration: string;
  image: ImageSourcePropType;
  instructions?: string[];
  ingredients?: Ingredient[];
  videoUrl?: string;
  author?: string;
}

// Configuração de Estado do Dispositivo no Cenário
export interface ScenarioDeviceState {
  deviceId: string;
  state: 'on' | 'off';
  value?: number | string;
  brightness?: string; // ex: "80%", "100%"
}

// Cenário (Ambiente)
export interface Scenario {
  id: string;
  title: string;
  description: string;
  room: string;
  image: ImageSourcePropType;
  category: 'My creations' | 'Recommended';
  devices: ScenarioDeviceState[];
  playlist?: string;
  focusMode: boolean;
}

// Atividade
export interface Activity {
  id: string;
  title: string;
  description: string;
  room: string;
  image: ImageSourcePropType;
  category: 'My creations' | 'Recommended' | 'Simple recipes';
  type: 'cooking' | 'meditation' | 'workout' | 'audiobooks' | 'general';

  // Relacionamentos
  scenarioId?: string;
  contentId?: string;
}

// ==========================================
// 2. DADOS DE CONTEÚDO (UNIFICADOS)
// ==========================================
// Agora é mais fácil identificar os IDs porque estão todos aqui
export const CONTENTS: Record<string, Content> = {
  // --- RECEITAS ---
  c1: {
    id: 'c1',
    title: 'Italian Pasta Tutorial',
    type: 'recipe',
    duration: '45 min',
    image: require('@/assets/cooking_activities/my_creations_cooking/italian_night.png'),
    ingredients: [
      { item: 'Pasta', amount: '500g' },
      { item: 'Tomato Sauce', amount: '200ml' },
    ],
    instructions: ['Boil water', 'Cook pasta', 'Add sauce', 'Enjoy with wine'],
  },
  c3: {
    id: 'c3',
    title: 'Fudgy Brownies',
    type: 'recipe',
    duration: '50 min',
    image: require('@/assets/cooking_activities/simple_recipes/chocolate_cake.png'),
    ingredients: [
      { item: 'Unsalted Butter', amount: '225g' },
      { item: 'Sugar', amount: '400g' },
      { item: 'Cocoa Powder', amount: '80g' },
      { item: 'Eggs', amount: '4 large' },
      { item: 'Flour', amount: '130g' },
      { item: 'Chocolate Chips', amount: '200g' },
    ],
    instructions: [
      'Preheat the oven to 175°C.',
      'Melt butter and mix with sugar/cocoa.',
      'Add eggs.',
      'Fold in flour and chips.',
      'Bake for 30 mins.',
    ],
  },

  // --- MEDITAÇÃO ---
  c2: {
    id: 'c2',
    title: 'Morning Zen Guide',
    type: 'video',
    duration: '12 min',
    image: require('@/assets/meditation_content/video_sessions/morning_zen.png'),
    instructions: [
      'Sit down comfortably.',
      'Put your hand on your heart. Take 3 deep breaths.',
      'Find 3 things you are grateful for right now.',
      'Smile and open your eyes.',
    ],
  },
  c4: {
    id: 'c4',
    title: 'Deep Sleep Frequency',
    type: 'audio',
    duration: '60 min',
    image: require('@/assets/meditation_activities/my_creations/gratitude_flow.png'),
  },

  // --- WORKOUT ---
  c5: {
    id: 'c5',
    title: 'HIIT Cardio Blast',
    type: 'video',
    duration: '20 min',
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    instructions: ['Warm up 5 min', 'Sprint 30s', 'Rest 30s', 'Repeat 10x'],
  },
  c6: {
    id: 'c6',
    title: 'Yoga for Back Pain',
    type: 'video',
    duration: '30 min',
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    instructions: ['Child pose', 'Cat-Cow', 'Downward Dog', 'Cobra Pose'],
  },

  // --- AUDIOBOOKS ---
  c7: {
    id: 'c7',
    title: 'The Power of Habit',
    type: 'audio',
    duration: '15 min',
    image: require('@/assets/Scenarios/deep_focus.png'),
    author: 'Charles Duhigg',
  },
  c8: {
    id: 'c8',
    title: 'Atomic Habits',
    type: 'audio',
    duration: '20 min',
    image: require('@/assets/Scenarios/deep_focus.png'),
    author: 'James Clear',
  },
};

// ==========================================
// 3. CENÁRIOS (ATUALIZADOS COM BRILHO)
// ==========================================
export const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    title: 'Desert Heat',
    description: 'Warm lights and dry temperature matching a desert evening.',
    room: 'Living Room',
    image: require('@/assets/Scenarios/desert_heat.png'),
    category: 'My creations',
    focusMode: false,
    devices: [
      {
        deviceId: 'dev_light_living',
        state: 'on',
        value: '#FF8C00',
        brightness: '80%',
      },
      { deviceId: 'dev_speaker_living', state: 'on', value: 'Lo-Fi Beats' },
      { deviceId: 'dev_thermostat_main', state: 'on', value: 24 },
    ],
  },
  {
    id: 's2',
    title: 'Deep Focus',
    description: 'Cool white light and silence for maximum productivity.',
    room: 'Bedroom',
    image: require('@/assets/Scenarios/deep_focus.png'),
    category: 'My creations',
    playlist: 'Focus Playlist',
    focusMode: true,
    devices: [
      {
        deviceId: 'dev_light_bed',
        state: 'on',
        value: '#E0F7FA',
        brightness: '100%',
      },
      { deviceId: 'dev_purifier_bed', state: 'on', value: 'Silent' },
      { deviceId: 'dev_speaker_bed', state: 'on', value: 'Focus Playlist' },
    ],
  },
  {
    id: 's3',
    title: 'Forest Bathing',
    description: 'Sounds of nature and green ambient lighting.',
    room: 'Bedroom',
    image: require('@/assets/Scenarios/forest_bathing.png'),
    category: 'Recommended',
    focusMode: false,
    playlist: 'Spotify Nature Sounds',
    devices: [
      {
        deviceId: 'dev_light_bed',
        state: 'on',
        value: '#90EE90',
        brightness: '50%',
      },
      { deviceId: 'dev_diffuser_bed', state: 'on', value: 'Pine' },
      { deviceId: 'dev_speaker_bed', state: 'on' },
    ],
  },
  {
    id: 's4',
    title: 'Slow Cooking',
    description: 'Bright kitchen lights for chopping vegetables safely.',
    room: 'Kitchen',
    image: require('@/assets/Scenarios/slow_cooking.png'),
    category: 'Recommended',
    focusMode: false,
    devices: [
      {
        deviceId: 'dev_light_kitchen',
        state: 'on',
        value: '#FFFFFF',
        brightness: '100%',
      },
      { deviceId: 'dev_speaker_kitchen', state: 'on', value: 'Podcast' },
    ],
  },
  {
    id: 's5',
    title: 'Moonlight Bay',
    description: 'Cool blue tones and gentle wave sounds for deep relaxation.',
    room: 'Bedroom',
    image: require('@/assets/Scenarios/moonlight_bay.png'),
    category: 'Recommended',
    focusMode: true,
    playlist: 'Calm Ocean Waves',
    devices: [
      {
        deviceId: 'dev_light_bed',
        state: 'on',
        value: '#191970',
        brightness: '30%',
      },
      { deviceId: 'dev_speaker_bed', state: 'on' },
      { deviceId: 'dev_diffuser_bed', state: 'on', value: 'Lavender' },
      { deviceId: 'dev_purifier_bed', state: 'on', value: 'Auto' },
    ],
  },
];

// ==========================================
// 4. ATIVIDADES
// ==========================================
export const ACTIVITIES: Activity[] = [
  {
    id: '1',
    title: 'Italian Night',
    description: 'A cozy cooking session with italian vibes.',
    room: 'Kitchen',
    image: require('@/assets/cooking_activities/my_creations_cooking/italian_night.png'),
    category: 'My creations',
    type: 'cooking',
    contentId: 'c1',
    scenarioId: 's4',
  },
  {
    id: '2',
    title: 'Sunrise Flow',
    description: 'Start your day with energy.',
    room: 'Living Room',
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    category: 'My creations',
    type: 'workout',
    contentId: 'c5',
  },
  {
    id: '3',
    title: 'Gratitude Flow',
    description:
      'With a gentle voice guiding you, focus for 8 minutes on 3 to 5 things you are grateful for that morning (it can be something as simple as a hot coffee). Shift your brain chemistry to a positive state.',
    room: 'Bedroom',
    image: require('@/assets/meditation_activities/my_creations/gratitude_flow.png'),
    category: 'My creations',
    type: 'meditation',
    contentId: 'c2',
    scenarioId: 's5',
  },
  {
    id: '4',
    title: 'Brownies',
    description: 'Easy homemade brownies that are fudgy and delicious.',
    room: 'Kitchen',
    image: require('@/assets/cooking_activities/recommended/brownies.png'),
    category: 'Recommended',
    type: 'cooking',
    contentId: 'c3',
    scenarioId: 's3',
  },
  {
    id: '5',
    title: 'Morning Zen',
    description: 'Quick meditation session.',
    room: 'Living Room',
    image: require('@/assets/meditation_content/video_sessions/morning_zen.png'),
    category: 'Recommended',
    type: 'meditation',
    contentId: 'c2',
  },
  {
    id: '6',
    title: 'Eggs Benedict',
    description: 'Classic breakfast recipe.',
    room: 'Kitchen',
    image: require('@/assets/cooking_activities/recommended/eggs_benedict.png'),
    category: 'Recommended',
    type: 'cooking',
  },
  {
    id: '7',
    title: 'Vodka Pasta',
    description: 'Trendy and delicious pasta.',
    room: 'Kitchen',
    image: require('@/assets/cooking_activities/simple_recipes/vodka_pasta.png'),
    category: 'Simple recipes',
    type: 'cooking',
  },
  {
    id: '8',
    title: 'Evening Read',
    description: 'Relax with a good book summary.',
    room: 'Bedroom',
    image: require('@/assets/Scenarios/deep_focus.png'),
    category: 'Recommended',
    type: 'audiobooks',
    contentId: 'c8',
    scenarioId: 's2',
  },
  {
    id: '9',
    title: 'Chocolate Cake',
    description: 'For the cheat day.',
    room: 'Kitchen',
    image: require('@/assets/cooking_activities/simple_recipes/chocolate_cake.png'),
    category: 'Simple recipes',
    type: 'cooking',
  },
  {
    id: '10',
    title: 'Pasta Primo',
    description: 'Quick pasta dish.',
    room: 'Kitchen',
    image: require('@/assets/cooking_activities/simple_recipes/pasta.png'),
    category: 'Simple recipes',
    type: 'cooking',
  },
];
