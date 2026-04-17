'use client'
import { useState } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

export default function SuggestionCard({ label, suggestion, score, maxScore }) {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  const getColor = () => {
    if (percent >= 80) return '#16A34A'
    if (percent >= 60) return '#D97706'
    return '#DC2626'
  }

  const getLevelText = () => {
    if (percent >= 80) return t('score.good')
    if (percent >= 60) return t('score.fair')
    return t('score.needImprovement')
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header - clickable */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '18px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div className="icon-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 13, color: getColor(), fontWeight: 500 }}>
            {percent}% {getLevelText()}
          </p>
        </div>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" stroke="var(--text-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expandable content */}
      {open && (
        <div style={{
          padding: '0 20px 18px 20px',
          borderTop: '1px solid var(--border)'
        }}>
          <div style={{
            background: 'var(--primary-light)',
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 14
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>
              {t('result.suggestion')}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6 }}>{suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}
