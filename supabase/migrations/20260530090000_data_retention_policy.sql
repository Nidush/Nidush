-- Data retention policy:
-- - biometric_readings: 30 days
-- - notifications: 90 days
-- - device_discovery_requests: 30 days
-- - api_content_sync_runs: 180 days
-- - user_consents: kept while the account exists for audit purposes

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.apply_data_retention()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_biometric_deleted integer := 0;
  v_notifications_deleted integer := 0;
  v_device_requests_deleted integer := 0;
  v_api_runs_deleted integer := 0;
BEGIN
  DELETE FROM public.biometric_readings
  WHERE recorded_at < now() - interval '30 days';
  GET DIAGNOSTICS v_biometric_deleted = ROW_COUNT;

  DELETE FROM public.notifications
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_notifications_deleted = ROW_COUNT;

  DELETE FROM public.device_discovery_requests
  WHERE coalesce(completed_at, requested_at, created_at) < now() - interval '30 days';
  GET DIAGNOSTICS v_device_requests_deleted = ROW_COUNT;

  IF to_regclass('public.api_content_sync_runs') IS NOT NULL THEN
    DELETE FROM public.api_content_sync_runs
    WHERE coalesce(finished_at, started_at, created_at) < now() - interval '180 days';
    GET DIAGNOSTICS v_api_runs_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'biometric_readings_deleted', v_biometric_deleted,
    'notifications_deleted', v_notifications_deleted,
    'device_discovery_requests_deleted', v_device_requests_deleted,
    'api_content_sync_runs_deleted', v_api_runs_deleted,
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_data_retention() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_data_retention() FROM anon;
REVOKE ALL ON FUNCTION public.apply_data_retention() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_data_retention() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-data-retention');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'daily-data-retention',
  '15 4 * * *',
  $job$
  SELECT public.apply_data_retention();
  $job$
);

NOTIFY pgrst, 'reload schema';
