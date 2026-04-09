'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnalyses: 0,
    averageScore: 0,
    topPositions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      // จำนวน user ทั้งหมด
      const { data: users } = await supabase
        .from('profiles')
        .select('id')

      // จำนวนการวิเคราะห์ที่เสร็จ
      const { data: analyses } = await supabase
        .from('analyses')
        .select('total_score, job_position')
        .eq('status', 'completed')

      // คำนวณคะแนนเฉลี่ย
      let averageScore = 0
      if (analyses && analyses.length > 0) {
        averageScore = Math.round(
          analyses.reduce((sum, a) => sum + a.total_score, 0) / analyses.length
        )
      }

      // ตำแหน่งงานยอดนิยม
      const positionCount = {}
      analyses?.forEach(a => {
        positionCount[a.job_position] = (positionCount[a.job_position] || 0) + 1
      })
      const topPositions = Object.entries(positionCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      setStats({
        totalUsers: users?.length || 0,
        totalAnalyses: analyses?.length || 0,
        averageScore,
        topPositions
      })
      setLoading(false)
    }
    loadStats()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <AuthLayout requiredRole="admin">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {loading ? (
        <p className="text-gray-500">กำลังโหลด...</p>
      ) : (
        <>
          {/* สถิติหลัก */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">ผู้ใช้งานทั้งหมด</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">การวิเคราะห์ทั้งหมด</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAnalyses}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">คะแนนเฉลี่ยรวม</p>
              <p className={`text-3xl font-bold ${stats.totalAnalyses > 0 ? getScoreColor(stats.averageScore) : 'text-gray-300'}`}>
                {stats.totalAnalyses > 0 ? `${stats.averageScore}/100` : '-'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">ตำแหน่งงานในระบบ</p>
              <p className="text-3xl font-bold text-blue-600">{stats.topPositions.length}</p>
            </div>
          </div>

          {/* ลิงก์จัดการ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/admin/users" className="block bg-white rounded-lg shadow-sm border p-6 hover:border-blue-300 transition">
              <h2 className="text-lg font-semibold mb-2 text-blue-600">จัดการผู้ใช้งาน</h2>
              <p className="text-gray-500 text-sm">ดูข้อมูลผู้ใช้งานในระบบ</p>
            </Link>
            <Link href="/admin/positions" className="block bg-white rounded-lg shadow-sm border p-6 hover:border-blue-300 transition">
              <h2 className="text-lg font-semibold mb-2 text-blue-600">จัดการตำแหน่งงาน</h2>
              <p className="text-gray-500 text-sm">เพิ่ม แก้ไข ลบตำแหน่งงาน</p>
            </Link>
            <Link href="/admin/criteria" className="block bg-white rounded-lg shadow-sm border p-6 hover:border-blue-300 transition">
              <h2 className="text-lg font-semibold mb-2 text-blue-600">จัดการเกณฑ์ประเมิน</h2>
              <p className="text-gray-500 text-sm">กำหนดเกณฑ์การให้คะแนน</p>
            </Link>
          </div>

          {/* ตำแหน่งงานยอดนิยม */}
          {stats.topPositions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">ตำแหน่งงานยอดนิยม</h2>
              <div className="space-y-3">
                {stats.topPositions.map((pos, index) => (
                  <div key={pos.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-6">{index + 1}</span>
                      <span className="text-sm">{pos.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{pos.count} ครั้ง</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AuthLayout>
  )
}