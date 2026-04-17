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
        /* Analyzing state */
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
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)' }}>
              {t('result.title')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/dashboard/history" className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
                {t('result.allHistory')}
              </Link>
              <Link href="/dashboard/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
                {t('result.newAnalysis')}
              </Link>
            </div>
          </div>

          {/* File info */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-dark)', marginBottom: 2 }}>
                <span style={{ color: 'var(--text-gray)' }}>{t('result.file')}: </span>
                <strong>{analysis.file_name}</strong>
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-dark)' }}>
                <span style={{ color: 'var(--text-gray)' }}>{t('result.position')}: </span>
                <strong>{analysis.job_position}</strong>
              </p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
              {new Date(analysis.created_at).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {/* Total score */}
          <div style={{ marginBottom: 24 }}>
            <ScoreOverview score={analysis.total_score} label={t('result.totalScore')} />
          </div>

          {/* Category scores */}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>
            {t('result.categoryScores')}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
            {categories.map(({ key, label, max }) => (
              <ScoreCard key={key} label={label} score={analysis.scores?.[key] || 0} maxScore={max} />
            ))}
          </div>

          {/* Summary */}
          <div style={{
            background: 'var(--primary-light)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 24px',
            marginBottom: 24
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>
              💡 {t('result.summary')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.7 }}>
              {analysis.suggestions?.summary}
            </p>
          </div>

          {/* Suggestions per category */}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>
            {t('result.suggestions')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
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
