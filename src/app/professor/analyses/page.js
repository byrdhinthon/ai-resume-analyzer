'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AnalysisHistoryTable from '@/components/AnalysisHistoryTable'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfessorHistoryPage() {
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      let { data, error } = await supabase
        .from('analyses')
        .select('*, profiles(first_name, last_name, student_id, username, role)')
        .order('created_at', { ascending: false })

      if (error) {
        const res = await supabase
          .from('analyses')
          .select('*')
          .order('created_at', { ascending: false })
        data = res.data
      }

      setAnalyses(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AuthLayout requiredRole="professor">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)' }}>
            {t('professor.historyTitle')}
          </h1>
          <Link href="/professor/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
            {t('history.newAnalysis')}
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
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 56, height: 56, background: 'var(--primary-light)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-gray)', marginBottom: 4 }}>
              {t('professor.noHistory')}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
              {t('professor.startNow')}
            </p>
          </div>
        ) : (
          <AnalysisHistoryTable
            analyses={analyses}
            detailPath={(id) => `/professor/analyze/${id}`}
            showStudent={true}
          />
        )}
      </div>
    </AuthLayout>
  )
}
