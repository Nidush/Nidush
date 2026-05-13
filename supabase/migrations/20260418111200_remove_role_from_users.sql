-- Migration: Remove role column from public.users
-- 
-- The role (admin/resident) belongs ONLY in public.user_homes.
-- Having 'role' in both tables causes confusion:
--   • The trigger sets DEFAULT 'resident' on signup (before onboarding)
--   • The real role is assigned in user_homes AFTER onboarding
--
-- Solution: drop 'role' from users entirely.
-- All role checks must use: SELECT role FROM user_homes WHERE user_id = auth.uid()

ALTER TABLE public.users DROP COLUMN IF EXISTS role;
