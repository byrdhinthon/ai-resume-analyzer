'use client'
import AuthLayout from '@/components/AuthLayout'

export default function AdminPage() {
  return (
    <AuthLayout requiredRole="admin">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">จัดการระบบวิเคราะห์เรซูเม่</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">ผู้ใช้งาน</h2>
          <p className="text-gray-500 text-sm">จัดการข้อมูลผู้ใช้งานในระบบ</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">ตำแหน่งงาน</h2>
          <p className="text-gray-500 text-sm">เพิ่ม แก้ไข ลบตำแหน่งงาน</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">เกณฑ์ประเมิน</h2>
          <p className="text-gray-500 text-sm">กำหนดเกณฑ์การให้คะแนน</p>
        </div>
      </div>
    </AuthLayout>
  )
}
