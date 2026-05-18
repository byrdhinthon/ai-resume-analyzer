'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AnalysisHistoryTable from '@/components/AnalysisHistoryTable'
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
          <AnalysisHistoryTable
            analyses={analyses}
            detailPath={(id) => `/dashboard/analyze/${id}`}
          />
        )}
      </div>
    </AuthLayout>
  )
}
