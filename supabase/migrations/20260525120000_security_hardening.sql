-- Security hardening:
-- - stop storing Spotify tokens in public.users
-- - restrict home creation/join flows to explicit, authorized paths
-- - tighten avatar storage writes to per-user folders

ALTER TABLE public.homes
  ADD COLUMN IF NOT EXISTS creator_user_id uuid REFERENCES public.users(auth_uid) ON DELETE SET NULL;

UPDATE public.homes h
SET creator_user_id = admin_assoc.user_id
FROM (
  SELECT DISTINCT ON (uh.home_id)
    uh.home_id,
    uh.user_id
  FROM public.user_homes uh
  ORDER BY uh.home_id, CASE WHEN uh.role = 'admin' THEN 0 ELSE 1 END, uh.created_at
) AS admin_assoc
WHERE h.id = admin_assoc.home_id
  AND h.creator_user_id IS NULL;

ALTER TABLE public.user_homes
  DROP CONSTRAINT IF EXISTS user_homes_role_check;

ALTER TABLE public.user_homes
  ADD CONSTRAINT user_homes_role_check
  CHECK (role IN ('admin', 'resident'));

DROP POLICY IF EXISTS "p_homes_insert" ON public.homes;
CREATE POLICY "p_homes_insert"
ON public.homes
FOR INSERT
TO authenticated
WITH CHECK (
  creator_user_id = auth.uid()
);

DROP POLICY IF EXISTS "p_user_homes_insert" ON public.user_homes;
CREATE POLICY "p_user_homes_insert"
ON public.user_homes
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'
  AND EXISTS (
    SELECT 1
    FROM public.homes h
    WHERE h.id = home_id
      AND h.creator_user_id = auth.uid()
  )
);

UPDATE public.users
SET
  spotify_token = NULL,
  spotify_refresh_token = NULL
WHERE spotify_token IS NOT NULL
   OR spotify_refresh_token IS NOT NULL;

ALTER TABLE public.users DROP COLUMN IF EXISTS spotify_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS spotify_refresh_token;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

NOTIFY pgrst, 'reload schema';
