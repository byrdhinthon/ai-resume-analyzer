'use client'
import { useLanguage } from '@/lib/LanguageContext'

export default function ScoreOverview({ score, label }) {
  const { t } = useLanguage()

  const getLevel = () => {
    if (score >= 80) return t('score.excellent')
    if (score >= 60) return t('score.good')
    if (score >= 40) return t('score.fair')
    return t('score.needImprovement')
  }

  const getColor = () => {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return '#D97706'
    return '#DC2626'
  }

  return (
    <div className="card text-center" style={{ padding: '48px 32px' }}>
      {/* Score circle */}
      <div style={{
        width: 140,
        height: 140,
        background: 'var(--input-bg)',
        borderRadius: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <span style={{ fontSize: 52, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>
          {score}
        </span>
      </div>

      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>
        {getLevel()}
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-gray)' }}>
        {label || t('result.totalScore')}
      </p>
    </div>
  )
}
