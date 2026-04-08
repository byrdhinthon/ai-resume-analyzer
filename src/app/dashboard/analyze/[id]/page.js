'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'

const categoryLabels = {
  contact_info: { label: 'ข้อมูลติดต่อ', max: 10 },
  skills: { label: 'ทักษะ', max: 30 },
  experience: { label: 'ประสบการณ์', max: 25 },
  education: { label: 'ระดับการศึกษา', max: 10 },
  structure: { label: 'โครงสร้างเรซูเม่', max: 25 }
}

function getScoreColor(score, max) {
  const percent = (score / max) * 100
  if (percent >= 80) return 'bg-green-500'
  if (percent >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getScoreLevel(score, max) {
  const percent = (score / max) * 100
  if (percent >= 80) return 'ดีมาก'
  if (percent >= 60) return 'ดี'
  if (percent >= 40) return 'พอใช้'
  return 'ควรปรับปรุง'
}

export default function AnalysisResultPage({ params }) {
  const { id } = use(params)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalysis()
  }, [id])

  async function loadAnalysis() {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setError('ไม่พบข้อมูลการวิเคราะห์')
      setLoading(false)
      return
    }

    setAnalysis(data)
    setLoading(false)

    // ถ้า status = pending → เริ่มวิเคราะห์
    if (data.status === 'pending') {
      startAnalysis(data)
    }
  }

  async function startAnalysis(data) {
    setAnalyzing(true)

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisId: data.id,
        fileUrl: data.file_url,
        fileName: data.file_name,
        jobPosition: data.job_position
      })
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'วิเคราะห์ล้มเหลว')
      setAnalyzing(false)
      return
    }

    // โหลดข้อมูลใหม่
    await loadAnalysis()
    setAnalyzing(false)
  }

  if (loading) {
    return (
      <AuthLayout requiredRole="member">
        <p className="text-center text-gray-500 mt-10">กำลังโหลด...</p>
      </AuthLayout>
    )
  }

  if (error) {
    return (
      <AuthLayout requiredRole="member">
        <p className="text-center text-red-500 mt-10">{error}</p>
        <div className="text-center mt-4">
          <Link href="/dashboard/analyze" className="text-blue-600 hover:underline">
            กลับไปหน้าวิเคราะห์
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout requiredRole="member">
      {analyzing ? (
        <div className="text-center mt-20">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-medium text-gray-700">กำลังวิเคราะห์เรซูเม่ด้วย AI...</p>
          <p className="text-sm text-gray-500 mt-2">อาจใช้เวลา 10-30 วินาที</p>
        </div>
      ) : analysis.status === 'completed' ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">ผลการวิเคราะห์</h1>
            <Link href="/dashboard/analyze" className="text-blue-600 hover:underline text-sm">
              วิเคราะห์ใหม่
            </Link>
          </div>

          {/* ข้อมูลไฟล์ */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <p className="text-sm text-gray-600">ไฟล์: <strong>{analysis.file_name}</strong></p>
            <p className="text-sm text-gray-600">ตำแหน่งงาน: <strong>{analysis.job_position}</strong></p>
          </div>

          {/* คะแนนรวม */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 text-center">
            <p className="text-sm text-gray-500 mb-2">คะแนนรวม</p>
            <p className={`text-5xl font-bold ${
              analysis.total_score >= 80 ? 'text-green-600' :
              analysis.total_score >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {analysis.total_score}<span className="text-2xl text-gray-400">/100</span>
            </p>
            <p className="text-sm mt-2 text-gray-600">
              {getScoreLevel(analysis.total_score, 100)}
            </p>
          </div>

          {/* คะแนนแต่ละหมวด */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(categoryLabels).map(([key, { label, max }]) => {
              const score = analysis.scores?.[key] || 0
              const percent = (score / max) * 100

              return (
                <div key={key} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-bold">{score}/{max}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getScoreColor(score, max)}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getScoreLevel(score, max)}</p>
                </div>
              )
            })}
          </div>

          {/* คำแนะนำ */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">สรุปภาพรวม</h2>
            <p className="text-gray-700">{analysis.suggestions?.summary}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold">คำแนะนำแต่ละหมวด</h2>
            {Object.entries(categoryLabels).map(([key, { label }]) => (
              <div key={key} className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-medium text-sm text-blue-700 mb-2">{label}</h3>
                <p className="text-sm text-gray-700">{analysis.suggestions?.[key]}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center mt-10">
          <p className="text-red-500">การวิเคราะห์ล้มเหลว</p>
          <Link href="/dashboard/analyze" className="text-blue-600 hover:underline mt-4 inline-block">
            ลองใหม่อีกครั้ง
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
