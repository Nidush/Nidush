-- 1. Permissão de Inserção em Homes (Essencial para criar casa)
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_homes_insert" ON public.homes;
CREATE POLICY "p_homes_insert" ON public.homes FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Permissão de Inserção em User_Homes (Essencial para ligar user à casa)
ALTER TABLE public.user_homes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_user_homes_insert" ON public.user_homes;
CREATE POLICY "p_user_homes_insert" ON public.user_homes FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Permissão de Update em Users (Para gravar o perfil)
DROP POLICY IF EXISTS "allow_me_to_update_myself" ON public.users;
CREATE POLICY "allow_me_to_update_myself" ON public.users FOR UPDATE TO authenticated USING (auth_uid::text = auth.uid()::text) WITH CHECK (auth_uid::text = auth.uid()::text);
