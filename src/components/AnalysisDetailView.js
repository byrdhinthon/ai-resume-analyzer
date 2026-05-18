'use client'
import Link from 'next/link'
import ScoreOverview from './ScoreOverview'
import ScoreCard from './ScoreCard'
import SuggestionCard from './SuggestionCard'
import { useLanguage } from '@/lib/LanguageContext'

export default function AnalysisDetailView({
  analysis,
  categories,
  backLink,
  newLink,
  extraHeader
}) {
  const { t } = useLanguage()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)' }}>
          {t('result.title')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href={backLink} className="btn-secondary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
            {t('result.allHistory')}
          </Link>
          <Link href={newLink} className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
            {t('result.newAnalysis')}
          </Link>
        </div>
      </div>

      {extraHeader}

      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-dark)', marginBottom: 2 }}>
            <span style={{ color: 'var(--text-gray)' }}>{t('result.file')}: </span>
            <strong>{analysis.file_name}</strong>
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-dark)' }}>
            <span style={{ color: 'var(--text-gray)' }}>{t('result.position')}: </span>
            <strong>{analysis.job_position}</strong>
          </p>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
          {new Date(analysis.created_at).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <ScoreOverview score={analysis.total_score} label={t('result.totalScore')} />
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>
        {t('result.categoryScores')}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
        {categories.map(({ key, label, max }) => (
          <ScoreCard key={key} label={label} score={analysis.scores?.[key] || 0} maxScore={max} />
        ))}
      </div>

      <div style={{
        background: 'var(--primary-light)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        marginBottom: 24
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>
          {t('result.summary')}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.7 }}>
          {analysis.suggestions?.summary}
        </p>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 14 }}>
        {t('result.suggestions')}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {categories.map(({ key, label, max }) => (
          <SuggestionCard
            key={key}
            label={label}
            suggestion={analysis.suggestions?.[key]}
            score={analysis.scores?.[key] || 0}
            maxScore={max}
          />
        ))}
      </div>
    </div>
  )
}
