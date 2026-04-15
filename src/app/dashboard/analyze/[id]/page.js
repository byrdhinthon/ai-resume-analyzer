'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import ScoreOverview from '@/components/ScoreOverview'
import ScoreCard from '@/components/ScoreCard'
import SuggestionCard from '@/components/SuggestionCard'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'



export default function AnalysisResultPage({ params }) {
  const { id } = use(params)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const { t } = useLanguage()

  const categories = [
    { key: 'contact_info', label: t('result.contactInfo'), max: 10 },
    { key: 'skills', label: t('result.skills'), max: 30 },
    { key: 'experience', label: t('result.experience'), max: 25 },
    { key: 'education', label: t('result.education'), max: 10 },
    { key: 'structure', label: t('result.structure'), max: 25 }
  ]
  
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

    if (data.status === 'pending') {
      startAnalysis(data)
    }
  }

  async function startAnalysis(data) {
    setAnalyzing(true)

    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
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

    await loadAnalysis()
    setAnalyzing(false)
  }

  if (loading) {
    return (
      <AuthLayout requiredRole="member">
        <p className="text-center text-gray-500 mt-10">{t('common.loading')}</p>
      </AuthLayout>
    )
  }

  if (error) {
    return (
      <AuthLayout requiredRole="member">
        <div className="text-center mt-10">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/dashboard/analyze" className="text-blue-600 hover:underline">
            {t('result.newAnalysis')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout requiredRole="member">
      {analyzing ? (
        <div className="text-center mt-20">
          <div className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">{t('analyze.analyzing')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('analyze.analyzingWait')}</p>
        </div>
      ) : analysis.status === 'completed' ? (
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('result.title')}</h1>
            <div className="flex gap-3">
              <Link href="/dashboard/history" className="text-sm text-gray-600 hover:underline">
                {t('result.allHistory')}
              </Link>
              <Link href="/dashboard/analyze" className="text-sm text-blue-600 hover:underline">
                {t('result.newAnalysis')}
              </Link>
            </div>
          </div>

          {/* ข้อมูลไฟล์ */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">{t('result.file')}: <strong>{analysis.file_name}</strong></p>
              <p className="text-sm text-gray-600">{t('result.position')}: <strong>{analysis.job_position}</strong></p>
            </div>
            <p className="text-xs text-gray-400">
              {new Date(analysis.created_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {/* คะแนนรวม */}
          <div className="mb-6">
            <ScoreOverview score={analysis.total_score} label={t('result.totalScore')} />
          </div>

          {/* คะแนนแต่ละหมวด */}
          <h2 className="text-lg font-bold mb-3">{t('result.categoryScores')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {categories.map(({ key, label, max }) => (
              <ScoreCard
                key={key}
                label={label}
                score={analysis.scores?.[key] || 0}
                maxScore={max}
              />
            ))}
          </div>

          {/* สรุปภาพรวม */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-blue-800 mb-2">{t('result.summary')}</h2>
            <p className="text-gray-700 leading-relaxed">{analysis.suggestions?.summary}</p>
          </div>

          {/* คำแนะนำแต่ละหมวด */}
          <h2 className="text-lg font-bold mb-3">{t('result.suggestions')}</h2>
          <div className="space-y-3 mb-8">
            {categories.map(({ key, label, max }) => (
              <SuggestionCard
                key={key}
                label={label}
                suggestion={analysis.suggestions?.[key]}
                score={analysis.scores?.[key] || 0}
                maxScore={max}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center mt-10">
          <p className="text-red-500 mb-4">Analysis failed</p>
          <Link href="/dashboard/analyze" className="text-blue-600 hover:underline">
            {t('result.newAnalysis')}
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}