'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminPositionsPage() {
  const { t } = useLanguage()
  const [positions, setPositions] = useState([])
  const [customPositions, setCustomPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: posData } = await supabase.from('job_positions').select('*').order('id')
    setPositions(posData || [])

    const { data: analysesData } = await supabase.from('analyses').select('job_position')
    if (analysesData && posData) {
      const officialNames = posData.map(p => p.name)
      const custom = [...new Set(
        analysesData.map(a => a.job_position).filter(name => !officialNames.includes(name))
      )]
      setCustomPositions(custom)
    }
    setLoading(false)
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setError('')
    const { error } = await supabase.from('job_positions').insert({ name: newName.trim() })
    if (error) { setError(error.message); return }
    setNewName(''); setShowAdd(false); loadData()
  }

  async function handleEdit(id) {
    if (!editName.trim()) return
    setError('')
    const { error } = await supabase.from('job_positions').update({ name: editName.trim() }).eq('id', id)
    if (error) { setError(error.message); return }
    setEditId(null); setEditName(''); loadData()
  }

  async function handleDelete(id, name) {
    if (!confirm(t('admin.positions.deleteConfirm').replace('{name}', name))) return
    const { error } = await supabase.from('job_positions').delete().eq('id', id)
    if (error) { setError(error.message); return }
    loadData()
  }

  async function handleToggleActive(id, currentActive) {
    await supabase.from('job_positions').update({ active: !currentActive }).eq('id', id)
    loadData()
  }

  return (
    <AuthLayout requiredRole="admin">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)' }}>
            {t('admin.positions.title')}
          </h1>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: 14 }}
          >
            {t('admin.positions.add')}
          </button>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>
            {error}
          </p>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 12 }}>
              {t('admin.positions.addNew')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="input-wrap" style={{ flex: 1 }}>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t('admin.positions.name')}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  style={{ flex: 1 }}
                />
              </div>
              <button onClick={handleAdd} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                {t('common.save')}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewName('') }}
                className="btn-secondary"
                style={{ padding: '10px 20px', fontSize: 14 }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 36, height: 36, border: '3px solid var(--primary-light)',
              borderTopColor: 'var(--primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <>
            {/* Positions table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t('admin.positions.id'), t('admin.positions.posName'), t('admin.positions.status'), t('admin.positions.manage')].map((h, i) => (
                      <th key={i} style={{
                        textAlign: i >= 2 ? 'center' : 'left',
                        padding: '14px 16px', fontSize: 13, fontWeight: 600,
                        color: 'var(--text-gray)', background: 'var(--input-bg)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => (
                    <tr key={pos.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-light)' }}>{pos.id}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14 }}>
                        {editId === pos.id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div className="input-wrap" style={{ flex: 1, padding: '6px 12px' }}>
                              <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEdit(pos.id)}
                                style={{ flex: 1, fontSize: 13 }}
                              />
                            </div>
                            <button onClick={() => handleEdit(pos.id)} style={{ fontSize: 13, color: '#16A34A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                              {t('common.save')}
                            </button>
                            <button onClick={() => setEditId(null)} style={{ fontSize: 13, color: 'var(--text-gray)', background: 'none', border: 'none', cursor: 'pointer' }}>
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: pos.active ? 'var(--text-dark)' : 'var(--text-light)', textDecoration: pos.active ? 'none' : 'line-through' }}>
                            {pos.name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleToggleActive(pos.id, pos.active)}
                          style={{
                            fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                            border: 'none', cursor: 'pointer',
                            background: pos.active ? '#DCFCE7' : 'var(--input-bg)',
                            color: pos.active ? '#16A34A' : 'var(--text-gray)'
                          }}
                        >
                          {pos.active ? t('admin.positions.active') : t('admin.positions.inactive')}
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                          <button
                            onClick={() => { setEditId(pos.id); setEditName(pos.name) }}
                            style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(pos.id, pos.name)}
                            style={{ fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
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

            {/* Custom positions */}
            {customPositions.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 6 }}>
                  {t('admin.positions.customTitle')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-gray)', marginBottom: 14 }}>
                  {t('admin.positions.customDesc')}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {customPositions.map(name => (
                    <span key={name} style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 99,
                      background: '#FEFCE8', border: '1px solid #FDE047', color: '#92400E'
                    }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
