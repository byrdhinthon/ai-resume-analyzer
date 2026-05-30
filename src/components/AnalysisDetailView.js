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

      {/* อาชีพที่ AI แนะนำ — เฉพาะ quality / ai-suggest mode */}
      {analysis.recommended_career && (
        <div style={{
          background: '#EFF6FF',
          border: '1.5px solid #3B82F6',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}>
          <span style={{ fontSize: 22 }}>🎯</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>
              {analysis.evaluation_mode === 'ai-suggest' ? 'ตำแหน่งที่ AI เลือกประเมิน' : 'อาชีพที่แนะนำ'}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6 }}>
              {analysis.recommended_career}
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24, position: 'relative' }}>
        <ScoreOverview score={analysis.total_score} label={t('result.totalScore')} />

        {/* Pass/Fail badge — เฉพาะ Quality Review Mode */}
        {analysis.evaluation_mode === 'quality' && analysis.pass_threshold !== null && (
          (() => {
            const passed = analysis.total_score >= analysis.pass_threshold
            return (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '8px 16px',
                borderRadius: 99,
                background: passed ? '#DCFCE7' : '#FEF2F2',
                border: '1.5px solid ' + (passed ? '#16A34A' : '#DC2626'),
                fontSize: 14,
                fontWeight: 700,
                color: passed ? '#16A34A' : '#DC2626'
              }}>
                <span style={{ fontSize: 18 }}>{passed ? '✅' : '❌'}</span>
                <span>{passed ? 'ผ่าน' : 'ไม่ผ่าน'}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: passed ? '#16A34A' : '#DC2626', opacity: 0.7 }}>
                  (เกณฑ์ {analysis.pass_threshold})
                </span>
              </div>
            )
          })()
        )}
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
