-- Migration: Fix User Policies
-- Description: Adds missing INSERT policy to public.users to allow profile creation during onboarding.

-- 1. ADD INSERT POLICY FOR USERS
-- This allows authenticated users to create their own profile record.
DROP POLICY IF EXISTS "p_users_insert" ON public.users;
CREATE POLICY "p_users_insert" ON public.users 
FOR INSERT TO authenticated 
WITH CHECK (auth_uid = auth.uid());

-- 2. RE-CHECK UPDATE POLICY
-- Ensuring users can update their own data.
DROP POLICY IF EXISTS "allow_me_to_update_myself" ON public.users;
CREATE POLICY "allow_me_to_update_myself" ON public.users 
FOR UPDATE TO authenticated 
USING (auth_uid = auth.uid()) 
WITH CHECK (auth_uid = auth.uid());

-- 3. ENSURE USER_HOMES HAS FULL ACCESS
-- Users must be able to insert their own association.
DROP POLICY IF EXISTS "p_user_homes_insert" ON public.user_homes;
CREATE POLICY "p_user_homes_insert" ON public.user_homes 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());
