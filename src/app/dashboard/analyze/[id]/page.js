'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AnalysisDetailView from '@/components/AnalysisDetailView'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function AnalysisResultPage({ params }) {
  const { id } = use(params)
  const { t } = useLanguage()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    { key: 'contact_info', label: t('result.contactInfo'), max: 10 },
    { key: 'skills', label: t('result.skills'), max: 30 },
    { key: 'experience', label: t('result.experience'), max: 25 },
    { key: 'education', label: t('result.education'), max: 10 },
    { key: 'structure', label: t('result.structure'), max: 25 }
  ]

  useEffect(() => { loadAnalysis() }, [id])

  async function loadAnalysis() {
    const { data, error } = await supabase
      .from('analyses').select('*').eq('id', id).single()

    if (error || !data) {
      setError(t('result.notFound') || 'ไม่พบข้อมูลการวิเคราะห์')
      setLoading(false)
      return
    }
    setAnalysis(data)
    setLoading(false)
    if (data.status === 'pending') startAnalysis(data)
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
      setError(result.error || t('analyze.failed') || 'วิเคราะห์ล้มเหลว')
      setAnalyzing(false)
      return
    }
    await loadAnalysis()
    setAnalyzing(false)
  }

  if (loading) {
    return (
      <AuthLayout requiredRole="member">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{
            width: 40, height: 40,
            border: '3px solid var(--primary-light)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </AuthLayout>
    )
  }

  if (error) {
    return (
      <AuthLayout requiredRole="member">
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ color: '#DC2626', marginBottom: 16, fontSize: 15 }}>{error}</p>
          <Link href="/dashboard/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: 14 }}>
            {t('result.newAnalysis')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout requiredRole="member">
      {analyzing ? (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <div style={{
            width: 80, height: 80, background: 'var(--primary-light)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <div style={{
              width: 40, height: 40,
              border: '4px solid var(--primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
          <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 8 }}>
            {t('analyze.analyzing')}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-gray)' }}>{t('analyze.analyzingWait')}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : analysis.status === 'completed' ? (
        <AnalysisDetailView
          analysis={analysis}
          categories={categories}
          backLink="/dashboard/history"
          newLink="/dashboard/analyze"
        />
      ) : (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ color: '#DC2626', marginBottom: 16 }}>{t('analyze.failed') || 'Analysis failed'}</p>
          <Link href="/dashboard/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: 14 }}>
            {t('result.newAnalysis')}
          </Link>
        </div>
      )}
    </AuthLayout>
  )
}
