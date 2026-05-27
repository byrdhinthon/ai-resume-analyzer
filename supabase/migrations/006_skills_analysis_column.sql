-- Migration 006: เก็บ skills_analysis จาก AI ลง analyses table
-- ไว้แสดงผลบน UI ภายหลัง (matched / missing / irrelevant skills)

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS skills_analysis jsonb;
