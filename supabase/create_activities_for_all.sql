-- Este script cria uma "Atividade de Casa" para todos os utilizadores que existam na base de dados
-- e que já estejam associados a uma casa (home).

DO $$
DECLARE
    u RECORD;
BEGIN
    -- Percorre todos os utilizadores que pertencem a uma casa
    FOR u IN (SELECT user_id, home_id FROM public.user_homes) LOOP

        -- Insere a nova atividade para cada utilizador e a respetiva casa
        INSERT INTO public.activities (
            title,
            description,
            category,
            type,
            home_id,
            user_id,
            focus_mode_enabled,
            shortcuts
        ) VALUES (
            'Arrumação Semanal da Casa',
            'Atividade automática: Aproveita para organizar o teu espaço e limpar a casa.',
            'Household',
            'other',
            u.home_id,
            u.user_id,
            false,
            false
        );

    END LOOP;
END $$;
