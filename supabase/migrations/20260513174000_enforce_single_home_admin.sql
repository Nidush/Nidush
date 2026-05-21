-- A home can have many users, but only one admin.
-- Existing duplicate admins are demoted to residents, keeping the oldest admin.

UPDATE public.user_homes
SET role = 'resident',
    updated_at = now()
WHERE role IS NULL
   OR role NOT IN ('admin', 'resident');

WITH ranked_admins AS (
  SELECT
    user_id,
    home_id,
    row_number() OVER (
      PARTITION BY home_id
      ORDER BY created_at ASC, user_id ASC
    ) AS admin_rank
  FROM public.user_homes
  WHERE role = 'admin'
)
UPDATE public.user_homes uh
SET role = 'resident',
    updated_at = now()
FROM ranked_admins ra
WHERE uh.user_id = ra.user_id
  AND uh.home_id = ra.home_id
  AND ra.admin_rank > 1;

ALTER TABLE public.user_homes
  ALTER COLUMN role SET DEFAULT 'resident';

ALTER TABLE public.user_homes
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE public.user_homes
  DROP CONSTRAINT IF EXISTS user_homes_role_check;

ALTER TABLE public.user_homes
  ADD CONSTRAINT user_homes_role_check
  CHECK (role IN ('admin', 'resident'));

CREATE UNIQUE INDEX IF NOT EXISTS user_homes_one_admin_per_home_idx
  ON public.user_homes (home_id)
  WHERE role = 'admin';
