-- Commit: fix/criteria-professor-rls-silent-save
-- Allow professor (+ admin) to UPDATE scoring_criteria.
-- Date: 2026-06-11
--
-- Bug: the /professor/criteria page was opened to professors on the FRONTEND
-- (src/app/admin/criteria/page.js), but scoring_criteria RLS only allowed admin to
-- UPDATE. A professor's UPDATE matched 0 rows under RLS and returned NO error, so the
-- UI showed "บันทึกสำเร็จ" while nothing was written (updated_at stayed unchanged).
--
-- This policy is additive (permissive policies are OR'd) — any existing admin UPDATE
-- policy keeps working; professors gain UPDATE access too.

DROP POLICY IF EXISTS "Professors and admins can update scoring_criteria" ON public.scoring_criteria;
CREATE POLICY "Professors and admins can update scoring_criteria" ON public.scoring_criteria
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('professor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('professor', 'admin')
    )
  );
