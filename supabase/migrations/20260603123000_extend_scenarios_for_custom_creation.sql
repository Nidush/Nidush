ALTER TABLE public.scenarios
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS playlist_name text,
  ADD COLUMN IF NOT EXISTS focus_mode_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shortcuts boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
