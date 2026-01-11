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
  category:
    | 'My creations'
    | 'Recommended'
    | 'Simple recipes'
    | 'For the morning';
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
  // --- ADICIONAR DENTRO DE CONTENTS ---
  c9: {
    id: 'c9',
    title: 'Sunrise Flow Meditation',
    type: 'video', // ou 'audio' se preferires
    duration: '15 min',
    // Certifica-te que o caminho da imagem está correto para o teu projeto
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    instructions: [
      'Find a comfortable seated position, preferably facing a window with natural light.',
      'Close your eyes and take deep breaths, inhaling through your nose and exhaling through your mouth.',
      'Visualize the sun rising, filling your body with warmth and golden energy.',
      'Scan your body from head to toe, releasing any tension you find.',
      'Set a clear and positive intention for the day ahead.',
      'Gently open your eyes and stretch your arms towards the sky.',
    ],
  },
  // --- ADICIONAR DENTRO DE CONTENTS ---
  c10: {
    id: 'c10',
    title: 'Classic Eggs Benedict',
    type: 'recipe',
    duration: '30 min',
    image: require('@/assets/cooking_activities/recommended/eggs_benedict.png'),
    ingredients: [
      { item: 'English Muffins', amount: '2 split' },
      { item: 'Eggs', amount: '4 large' },
      { item: 'Canadian Bacon', amount: '4 slices' },
      { item: 'Unsalted Butter', amount: '100g' }, // Para o molho
      { item: 'Egg Yolks', amount: '3' }, // Para o molho
      { item: 'Lemon Juice', amount: '1 tbsp' },
      { item: 'White Vinegar', amount: '1 tbsp' }, // Para escalfar
      { item: 'Chives', amount: 'Garnish' },
    ],
    instructions: [
      'Make the Hollandaise: Whisk egg yolks and lemon juice in a bowl. Slowly stream in melted butter while whisking constantly until thick.',
      'Toast the English muffins until golden brown.',
      'Fry the Canadian bacon slices in a pan for 1-2 minutes per side.',
      'Poach the eggs: Bring water with vinegar to a simmer. Create a gentle vortex and drop eggs in for 3-4 minutes.',
      'Assemble: Place bacon on the muffin, top with the poached egg, and pour Hollandaise sauce generously over it.',
      'Garnish with chopped chives and serve immediately.',
    ],
  },
  // --- ADICIONAR DENTRO DE CONTENTS ---
  c11: {
    id: 'c11',
    title: 'Daily Full Body Stretch',
    type: 'video', // 'video' é o tipo mais adequado para exercícios guiados
    duration: '15 min',
    // Ajusta o caminho da imagem conforme necessário
    image: require('@/assets/activities_for_you/stretching.png'),
    instructions: [
      'Neck Release: Gently tilt your head to the right, hold for 15s, then switch to the left.',
      'Shoulder Rolls: Roll your shoulders backwards 10 times to release tension.',
      'Forward Fold: Stand tall, exhale and hinge at your hips to touch your toes. Keep knees slightly bent.',
      'Cat-Cow Stretch: On hands and knees, inhale to arch your back (Cow) and exhale to round it (Cat).',
      'Child’s Pose: Sit back on your heels, reach arms forward and rest your forehead on the floor.',
      'Cobra Pose: Lie on your stomach, place hands under shoulders and gently lift your chest.',
    ],
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
    playlist: 'Lo-Fi Beats',
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
    playlist: 'Cooking Vibes',
    devices: [
      {
        deviceId: 'dev_light_kitchen',
        state: 'on',
        value: '#FFFFFF',
        brightness: '100%',
      },
      { deviceId: 'dev_speaker_kitchen', state: 'on', value: 'Cooking Vibes' },
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
  {
    id: 's6',
    title: 'Lavender Dream',
    description:
      'Immerse yourself in soft violet hues and the calming scent of lavender. The perfect atmosphere for winding down and gentle stretching.',
    room: 'Bedroom',
    // Podes manter uma imagem de relaxamento existente
    image: require('@/assets/Scenarios/lavender_dream.png'),
    category: 'Recommended',
    focusMode: true, // Ativado para não haver interrupções
    playlist: 'Calm Piano & Ambient',
    devices: [
      {
        deviceId: 'dev_light_bed',
        state: 'on',
        value: '#B39DDB', // Um tom Lavanda/Violeta suave
        brightness: '40%', // Luz suave para relaxar
      },
      {
        deviceId: 'dev_diffuser_bed',
        state: 'on',
        value: 'Lavender', // Essencial para o nome do cenário
      },
      {
        deviceId: 'dev_speaker_bed',
        state: 'on',
        value: 'Calm Piano & Ambient',
      },
      {
        deviceId: 'dev_purifier_bed',
        state: 'on',
        value: 'Silent', // Modo silencioso para não perturbar
      },
    ],
  },
  {
    id: 's7',
    title: 'Dinner Date',
    description:
      'Set the perfect romantic mood with dimmed warm lights and smooth jazz playing in the background.',
    room: 'Kitchen',
    image: require('@/assets/Scenarios/dinner_date.png'),
    category: 'My creations',
    focusMode: true,
    playlist: 'Smooth Jazz Essentials',
    devices: [
      {
        deviceId: 'dev_light_kitchen',
        state: 'on',
        value: '#FFD700',
        brightness: '50%',
      },
      {
        deviceId: 'dev_speaker_kitchen',
        state: 'on',
        value: 'Smooth Jazz Essentials',
      },
      {
        deviceId: 'dev_thermostat_main',
        state: 'on',
        value: 22,
      },
    ],
  },
  {
    id: 's8',
    title: 'Rose Garden',
    description:
      'A botanical escape in your living room. Soft pink lighting and floral scents create a gentle, blooming atmosphere.',
    room: 'Living Room',
    image: require('@/assets/Scenarios/rose_garden.png'),
    category: 'My creations',
    focusMode: false,
    playlist: 'Secret Garden Ambience',
    devices: [
      {
        deviceId: 'dev_light_living',
        state: 'on',
        value: '#FFB6C1', // "Light Pink" - Um rosa suave e natural
        brightness: '65%',
      },
      {
        deviceId: 'dev_speaker_living',
        state: 'on',
        value: 'Secret Garden Ambience',
      },
      {
        deviceId: 'dev_thermostat_main',
        state: 'on',
        value: 23, // Uma temperatura amena de "primavera"
      },
      // Se tiveres um difusor na sala (assumi o ID, ajusta se necessário)
      {
        deviceId: 'dev_diffuser_living',
        state: 'on',
        value: 'Rose & Peony',
      },
    ],
  },
  {
    id: 's9',
    title: 'Rainy Library',
    description:
      'Curl up with a good book. Warm amber lighting and steady rain sounds create the ultimate cozy reading atmosphere.',
    room: 'Bedroom',
    // A imagem de deep_focus funciona bem aqui, pois sugere concentração/leitura
    image: require('@/assets/Scenarios/rainy_library.png'),
    category: 'Recommended',
    focusMode: true, // Essencial para leitura
    playlist: 'Heavy Rain & Lo-Fi',
    devices: [
      {
        deviceId: 'dev_light_bed',
        state: 'on',
        value: '#FFC107',
        brightness: '55%',
      },
      {
        deviceId: 'dev_speaker_bed',
        state: 'on',
        value: 'Heavy Rain & Lo-Fi',
      },
      {
        deviceId: 'dev_diffuser_bed',
        state: 'on',
        value: 'Sandalwood', // Aroma amadeirado (lembra livros antigos e madeira)
      },
      {
        deviceId: 'dev_thermostat_main', // Assumindo controlo geral
        state: 'on',
        value: 24, // Um pouco mais quente para contrastar com a "chuva" lá fora
      },
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
    type: 'meditation',
    contentId: 'c9',
    scenarioId: 's1',
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
    description:
      'Master the art of the perfect brunch. Crispy muffins, tender poached eggs, and rich Hollandaise sauce to start your Sunday right.',
    room: 'Kitchen',
    image: require('@/assets/cooking_activities/recommended/eggs_benedict.png'),
    category: 'Recommended',
    type: 'cooking',
    contentId: 'c10',
    scenarioId: 's4',
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
  {
    id: '11',
    title: 'Stretching',
    description: 'Quick stretching session.',
    room: 'Bedroom',
    image: require('@/assets/activities_for_you/stretching.png'),
    category: 'My creations',
    type: 'workout',
    contentId: 'c11',
    scenarioId: 's6',
  },
];
