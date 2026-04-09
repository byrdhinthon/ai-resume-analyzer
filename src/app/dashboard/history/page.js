'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function HistoryPage() {
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
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusLabel = (status) => {
    if (status === 'completed') return { text: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' }
    if (status === 'pending') return { text: 'รอวิเคราะห์', color: 'bg-yellow-100 text-yellow-700' }
    return { text: 'ล้มเหลว', color: 'bg-red-100 text-red-700' }
  }
  const { t } = useLanguage()
  return (
    <AuthLayout requiredRole="member">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('history.title')}</h1>
        <Link
          href="/dashboard/analyze"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {t('history.newAnalysis')}
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">กำลังโหลด...</p>
      ) : analyses.length === 0 ? (
        <div className="text-center mt-10 bg-white rounded-lg border p-8">
          <p className="text-gray-500 mb-4">{t('history.empty')}</p>
          <Link
            href="/dashboard/analyze"
            className="text-blue-600 hover:underline"
          >
            {t('history.startNow')}
          </Link>
        </div>
      ) : (
        <>
          {/* ตารางบนจอใหญ่ */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t('history.date')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t('history.file')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t('history.position')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">{t('history.score')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">{t('history.status')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((item) => {
                  const getStatusLabel = (status) => {
                    if (status === 'completed') return { text: t('history.completed'), color: 'bg-green-100 text-green-700' }
                    if (status === 'pending') return { text: t('history.pending'), color: 'bg-yellow-100 text-yellow-700' }
                    return { text: t('history.failed'), color: 'bg-red-100 text-red-700' }
                  }
                  return (
                    <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{item.file_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{item.job_position}</td>
                      <td className="px-4 py-3 text-center">
                        {item.total_score !== null ? (
                          <span className={`font-bold ${getScoreColor(item.total_score)}`}>
                            {item.total_score}/100
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status === 'completed' && (
                          <Link
                            href={`/dashboard/analyze/${item.id}`}
                            className="text-sm text-blue-600 hover:underline"
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

          {/* Card บนมือถือ */}
          <div className="md:hidden space-y-3">
            {analyses.map((item) => {
              const status = getStatusLabel(item.status)
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.job_position}</p>
                      <p className="text-xs text-gray-500">{item.file_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center gap-3">
                      {item.total_score !== null && (
                        <span className={`font-bold ${getScoreColor(item.total_score)}`}>
                          {item.total_score}/100
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <Link
                          href={`/dashboard/analyze/${item.id}`}
                          className="text-sm text-blue-600 hover:underline"
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
    </AuthLayout>
  )
}
