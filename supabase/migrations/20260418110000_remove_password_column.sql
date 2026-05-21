-- Migration: Remove password column from public.users
-- Passwords are managed exclusively by Supabase Auth (auth.users).
-- They must NEVER be stored in the public schema.

ALTER TABLE public.users DROP COLUMN IF EXISTS password;
