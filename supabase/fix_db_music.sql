-- SCRIP PARA CORRIGIR AS MÚSICAS NO SUPABASE
-- ✅ Copia este código e cola no SQL Editor do teu Supabase

-- 1. Adicionar colunas de música à tabela de atividades
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS scenario_id INTEGER;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS playlist_id TEXT;

-- 2. Criar a tabela de cenários (se não existir)
CREATE TABLE IF NOT EXISTS public.scenarios (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    playlist_id TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir os cenários padrão do Nidush
INSERT INTO public.scenarios (id, name, playlist_id)
VALUES 
(1, 'Desert Lo-fi', '37i9dQZF1DXdbChS9879u9'),
(2, 'Gym Energy', '37i9dQZF1DX76W9kuv1Z0g'),
(3, 'Zen Garden', '37i9dQZF1DWZ0XmS6AnY9s')
ON CONFLICT (id) DO UPDATE SET playlist_id = EXCLUDED.playlist_id;

-- 4. Abrir permissões de leitura
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for all users" ON public.scenarios;
CREATE POLICY "Allow read for all users" ON public.scenarios FOR SELECT USING (true);
