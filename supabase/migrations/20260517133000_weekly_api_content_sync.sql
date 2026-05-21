-- Weekly API content sync.
-- pg_cron triggers the Edge Function every Monday at 03:00 UTC.
-- The function upserts into public.contents using stable API IDs, so reruns update
-- existing records and only insert genuinely new API records.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.api_content_sync_runs (
  id bigserial PRIMARY KEY,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_content_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_content_sync_runs_service_only" ON public.api_content_sync_runs;
CREATE POLICY "api_content_sync_runs_service_only"
ON public.api_content_sync_runs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  PERFORM cron.unschedule('weekly-api-content-sync');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'weekly-api-content-sync',
  '0 3 * * 1',
  $job$
  SELECT net.http_post(
    url := 'https://jawmnnwdxfoiirzsyobv.supabase.co/functions/v1/weekly-api-content-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce(current_setting('app.settings.api_content_sync_secret', true), '')
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'scheduled_at', now()
    )
  ) AS request_id;
  $job$
);
