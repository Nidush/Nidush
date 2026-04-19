-- Migration: Sprint 4 Business Rules & Security
-- Description: Adds CHECK constraints, stricter RLS policies, and triggers for validation.

-- 1. DATABASE VALIDATIONS (INTEGRITY)

-- Garantir que o tipo de atividade é um dos permitidos
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS check_activity_type;

-- LIMPEZA: Mudar tipos existentes que não batem com a nova lista para 'other'
UPDATE public.activities 
SET type = 'other' 
WHERE type NOT IN ('Cooking', 'Audiobooks', 'Meditation', 'Workout', 'Yoga', 'Reading', 'other') 
   OR type IS NULL;

ALTER TABLE public.activities
ADD CONSTRAINT check_activity_type 
CHECK (type IN ('Cooking', 'Audiobooks', 'Meditation', 'Workout', 'Yoga', 'Reading', 'other'));

-- Garantir que os dias da semana na rotina seguem um padrão (ex: Mon,Tue...) ou são nulos
ALTER TABLE public.routines
DROP CONSTRAINT IF EXISTS check_days_format;

-- CORREÇÃO: Adicionar coluna updated_at que estava em falta para evitar erro no trigger
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- LIMPEZA: Se o formato não for o correto (3 letras separadas por vírgula), pomos a NULL para não dar erro
UPDATE public.routines 
SET days_of_week = NULL 
WHERE days_of_week !~* '^([a-zA-Z]{3},?)*$';

ALTER TABLE public.routines
ADD CONSTRAINT check_days_format
CHECK (days_of_week ~* '^([a-zA-Z]{3},?)*$' OR days_of_week IS NULL);

-- 2. ENHANCED SECURITY (ROW LEVEL SECURITY)

-- Atividades: Apenas o criador ou membros da mesma casa podem ver
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activities access policy" ON public.activities;
CREATE POLICY "Activities access policy" ON public.activities
FOR ALL TO authenticated
USING (
    user_id = auth.uid() 
    OR home_id IN (SELECT home_id FROM public.user_homes WHERE user_id = auth.uid())
);

-- Rotinas: Apenas membros da casa podem gerir
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Routines access policy" ON public.routines;
CREATE POLICY "Routines access policy" ON public.routines
FOR ALL TO authenticated
USING (
    home_id IN (SELECT home_id FROM public.user_homes WHERE user_id = auth.uid())
);

-- Rooms & Devices: Acesso restrito aos residentes da casa
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Rooms members access" ON public.rooms;
CREATE POLICY "Rooms members access" ON public.rooms
FOR SELECT TO authenticated
USING (public.is_member(home_id));

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Devices members access" ON public.devices;
CREATE POLICY "Devices members access" ON public.devices
FOR ALL TO authenticated
USING (room_id IN (SELECT id FROM public.rooms WHERE public.is_member(home_id)));

-- 3. AUTOMATIC VALIDATION TRIGGERS

-- Trigger para garantir que ao criar uma atividade, o home_id é preenchido automaticamente 
-- a partir do perfil do utilizador se não for enviado
CREATE OR REPLACE FUNCTION public.set_default_home_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.home_id IS NULL THEN
    SELECT home_id INTO NEW.home_id FROM public.user_homes WHERE user_id = auth.uid() LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_set_activity_home ON public.activities;
CREATE TRIGGER tr_set_activity_home
BEFORE INSERT ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.set_default_home_id();
