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
    image: require('@/assets/cooking_activities/recommended/brownies.png'),
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
  c12: {
    id: 'c12',
    title: 'Pasta Primo',
    description:
      'A vibrant and fresh pasta dish featuring seasonal vegetables, garlic, and a touch of parmesan. Perfect for a quick, healthy meal.',
    type: 'recipe',
    category: 'cooking',
    duration: '25 min',
    image: require('@/assets/cooking_activities/simple_recipes/pasta.png'),
    ingredients: [
      { item: 'Penne Pasta', amount: '400g' },
      { item: 'Cherry Tomatoes', amount: '200g' },
      { item: 'Zucchini', amount: '1 medium' },
      { item: 'Olive Oil', amount: '3 tbsp' },
      { item: 'Garlic', amount: '2 cloves' },
      { item: 'Parmesan Cheese', amount: '50g' },
      { item: 'Fresh Basil', amount: 'Handful' },
    ],
    instructions: [
      'Bring a large pot of salted water to a boil and cook pasta until al dente.',
      'In a large pan, sauté minced garlic and sliced zucchini in olive oil over medium heat.',
      'Add halved cherry tomatoes and cook for 3-4 minutes until they soften slightly.',
      'Drain the pasta (reserving a splash of cooking water) and toss it into the pan with the vegetables.',
      'Stir in the reserved pasta water to create a light glossy sauce.',
      'Serve hot, topped with fresh basil leaves and grated parmesan.',
    ],
  },

  c13: {
    id: 'c13',
    title: 'Classic Chocolate Cake',
    description:
      'A timeless favorite. This moist and rich chocolate cake is perfect for birthdays or just treating yourself.',
    type: 'recipe',
    category: 'cooking',
    duration: '60 min',
    image: require('@/assets/cooking_activities/simple_recipes/chocolate_cake.png'),
    ingredients: [
      { item: 'All-Purpose Flour', amount: '250g' },
      { item: 'Sugar', amount: '300g' },
      { item: 'Cocoa Powder', amount: '75g' },
      { item: 'Eggs', amount: '2 large' },
      { item: 'Milk', amount: '240ml' },
      { item: 'Vegetable Oil', amount: '120ml' },
      { item: 'Baking Powder', amount: '2 tsp' },
      { item: 'Boiling Water', amount: '240ml' },
    ],
    instructions: [
      'Preheat oven to 175°C and grease a round cake pan.',
      'Whisk together sugar, flour, cocoa, baking powder, baking soda, and salt in a large bowl.',
      'Add eggs, milk, oil, and vanilla extract. Beat on medium speed for 2 minutes.',
      'Stir in boiling water by hand (the batter will be thin, but that is normal).',
      'Pour batter into the prepared pan.',
      'Bake for 30-35 minutes or until a wooden toothpick inserted in the center comes out clean.',
      'Cool completely in the pan before removing to frost.',
    ],
  },
  c14: {
    id: 'c14',
    title: 'Spicy Vodka Pasta',
    description:
      'A creamy, rich, and slightly spicy tomato sauce with a splash of vodka. Restaurant quality made at home.',
    type: 'recipe',
    category: 'cooking',
    duration: '25 min',
    image: require('@/assets/cooking_activities/simple_recipes/vodka_pasta.png'),
    ingredients: [
      { item: 'Penne or Rigatoni', amount: '400g' },
      { item: 'Heavy Cream', amount: '150ml' },
      { item: 'Tomato Paste', amount: '100g' },
      { item: 'Vodka', amount: '3 tbsp' },
      { item: 'Butter', amount: '50g' },
      { item: 'Onion', amount: '1 small' },
      { item: 'Garlic', amount: '2 cloves' },
      { item: 'Chili Flakes', amount: '1 tsp' },
      { item: 'Parmesan', amount: 'Grated' },
    ],
    instructions: [
      'Boil pasta in salted water until al dente. Save a cup of pasta water.',
      'In a large pan, melt butter and sauté chopped onion and garlic until soft.',
      'Add tomato paste and chili flakes, cooking for 3-5 mins until the paste turns dark red (this is key!).',
      'Pour in the vodka to deglaze the pan and cook for 2 mins to evaporate the alcohol.',
      'Lower the heat and stir in the heavy cream until smooth.',
      'Toss in the cooked pasta and a splash of pasta water. Mix vigorously until the sauce coats the pasta.',
      'Serve immediately topped with fresh parmesan.',
    ],
  },

  c2: {
    id: 'c2',
    title: 'Morning Zen Guide',
    description: 'Start your day with clarity and peace.',
    type: 'audio',
    category: 'meditation',
    duration: '8 min',
    image: require('@/assets/meditation_content/video_sessions/morning_zen.png'),
    instructions: [
      {
        text: 'Sit down comfortably in a quiet place',
        description:
          'Find a comfortable seated position, either on a chair or on a cushion on the floor. Keep your back straight but relaxed.',
      },
      {
        text: 'Put your hand on your heart. Take 3 deep breaths',
        description:
          'Gently place your right hand over your heart center. Take a deep breath in through your nose, hold it for a moment, and exhale slowly through your mouth. Repeat this three times.',
        duration: 30,
      },
      {
        text: 'Find 3 things you are grateful',
        description:
          'With your eyes closed, think about three simple things in your life that you are grateful for today. Let that feeling of gratitude fill your chest.',
        duration: 60,
      },
      {
        text: 'Smile and open your eyes',
        description:
          'Now, gently bring a smile to your face. Feel the lightness it brings. When you feel ready, slowly open your eyes to start your day.',
      },
    ],
  },

  c4: {
    id: 'c4',
    title: 'Deep Sleep Frequency',
    description: 'Drift into a deep, restorative sleep.',
    type: 'video',
    category: 'meditation',
    duration: '60 min',
    image: require('@/assets/meditation_activities/my_creations/gratitude_flow.png'),
  },

  c9: {
    id: 'c9',
    title: 'Sunrise Flow Meditation',
    description: 'Connect with the energy of the rising sun.',
    type: 'audio',
    category: 'meditation',
    duration: '15 min',
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    instructions: [
      {
        text: 'Find a comfortable seated position, facing a window.',
        description:
          'Sit comfortably facing a window or a source of natural light. Place your hands on your knees, palms facing up to receive energy.',
      },
      {
        text: 'Close your eyes and take deep breaths.',
        description:
          'Gently close your eyes. Begin to deepen your breath, inhaling fully through your nose and sighing it out through your mouth.',
        duration: 60,
      },
      {
        text: 'Visualize the sun rising, filling you with warmth.',
        description:
          'Imagine a golden sun rising in front of you. Feel its warm rays touching your skin and filling your entire body with golden, healing energy.',
        duration: 120,
      },
      {
        text: 'Scan your body from head to toe, releasing tension.',
        description:
          'Bring your attention to the top of your head. Slowly scan down through your body, relaxing your jaw, your shoulders, and your stomach as you go.',
        duration: 60,
      },
      {
        text: 'Set a clear and positive intention for the day.',
        description:
          'Ask yourself: how do I want to feel today? Set a clear, positive intention for the day ahead.',
        duration: 60,
      },
      {
        text: 'Gently open your eyes and stretch your arms.',
        description:
          'Take one last deep breath. Gently blink your eyes open and reach your arms up towards the sky, embracing the new day.',
      },
    ],
  },
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
  c15: {
    id: 'c15',
    title: 'Visualization for Success',
    description:
      'Boost your confidence and clarity by mentally rehearsing your goals. A powerful technique used by athletes and leaders to prime the brain for achievement.',
    type: 'audio',
    category: 'meditation',
    duration: '10 min',
    // Estou a usar esta imagem como placeholder, ajusta se tiveres uma de "sucesso" ou "montanha"
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    instructions: [
      {
        text: 'Find a comfortable, upright position.',
        description:
          'Sit in a chair with your feet flat on the floor and hands resting on your lap. Close your eyes and take three deep, centering breaths.',
        duration: 60,
      },
      {
        text: 'Visualize your specific goal.',
        description:
          'Bring to mind a specific goal or task you want to achieve today. See it clearly. Where are you? Who is with you? What are you doing?',
        duration: 90,
      },
      {
        text: 'Engage all your senses.',
        description:
          'Don’t just see it. Feel the texture of the desk or equipment. Hear the sounds around you. Feel the emotion of confidence and competence flowing through you.',
        duration: 120,
      },
      {
        text: 'Experience the moment of completion.',
        description:
          'Fast forward to the moment you finish the task successfully. Feel the relief, the pride, and the satisfaction. Lock that feeling into your body.',
        duration: 60,
      },
      {
        text: 'Return with confidence.',
        description:
          'Slowly bring your awareness back to the room. Carry that feeling of success with you as you open your eyes.',
      },
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
