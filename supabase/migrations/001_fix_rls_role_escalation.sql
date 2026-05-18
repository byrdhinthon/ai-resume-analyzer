-- Commit 1: fix/rls-role-escalation
-- Fix critical RLS vulnerability: prevent users from escalating their own role
-- Date: 2026-05-18

-- 1. Update CHECK constraint to allow 'professor' role (needed for Commit 2)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'admin', 'professor'));

-- 2. Fix INSERT policy: force new profiles to have role='member'
--    Prevents users from signing up as admin/professor
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'member');

-- 3. Fix UPDATE policy: prevent users from changing their own role
--    The WITH CHECK ensures role must equal current role (subquery)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid()));
