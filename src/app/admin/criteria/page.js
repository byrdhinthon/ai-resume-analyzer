'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'

export default function AdminCriteriaPage() {
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCriteria()
  }, [])

  async function loadCriteria() {
    const { data } = await supabase
      .from('scoring_criteria')
      .select('*')
      .order('id')

    setCriteria(data || [])
    setLoading(false)
  }

  function startEdit(item) {
    setEditId(item.id)
    setEditData({
      label: item.label,
      max_score: item.max_score,
      description: item.description || ''
    })
    setMessage('')
  }

  async function handleSave(id) {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('scoring_criteria')
      .update({
        label: editData.label,
        max_score: parseInt(editData.max_score),
        description: editData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      setMessage('บันทึกล้มเหลว: ' + error.message)
    } else {
      setMessage('บันทึกสำเร็จ')
      setEditId(null)
      loadCriteria()
    }
    setSaving(false)
  }

  const totalMaxScore = criteria.reduce((sum, c) => sum + c.max_score, 0)

  return (
    <AuthLayout requiredRole="admin">
      <h1 className="text-2xl font-bold mb-2">จัดการเกณฑ์การประเมิน</h1>
      <p className="text-sm text-gray-500 mb-6">
        คะแนนรวมทั้งหมด: <strong className={totalMaxScore === 100 ? 'text-green-600' : 'text-red-600'}>{totalMaxScore}/100</strong>
        {totalMaxScore !== 100 && ' (ควรเท่ากับ 100)'}
      </p>

      {message && (
        <p className={`text-sm mb-4 ${message.includes('ล้มเหลว') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">กำลังโหลด...</p>
      ) : (
        <div className="space-y-4">
          {criteria.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
              {editId === item.id ? (
                // โหมดแก้ไข
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวด</label>
                      <input
                        type="text"
                        value={editData.label}
                        onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">คะแนนเต็ม</label>
                      <input
                        type="number"
                        value={editData.max_score}
                        onChange={(e) => setEditData({ ...editData, max_score: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบายเกณฑ์</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(item.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:bg-gray-400"
                    >
                      {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                // โหมดแสดงผล
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold">{item.label}</h2>
                      <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {item.max_score} คะแนน
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      แก้ไขล่าสุด: {new Date(item.updated_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => startEdit(item)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    แก้ไข
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AuthLayout>
  )
}
