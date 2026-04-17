'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function HistoryPage() {
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHistory() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setAnalyses(data || [])
      setLoading(false)
    }
    loadHistory()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return '#D97706'
    return '#DC2626'
  }

  const getStatusStyle = (status) => {
    if (status === 'completed') return { text: t('history.completed'), bg: '#DCFCE7', color: '#16A34A' }
    if (status === 'pending') return { text: t('history.pending'), bg: '#FEF3C7', color: '#D97706' }
    return { text: t('history.failed'), bg: '#FEE2E2', color: '#DC2626' }
  }

  return (
    <AuthLayout requiredRole="member">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)' }}>
            {t('history.title')}
          </h1>
          <Link href="/dashboard/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: 14 }}>
            + {t('history.newAnalysis')}
          </Link>
        </div>

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
        ) : analyses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{
              width: 64, height: 64, background: 'var(--primary-light)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-gray)', marginBottom: 20 }}>{t('history.empty')}</p>
            <Link href="/dashboard/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: 14 }}>
              {t('history.startNow')}
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'none' }} id="desktop-table">
              <style>{`@media (min-width: 768px) { #desktop-table { display: block !important; } #mobile-cards { display: none !important; } }`}</style>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t('history.date'), t('history.file'), t('history.position'), t('history.score'), t('history.status'), ''].map((h, i) => (
                      <th key={i} style={{
                        textAlign: i >= 3 ? 'center' : 'left',
                        padding: '14px 16px',
                        fontSize: 13, fontWeight: 600,
                        color: 'var(--text-gray)',
                        background: 'var(--input-bg)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((item) => {
                    const s = getStatusStyle(item.status)
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-gray)' }}>
                          {new Date(item.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.file_name}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                          {item.job_position}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {item.total_score !== null ? (
                            <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(item.total_score) }}>
                              {item.total_score}/100
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 500,
                            padding: '4px 10px', borderRadius: 99,
                            background: s.bg, color: s.color
                          }}>
                            {s.text}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {item.status === 'completed' && (
                            <Link
                              href={`/dashboard/analyze/${item.id}`}
                              style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                            >
                              {t('history.viewDetail')}
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div id="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analyses.map((item) => {
                const s = getStatusStyle(item.status)
                return (
                  <div key={item.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 2 }}>{item.job_position}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-gray)' }}>{item.file_name}</p>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        padding: '3px 8px', borderRadius: 99,
                        background: s.bg, color: s.color, flexShrink: 0, marginLeft: 8
                      }}>
                        {s.text}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {new Date(item.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.total_score !== null && (
                          <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(item.total_score) }}>
                            {item.total_score}/100
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <Link
                            href={`/dashboard/analyze/${item.id}`}
                            style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            {t('history.viewDetail')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
