CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.ai_auto_generation_runs (
  id bigserial PRIMARY KEY,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  users_processed integer NOT NULL DEFAULT 0,
  generated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_auto_generation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_auto_generation_runs_service_only" ON public.ai_auto_generation_runs;
CREATE POLICY "ai_auto_generation_runs_service_only"
ON public.ai_auto_generation_runs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.ai_auto_generated_activities (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(auth_uid) ON DELETE CASCADE,
  home_id integer NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  routine_id integer REFERENCES public.routines(id) ON DELETE SET NULL,
  scenario_id integer REFERENCES public.scenarios(id) ON DELETE SET NULL,
  activity_id integer REFERENCES public.activities(id) ON DELETE SET NULL,
  content_id text REFERENCES public.contents(id) ON DELETE SET NULL,
  scheduled_for_date date NOT NULL,
  time_bucket text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scheduled_for_date, time_bucket)
);

ALTER TABLE public.ai_auto_generated_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_auto_generated_activities_service_only" ON public.ai_auto_generated_activities;
CREATE POLICY "ai_auto_generated_activities_service_only"
ON public.ai_auto_generated_activities
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS ai_auto_generated_activities_user_date_idx
  ON public.ai_auto_generated_activities (user_id, scheduled_for_date DESC, created_at DESC);

DO $$
BEGIN
  PERFORM cron.unschedule('auto-generate-activity-suggestions');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'auto-generate-activity-suggestions',
  '15 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://jawmnnwdxfoiirzsyobv.supabase.co/functions/v1/auto-generate-activity-suggestions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce(current_setting('app.settings.auto_ai_generation_secret', true), '')
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'scheduled_at', now()
    )
  ) AS request_id;
  $job$
);

NOTIFY pgrst, 'reload schema';
