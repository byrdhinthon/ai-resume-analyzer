'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import BatchUploadForm from '@/components/BatchUploadForm'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfessorAnalyzePage() {
  const router = useRouter()
  const pathname = usePathname()
  const basePath = pathname.startsWith('/admin') ? '/admin' : '/professor'
  const { t } = useLanguage()
  const [jobPositions, setJobPositions] = useState([])
  const [selectedPosition, setSelectedPosition] = useState('')
  const [customPosition, setCustomPosition] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  useEffect(() => {
    async function loadPositions() {
      const { data } = await supabase
        .from('job_positions')
        .select('id, name')
        .eq('active', true)
        .order('name')
      setJobPositions(data || [])
    }
    loadPositions()
  }, [])

  const jobPosition = useCustom ? customPosition.trim() : selectedPosition

  return (
    <AuthLayout requiredRole={basePath === '/admin' ? 'admin' : 'professor'}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
          {t('professor.analyzeTitle')}
        </h1>

        <div className="card" style={{ padding: 32 }}>
          {/* Position selector */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 12 }}>
              {t('analyze.selectPosition')}
            </label>

            {/* Toggle pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { label: t('analyze.fromList'), value: false },
                { label: t('analyze.custom'), value: true }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setUseCustom(opt.value)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1.5px solid',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    borderColor: useCustom === opt.value ? 'var(--primary)' : 'var(--border)',
                    background: useCustom === opt.value ? 'var(--primary-light)' : 'transparent',
                    color: useCustom === opt.value ? 'var(--primary)' : 'var(--text-gray)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {!useCustom ? (
              <div className="input-wrap" style={{ cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <select
                  value={selectedPosition}
                  onChange={e => setSelectedPosition(e.target.value)}
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    background: 'transparent', fontSize: 15,
                    color: 'var(--text-dark)', cursor: 'pointer',
                    WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none'
                  }}
                >
                  <option value="">{t('analyze.selectPlaceholder')}</option>
                  {jobPositions.map(job => (
                    <option key={job.id} value={job.name}>{job.name}</option>
                  ))}
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ) : (
              <div className="input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
                  <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 3v4M8 3v4M12 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  value={customPosition}
                  onChange={e => setCustomPosition(e.target.value)}
                  placeholder={t('analyze.customPlaceholder')}
                />
              </div>
            )}
          </div>

          {/* Batch upload */}
          <BatchUploadForm
            jobPosition={jobPosition}
            onComplete={(ids) => {
              if (ids.length === 1) {
                router.push(`${basePath}/analyze/${ids[0]}`)
              } else {
                router.push(`${basePath}/analyses`)
              }
            }}
          />
        </div>
      </div>
    </AuthLayout>
  )
}
