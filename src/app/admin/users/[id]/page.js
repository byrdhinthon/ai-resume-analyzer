'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'

export default function AdminUserDetailPage({ params }) {
  const { id } = use(params)
  const [profile, setProfile] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // ดึง profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      setProfile(profileData)

      // ดึงประวัติการวิเคราะห์ของ user นี้
      const { data: analysesData } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      setAnalyses(analysesData || [])
      setLoading(false)
    }
    loadData()
  }, [id])

  const completedAnalyses = analyses.filter(a => a.status === 'completed')
  const averageScore = completedAnalyses.length > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.total_score, 0) / completedAnalyses.length)
    : 0

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // รวมตำแหน่งงานที่เคยกรอก
  const jobPositions = [...new Set(analyses.map(a => a.job_position))]

  if (loading) {
    return (
      <AuthLayout requiredRole="admin">
        <p className="text-gray-500">กำลังโหลด...</p>
      </AuthLayout>
    )
  }

  if (!profile) {
    return (
      <AuthLayout requiredRole="admin">
        <p className="text-red-500">ไม่พบข้อมูลผู้ใช้</p>
        <Link href="/admin/users" className="text-blue-600 hover:underline mt-4 inline-block">
          กลับ
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout requiredRole="admin">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          ← กลับ
        </Link>
        <h1 className="text-2xl font-bold">ข้อมูลผู้ใช้งาน</h1>
      </div>

      {/* ข้อมูลผู้ใช้ */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ชื่อผู้ใช้</p>
            <p className="font-medium">{profile.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">อีเมล</p>
            <p className="font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">สถานะ</p>
            <span className={`text-xs px-2 py-1 rounded-full ${
              profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {profile.role}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">วันที่สมัคร</p>
            <p className="font-medium">
              {new Date(profile.created_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* สถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-sm text-gray-500">จำนวนครั้งที่วิเคราะห์</p>
          <p className="text-2xl font-bold text-blue-600">{completedAnalyses.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-sm text-gray-500">คะแนนเฉลี่ย</p>
          <p className={`text-2xl font-bold ${completedAnalyses.length > 0 ? getScoreColor(averageScore) : 'text-gray-300'}`}>
            {completedAnalyses.length > 0 ? `${averageScore}/100` : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <p className="text-sm text-gray-500">ตำแหน่งงานที่สนใจ</p>
          <p className="text-2xl font-bold text-blue-600">{jobPositions.length}</p>
        </div>
      </div>

      {/* ตำแหน่งงานที่เคยกรอก */}
      {jobPositions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">ตำแหน่งงานที่เคยกรอก</h2>
          <div className="flex flex-wrap gap-2">
            {jobPositions.map((pos) => (
              <span key={pos} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {pos}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ประวัติการวิเคราะห์ */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">ประวัติการวิเคราะห์</h2>
        {analyses.length === 0 ? (
          <p className="text-gray-500 text-center p-6">ยังไม่มีประวัติ</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">วันที่</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ไฟล์</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ตำแหน่งงาน</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">คะแนน</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.file_name}</td>
                  <td className="px-4 py-3 text-sm">{item.job_position}</td>
                  <td className="px-4 py-3 text-center">
                    {item.total_score !== null ? (
                      <span className={`font-bold ${getScoreColor(item.total_score)}`}>
                        {item.total_score}/100
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status === 'completed' ? 'เสร็จสิ้น' :
                       item.status === 'pending' ? 'รอวิเคราะห์' : 'ล้มเหลว'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AuthLayout>
  )
}
