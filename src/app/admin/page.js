'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState({ totalUsers: 0, totalAnalyses: 0, averageScore: 0, topPositions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const { data: users } = await supabase.from('profiles').select('id')
      const { data: analyses } = await supabase
        .from('analyses').select('total_score, job_position').eq('status', 'completed')

      let averageScore = 0
      if (analyses && analyses.length > 0) {
        averageScore = Math.round(analyses.reduce((sum, a) => sum + a.total_score, 0) / analyses.length)
      }

      const positionCount = {}
      analyses?.forEach(a => {
        positionCount[a.job_position] = (positionCount[a.job_position] || 0) + 1
      })
      const topPositions = Object.entries(positionCount)
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([name, count]) => ({ name, count }))

      setStats({ totalUsers: users?.length || 0, totalAnalyses: analyses?.length || 0, averageScore, topPositions })
      setLoading(false)
    }
    loadStats()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return '#D97706'
    return '#DC2626'
  }

  const quickLinks = [
    {
      href: '/admin/users',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="var(--primary)" strokeWidth="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: t('admin.manageUsers'),
      desc: t('admin.manageUsersDesc')
    },
    {
      href: '/admin/positions',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="var(--primary)" strokeWidth="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="var(--primary)" strokeWidth="2"/></svg>,
      title: t('admin.managePositions'),
      desc: t('admin.managePositionsDesc')
    },
    {
      href: '/admin/criteria',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      title: t('admin.manageCriteria'),
      desc: t('admin.manageCriteriaDesc')
    },
  ]

  return (
    <AuthLayout requiredRole="admin">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
          {t('admin.title')}
        </h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 36, height: 36, border: '3px solid var(--primary-light)',
              borderTopColor: 'var(--primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: t('admin.totalUsers'), value: stats.totalUsers, color: 'var(--primary)' },
                { label: t('admin.totalAnalyses'), value: stats.totalAnalyses, color: 'var(--primary)' },
                {
                  label: t('admin.averageScore'),
                  value: stats.totalAnalyses > 0 ? `${stats.averageScore}` : '-',
                  sub: stats.totalAnalyses > 0 ? '/100' : '',
                  color: stats.totalAnalyses > 0 ? getScoreColor(stats.averageScore) : 'var(--text-light)'
                },
                { label: t('admin.totalPositions'), value: stats.topPositions.length, color: 'var(--primary)' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 10 }}>{s.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    {s.value}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-light)' }}>{s.sub}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
              {quickLinks.map(link => (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div className="icon-wrap">{link.icon}</div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>{link.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-gray)' }}>{link.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Top positions */}
            {stats.topPositions.length > 0 && (
              <div className="card" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 16 }}>
                  {t('admin.topPositions')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.topPositions.map((pos, i) => (
                    <div key={pos.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', width: 20 }}>{i + 1}</span>
                        <span style={{ fontSize: 14, color: 'var(--text-dark)' }}>{pos.name}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-gray)' }}>{pos.count} {t('admin.times')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
