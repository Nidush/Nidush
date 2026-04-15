-- 1. SETUP DE COLUNAS E TABELAS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'resident';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS home_idhome integer;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_uid uuid;
ALTER TABLE public.activity ADD COLUMN IF NOT EXISTS home_idhome integer;

-- 2. FUNÇÕES DE SEGURANÇA (Anti-Recursão)
CREATE OR REPLACE FUNCTION public.get_auth_home_id() 
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT home_idhome FROM public.users WHERE auth_uid::text = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE auth_uid::text = auth.uid()::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_internal_id() 
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT iduser FROM public.users WHERE auth_uid::text = auth.uid()::text LIMIT 1;
$$;

-- 3. TRIGGERS PARA AUTO-PREENCHIMENTO DE CASA E USER
CREATE OR REPLACE FUNCTION public.fill_metadata_shared() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.home_idhome IS NULL THEN
        NEW.home_idhome := public.get_auth_home_id();
    END IF;
    BEGIN
        NEW.user_iduser := public.get_auth_internal_id();
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_fill_activity_meta ON public.activity;
CREATE TRIGGER tr_fill_activity_meta BEFORE INSERT ON public.activity FOR EACH ROW EXECUTE FUNCTION public.fill_metadata_shared();

DROP TRIGGER IF EXISTS tr_fill_routine_meta ON public.routine;
CREATE TRIGGER tr_fill_routine_meta BEFORE INSERT ON public.routine FOR EACH ROW EXECUTE FUNCTION public.fill_metadata_shared();

-- 4. LIMPAR POLÍTICAS ANTIGAS
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "' || r.tablename || '"';
    END LOOP;
END $$;

-- 5. ATIVAR RLS
ALTER TABLE public.home ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortcut ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wearable ENABLE ROW LEVEL SECURITY;


-- USERS: Ver a si mesmo e à sua casa
CREATE POLICY "policy_users_select" ON public.users FOR SELECT TO authenticated USING (auth_uid::text = auth.uid()::text OR home_idhome::text = public.get_auth_home_id()::text);
CREATE POLICY "policy_users_update" ON public.users FOR UPDATE TO authenticated USING (auth_uid::text = auth.uid()::text);

-- HOME: Ver a sua casa, Admins editam
CREATE POLICY "policy_home_select" ON public.home FOR SELECT TO authenticated USING (idhome::text = public.get_auth_home_id()::text);
CREATE POLICY "policy_home_admin" ON public.home FOR UPDATE TO authenticated USING (idhome::text = public.get_auth_home_id()::text AND public.get_auth_role()::text = 'admin');

-- ROOMS: Ver da casa, Admins gerem
CREATE POLICY "policy_rooms_select" ON public.rooms FOR SELECT TO authenticated USING (home_idhome::text = public.get_auth_home_id()::text);
CREATE POLICY "policy_rooms_admin" ON public.rooms FOR ALL TO authenticated USING (home_idhome::text = public.get_auth_home_id()::text AND public.get_auth_role()::text = 'admin');

-- CONTENT: Aberto
CREATE POLICY "policy_content_read" ON public.content FOR SELECT TO authenticated USING (true);

-- SCENARIO: Ver da casa
CREATE POLICY "policy_scenario_select" ON public.scenario FOR SELECT TO authenticated USING (rooms_idrooms::text IN (SELECT idrooms::text FROM public.rooms WHERE home_idhome::text = public.get_auth_home_id()::text));

-- ROTINAS E ATIVIDADES: Partilhadas na casa OU criadas por mim (usando ID interno)
CREATE POLICY "policy_routine_all" ON public.routine FOR ALL TO authenticated USING (home_idhome::text = public.get_auth_home_id()::text OR user_iduser::text = public.get_auth_internal_id()::text);
CREATE POLICY "policy_activity_all" ON public.activity FOR ALL TO authenticated USING (home_idhome::text = public.get_auth_home_id()::text OR user_iduser::text = public.get_auth_internal_id()::text);

-- SHORTCUTS E WEARABLES: Pessoais
CREATE POLICY "policy_shortcut_me" ON public.shortcut FOR ALL TO authenticated USING (user_iduser::text = public.get_auth_internal_id()::text);
CREATE POLICY "policy_wearable_me" ON public.wearable FOR ALL TO authenticated USING (user_iduser::text = public.get_auth_internal_id()::text);

-- 7. REPARAR DADOS ÓRFÃOS 
UPDATE public.routine r SET home_idhome = u.home_idhome FROM public.users u WHERE r.user_iduser::text = u.iduser::text AND r.home_idhome IS NULL;
UPDATE public.activity a SET home_idhome = u.home_idhome FROM public.users u WHERE a.user_iduser::text = u.iduser::text AND a.home_idhome IS NULL;
