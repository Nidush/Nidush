-- Migration: Seed API Activities diretamente da tabela auth.users do sistema do Supabase

DO $$ 
DECLARE
    u RECORD;
    v_content_id_1 text := 'meal_carbonara_api_001';
    v_content_id_2 text := 'exercise_yoga_api_001';
BEGIN
    -- Volta a garantir que temos ambos os conteúdos (Receita e Exercício)
    IF NOT EXISTS (SELECT 1 FROM public.contents WHERE id = v_content_id_1) THEN
        INSERT INTO public.contents (id, title, description, type, category, image, instructions, ingredients, author) 
        VALUES (v_content_id_1, 'Spaghetti Carbonara', 'Uma receita clássica italiana de carbonara.', 'recipe', 'Pasta', 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg', '["Coza a massa em água com sal.", "Frite o bacon. Misture num tigela ovos e queijo.", "Junte a massa ao bacon na frigideira fora do lume, adicione a mistura de ovos e misture rápido para criar um molho cremoso."]', '["400g Spaghetti", "200g Pancetta ou Bacon", "4 Ovos", "100g Pecorino Romano"]', 'TheMealDB API Simulator');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.contents WHERE id = v_content_id_2) THEN
        INSERT INTO public.contents (id, title, description, type, category, instructions, author) 
        VALUES (v_content_id_2, 'Alongamento Matinal (Yoga)', 'Série de movimentos suaves para despertar o corpo.', 'exercise', 'stretching', '["Respire fundo 3 vezes.", "Levante os braços e estique.", "Toque nos pés e segure por 30 segundos."]', 'API Ninjas Simulator');
    END IF;

    -- Aqui está o SEGREDO: Em vez de ler da tabela publica de utilizadores, lemos DIRETAMENTE da tabela core (auth) do Supabase. Assim temos a certeza absoluta que a conta que criaste na App recebe as atividades!
    FOR u IN (SELECT id FROM auth.users) LOOP
        -- Receita
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE user_id = u.id AND content_id = v_content_id_1) THEN
            INSERT INTO public.activities (title, description, category, type, user_id, content_id, focus_mode_enabled, shortcuts) 
            VALUES ('Cozinhar Carbonara Clássica', 'Prepara esta deliciosa receita da TheMealDB!', 'My creations', 'Cooking', u.id, v_content_id_1, false, false);
        END IF;

        -- Exercício
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE user_id = u.id AND content_id = v_content_id_2) THEN
            INSERT INTO public.activities (title, description, category, type, user_id, content_id, focus_mode_enabled, shortcuts) 
            VALUES ('Sessão de Alongamentos', 'Treino da API Ninjas para começar o dia.', 'My creations', 'Yoga', u.id, v_content_id_2, true, false);
        END IF;
    END LOOP;

END $$;
