-- Migration: Seed API Activities to all Users/Homes
-- Obtém atividades (simulando a estrutura da TheMealDB e API Ninjas) e disponibiliza a todos.

DO $$ 
DECLARE
    h RECORD;
    v_content_id_1 text := 'meal_carbonara_api_001';
    v_content_id_2 text := 'exercise_yoga_api_001';
BEGIN
    -- ==============================================================
    -- 1. CRIAR OS CONTEÚDOS GLOBAIS (BASE DE DADOS)
    -- ==============================================================
    
    -- Conteúdo 1: Receita (TheMealDB format)
    IF NOT EXISTS (SELECT 1 FROM public.contents WHERE id = v_content_id_1) THEN
        INSERT INTO public.contents (
            id, title, description, type, category, image, instructions, ingredients, author
        ) VALUES (
            v_content_id_1,
            'Spaghetti Carbonara',
            'Uma receita clássica italiana de carbonara.',
            'recipe',
            'Pasta',
            'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
            '["Coza a massa em água com sal.", "Frite o bacon. Misture num tigela ovos e queijo.", "Junte a massa ao bacon na frigideira fora do lume, adicione a mistura de ovos e misture rápido para criar um molho cremoso."]',
            '["400g Spaghetti", "200g Pancetta ou Bacon", "4 Ovos", "100g Pecorino Romano"]',
            'TheMealDB API Simulator'
        );
    END IF;

    -- Conteúdo 2: Exercício (API Ninjas format)
    IF NOT EXISTS (SELECT 1 FROM public.contents WHERE id = v_content_id_2) THEN
        INSERT INTO public.contents (
            id, title, description, type, category, instructions, author
        ) VALUES (
            v_content_id_2,
            'Alongamento Matinal (Yoga)',
            'Série de movimentos suaves para despertar o corpo.',
            'exercise',
            'stretching',
            '["Respire fundo 3 vezes.", "Levante os braços e estique.", "Toque nos pés e segure por 30 segundos."]',
            'API Ninjas Simulator'
        );
    END IF;

    -- ==============================================================
    -- 2. DISPONIBILIZAR NAS CASAS DOS UTILIZADORES
    -- ==============================================================
    
    -- Percorre todas as casas registadas no sistema
    FOR h IN (SELECT DISTINCT home_id FROM public.user_homes) LOOP
        
        -- Garante que a Receita não foi inserida nesta casa
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE home_id = h.home_id AND content_id = v_content_id_1) THEN
            INSERT INTO public.activities (
                title, description, category, type, home_id, content_id, focus_mode_enabled, shortcuts
            ) VALUES (
                'Cozinhar Carbonara Clássica',
                'Prepara esta deliciosa receita importada diretamente!',
                'Cooking',
                'Cooking',
                h.home_id,
                v_content_id_1,
                false,
                false
            );
        END IF;

        -- Garante que o Exercício não foi inserido nesta casa
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE home_id = h.home_id AND content_id = v_content_id_2) THEN
            INSERT INTO public.activities (
                title, description, category, type, home_id, content_id, focus_mode_enabled, shortcuts
            ) VALUES (
                'Sessão de Alongamentos',
                'Treino de mobilidade perfeito para começar o dia.',
                'Fitness',
                'Yoga',
                h.home_id,
                v_content_id_2,
                true,
                false
            );
        END IF;
        
    END LOOP;

END $$;
