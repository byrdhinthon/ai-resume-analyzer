-- Migration 009: เก็บ error message (ภาษาคน) + อาชีพที่ AI แนะนำ
-- error_message    : เหตุผลที่วิเคราะห์ล้มเหลว เขียนให้ user ทั่วไปเข้าใจ (ไม่ใช่ error code)
-- recommended_career : อาชีพ/ตำแหน่งที่ AI แนะนำจากเรซูเม่ (ใช้ใน Quality Review Mode)

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS recommended_career text;
