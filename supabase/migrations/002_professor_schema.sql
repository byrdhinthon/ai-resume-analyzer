-- Commit 2: feat/db-professor-schema
-- Add professor-related schema changes and RLS policies
-- Date: 2026-05-18

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- 2. Professor can read ALL analyses (not just their own)
CREATE POLICY "Professors can read all analyses" ON analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'professor'
    )
  );

-- 3. All authenticated users can read active job positions
CREATE POLICY "Authenticated users can read active job_positions" ON job_positions
  FOR SELECT
  USING (
    auth.role() = 'authenticated'::text
    AND active = true
  );

-- 4. Professor can read all resume files in storage
CREATE POLICY "Professors can read all resumes" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'professor'
    )
  );
