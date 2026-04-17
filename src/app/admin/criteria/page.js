'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminCriteriaPage() {
  const { t } = useLanguage()
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => { loadCriteria() }, [])

  async function loadCriteria() {
    const { data } = await supabase.from('scoring_criteria').select('*').order('id')
    setCriteria(data || [])
    setLoading(false)
  }

  function startEdit(item) {
    setEditId(item.id)
    setEditData({ label: item.label, max_score: item.max_score, description: item.description || '' })
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
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6 }}>
          {t('admin.criteria.title')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-gray)', marginBottom: 24 }}>
          {t('admin.criteria.totalScore')}{' '}
          <strong style={{ color: totalMaxScore === 100 ? '#16A34A' : '#DC2626' }}>
            {totalMaxScore}/100
          </strong>
          {totalMaxScore !== 100 && <span style={{ color: '#DC2626' }}> {t('admin.criteria.shouldBe100')}</span>}
        </p>

        {message && (
          <div style={{
            fontSize: 13, padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: message.type === 'error' ? '#FEF2F2' : '#DCFCE7',
            color: message.type === 'error' ? '#DC2626' : '#16A34A'
          }}>
            {message.text}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {criteria.map(item => (
              <div key={item.id} className="card" style={{ padding: 24 }}>
                {editId === item.id ? (
                  /* Edit mode */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>
                          {t('admin.criteria.categoryName')}
                        </label>
                        <div className="input-wrap">
                          <input
                            type="text"
                            value={editData.label}
                            onChange={e => setEditData({ ...editData, label: e.target.value })}
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>
                          {t('admin.criteria.maxScore')}
                        </label>
                        <div className="input-wrap">
                          <input
                            type="number"
                            value={editData.max_score}
                            onChange={e => setEditData({ ...editData, max_score: e.target.value })}
                            min="0" max="100"
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>
                        {t('admin.criteria.description')}
                      </label>
                      <textarea
                        value={editData.description}
                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                        rows={3}
                        style={{
                          width: '100%', padding: '10px 14px',
                          border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                          fontSize: 14, color: 'var(--text-dark)', background: 'var(--input-bg)',
                          resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={saving}
                        className="btn-primary"
                        style={{ padding: '10px 24px', fontSize: 14 }}
                      >
                        {saving ? t('admin.criteria.saving') : t('common.save')}
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="btn-secondary"
                        style={{ padding: '10px 20px', fontSize: 14 }}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-dark)' }}>{item.label}</h2>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                          background: 'var(--primary-light)', color: 'var(--primary)'
                        }}>
                          {item.max_score} {t('admin.criteria.points')}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6 }}>{item.category}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-gray)', lineHeight: 1.6 }}>{item.description}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
                        {t('admin.criteria.lastUpdated')} {new Date(item.updated_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(item)}
                      style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, marginLeft: 16, flexShrink: 0 }}
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
