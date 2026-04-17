'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { useLanguage } from '@/lib/LanguageContext'

export default function AnalyzePage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [jobPositions, setJobPositions] = useState([])
  const [selectedPosition, setSelectedPosition] = useState('')
  const [customPosition, setCustomPosition] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPositions() {
      const { data } = await supabase
        .from('job_positions')
        .select('*')
        .eq('active', true)
        .order('name')
      setJobPositions(data || [])
    }
    loadPositions()
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    setError('')
    if (!selected) { setFile(null); return }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(selected.type)) {
      setError(t('analyze.fileTypeError'))
      setFile(null)
      e.target.value = ''
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError(t('analyze.fileSizeError'))
      setFile(null)
      e.target.value = ''
      return
    }
    setFile(selected)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const jobPosition = useCustom ? customPosition.trim() : selectedPosition
    if (!jobPosition) { setError(t('analyze.selectPositionError')); return }
    if (!file) { setError(t('analyze.selectFileError')); return }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) { setError(uploadError.message); setLoading(false); return }

      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          file_url: fileName,
          file_name: file.name,
          job_position: jobPosition,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) { setError(insertError.message); setLoading(false); return }

      router.push(`/dashboard/analyze/${analysis.id}`)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <AuthLayout requiredRole="member">
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
          {t('analyze.title')}
        </h1>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Position selector */}
            <div>
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
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 15,
                      color: 'var(--text-dark)',
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none'
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

            {/* File upload */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 12 }}>
                {t('analyze.upload')}
              </label>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{
                  border: `2px dashed ${file ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: file ? 'var(--primary-light)' : 'var(--input-bg)',
                  transition: 'all 0.2s'
                }}>
                  {file ? (
                    <>
                      <div style={{
                        width: 48, height: 48, background: '#fff',
                        borderRadius: 12, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2v6h6" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>{file.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-gray)' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {t('analyze.changeFile')}
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 48, height: 48, background: 'var(--surface)',
                        borderRadius: 12, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 12px'
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="var(--text-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-gray)', marginBottom: 4 }}>{t('analyze.clickToSelect')}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{t('analyze.fileTypes')}</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: 10 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15 }}
            >
              {loading ? t('analyze.uploading') : t('analyze.submit')}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  )
}
