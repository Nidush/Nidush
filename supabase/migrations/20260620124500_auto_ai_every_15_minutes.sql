ALTER TABLE public.ai_auto_generated_activities
  ADD COLUMN IF NOT EXISTS scheduled_for_slot timestamptz;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname
  INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.ai_auto_generated_activities'::regclass
    AND contype = 'u'
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.ai_auto_generated_activities'::regclass AND attname = 'user_id'),
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.ai_auto_generated_activities'::regclass AND attname = 'scheduled_for_date'),
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.ai_auto_generated_activities'::regclass AND attname = 'time_bucket')
    ]::smallint[];

  IF constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.ai_auto_generated_activities DROP CONSTRAINT %I',
      constraint_name
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ai_auto_generated_activities_user_slot_idx
  ON public.ai_auto_generated_activities (user_id, scheduled_for_slot)
  WHERE scheduled_for_slot IS NOT NULL;

DO $$
BEGIN
  PERFORM cron.unschedule('auto-generate-activity-suggestions');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'auto-generate-activity-suggestions',
  '*/15 * * * *',
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
