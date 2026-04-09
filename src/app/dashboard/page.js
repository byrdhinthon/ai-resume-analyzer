'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function DashboardPage() {
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
        setStats({
          count: analyses.length,
          average: average,
          latest: analyses[0]
        })
      }
      setLoading(false)
    }
    loadStats()
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
  const { t } = useLanguage()
  return (
    <AuthLayout requiredRole="member">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">{t('dashboard.analyzeCount')}</p>
              <p className="text-3xl font-bold text-blue-600">{stats.count}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">{t('dashboard.averageScore')}</p>
              <p className={`text-3xl font-bold ${stats.count > 0 ? getScoreColor(stats.average) : 'text-gray-300'}`}>
                {stats.count > 0 ? `${stats.average}/100` : '-'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">{t('dashboard.latestScore')}</p>
              <p className={`text-3xl font-bold ${stats.latest ? getScoreColor(stats.latest.total_score) : 'text-gray-300'}`}>
                {stats.latest ? `${stats.latest.total_score}/100` : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link href="/dashboard/analyze" className="block bg-white rounded-lg shadow-sm border p-6 hover:border-blue-300 transition">
              <h2 className="text-lg font-semibold mb-2 text-blue-600">{t('dashboard.analyzeResume')}</h2>
              <p className="text-gray-500 text-sm">{t('dashboard.analyzeDesc')}</p>
            </Link>
            <Link href="/dashboard/history" className="block bg-white rounded-lg shadow-sm border p-6 hover:border-blue-300 transition">
              <h2 className="text-lg font-semibold mb-2 text-blue-600">{t('dashboard.historyTitle')}</h2>
              <p className="text-gray-500 text-sm">{t('dashboard.historyDesc')}</p>
            </Link>
          </div>

          {stats.latest && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{t('dashboard.latestResult')}</h2>
                <Link href={`/dashboard/analyze/${stats.latest.id}`} className="text-sm text-blue-600 hover:underline">
                  {t('dashboard.viewDetail')}
                </Link>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">{t('result.file')}: <strong>{stats.latest.file_name}</strong></p>
                  <p className="text-sm text-gray-600">{t('result.position')}: <strong>{stats.latest.job_position}</strong></p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(stats.latest.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-center">
                  <p className={`text-4xl font-bold ${getScoreColor(stats.latest.total_score)}`}>
                    {stats.latest.total_score}
                  </p>
                  <p className="text-xs text-gray-400">/100</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AuthLayout>
  )
}
