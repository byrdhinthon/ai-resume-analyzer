'use client'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

/**
 * Shared component for displaying analysis history (desktop table + mobile cards)
 * Used by both dashboard/history and professor/analyses
 *
 * Props:
 *   analyses    - array of analysis records
 *   detailPath  - function (id) => string, e.g. (id) => `/dashboard/analyze/${id}`
 *   showStudent - boolean, show student name column (for professor view)
 */
export default function AnalysisHistoryTable({
  analyses,
  detailPath,
  showStudent = false
}) {
  const { t } = useLanguage()

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

  const headers = [
    t('history.date'),
    ...(showStudent ? [t('history.student') || 'นักศึกษา'] : []),
    t('history.file'),
    t('history.position'),
    t('history.score'),
    t('history.status'),
    ''
  ]

  return (
    <>
      {/* Desktop table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'none' }} id="desktop-history-table">
        <style>{`@media (min-width: 768px) { #desktop-history-table { display: block !important; } #mobile-history-cards { display: none !important; } }`}</style>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  textAlign: i >= headers.length - 3 ? 'center' : 'left',
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
                  {showStudent && (
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                      {item.profiles?.first_name
                        ? `${item.profiles.first_name} ${item.profiles.last_name || ''}`
                        : item.profiles?.username || '-'}
                    </td>
                  )}
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
                        href={detailPath(item.id)}
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
      <div id="mobile-history-cards" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {analyses.map((item) => {
          const s = getStatusStyle(item.status)
          return (
            <div key={item.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 2 }}>{item.job_position}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-gray)' }}>{item.file_name}</p>
                  {showStudent && (
                    <p style={{ fontSize: 12, color: 'var(--text-gray)', marginTop: 2 }}>
                      {item.profiles?.first_name
                        ? `${item.profiles.first_name} ${item.profiles.last_name || ''}`
                        : item.profiles?.username || '-'}
                    </p>
                  )}
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
                      href={detailPath(item.id)}
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
  )
}
