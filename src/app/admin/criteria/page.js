'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminCriteriaPage() {
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const { t } = useLanguage()

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
    setMessage(null)
  }

  async function handleSave(id) {
    setSaving(true)
    setMessage(null)

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
      setMessage({ type: 'error', text: t('admin.criteria.saveFailed') + error.message })
    } else {
      setMessage({ type: 'success', text: t('admin.criteria.saveSuccess') })
      setEditId(null)
      loadCriteria()
    }
    setSaving(false)
  }

  const totalMaxScore = criteria.reduce((sum, c) => sum + c.max_score, 0)

  return (
    <AuthLayout requiredRole="admin">
      <h1 className="text-2xl font-bold mb-2">{t('admin.criteria.title')}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {t('admin.criteria.totalScore')} <strong className={totalMaxScore === 100 ? 'text-green-600' : 'text-red-600'}>{totalMaxScore}/100</strong>
        {totalMaxScore !== 100 && t('admin.criteria.shouldBe100')}
      </p>

      {message && (
        <p className={`text-sm mb-4 ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : (
        <div className="space-y-4">
          {criteria.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
              {editId === item.id ? (
                // โหมดแก้ไข
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.criteria.categoryName')}</label>
                      <input
                        type="text"
                        value={editData.label}
                        onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.criteria.maxScore')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.criteria.description')}</label>
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
                      {saving ? t('admin.criteria.saving') : t('common.save')}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                    >
                      {t('common.cancel')}
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
                        {item.max_score} {t('admin.criteria.points')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t('admin.criteria.lastUpdated')} {new Date(item.updated_at).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => startEdit(item)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t('common.edit')}
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
