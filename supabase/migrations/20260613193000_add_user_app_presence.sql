ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_app_active_at timestamptz;

CREATE INDEX IF NOT EXISTS users_last_app_active_at_idx
  ON public.users (last_app_active_at DESC);

NOTIFY pgrst, 'reload schema';
