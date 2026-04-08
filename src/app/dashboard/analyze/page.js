'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'

export default function AnalyzePage() {
  const router = useRouter()
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
      setError('รองรับเฉพาะไฟล์ PDF (.pdf) และ Word (.docx) เท่านั้น')
      setFile(null)
      e.target.value = ''
      return
    }

    // เช็คขนาดไฟล์ (5MB)
    if (selected.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 5MB')
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
      setError('กรุณาเลือกหรือกรอกตำแหน่งงาน')
      return
    }
    if (!file) {
      setError('กรุณาเลือกไฟล์เรซูเม่')
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
        setError('อัปโหลดไฟล์ล้มเหลว: ' + uploadError.message)
        setLoading(false)
        return
      }

      // สร้าง URL สำหรับเข้าถึงไฟล์
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      // บันทึกลงตาราง analyses (สถานะ pending รอวิเคราะห์)
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
        setError('บันทึกข้อมูลล้มเหลว: ' + insertError.message)
        setLoading(false)
        return
      }

      alert('อัปโหลดสำเร็จ! กำลังไปยังหน้าวิเคราะห์...')
      router.push(`/dashboard/analyze/${analysis.id}`)

    } catch (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <AuthLayout requiredRole="member">
      <h1 className="text-2xl font-bold mb-6">วิเคราะห์เรซูเม่</h1>

      <div className="max-w-2xl bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* เลือกตำแหน่งงาน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ตำแหน่งงานที่ต้องการสมัคร
            </label>

            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useCustom}
                  onChange={() => setUseCustom(false)}
                  className="text-blue-600"
                />
                <span className="text-sm">เลือกจากรายการ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useCustom}
                  onChange={() => setUseCustom(true)}
                  className="text-blue-600"
                />
                <span className="text-sm">กรอกเอง</span>
              </label>
            </div>

            {!useCustom ? (
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- เลือกตำแหน่งงาน --</option>
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
                placeholder="กรอกตำแหน่งงานในสายงาน IT"
              />
            )}
          </div>

          {/* Upload ไฟล์ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อัปโหลดเรซูเม่
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
                    <p className="text-xs text-blue-500 mt-2">คลิกเพื่อเปลี่ยนไฟล์</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500">คลิกเพื่อเลือกไฟล์</p>
                    <p className="text-xs text-gray-400 mt-1">รองรับ PDF และ DOCX (สูงสุด 5MB)</p>
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
            {loading ? 'กำลังอัปโหลด...' : 'วิเคราะห์เรซูเม่'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
