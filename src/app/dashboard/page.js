'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function DashboardPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState({ count: 0, average: 0, latest: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: analyses } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (analyses && analyses.length > 0) {
        const totalScores = analyses.map(a => a.total_score)
        const average = Math.round(totalScores.reduce((a, b) => a + b, 0) / totalScores.length)
        setStats({ count: analyses.length, average, latest: analyses[0] })
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
    <AuthLayout requiredRole="member">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
          {t('dashboard.title')}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: t('dashboard.analyzeCount'), value: stats.count, color: 'var(--primary)' },
                { label: t('dashboard.averageScore'), value: stats.count > 0 ? `${stats.average}` : '-', color: stats.count > 0 ? getScoreColor(stats.average) : 'var(--text-light)', sub: stats.count > 0 ? '/100' : '' },
                { label: t('dashboard.latestScore'), value: stats.latest ? `${stats.latest.total_score}` : '-', color: stats.latest ? getScoreColor(stats.latest.total_score) : 'var(--text-light)', sub: stats.latest ? '/100' : '' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-gray)', marginBottom: 10 }}>{s.label}</p>
                  <p style={{ fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {s.value}<span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-light)' }}>{s.sub}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <Link href="/dashboard/analyze" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <div className="icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6M12 18v-6M9 15h6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>{t('dashboard.analyzeResume')}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-gray)' }}>{t('dashboard.analyzeDesc')}</p>
                </div>
              </Link>
              <Link href="/dashboard/history" style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <div className="icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="2"/>
                        <path d="M12 6v6l4 2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>{t('dashboard.historyTitle')}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-gray)' }}>{t('dashboard.historyDesc')}</p>
                </div>
              </Link>
            </div>

            {/* Latest result */}
            {stats.latest && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dark)' }}>{t('dashboard.latestResult')}</h2>
                  <Link
                    href={`/dashboard/analyze/${stats.latest.id}`}
                    style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {t('dashboard.viewDetail')}
                  </Link>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, color: 'var(--text-dark)', fontWeight: 500, marginBottom: 4 }}>
                      {stats.latest.file_name}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-gray)', marginBottom: 4 }}>
                      {t('result.position')}: <strong style={{ color: 'var(--text-dark)' }}>{stats.latest.job_position}</strong>
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                      {new Date(stats.latest.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 48, fontWeight: 700, color: getScoreColor(stats.latest.total_score), lineHeight: 1 }}>
                      {stats.latest.total_score}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-light)' }}>/100</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
