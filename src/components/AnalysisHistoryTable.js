'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function AnalysisHistoryTable({
  analyses,
  detailPath,
  showStudent = false,
  userHighScores = null
}) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

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

  const getRoleLabel = (role) => {
    if (role === 'professor') return 'Professor'
    if (role === 'admin') return 'Admin'
    return 'Member'
  }

  const getStudentName = (item) => {
    if (item.profiles?.first_name) return `${item.profiles.first_name} ${item.profiles.last_name || ''}`.trim()
    return item.profiles?.username || '-'
  }

  const getDisplayScore = (item) => {
    if (userHighScores && item.user_id && userHighScores[item.user_id] !== undefined) {
      return userHighScores[item.user_id]
    }
    return item.total_score
  }

  function copyToExcel() {
    const scoreLabel = userHighScores ? 'คะแนนสูงสุด' : 'คะแนน'
    const header = showStudent
      ? ['วันที่', 'ชื่อ-นามสกุล', 'รหัสนักศึกษา', 'Role', 'ไฟล์', 'ตำแหน่งงาน', scoreLabel, 'สถานะ']
      : ['วันที่', 'ไฟล์', 'ตำแหน่งงาน', scoreLabel, 'สถานะ']

    const rows = analyses.map(item => {
      const date = new Date(item.created_at).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric'
      })
      const displayScore = getDisplayScore(item)
      const score = displayScore !== null && displayScore !== undefined ? displayScore : ''
      const status = item.status === 'completed' ? 'เสร็จสิ้น' : item.status === 'pending' ? 'รอวิเคราะห์' : 'ล้มเหลว'

      if (showStudent) {
        return [
          date,
          getStudentName(item),
          item.profiles?.student_id || '-',
          getRoleLabel(item.profiles?.role),
          item.file_name,
          item.job_position,
          score,
          status
        ]
      }
      return [date, item.file_name, item.job_position, score, status]
    })

    const tsv = [header, ...rows].map(row => row.join('\t')).join('\n')
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const headers = [
    t('history.date'),
    ...(showStudent ? [
      t('history.student') || 'นักศึกษา',
      t('history.studentId') || 'รหัสนักศึกษา',
      t('history.role') || 'Role',
    ] : []),
    t('history.file'),
    t('history.position'),
    userHighScores ? (t('history.highScore') || 'คะแนนสูงสุด') : t('history.score'),
    t('history.status'),
    ''
  ]

  return (
    <>
      {/* Copy to Excel button */}
      {showStudent && analyses.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={copyToExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              background: copied ? '#DCFCE7' : 'var(--surface)',
              color: copied ? '#16A34A' : 'var(--text-gray)',
              border: `1px solid ${copied ? '#16A34A' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('history.copied') || 'คัดลอกแล้ว!'}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {t('history.copyExcel') || 'Copy สำหรับ Excel'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Desktop table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'none' }} id="desktop-history-table">
        <style>{`@media (min-width: 768px) { #desktop-history-table { display: block !important; } #mobile-history-cards { display: none !important; } }`}</style>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: showStudent ? 900 : 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{
                    textAlign: i >= headers.length - 3 ? 'center' : 'left',
                    padding: '14px 16px', fontSize: 13, fontWeight: 600,
                    color: 'var(--text-gray)', background: 'var(--input-bg)',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyses.map((item) => {
                const s = getStatusStyle(item.status)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-gray)', whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    {showStudent && (
                      <>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)', fontWeight: 500 }}>
                          {getStudentName(item)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-gray)', fontFamily: 'monospace' }}>
                          {item.profiles?.student_id || '-'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                            background: item.profiles?.role === 'professor' ? '#DBEAFE' : 'var(--primary-light)',
                            color: item.profiles?.role === 'professor' ? '#2563EB' : 'var(--primary)'
                          }}>
                            {getRoleLabel(item.profiles?.role)}
                          </span>
                        </td>
                      </>
                    )}
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.file_name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                      {item.job_position}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {(() => {
                        const score = getDisplayScore(item)
                        return score !== null && score !== undefined ? (
                          <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(score) }}>
                            {score}/100
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 99,
                        background: s.bg, color: s.color
                      }}>{s.text}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {item.status === 'completed' && (
                        <Link href={detailPath(item.id)}
                          style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
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
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-dark)', fontWeight: 500 }}>
                        {getStudentName(item)}
                      </p>
                      <span style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'monospace' }}>
                        {item.profiles?.student_id || ''}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99,
                        background: item.profiles?.role === 'professor' ? '#DBEAFE' : 'var(--primary-light)',
                        color: item.profiles?.role === 'professor' ? '#2563EB' : 'var(--primary)'
                      }}>
                        {getRoleLabel(item.profiles?.role)}
                      </span>
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 99,
                  background: s.bg, color: s.color, flexShrink: 0, marginLeft: 8
                }}>{s.text}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                  {new Date(item.created_at).toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {(() => {
                    const score = getDisplayScore(item)
                    return score !== null && score !== undefined ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(score) }}>
                        {score}/100
                      </span>
                    ) : null
                  })()}
                  {item.status === 'completed' && (
                    <Link href={detailPath(item.id)}
                      style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
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
