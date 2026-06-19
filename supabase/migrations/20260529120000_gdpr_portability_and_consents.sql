CREATE TABLE IF NOT EXISTS public.user_consents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, consent_type, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id
ON public.user_consents (user_id, accepted_at DESC);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
CREATE POLICY "Users can view their own consents"
ON public.user_consents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own consents" ON public.user_consents;
CREATE POLICY "Users can insert their own consents"
ON public.user_consents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own consents" ON public.user_consents;
CREATE POLICY "Users can update their own consents"
ON public.user_consents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS tr_user_consents_updated_at ON public.user_consents;
CREATE TRIGGER tr_user_consents_updated_at
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.save_user_consent(
  p_consent_type TEXT,
  p_policy_version TEXT,
  p_source TEXT
)
RETURNS public.user_consents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.user_consents;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.user_consents (
    user_id,
    consent_type,
    policy_version,
    accepted_at,
    source
  )
  VALUES (
    v_user_id,
    p_consent_type,
    p_policy_version,
    NOW(),
    p_source
  )
  ON CONFLICT (user_id, consent_type, policy_version)
  DO UPDATE SET
    accepted_at = EXCLUDED.accepted_at,
    source = EXCLUDED.source,
    updated_at = NOW()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_user_consent(TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT auth.uid() AS user_id
  ),
  profile_row AS (
    SELECT
      u.auth_uid,
      u.first_name,
      u.last_name,
      u.email,
      u.avatar_url,
      u.hobbies,
      u.spotify_connected,
      u.created_at,
      u.updated_at
    FROM public.users u
    JOIN me ON me.user_id = u.auth_uid
  ),
  home_rows AS (
    SELECT
      uh.home_id,
      uh.role,
      uh.created_at,
      h.name AS home_name,
      h.join_code
    FROM public.user_homes uh
    LEFT JOIN public.homes h ON h.id = uh.home_id
    JOIN me ON me.user_id = uh.user_id
  )
  SELECT jsonb_build_object(
    'exported_at', NOW(),
    'profile', COALESCE(
      (
        SELECT jsonb_build_object(
          'auth_uid', pr.auth_uid,
          'first_name', pr.first_name,
          'last_name', pr.last_name,
          'email', pr.email,
          'avatar_url', pr.avatar_url,
          'created_at', pr.created_at,
          'updated_at', pr.updated_at
        )
        FROM profile_row pr
      ),
      '{}'::jsonb
    ),
    'activities', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC)
        FROM public.activities a
        JOIN me ON me.user_id = a.user_id
      ),
      '[]'::jsonb
    ),
    'preferences', COALESCE(
      (
        SELECT jsonb_build_object(
          'hobbies', COALESCE(
            to_jsonb(
              array_remove(
                regexp_split_to_array(COALESCE(pr.hobbies, ''), '\s*,\s*'),
                ''
              )
            ),
            '[]'::jsonb
          ),
          'spotify_connected', COALESCE(pr.spotify_connected, false)
        )
        FROM profile_row pr
      ),
      jsonb_build_object(
        'hobbies', '[]'::jsonb,
        'spotify_connected', false
      )
    ),
    'routines', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(r) ORDER BY r.id DESC)
        FROM public.routines r
        JOIN me ON me.user_id = r.user_id
      ),
      '[]'::jsonb
    ),
    'shortcuts', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(s) ORDER BY s.displayorder ASC, s.id ASC)
        FROM public.shortcuts s
        JOIN me ON me.user_id = s.user_id
      ),
      '[]'::jsonb
    ),
    'devices', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(d) ORDER BY d.last_seen DESC NULLS LAST, d.created_at DESC)
        FROM public.devices d
        JOIN me ON me.user_id = d.user_id
      ),
      '[]'::jsonb
    ),
    'biometric_readings', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(b) ORDER BY b.recorded_at DESC, b.created_at DESC)
        FROM public.biometric_readings b
        JOIN me ON me.user_id = b.user_id
      ),
      '[]'::jsonb
    ),
    'notifications', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC)
        FROM public.notifications n
        JOIN me ON me.user_id = n.user_id
      ),
      '[]'::jsonb
    ),
    'home_memberships', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(hm) ORDER BY hm.created_at ASC)
        FROM home_rows hm
      ),
      '[]'::jsonb
    ),
    'consents', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'consent_type', uc.consent_type,
            'policy_version', uc.policy_version,
            'accepted_at', uc.accepted_at,
            'source', uc.source
          )
          ORDER BY uc.accepted_at DESC
        )
        FROM public.user_consents uc
        JOIN me ON me.user_id = uc.user_id
      ),
      '[]'::jsonb
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.export_my_data() TO authenticated;
