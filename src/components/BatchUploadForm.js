'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/LanguageContext'
import { useProfile } from '@/lib/ProfileContext'

const MAX_FILES = 30
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp'
]

export default function BatchUploadForm({ jobPosition, onComplete, mode = 'per-position', passThreshold = 70 }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  // progress[fileKey] = { status, message, analysisId, name, career, passed }
  const [progress, setProgress] = useState({})
  const [error, setError] = useState('')
  const [finished, setFinished] = useState(false)
  const { t } = useLanguage()
  const { user } = useProfile()

  // โหมดที่แสดงตารางสรุป (มีอาชีพแนะนำ) = quality + ai-suggest
  const showSummaryTable = mode === 'quality' || mode === 'ai-suggest'

  function addFiles(e) {
    const newFiles = Array.from(e.target.files)
    setError('')
    setFinished(false) // เพิ่มไฟล์ใหม่ = เริ่มรอบใหม่ → โชว์ปุ่มวิเคราะห์อีกครั้ง
    const validFiles = []
    for (const f of newFiles) {
      if (files.length + validFiles.length >= MAX_FILES) {
        setError(t('batch.maxFiles')); break
      }
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(t('analyze.fileTypeError')); continue
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(t('analyze.fileSizeError')); continue
      }
      if (files.some(ex => ex.name === f.name && ex.size === f.size)) continue
      validFiles.push(f)
    }
    if (validFiles.length > 0) setFiles(prev => [...prev, ...validFiles])
    e.target.value = ''
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFinished(false)
  }

  function setP(fileKey, patch) {
    setProgress(prev => ({ ...prev, [fileKey]: { ...prev[fileKey], ...patch } }))
  }

  // วิเคราะห์ไฟล์เดียว — แยกออกมาเพื่อให้ retry ได้
  async function analyzeOne(file, index, batchId, session) {
    const fileKey = `${index}-${file.name}`
    try {
      setP(fileKey, { status: 'uploading', message: null })
      const fileExt = file.name.split('.').pop()
      // unique filename ด้วย randomUUID (เลี่ยง Date.now ใน render scope + กันชนกันเองตอน retry)
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file)
      if (uploadError) {
        setP(fileKey, { status: 'error', message: 'อัปโหลดไฟล์ขึ้นระบบไม่สำเร็จ ลองใหม่อีกครั้ง' })
        return null
      }

      const insertData = {
        user_id: user.id,
        file_url: fileName,
        file_name: file.name,
        job_position: mode === 'per-position' ? jobPosition : (mode === 'quality' ? 'Quality Review' : 'AI Suggested'),
        status: 'pending'
      }
      if (batchId) insertData.batch_id = batchId

      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert(insertData)
        .select('id').single()
      if (insertError) {
        setP(fileKey, { status: 'error', message: 'บันทึกข้อมูลเริ่มต้นไม่สำเร็จ ลองใหม่อีกครั้ง' })
        return null
      }

      setP(fileKey, { status: 'analyzing', analysisId: analysis.id })
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          analysisId: analysis.id,
          fileUrl: fileName,
          fileName: file.name,
          jobPosition: mode === 'per-position' ? jobPosition : (mode === 'quality' ? 'Quality Review' : 'AI Suggested'),
          mode,
          passThreshold
        })
      })

      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setP(fileKey, {
          status: 'done',
          analysisId: analysis.id,
          name: data.extracted_name || file.name,
          career: data.recommended_career || null,
          passed: data.passed
        })
        return analysis.id
      } else {
        // message ภาษาคนจาก backend (ถ้ามี) — ไม่ใช่ error code ดิบ
        setP(fileKey, { status: 'error', message: data.message || 'วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้ง' })
        return null
      }
    } catch (err) {
      setP(fileKey, { status: 'error', message: 'เกิดข้อผิดพลาดที่เครือข่าย ลองใหม่อีกครั้ง' })
      return null
    }
  }

  async function uploadAll() {
    if (mode === 'per-position' && !jobPosition) {
      setError(t('analyze.selectPositionError')); return
    }
    if (files.length === 0) { setError(t('analyze.selectFileError')); return }
    if (!user) { setError('Not authenticated'); return }

    setUploading(true); setError(''); setFinished(false)
    const { data: { session } } = await supabase.auth.getSession()
    const batchId = files.length > 1 ? crypto.randomUUID() : null

    const analysisIds = []
    for (let i = 0; i < files.length; i++) {
      const fileKey = `${i}-${files[i].name}`
      // ข้ามไฟล์ที่วิเคราะห์เสร็จแล้ว (กดเพิ่มไฟล์ใหม่หลังรอบก่อน) — กัน analyze ซ้ำ + เปลือง AI
      const prev = progress[fileKey]
      if (prev?.status === 'done') {
        if (prev.analysisId) analysisIds.push(prev.analysisId)
        continue
      }
      const id = await analyzeOne(files[i], i, batchId, session)
      if (id) analysisIds.push(id)
    }

    setUploading(false)
    setFinished(true)

    // per-position → ไปหน้าผลเลย (เหมือนเดิม)
    // quality / ai-suggest → ค้างหน้านี้ แสดงตารางสรุป
    if (!showSummaryTable && onComplete && analysisIds.length > 0) {
      onComplete(analysisIds)
    }
  }

  // retry ไฟล์เดียวที่ fail
  async function retryOne(index) {
    const { data: { session } } = await supabase.auth.getSession()
    setUploading(true)
    await analyzeOne(files[index], index, null, session)
    setUploading(false)
  }

  const getStatusIcon = (s) => ({ uploading: '⬆️', analyzing: '🔍', done: '✅', error: '❌' }[s] || '📄')
  const getStatusText = (s) => ({
    uploading: t('batch.uploading'),
    analyzing: t('batch.analyzing'),
    done: t('batch.done'),
    error: t('batch.error')
  }[s] || '')

  const doneCount = Object.values(progress).filter(p => p?.status === 'done').length
  const passedCount = Object.values(progress).filter(p => p?.passed === true).length

  return (
    <div>
      <input type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp" multiple onChange={addFiles} style={{ display: 'none' }} id="batch-file-upload" disabled={uploading} />
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
          <p style={{ fontSize: 14, color: 'var(--text-gray)', marginBottom: 4 }}>{t('batch.clickToSelect')}</p>
          <p style={{ fontSize: 12, color: 'var(--text-light)' }}>PDF, DOCX, PNG, JPG · {t('batch.maxInfo') || `สูงสุด ${MAX_FILES} ไฟล์ · ไฟล์ละไม่เกิน 5MB`}</p>
        </div>
      </label>

      {/* รายการไฟล์ + สถานะ */}
      {files.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map((file, index) => {
            const fileKey = `${index}-${file.name}`
            const p = progress[fileKey] || {}
            return (
              <div key={fileKey} style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (p.status === 'error' ? '#FCA5A5' : 'var(--border)') }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16 }}>{getStatusIcon(p.status)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-light)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB{p.status && ` · ${getStatusText(p.status)}`}</p>
                  </div>
                  {!uploading && p.status === 'error' && (
                    <button type="button" onClick={() => retryOne(index)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                      🔄 ลองใหม่
                    </button>
                  )}
                  {!uploading && p.status !== 'error' && (
                    <button type="button" onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: 18, padding: 4 }}>×</button>
                  )}
                </div>
                {/* error message ภาษาคน */}
                {p.status === 'error' && p.message && (
                  <p style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, marginTop: 8, lineHeight: 1.5 }}>
                    ⚠️ {p.message}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: 10, marginTop: 12 }}>{error}</p>}

      {files.length > 0 && !finished && (
        <button type="button" onClick={uploadAll} disabled={uploading} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 16 }}>
          {uploading ? t('batch.processing') : `${t('batch.submit')} ${files.length}`}
        </button>
      )}

      {/* ตารางสรุป — เฉพาะ quality / ai-suggest mode หลังวิเคราะห์เสร็จ */}
      {showSummaryTable && finished && doneCount > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-dark)' }}>
              ผลการวิเคราะห์ ({doneCount} คน)
            </h3>
            {mode === 'quality' && (
              <span style={{ fontSize: 13, color: 'var(--text-gray)' }}>
                ผ่าน <strong style={{ color: '#16A34A' }}>{passedCount}</strong> / {doneCount}
              </span>
            )}
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {/* หัวตาราง */}
            <div style={{ display: 'flex', background: 'var(--input-bg)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-gray)' }}>
              <div style={{ flex: '0 0 38%', padding: '10px 14px' }}>ชื่อเจ้าของเรซูเม่</div>
              <div style={{ flex: 1, padding: '10px 14px' }}>{mode === 'quality' ? 'อาชีพที่แนะนำ' : 'ตำแหน่งที่ AI เลือก'}</div>
              {mode === 'quality' && <div style={{ flex: '0 0 90px', padding: '10px 14px', textAlign: 'center' }}>ผล</div>}
            </div>
            {/* แถวข้อมูล */}
            {files.map((file, index) => {
              const fileKey = `${index}-${file.name}`
              const p = progress[fileKey] || {}
              if (p.status !== 'done') return null
              return (
                <div
                  key={fileKey}
                  onClick={() => p.analysisId && onComplete && onComplete([p.analysisId])}
                  style={{
                    display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)',
                    fontSize: 13, cursor: p.analysisId ? 'pointer' : 'default', background: '#fff'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--input-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <div style={{ flex: '0 0 38%', padding: '12px 14px', fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name || file.name}
                  </div>
                  <div style={{ flex: 1, padding: '12px 14px', color: 'var(--text-gray)', lineHeight: 1.5 }}>
                    {p.career || '—'}
                  </div>
                  {mode === 'quality' && (
                    <div style={{ flex: '0 0 90px', padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                        background: p.passed ? '#DCFCE7' : '#FEF2F2',
                        color: p.passed ? '#16A34A' : '#DC2626'
                      }}>
                        {p.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
            💡 คลิกที่แถวเพื่อดูรายละเอียดคะแนนของแต่ละคน
          </p>
        </div>
      )}
    </div>
  )
}
