-- Re-apply the join-code RPC with a fresh migration version.
-- Supabase does not re-run an already-applied migration after the file changes.
CREATE OR REPLACE FUNCTION public.join_home_by_code(p_join_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_home_id integer;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT h.id
  INTO v_home_id
  FROM public.homes h
  WHERE upper(trim(h.join_code)) = upper(trim(p_join_code))
  LIMIT 1;

  IF v_home_id IS NULL THEN
    RAISE EXCEPTION 'Join code not found' USING ERRCODE = 'P0002';
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

NOTIFY pgrst, 'reload schema';
