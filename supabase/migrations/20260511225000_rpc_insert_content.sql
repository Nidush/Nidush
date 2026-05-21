CREATE OR REPLACE FUNCTION public.seed_api_content(
    p_content_id text,
    p_title text,
    p_description text,
    p_category text,
    p_type text,
    p_image text,
    p_instructions jsonb,
    p_ingredients jsonb,
    p_author text
) RETURNS void AS $$
BEGIN
    -- Insere apenas o conteúdo (disponível para todos escolherem no Passo 2)
    -- O 'SECURITY DEFINER' ignora o bloqueio do RLS!
    INSERT INTO public.contents (
        id, title, description, category, type, image, instructions, ingredients, author
    ) VALUES (
        p_content_id, p_title, p_description, p_category, p_type, p_image, p_instructions, p_ingredients, p_author
    ) ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
