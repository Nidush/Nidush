CREATE TABLE IF NOT EXISTS public.device_discovery_requests (
  id bigserial PRIMARY KEY,
  home_id integer NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES public.users(auth_uid) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  result jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_discovery_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "p_device_discovery_requests_select" ON public.device_discovery_requests;
CREATE POLICY "p_device_discovery_requests_select"
ON public.device_discovery_requests
FOR SELECT
TO authenticated
USING (public.is_member(home_id));

DROP POLICY IF EXISTS "p_device_discovery_requests_insert" ON public.device_discovery_requests;
CREATE POLICY "p_device_discovery_requests_insert"
ON public.device_discovery_requests
FOR INSERT
TO authenticated
WITH CHECK (public.is_member(home_id));

DROP POLICY IF EXISTS "p_device_discovery_requests_update" ON public.device_discovery_requests;
CREATE POLICY "p_device_discovery_requests_update"
ON public.device_discovery_requests
FOR UPDATE
TO authenticated
USING (public.is_member(home_id))
WITH CHECK (public.is_member(home_id));

CREATE INDEX IF NOT EXISTS device_discovery_requests_home_status_idx
  ON public.device_discovery_requests (home_id, status, requested_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS device_discovery_requests_one_open_per_home_idx
  ON public.device_discovery_requests (home_id)
  WHERE status IN ('pending', 'running');

DROP TRIGGER IF EXISTS tr_device_discovery_requests_updated_at ON public.device_discovery_requests;
CREATE TRIGGER tr_device_discovery_requests_updated_at
BEFORE UPDATE ON public.device_discovery_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

NOTIFY pgrst, 'reload schema';
