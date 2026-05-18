'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/LanguageContext'

const MAX_FILES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export default function BatchUploadForm({ jobPosition, onComplete }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({})
  const [error, setError] = useState('')
  const { t } = useLanguage()

  function addFiles(e) {
    const newFiles = Array.from(e.target.files)
    setError('')
    const validFiles = []
    for (const f of newFiles) {
      if (files.length + validFiles.length >= MAX_FILES) {
        setError(t('batch.maxFiles') || `สูงสุด ${MAX_FILES} ไฟล์`); break
      }
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(t('analyze.fileTypeError') || 'รองรับเฉพาะ PDF และ DOCX'); continue
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(t('analyze.fileSizeError') || 'ไฟล์ต้องไม่เกิน 5MB'); continue
      }
      if (files.some(ex => ex.name === f.name && ex.size === f.size)) continue
      validFiles.push(f)
    }
    if (validFiles.length > 0) setFiles(prev => [...prev, ...validFiles])
    e.target.value = ''
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadAll() {
    if (!jobPosition) { setError(t('analyze.selectPositionError') || 'กรุณาเลือกตำแหน่งงาน'); return }
    if (files.length === 0) { setError(t('analyze.selectFileError') || 'กรุณาเลือกไฟล์'); return }

    setUploading(true); setError('')
    const analysisIds = []
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileKey = `${i}-${file.name}`
      try {
        setProgress(prev => ({ ...prev, [fileKey]: 'uploading' }))
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file)
        if (uploadError) { setProgress(prev => ({ ...prev, [fileKey]: 'error' })); continue }

        const { data: analysis, error: insertError } = await supabase
          .from('analyses')
          .insert({ user_id: user.id, file_url: fileName, file_name: file.name, job_position: jobPosition, status: 'pending' })
          .select().single()
        if (insertError) { setProgress(prev => ({ ...prev, [fileKey]: 'error' })); continue }

        setProgress(prev => ({ ...prev, [fileKey]: 'analyzing' }))
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ analysisId: analysis.id, fileUrl: fileName, fileName: file.name, jobPosition })
        })

        if (response.ok) { setProgress(prev => ({ ...prev, [fileKey]: 'done' })); analysisIds.push(analysis.id) }
        else { setProgress(prev => ({ ...prev, [fileKey]: 'error' })) }
      } catch {
        setProgress(prev => ({ ...prev, [fileKey]: 'error' }))
      }
    }
    setUploading(false)
    if (onComplete && analysisIds.length > 0) onComplete(analysisIds)
  }

  const getStatusIcon = (s) => ({ uploading: '⬆️', analyzing: '🔍', done: '✅', error: '❌' }[s] || '📄')
  const getStatusText = (s) => ({
    uploading: t('batch.uploading') || 'กำลังอัปโหลด...',
    analyzing: t('batch.analyzing') || 'กำลังวิเคราะห์...',
    done: t('batch.done') || 'เสร็จสิ้น',
    error: t('batch.error') || 'ผิดพลาด'
  }[s] || '')

  return (
    <div>
      <input type="file" accept=".pdf,.docx" multiple onChange={addFiles} style={{ display: 'none' }} id="batch-file-upload" disabled={uploading} />
      <label htmlFor="batch-file-upload" style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'block' }}>
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
          padding: '28px 20px', textAlign: 'center', background: 'var(--input-bg)', opacity: uploading ? 0.5 : 1
        }}>
          <div style={{ width: 48, height: 48, background: 'var(--surface)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="var(--text-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-gray)', marginBottom: 4 }}>{t('batch.clickToSelect') || 'คลิกเพื่อเลือกไฟล์ (หลายไฟล์ได้)'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-light)' }}>PDF, DOCX · {t('batch.maxInfo') || `สูงสุด ${MAX_FILES} ไฟล์ · ไฟล์ละไม่เกิน 5MB`}</p>
        </div>
      </label>

      {files.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((file, index) => {
            const fileKey = `${index}-${file.name}`
            const status = progress[fileKey]
            return (
              <div key={fileKey} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 16 }}>{getStatusIcon(status)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-light)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB{status && ` · ${getStatusText(status)}`}</p>
                </div>
                {!uploading && <button type="button" onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: 18, padding: 4 }}>×</button>}
              </div>
            )
          })}
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: 10, marginTop: 12 }}>{error}</p>}

      {files.length > 0 && (
        <button type="button" onClick={uploadAll} disabled={uploading} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 16 }}>
          {uploading ? (t('batch.processing') || 'กำลังประมวลผล...') : (t('batch.submit') || `อัปโหลดและวิเคราะห์ ${files.length} ไฟล์`)}
        </button>
      )}
    </div>
  )
}
