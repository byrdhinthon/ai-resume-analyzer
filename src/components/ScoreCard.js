'use client'
import { useLanguage } from '@/lib/LanguageContext'

export default function ScoreCard({ label, score, maxScore, icon }) {
  const { t } = useLanguage()
  const percent = Math.round((score / maxScore) * 100)

  const getLevel = () => {
    if (percent >= 80) return t('score.excellent')
    if (percent >= 60) return t('score.good')
    if (percent >= 40) return t('score.fair')
    return t('score.needImprovement')
  }

  const getColor = () => {
    if (percent >= 80) return '#16A34A'
    if (percent >= 60) return '#D97706'
    return '#DC2626'
  }

  const getBarColor = () => {
    if (percent >= 80) return '#16A34A'
    if (percent >= 60) return '#D97706'
    return '#DC2626'
  }

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div className="icon-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="2"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: getColor() }}>{percent}%</span>
        </div>
        {/* Progress bar */}
        <div style={{ width: '100%', height: 6, background: 'var(--input-bg)', borderRadius: 99 }}>
          <div style={{
            height: 6,
            borderRadius: 99,
            width: `${percent}%`,
            background: getBarColor(),
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: getColor(), fontWeight: 500 }}>{getLevel()}</span>
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{score}/{maxScore}</span>
        </div>
      </div>
    </div>
  )
}
