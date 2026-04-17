'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminUserDetailPage({ params }) {
  const { id } = use(params)
  const { t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', id).single()
      setProfile(profileData)

      const { data: analysesData } = await supabase
        .from('analyses').select('*').eq('user_id', id).order('created_at', { ascending: false })
      setAnalyses(analysesData || [])
      setLoading(false)
    }
    loadData()
  }, [id])

  const completedAnalyses = analyses.filter(a => a.status === 'completed')
  const averageScore = completedAnalyses.length > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.total_score, 0) / completedAnalyses.length)
    : 0
  const jobPositions = [...new Set(analyses.map(a => a.job_position))]

  const getScoreColor = (score) => {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return '#D97706'
    return '#DC2626'
  }

  const getStatusStyle = (status) => {
    if (status === 'completed') return { bg: '#DCFCE7', color: '#16A34A', text: t('admin.userDetail.completed') }
    if (status === 'pending') return { bg: '#FEF3C7', color: '#D97706', text: t('admin.userDetail.pending') }
    return { bg: '#FEE2E2', color: '#DC2626', text: t('admin.userDetail.failed') }
  }

  if (loading) {
    return (
      <AuthLayout requiredRole="admin">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid var(--primary-light)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </AuthLayout>
    )
  }

  if (!profile) {
    return (
      <AuthLayout requiredRole="admin">
        <p style={{ color: '#DC2626', marginBottom: 16 }}>{t('admin.userDetail.notFound')}</p>
        <Link href="/admin/users" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
          ← {t('admin.userDetail.back')}
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout requiredRole="admin">
      <div>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/admin/users" style={{ fontSize: 13, color: 'var(--text-gray)', textDecoration: 'none' }}>
            ← {t('admin.userDetail.back')}
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dark)' }}>
            {t('admin.userDetail.title')}
          </h1>
        </div>

        {/* Profile card */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { label: t('admin.userDetail.username'), value: profile.username },
              { label: t('admin.userDetail.email'), value: profile.email },
              {
                label: t('admin.userDetail.role'),
                value: null,
                badge: profile.role,
                badgeStyle: {
                  background: profile.role === 'admin' ? '#F3E8FF' : 'var(--primary-light)',
                  color: profile.role === 'admin' ? '#7C3AED' : 'var(--primary)'
                }
              },
              {
                label: t('admin.userDetail.date'),
                value: new Date(profile.created_at).toLocaleDateString('th-TH', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })
              }
            ].map((f, i) => (
              <div key={i}>
                <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 4 }}>{f.label}</p>
                {f.badge ? (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                    ...f.badgeStyle
                  }}>{f.badge}</span>
                ) : (
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{f.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: t('admin.userDetail.analyzeCount'), value: completedAnalyses.length, color: 'var(--primary)' },
            {
              label: t('admin.userDetail.averageScore'),
              value: completedAnalyses.length > 0 ? `${averageScore}` : '-',
              sub: completedAnalyses.length > 0 ? '/100' : '',
              color: completedAnalyses.length > 0 ? getScoreColor(averageScore) : 'var(--text-light)'
            },
            { label: t('admin.userDetail.interestedPositions'), value: jobPositions.length, color: 'var(--primary)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-light)' }}>{s.sub}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Past positions */}
        {jobPositions.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 12 }}>
              {t('admin.userDetail.pastPositions')}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {jobPositions.map(pos => (
                <span key={pos} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 99,
                  background: 'var(--input-bg)', color: 'var(--text-gray)',
                  border: '1px solid var(--border)'
                }}>
                  {pos}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* History table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            {t('admin.userDetail.history')}
          </h2>
          {analyses.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '40px 20px', fontSize: 14 }}>
              {t('admin.userDetail.noHistory')}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[t('history.date'), t('history.file'), t('history.position'), t('history.score'), t('history.status')].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i >= 3 ? 'center' : 'left',
                      padding: '12px 16px', fontSize: 12, fontWeight: 600,
                      color: 'var(--text-gray)', background: 'var(--input-bg)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyses.map(item => {
                  const s = getStatusStyle(item.status)
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-gray)' }}>
                        {new Date(item.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                        {item.file_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                        {item.job_position}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {item.total_score !== null ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(item.total_score) }}>
                            {item.total_score}/100
                          </span>
                        ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 99,
                          background: s.bg, color: s.color
                        }}>{s.text}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
