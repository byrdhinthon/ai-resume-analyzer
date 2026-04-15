'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState([])
  const [customPositions, setCustomPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')
  const { t } = useLanguage()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // ดึงตำแหน่งงานจาก job_positions
    const { data: posData } = await supabase
      .from('job_positions')
      .select('*')
      .order('id')

    setPositions(posData || [])

    // ดึงตำแหน่งที่ผู้ใช้กรอกเองจาก analyses
    const { data: analysesData } = await supabase
      .from('analyses')
      .select('job_position')

    if (analysesData && posData) {
      const officialNames = posData.map(p => p.name)
      const custom = [...new Set(
        analysesData
          .map(a => a.job_position)
          .filter(name => !officialNames.includes(name))
      )]
      setCustomPositions(custom)
    }

    setLoading(false)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setError('')

    const { error } = await supabase
      .from('job_positions')
      .insert({ name: newName.trim() })

    if (error) {
      setError(error.message)
      return
    }

    setNewName('')
    setShowAdd(false)
    loadData()
  }

  async function handleEdit(id) {
    if (!editName.trim()) return
    setError('')

    const { error } = await supabase
      .from('job_positions')
      .update({ name: editName.trim() })
      .eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    setEditId(null)
    setEditName('')
    loadData()
  }

  async function handleDelete(id, name) {
    if (!confirm(t('admin.positions.deleteConfirm').replace('{name}', name))) return

    const { error } = await supabase
      .from('job_positions')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    loadData()
  }

  async function handleToggleActive(id, currentActive) {
    await supabase
      .from('job_positions')
      .update({ active: !currentActive })
      .eq('id', id)

    loadData()
  }

  return (
    <AuthLayout requiredRole="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('admin.positions.title')}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          {t('admin.positions.add')}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* เพิ่มตำแหน่งใหม่ */}
      {showAdd && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <h2 className="text-sm font-medium mb-2">{t('admin.positions.addNew')}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('admin.positions.name')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
              {t('common.save')}
            </button>
            <button onClick={() => { setShowAdd(false); setNewName('') }} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : (
        <>
          {/* ตารางตำแหน่งงาน */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t('admin.positions.id')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">{t('admin.positions.posName')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">{t('admin.positions.status')}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">{t('admin.positions.manage')}</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{pos.id}</td>
                    <td className="px-4 py-3 text-sm">
                      {editId === pos.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleEdit(pos.id)}
                          />
                          <button onClick={() => handleEdit(pos.id)} className="text-green-600 text-sm hover:underline">{t('common.save')}</button>
                          <button onClick={() => setEditId(null)} className="text-gray-500 text-sm hover:underline">{t('common.cancel')}</button>
                        </div>
                      ) : (
                        <span className={pos.active ? '' : 'text-gray-400 line-through'}>{pos.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(pos.id, pos.active)}
                        className={`text-xs px-2 py-1 rounded-full ${
                          pos.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {pos.active ? t('admin.positions.active') : t('admin.positions.inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => { setEditId(pos.id); setEditName(pos.name) }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(pos.id, pos.name)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ตำแหน่งที่ผู้ใช้กรอกเอง */}
          {customPositions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-3">{t('admin.positions.customTitle')}</h2>
              <p className="text-sm text-gray-500 mb-3">{t('admin.positions.customDesc')}</p>
              <div className="flex flex-wrap gap-2">
                {customPositions.map((name) => (
                  <span key={name} className="px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-full text-sm">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AuthLayout>
  )
}
