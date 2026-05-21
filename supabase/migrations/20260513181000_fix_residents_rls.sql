-- Allow residents to see every profile linked to their home.
-- The previous user_homes policy could collapse to only the current user's row.

CREATE OR REPLACE FUNCTION public.current_user_home_ids()
RETURNS TABLE(home_id integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT uh.home_id
  FROM public.user_homes uh
  WHERE uh.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_member(h_id integer)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_homes uh
    WHERE uh.user_id = auth.uid()
      AND uh.home_id = h_id
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_home_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_home_ids() TO authenticated;

REVOKE ALL ON FUNCTION public.is_member(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member(integer) TO authenticated;

ALTER TABLE public.user_homes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "p_user_homes_all" ON public.user_homes;
DROP POLICY IF EXISTS "p_user_homes_select" ON public.user_homes;
DROP POLICY IF EXISTS "p_user_homes_insert" ON public.user_homes;

CREATE POLICY "p_user_homes_select"
ON public.user_homes
FOR SELECT
TO authenticated
USING (
  home_id IN (
    SELECT homes_for_user.home_id
    FROM public.current_user_home_ids() AS homes_for_user
  )
);

CREATE POLICY "p_user_homes_insert"
ON public.user_homes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "p_users_select" ON public.users;

CREATE POLICY "p_users_select"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth_uid = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.user_homes uh
    WHERE uh.user_id = public.users.auth_uid
      AND uh.home_id IN (
        SELECT homes_for_user.home_id
        FROM public.current_user_home_ids() AS homes_for_user
      )
  )
);

NOTIFY pgrst, 'reload schema';
