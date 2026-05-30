'use client'
// professor เข้าจัดการเกณฑ์ประเมินได้ — re-use หน้าเดียวกับ admin
// (component เช็ค pathname เอง → requiredRole = 'professor' เมื่ออยู่ใต้ /professor)
import CriteriaPage from '@/app/admin/criteria/page'

export default function ProfessorCriteriaPage() {
  return <CriteriaPage />
}
