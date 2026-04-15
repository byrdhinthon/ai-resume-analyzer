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

  // โหลดตำแหน่งงานจาก database
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

  // ตรวจสอบไฟล์ที่เลือก
  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    setError('')

    if (!selected) {
      setFile(null)
      return
    }

    // เช็คประเภทไฟล์
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

    // เช็คขนาดไฟล์ (5MB)
    if (selected.size > 5 * 1024 * 1024) {
      setError(t('analyze.fileSizeError'))
      setFile(null)
      e.target.value = ''
      return
    }

    setFile(selected)
  }

  // Upload ไฟล์ + บันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const jobPosition = useCustom ? customPosition.trim() : selectedPosition
    if (!jobPosition) {
      setError(t('analyze.selectPositionError'))
      return
    }
    if (!file) {
      setError(t('analyze.selectFileError'))
      return
    }

    setLoading(true)

    try {
      // ดึง user id
      const { data: { user } } = await supabase.auth.getUser()

      // สร้างชื่อไฟล์ไม่ซ้ำ
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload ไฟล์ไป Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      // บันทึกลงตาราง analyses (สถานะ pending รอวิเคราะห์)
      // file_url เก็บ storage path (เช่น "userId/timestamp.pdf") ไม่ใช่ URL เต็ม
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

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      router.push(`/dashboard/analyze/${analysis.id}`)

    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }
  return (
    <AuthLayout requiredRole="member">
      <h1 className="text-2xl font-bold mb-6">{t('analyze.title')}</h1>

      <div className="max-w-2xl bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('analyze.selectPosition')}
            </label>

            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useCustom}
                  onChange={() => setUseCustom(false)}
                  className="text-blue-600"
                />
                <span className="text-sm">{t('analyze.fromList')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useCustom}
                  onChange={() => setUseCustom(true)}
                  className="text-blue-600"
                />
                <span className="text-sm">{t('analyze.custom')}</span>
              </label>
            </div>

            {!useCustom ? (
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('analyze.selectPlaceholder')}</option>
                {jobPositions.map((job) => (
                  <option key={job.id} value={job.name}>
                    {job.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('analyze.customPlaceholder')}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('analyze.upload')}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="text-sm font-medium text-green-600">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-blue-500 mt-2">{t('analyze.changeFile')}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500">{t('analyze.clickToSelect')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('analyze.fileTypes')}</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? t('analyze.uploading') : t('analyze.submit')}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
