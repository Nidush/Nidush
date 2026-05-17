-- Migration: Add avatar_url to handle_new_user trigger
-- Date: 2026-05-14

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_uid, email, first_name, last_name, avatar_url, password_hash)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NEW.encrypted_password   -- bcrypt hash, nunca a password real
  )
  ON CONFLICT (auth_uid) DO UPDATE
    SET email         = EXCLUDED.email,
        first_name    = EXCLUDED.first_name,
        last_name     = EXCLUDED.last_name,
        avatar_url    = EXCLUDED.avatar_url,
        password_hash = EXCLUDED.password_hash;

  RETURN NEW;
END;
$$;