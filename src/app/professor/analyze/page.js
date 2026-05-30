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
  // positionMode: 'list' (เลือกจากรายการ) | 'custom' (กรอกเอง) | 'ai' (ให้ AI แนะนำ)
  const [positionMode, setPositionMode] = useState('list')
  const [qualityMode, setQualityMode] = useState(false)
  const [passThreshold, setPassThreshold] = useState(70)

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

  const jobPosition = positionMode === 'custom' ? customPosition.trim() : selectedPosition

  // คำนวณ mode ที่จะส่งให้ API:
  //  Quality toggle on → 'quality'
  //  positionMode 'ai' → 'ai-suggest' (AI เลือกตำแหน่งเอง)
  //  อื่นๆ → 'per-position'
  const analyzeMode = qualityMode ? 'quality' : (positionMode === 'ai' ? 'ai-suggest' : 'per-position')

  return (
    <AuthLayout requiredRole={basePath === '/admin' ? 'admin' : 'professor'}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
          {t('professor.analyzeTitle')}
        </h1>

        <div className="card" style={{ padding: 32 }}>

          {/* Quality Review Mode toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: qualityMode ? '#FEF3C7' : 'var(--input-bg)',
            border: '1.5px solid ' + (qualityMode ? '#F59E0B' : 'var(--border)'),
            marginBottom: 24,
            transition: 'all 0.2s'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: qualityMode ? '#92400E' : 'var(--text-dark)' }}>
                  Quality Review Mode
                </span>
                {qualityMode && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: '#F59E0B', color: '#fff', letterSpacing: 0.5
                  }}>เปิดอยู่</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: qualityMode ? '#92400E' : 'var(--text-gray)', lineHeight: 1.4 }}>
                ตรวจคุณภาพการเขียนเรซูเม่ โดยไม่สนตำแหน่งงาน — เหมาะสำหรับตรวจ batch เพื่อบอก &ldquo;ผ่าน / ไม่ผ่าน&rdquo;
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: 16 }}>
              <input
                type="checkbox"
                checked={qualityMode}
                onChange={e => setQualityMode(e.target.checked)}
                style={{ width: 20, height: 20, cursor: 'pointer', accentColor: '#F59E0B' }}
              />
            </label>
          </div>

          {/* Pass threshold (เฉพาะตอน Quality Mode) */}
          {qualityMode && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 12 }}>
                เกณฑ์ผ่าน (Pass threshold)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={passThreshold}
                  onChange={e => setPassThreshold(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: '#F59E0B' }}
                />
                <div style={{
                  minWidth: 80,
                  textAlign: 'center',
                  padding: '6px 12px',
                  background: '#FEF3C7',
                  border: '1.5px solid #F59E0B',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#92400E'
                }}>
                  {passThreshold}<span style={{ fontSize: 11, color: '#92400E' }}> / 100</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                เรซูเม่ที่ได้คะแนนรวม ≥ {passThreshold} จะถูกจัดเป็น &ldquo;ผ่าน&rdquo;
              </p>
            </div>
          )}

          {/* Position selector — ซ่อนเมื่อ Quality Mode เปิด */}
          {!qualityMode && (
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 12 }}>
              {t('analyze.selectPosition')}
            </label>

            {/* Toggle pills — 3 ทาง: เลือกจากรายการ / กรอกเอง / ให้ AI แนะนำ */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { label: t('analyze.fromList'), value: 'list' },
                { label: t('analyze.custom'), value: 'custom' },
                { label: 'ให้ AI แนะนำ', value: 'ai' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPositionMode(opt.value)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1.5px solid',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    borderColor: positionMode === opt.value ? 'var(--primary)' : 'var(--border)',
                    background: positionMode === opt.value ? 'var(--primary-light)' : 'transparent',
                    color: positionMode === opt.value ? 'var(--primary)' : 'var(--text-gray)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {positionMode === 'list' && (
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
            )}

            {positionMode === 'custom' && (
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

            {positionMode === 'ai' && (
              <div style={{
                padding: '14px 18px', borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)', border: '1.5px solid var(--primary)'
              }}>
                <p style={{ fontSize: 13, color: 'var(--primary)', lineHeight: 1.5 }}>
                  AI จะอ่านเรซูเม่แล้วเลือกตำแหน่งที่เหมาะกับแต่ละคนให้เอง — แล้วให้คะแนนตามตำแหน่งนั้น
                </p>
              </div>
            )}
          </div>
          )}

          {/* Batch upload */}
          <BatchUploadForm
            jobPosition={analyzeMode === 'per-position' ? jobPosition : analyzeMode === 'quality' ? 'Quality Review' : 'AI Suggested'}
            mode={analyzeMode}
            passThreshold={passThreshold}
            onComplete={(ids, opts) => {
              const url = `${basePath}/analyze/${ids[0]}`
              // คลิกแถวใน batch (newTab) → เปิด tab ใหม่ (หน้า batch ไม่หาย)
              // single file วิเคราะห์เสร็จ → ไปหน้าผลปกติ
              if (opts?.newTab) window.open(url, '_blank')
              else router.push(url)
            }}
          />
        </div>
      </div>
    </AuthLayout>
  )
}
