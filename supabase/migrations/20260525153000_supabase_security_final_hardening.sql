-- Final Supabase security hardening:
-- - move local device sync tokens out of the member-readable homes table
-- - block users from joining multiple homes through direct inserts/RPCs
-- - force device discovery writes to happen only through trusted Edge Functions

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.home_device_secrets (
  home_id integer PRIMARY KEY REFERENCES public.homes(id) ON DELETE CASCADE,
  device_sync_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_device_secrets ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS home_device_secrets_device_sync_token_idx
  ON public.home_device_secrets (device_sync_token);

INSERT INTO public.home_device_secrets (home_id, device_sync_token)
SELECT h.id, coalesce(h.device_sync_token, gen_random_uuid())
FROM public.homes h
ON CONFLICT (home_id) DO UPDATE
SET device_sync_token = coalesce(public.home_device_secrets.device_sync_token, EXCLUDED.device_sync_token);

DROP TRIGGER IF EXISTS tr_home_device_secrets_updated_at ON public.home_device_secrets;
CREATE TRIGGER tr_home_device_secrets_updated_at
BEFORE UPDATE ON public.home_device_secrets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.ensure_home_device_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.home_device_secrets (home_id)
  VALUES (NEW.id)
  ON CONFLICT (home_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_home_device_secret() FROM PUBLIC;

DROP TRIGGER IF EXISTS tr_homes_ensure_device_secret ON public.homes;
CREATE TRIGGER tr_homes_ensure_device_secret
AFTER INSERT ON public.homes
FOR EACH ROW EXECUTE FUNCTION public.ensure_home_device_secret();

REVOKE ALL ON public.home_device_secrets FROM PUBLIC;
REVOKE ALL ON public.home_device_secrets FROM anon;
REVOKE ALL ON public.home_device_secrets FROM authenticated;
GRANT ALL ON public.home_device_secrets TO service_role;

DROP INDEX IF EXISTS homes_device_sync_token_idx;
ALTER TABLE public.homes DROP COLUMN IF EXISTS device_sync_token;

CREATE OR REPLACE FUNCTION public.prevent_multi_home_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.user_homes uh
    WHERE uh.user_id = NEW.user_id
      AND uh.home_id <> NEW.home_id
  ) THEN
    RAISE EXCEPTION 'Users may only belong to one home'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_multi_home_membership() FROM PUBLIC;

DROP TRIGGER IF EXISTS tr_user_homes_single_home ON public.user_homes;
CREATE TRIGGER tr_user_homes_single_home
BEFORE INSERT OR UPDATE ON public.user_homes
FOR EACH ROW EXECUTE FUNCTION public.prevent_multi_home_membership();

CREATE OR REPLACE FUNCTION public.join_home_by_code(p_join_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_home_id integer;
  v_user_id uuid := auth.uid();
  v_existing_home_id integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF coalesce(trim(p_join_code), '') = '' THEN
    RAISE EXCEPTION 'Join code not provided' USING ERRCODE = '22023';
  END IF;

  SELECT uh.home_id
  INTO v_existing_home_id
  FROM public.user_homes uh
  WHERE uh.user_id = v_user_id
  ORDER BY uh.created_at ASC
  LIMIT 1;

  SELECT h.id
  INTO v_home_id
  FROM public.homes h
  WHERE upper(trim(h.join_code)) = upper(trim(p_join_code))
  LIMIT 1;

  IF v_home_id IS NULL THEN
    RAISE EXCEPTION 'Join code not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_existing_home_id IS NOT NULL AND v_existing_home_id <> v_home_id THEN
    RAISE EXCEPTION 'User is already linked to a different home' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.users (auth_uid, email, first_name, last_name)
  SELECT
    au.id,
    COALESCE(au.email, ''),
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', '')
  FROM auth.users au
  WHERE au.id = v_user_id
  ON CONFLICT (auth_uid) DO UPDATE
    SET
      email = COALESCE(NULLIF(public.users.email, ''), EXCLUDED.email, ''),
      first_name = COALESCE(NULLIF(public.users.first_name, ''), EXCLUDED.first_name, ''),
      last_name = COALESCE(NULLIF(public.users.last_name, ''), EXCLUDED.last_name, ''),
      updated_at = now();

  INSERT INTO public.user_homes (user_id, home_id, role)
  VALUES (v_user_id, v_home_id, 'resident')
  ON CONFLICT (user_id, home_id) DO UPDATE
    SET updated_at = now();

  RETURN v_home_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_home_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_home_by_code(text) TO authenticated;

DROP POLICY IF EXISTS "p_device_discovery_requests_insert" ON public.device_discovery_requests;
DROP POLICY IF EXISTS "p_device_discovery_requests_update" ON public.device_discovery_requests;

NOTIFY pgrst, 'reload schema';
