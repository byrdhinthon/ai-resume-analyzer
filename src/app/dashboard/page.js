
'use client'
import AuthLayout from '@/components/AuthLayout'

export default function DashboardPage() {
  return (
    <AuthLayout requiredRole="member">
      <h1 className="text-2xl font-bold mb-4">สวัสดี สมาชิก</h1>
      <p className="text-gray-600">ยินดีต้อนรับสู่ระบบวิเคราะห์เรซูเม่ด้วย AI</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">วิเคราะห์เรซูเม่</h2>
          <p className="text-gray-500 text-sm">อัปโหลดเรซูเม่และเลือกตำแหน่งงานเพื่อรับคำแนะนำ</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">ประวัติการวิเคราะห์</h2>
          <p className="text-gray-500 text-sm">ดูผลวิเคราะห์ที่ผ่านมาทั้งหมด</p>
        </div>
      </div>
    </AuthLayout>
  )
}
