-- Migration 004: เพิ่ม required_skills + nice_to_have + responsibilities ใน job_positions
-- เป้าหมาย: ให้ระบบรู้ว่าตำแหน่งแต่ละตำแหน่งต้องการทักษะอะไรบ้าง
--          แทนที่จะให้ AI เดาเองจากชื่อตำแหน่ง

ALTER TABLE public.job_positions
  ADD COLUMN IF NOT EXISTS required_skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS nice_to_have jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS responsibilities text;
