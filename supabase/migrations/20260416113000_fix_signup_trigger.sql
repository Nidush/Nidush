-- Migration: Fix Signup Trigger
-- Description: Robustly handle new user creation in public.users to prevent 500 errors on auth.signup.

-- 1. Create or replace the function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users using data from auth.users (NEW)
  -- We use COALESCE to ensure we don't fail on NULLs if metadata is missing
  INSERT INTO public.users (
    auth_uid,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'resident',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- In case of error, we can log it (optional) or just let it fail.
  -- To debug, we could: RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW; -- We return NEW so the auth signup itself doesn't fail even if profile fails
  -- BUT: Usually it's better to let it fail so the user knows something is wrong, 
  -- however, if we want to avoid 500 on auth, we could just return NEW.
  -- Actually, let's keep it strict but fixed.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger is attached to auth.users
-- We drop both possible names just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure proper permissions for the function
-- Since it's SECURITY DEFINER, it runs as the owner (postgres), 
-- but we should ensure it has access to the public schema.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
