-- Migration: Crianção de Function RPC para permitir que scripts externos gravem dados da API ignorando a RLS

CREATE OR REPLACE FUNCTION public.seed_dynamic_api_activity(
    p_content_id text,
    p_title text,
    p_description text,
    p_category text,
    p_type text,
    p_image text,
    p_instructions jsonb,
    p_ingredients jsonb,
    p_author text,
    p_activity_category text,
    p_activity_type text
) RETURNS void AS $$
DECLARE
    u RECORD;
BEGIN
    -- 1. Inserir Content
    INSERT INTO public.contents (
        id, title, description, category, type, image, instructions, ingredients, author
    ) VALUES (
        p_content_id, p_title, p_description, p_category, p_type, p_image, p_instructions, p_ingredients, p_author
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Atribuir Atividade Dinâmica a TODOS OS UTILIZADORES
    FOR u IN (SELECT id FROM auth.users) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE user_id = u.id AND content_id = p_content_id) THEN
            INSERT INTO public.activities (
                title, description, category, type, user_id, content_id, focus_mode_enabled, shortcuts
            ) VALUES (
                p_title, p_description, p_activity_category, p_activity_type, u.id, p_content_id, false, false
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
