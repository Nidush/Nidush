CREATE OR REPLACE FUNCTION public.register_user_push_token(
  p_expo_push_token text,
  p_platform text,
  p_last_seen_at timestamptz DEFAULT now()
)
RETURNS public.user_push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.user_push_tokens;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_expo_push_token IS NULL OR btrim(p_expo_push_token) = '' THEN
    RAISE EXCEPTION 'Push token is required';
  END IF;

  IF p_platform IS NULL OR btrim(p_platform) = '' THEN
    RAISE EXCEPTION 'Platform is required';
  END IF;

  INSERT INTO public.user_push_tokens (
    user_id,
    expo_push_token,
    platform,
    last_seen_at
  )
  VALUES (
    v_user_id,
    btrim(p_expo_push_token),
    btrim(p_platform),
    COALESCE(p_last_seen_at, now())
  )
  ON CONFLICT (expo_push_token)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    platform = EXCLUDED.platform,
    last_seen_at = EXCLUDED.last_seen_at,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.register_user_push_token(text, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_user_push_token(text, text, timestamptz) TO authenticated;
