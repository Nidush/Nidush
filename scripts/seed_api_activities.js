const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Variáveis EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const API_NINJAS_KEY = process.env.API_NINJAS_KEY;
const THE_MEAL_DB_URL = 'https://www.themealdb.com/api/json/v1/1/random.php';
const MUSCLES = ['biceps', 'triceps', 'chest', 'abdominals', 'glutes', 'hamstrings', 'calves', 'lats', 'forearms', 'middle_back', 'quadriceps'];

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// ==========================================
// 1. Fetch TheMealDB (Apenas cria Conteúdo)
// ==========================================
async function fetchMealDBContent() {
  try {
    const response = await fetch(THE_MEAL_DB_URL);
    const data = await response.json();
    const meal = data.meals[0];

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim()) ingredients.push(`${measure} ${ing}`.trim());
    }

    const contentId = `meal_${meal.idMeal}_${generateId()}`;
    return {
      id: contentId,
      title: meal.strMeal,
      description: `${meal.strArea} recipe. Tags: ${meal.strTags || 'None'}`,
      type: 'recipe',
      category: meal.strCategory,
      image: meal.strMealThumb, // Imagem no card do Passo 2!
      instructions: JSON.stringify(meal.strInstructions.split('\r\n').filter(l => l.trim())),
      ingredients: JSON.stringify(ingredients),
      video_url: meal.strYoutube || null,
      author: 'TheMealDB'
    };
  } catch (e) {
    console.error('Erro TheMealDB:', e.message);
    return null;
  }
}

// ==========================================
// 2. Fetch API Ninjas (Apenas cria Conteúdo)
// ==========================================
async function fetchApiNinjasContent() {
  if (!API_NINJAS_KEY || API_NINJAS_KEY === 'COLOQUE_AQUI') return null;

  const muscle = MUSCLES[Math.floor(Math.random() * MUSCLES.length)];
  try {
    const res = await fetch(`https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`, {
      headers: { 'X-Api-Key': API_NINJAS_KEY }
    });
    if (!res.ok) { console.error('Erro API Ninjas:', await res.text()); return null; }

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const exercise = data[Math.floor(Math.random() * data.length)];
    const contentId = `exercise_${generateId()}`;

    // Normalizar categoria: strength -> workout
    let category = exercise.type;
    if (category === 'strength' || category === 'strength_training') {
      category = 'workout';
    }

    return {
      id: contentId,
      title: exercise.name,
      description: `Difficulty: ${exercise.difficulty} | Muscle: ${exercise.muscle}`,
      type: 'exercise',
      category: category,
      image: `https://picsum.photos/seed/${contentId}/400/600`, // Imagem genérica no card do Passo 2!
      instructions: JSON.stringify([exercise.instructions]),
      author: 'API Ninjas'
    };
  } catch (e) {
    console.error('Erro API Ninjas:', e.message);
    return null;
  }
}

// ==========================================
// 3. Inserir APENAS na tabela `contents`
// ==========================================
async function insertContentOnly(contentObj) {
  if (!contentObj) return;

  const { error: contentErr } = await supabase.rpc('seed_api_content', {
    p_content_id: contentObj.id,
    p_title: contentObj.title,
    p_description: contentObj.description,
    p_category: contentObj.category,
    p_type: contentObj.type,
    p_image: contentObj.image || null,
    p_instructions: contentObj.instructions || null,
    p_ingredients: contentObj.ingredients || null,
    p_author: contentObj.author
  });

  if (contentErr) {
    console.error(`  ✗ Falha ao gravar conteudo na base de dados (${contentObj.title}):`, contentErr.message);
  } else {
    console.log(`✅ Ficheiro disponível no Passo 2: ${contentObj.title}`);
  }
}

// ==========================================
// Limpar atividades acidentais dos users
// ==========================================
async function clenupUserActivities() {
    console.log('🧹 A limpar Atividades que criei por engano para todos os utilizadores...');

    // Apaga qlq atividade injetada pela seed
    const { error } = await supabase
        .from('activities')
        .delete()
        .or('content_id.ilike.meal_%,content_id.ilike.exercise_%');

    if (error) {
        console.error('Falha a limpar atividades:', error);
    } else {
        console.log('🧹 Todas as atividades automáticas dos utilizadores apagadas com sucesso! Agora eles têm de criar à mão no Passo 2.');
    }
}

// ==========================================
// Main
// ==========================================
async function runSeed() {
  console.log('🚀 A popular catálogo de opções (Apenas Contents!)...\n');

  await clenupUserActivities();

  console.log('\n--- 🍳 Buscar 5 Receitas (TheMealDB) ---');
  for (let i = 0; i < 5; i++) {
    const d = await fetchMealDBContent();
    await insertContentOnly(d);
  }

  console.log('\n--- 💪 Buscar 5 Exercícios (API Ninjas) ---');
  for (let i = 0; i < 5; i++) {
    const d = await fetchApiNinjasContent();
    await insertContentOnly(d);
  }

  console.log('\n🎉 O teu Catálogo "Choose Content" no Passo 2 tem novidades fresquinhas!');
  process.exit(0);
}

runSeed();
