-- Migration: Seed API Activities para TODAS AS PESSOAS
-- Como alguns utilizadores podem ainda não ter uma casa criada (user_homes vazio),
-- vamos garantir que todos os utilizadores recebem instâncias diretas das atividades da API nas suas contas.

DO $$ 
DECLARE
    u RECORD;
    v_content_id_1 text := 'meal_carbonara_api_001';
    v_content_id_2 text := 'exercise_yoga_api_001';
BEGIN
    -- 1. Cria os conteúdos GLOBAIS
    IF NOT EXISTS (SELECT 1 FROM public.contents WHERE id = v_content_id_1) THEN
        INSERT INTO public.contents (id, title, description, type, category, image, instructions, ingredients, author) 
        VALUES (
            v_content_id_1, 'Spaghetti Carbonara', 'Uma receita clássica italiana de carbonara.', 'recipe', 'Pasta',
            'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
            '["Coza a massa em água com sal.", "Frite o bacon. Misture num tigela ovos e queijo.", "Junte a massa ao bacon na frigideira fora do lume, adicione a mistura de ovos e misture rápido para criar um molho cremoso."]',
            '["400g Spaghetti", "200g Pancetta ou Bacon", "4 Ovos", "100g Pecorino Romano"]', 'TheMealDB API Simulator'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.contents WHERE id = v_content_id_2) THEN
        INSERT INTO public.contents (id, title, description, type, category, instructions, author) 
        VALUES (
            v_content_id_2, 'Alongamento Matinal (Yoga)', 'Série de movimentos suaves para despertar o corpo.', 'exercise', 'stretching',
            '["Respire fundo 3 vezes.", "Levante os braços e estique.", "Toque nos pés e segure por 30 segundos."]', 'API Ninjas Simulator'
        );
    END IF;

    -- 2. Atribuir a todas as PESSOAS INDIVIDUALMENTE 
    -- (usar a tabela users direta, ignorando se não tiverem casa, pois a RLS lê user_id = auth.uid())
    FOR u IN (SELECT auth_uid FROM public.users WHERE auth_uid IS NOT NULL) LOOP
        
        -- Receita
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE user_id = u.auth_uid AND content_id = v_content_id_1) THEN
            INSERT INTO public.activities (
                title, description, category, type, user_id, content_id, focus_mode_enabled, shortcuts
            ) VALUES (
                'Cozinhar Carbonara Clássica', 'Prepara esta deliciosa receita importada diretamente!', 'Cooking', 'Cooking', 
                u.auth_uid, v_content_id_1, false, false
            );
        END IF;

        -- Exercício
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE user_id = u.auth_uid AND content_id = v_content_id_2) THEN
            INSERT INTO public.activities (
                title, description, category, type, user_id, content_id, focus_mode_enabled, shortcuts
            ) VALUES (
                'Sessão de Alongamentos', 'Treino de mobilidade perfeito para começar o dia.', 'Fitness', 'Yoga', 
                u.auth_uid, v_content_id_2, true, false
            );
        END IF;
        
    END LOOP;

END $$;
