-- Migration 008: Quality Review Mode (สำหรับอาจารย์ตรวจ batch แบบไม่ต้องเลือกตำแหน่ง)
-- Mode 'quality' = ตรวจคุณภาพการเขียนเรซูเม่ ไม่สนสายงาน → ใช้ pass_threshold ตัดสินผ่าน/ไม่ผ่าน
-- Mode 'per-position' (default) = ของเดิม ต้องเลือกตำแหน่ง

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS evaluation_mode text DEFAULT 'per-position'
    CHECK (evaluation_mode IN ('per-position', 'quality')),
  ADD COLUMN IF NOT EXISTS pass_threshold int;

-- pass_threshold: null สำหรับ per-position mode, 0-100 สำหรับ quality mode
-- (อนาคตอาจารย์เปลี่ยน threshold ต่อ batch ได้)
