ALTER TABLE public.scenarios
  ADD COLUMN IF NOT EXISTS devices jsonb NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
