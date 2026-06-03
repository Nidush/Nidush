CREATE TABLE IF NOT EXISTS public.ai_generation_requests (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.users(auth_uid) ON DELETE CASCADE,
  home_id integer REFERENCES public.homes(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'app',
  request_action text NOT NULL DEFAULT 'generate',
  model_requested text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generation_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ai_generation_requests_user_created_at_idx
  ON public.ai_generation_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_generation_requests_home_created_at_idx
  ON public.ai_generation_requests (home_id, created_at DESC);

NOTIFY pgrst, 'reload schema';
