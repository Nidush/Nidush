import { Content } from './types';

export const CONTENTS: Record<string, Content> = {
  // --- RECEITAS ---
  c1: {
    id: 'c1',
    title: 'Italian Pasta Tutorial',
    description:
      'Learn the secrets of authentic Italian pasta making. A simple yet delicious guide for a perfect dinner.',
    type: 'recipe',
    category: 'cooking',
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
    description:
      'Rich, gooey, and incredibly chocolatey. These brownies are the ultimate treat for any sweet tooth.',
    type: 'recipe',
    category: 'cooking',
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
  c10: {
    id: 'c10',
    title: 'Classic Eggs Benedict',
    description:
      'Master the art of the perfect brunch with poached eggs, Canadian bacon, and creamy Hollandaise sauce.',
    category: 'cooking',
    type: 'recipe',
    duration: '30 min',
    image: require('@/assets/cooking_activities/recommended/eggs_benedict.png'),
    ingredients: [
      { item: 'English Muffins', amount: '2 split' },
      { item: 'Eggs', amount: '4 large' },
      { item: 'Canadian Bacon', amount: '4 slices' },
      { item: 'Unsalted Butter', amount: '100g' },
      { item: 'Egg Yolks', amount: '3' },
      { item: 'Lemon Juice', amount: '1 tbsp' },
      { item: 'White Vinegar', amount: '1 tbsp' },
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

  // --- MEDITAÇÃO ---
  c2: {
    id: 'c2',
    title: 'Morning Zen Guide',
    description:
      'Start your day with clarity and peace. A quick session to center your mind before the busy day begins.',
    type: 'video',
    category: 'meditation',
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
    description:
      'Drift into a deep, restorative sleep with soothing frequencies designed to calm the nervous system.',
    type: 'audio',
    category: 'meditation',
    duration: '60 min',
    image: require('@/assets/meditation_activities/my_creations/gratitude_flow.png'),
  },
  c9: {
    id: 'c9',
    title: 'Sunrise Flow Meditation',
    description:
      'Connect with the energy of the rising sun. Visualize warmth and light filling your body for energy.',
    type: 'video',
    category: 'meditation',
    duration: '15 min',
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

  // --- WORKOUT ---
  c5: {
    id: 'c5',
    title: 'HIIT Cardio Blast',
    description:
      'Burn calories fast with high-intensity intervals. No equipment needed, just your energy!',
    type: 'video',
    category: 'workout',
    duration: '20 min',
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    instructions: ['Warm up 5 min', 'Sprint 30s', 'Rest 30s', 'Repeat 10x'],
  },
  c6: {
    id: 'c6',
    title: 'Yoga for Back Pain',
    description:
      'Gentle stretches to relieve tension in the lower back and improve your posture.',
    type: 'video',
    category: 'workout',
    duration: '30 min',
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    instructions: ['Child pose', 'Cat-Cow', 'Downward Dog', 'Cobra Pose'],
  },
  c11: {
    id: 'c11',
    title: 'Daily Full Body Stretch',
    description:
      'Release stiffness and improve flexibility with this comprehensive full-body stretching routine.',
    type: 'video',
    category: 'workout',
    duration: '15 min',
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

  // --- AUDIOBOOKS ---
  c7: {
    id: 'c7',
    title: 'The Power of Habit',
    description:
      'Explore the science behind why we do what we do and how to change things.',
    type: 'audio',
    category: 'audiobook',
    duration: '15 min',
    image: require('@/assets/Scenarios/deep_focus.png'),
    author: 'Charles Duhigg',
  },
  c8: {
    id: 'c8',
    title: 'Atomic Habits',
    description:
      'An easy and proven way to build good habits and break bad ones.',
    type: 'audio',
    category: 'audiobook',
    duration: '20 min',
    image: require('@/assets/Scenarios/deep_focus.png'),
    author: 'James Clear',
  },
};
