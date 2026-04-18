-- Migration: Fix handle_new_user trigger
-- The 'role' column in public.users is redundant and confusing.
-- The REAL role (admin/resident) lives in public.user_homes.
-- This trigger just creates the user profile record; role assignment
-- happens in the app when the user creates or joins a home.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    auth_uid,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_uid) DO NOTHING; -- Safe to re-run; never overwrite existing profiles
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error for uid=%: %', NEW.id, SQLERRM;
  RETURN NEW; -- Don't break auth signup even if profile insert fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
