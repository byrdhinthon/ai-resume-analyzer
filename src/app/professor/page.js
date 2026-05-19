'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfessorDashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState({ total: 0, avgScore: 0, studentCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const { data, error } = await supabase
        .from('analyses')
        .select('total_score, user_id, status')
        .eq('status', 'completed')

      if (error || !data) { setLoading(false); return }
      if (data.length > 0) {
        const uniqueStudents = new Set(data.map(a => a.user_id)).size
        const avg = Math.round(
          data.reduce((sum, a) => sum + (a.total_score || 0), 0) / data.length
        )
        setStats({ total: data.length, avgScore: avg, studentCount: uniqueStudents })
      }
      setLoading(false)
    }
    loadStats()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return '#D97706'
    return '#DC2626'
  }

  return (
    <AuthLayout requiredRole="professor">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
          {t('professor.dashboard')}
        </h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid var(--primary-light)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: t('professor.totalResumes'), value: stats.total, color: 'var(--primary)' },
                {
                  label: t('professor.avgScore'),
                  value: stats.total > 0 ? `${stats.avgScore}` : '-',
                  color: stats.total > 0 ? getScoreColor(stats.avgScore) : 'var(--text-light)',
                  sub: stats.total > 0 ? '/100' : ''
                },
                { label: t('professor.studentCount'), value: stats.studentCount, color: 'var(--primary)' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-gray)', marginBottom: 10 }}>{s.label}</p>
                  <p style={{ fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {s.value}
                    {s.sub && <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-light)' }}>{s.sub}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <Link href="/professor/analyze" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <div className="icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6M12 18v-6M9 15h6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>
                      {t('professor.batchAnalyze')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-gray)' }}>
                    {t('professor.batchAnalyzeDesc')}
                  </p>
                </div>
              </Link>
              <Link href="/professor/analyses" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <div className="icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>
                      {t('professor.viewHistory')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-gray)' }}>
                    {t('professor.viewHistoryDesc')}
                  </p>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
