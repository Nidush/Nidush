-- ========================================================
-- NIDUSH MASTER SETUP (ULTRA-ROBUST)
-- ========================================================

-- 1. UTILS
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    first_name character varying,
    last_name character varying,
    email character varying,
    password character varying,
    auth_uid uuid UNIQUE,
    avatar_url text,
    hobbies text,
    role text DEFAULT 'resident' CHECK (role IN ('admin', 'resident')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homes (
    id SERIAL PRIMARY KEY,
    name character varying NOT NULL,
    join_code text UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_homes (
    user_id UUID NOT NULL REFERENCES public.users(auth_uid) ON DELETE CASCADE,
    home_id INTEGER NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'resident',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, home_id)
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id SERIAL PRIMARY KEY,
    name character varying NOT NULL,
    home_id INTEGER REFERENCES public.homes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contents (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text,
    type text,
    category text,
    duration text,
    image text,
    instructions jsonb,
    ingredients jsonb,
    video_url text,
    author text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scenarios (
    id SERIAL PRIMARY KEY,
    name character varying NOT NULL,
    room_id INTEGER REFERENCES public.rooms(id) ON DELETE CASCADE,
    playlist_id character varying,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activities (
    id SERIAL PRIMARY KEY,
    title character varying NOT NULL,
    description character varying,
    category character varying,
    type character varying,
    image text,
    scenario_id integer REFERENCES public.scenarios(id) ON DELETE SET NULL,
    content_id text REFERENCES public.contents(id) ON DELETE SET NULL,
    focus_mode_enabled boolean DEFAULT false,
    shortcuts boolean DEFAULT false,
    home_id INTEGER REFERENCES public.homes(id) ON DELETE CASCADE,
    user_id uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.routines (
    id SERIAL PRIMARY KEY,
    name character varying NOT NULL,
    execution_time time without time zone,
    days_of_week character varying,
    is_active boolean DEFAULT true,
    scenario_id INTEGER REFERENCES public.scenarios(id) ON DELETE CASCADE,
    home_id INTEGER REFERENCES public.homes(id) ON DELETE CASCADE,
    user_id uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NORMALIZATION LOOP (Using EXECUTE to avoid parsing errors)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='iduser') THEN 
        EXECUTE 'ALTER TABLE public.users RENAME COLUMN iduser TO id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='homes' AND column_name='idhome') THEN 
        EXECUTE 'ALTER TABLE public.homes RENAME COLUMN idhome TO id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rooms' AND column_name='idrooms') THEN 
        EXECUTE 'ALTER TABLE public.rooms RENAME COLUMN idrooms TO id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rooms' AND column_name='home_idhome') THEN 
        EXECUTE 'ALTER TABLE public.rooms RENAME COLUMN home_idhome TO home_id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contents' AND column_name='idcontent') THEN 
        EXECUTE 'ALTER TABLE public.contents RENAME COLUMN idcontent TO id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='scenarios' AND column_name='idscenario') THEN 
        EXECUTE 'ALTER TABLE public.scenarios RENAME COLUMN idscenario TO id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='scenarios' AND column_name='rooms_idrooms') THEN 
        EXECUTE 'ALTER TABLE public.scenarios RENAME COLUMN rooms_idrooms TO room_id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activities' AND column_name='contentid') THEN 
        EXECUTE 'ALTER TABLE public.activities RENAME COLUMN contentid TO content_id'; 
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activities' AND column_name='scenarioid') THEN 
        EXECUTE 'ALTER TABLE public.activities RENAME COLUMN scenarioid TO scenario_id'; 
    END IF;
END $$;

-- 4. SECURITY HELPERS
CREATE OR REPLACE FUNCTION public.is_member(h_id integer) 
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_homes WHERE user_id = auth.uid() AND home_id = h_id);
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_users_select" ON public.users;
CREATE POLICY "p_users_select" ON public.users FOR SELECT TO authenticated USING (auth_uid = auth.uid() OR auth_uid IN (SELECT user_id FROM public.user_homes WHERE home_id IN (SELECT home_id FROM public.user_homes WHERE user_id = auth.uid())));

ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_homes_select" ON public.homes;
CREATE POLICY "p_homes_select" ON public.homes FOR SELECT TO authenticated USING (public.is_member(id));
DROP POLICY IF EXISTS "p_homes_insert" ON public.homes;
CREATE POLICY "p_homes_insert" ON public.homes FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.user_homes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "p_user_homes_all" ON public.user_homes;
CREATE POLICY "p_user_homes_all" ON public.user_homes FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_member(home_id));

-- 5. AUDIT TRIGGERS
DO $$
DECLARE t text;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'homes', 'rooms', 'activities', 'routines'))
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER tr_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);
    END LOOP;
END $$;
