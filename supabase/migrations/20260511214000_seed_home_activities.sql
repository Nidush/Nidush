-- Migration: Seed initial home activity for all users
-- Description: Creates a default "Arrumação Semanal da Casa" activity for every user that is part of a home.

DO $$ 
DECLARE
    u RECORD;
    v_content_id text;
BEGIN
    -- Cria um conteúdo genérico para associar às atividades de casa
    v_content_id := 'home_cleaning_content_001';
    
    IF NOT EXISTS (SELECT 1 FROM public.contents WHERE id = v_content_id) THEN
        INSERT INTO public.contents (
            id,
            title,
            description,
            type,
            category,
            author
        ) VALUES (
            v_content_id,
            'Arrumação Semanal da Casa',
            'Atividade automática: Aproveita para organizar o teu espaço e limpar a casa.',
            'other',
            'Household',
            'Nidush System'
        );
    END IF;

    -- Percorre todos os utilizadores que pertencem a uma casa
    FOR u IN (SELECT user_id, home_id FROM public.user_homes) LOOP
        
        -- Evita duplicar caso a migration já tenha sido corrida para o user
        IF NOT EXISTS (SELECT 1 FROM public.activities WHERE user_id = u.user_id AND content_id = v_content_id) THEN
            -- Insere a nova atividade
            INSERT INTO public.activities (
                title, 
                description, 
                category, 
                type, 
                home_id, 
                user_id,
                content_id,
                focus_mode_enabled,
                shortcuts
            ) VALUES (
                'Arrumação Semanal da Casa', 
                'Atividade automática: Aproveita para organizar o teu espaço e limpar a casa.', 
                'Household', 
                'other', 
                u.home_id, 
                u.user_id,
                v_content_id,
                false,
                false
            );
        END IF;
        
    END LOOP;
END $$;
