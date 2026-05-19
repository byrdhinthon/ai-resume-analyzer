'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminUserDetailPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLanguage()
  const [profile, setProfile] = useState(null)
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleMsg, setRoleMsg] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: profileData } = await supabase
        .from('profiles').select('id, username, email, role, student_id, first_name, last_name, created_at').eq('id', id).single()
      setProfile(profileData)

      const { data: analysesData } = await supabase
        .from('analyses').select('id, file_name, job_position, total_score, status, created_at').eq('user_id', id).order('created_at', { ascending: false })
      setAnalyses(analysesData || [])
      setLoading(false)
    }
    loadData()
  }, [id])

  const completedAnalyses = analyses.filter(a => a.status === 'completed')
  const averageScore = completedAnalyses.length > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.total_score, 0) / completedAnalyses.length)
    : 0
  const jobPositions = [...new Set(analyses.map(a => a.job_position))]

  async function changeRole(newRole) {
    if (!profile || newRole === profile.role) return
    setRoleLoading(true)
    setRoleMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: id, newRole })
      })
      const result = await res.json()
      if (res.ok) {
        setProfile(prev => ({ ...prev, role: newRole }))
        setRoleMsg(t('admin.userDetail.roleUpdated'))
      } else {
        setRoleMsg(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch {
      setRoleMsg('เกิดข้อผิดพลาด')
    }
    setRoleLoading(false)
    setTimeout(() => setRoleMsg(''), 3000)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: id })
      })
      const result = await res.json()
      if (res.ok) {
        router.push('/admin/users')
      } else {
        const errKey = `admin.userDetail.${result.error === 'CANNOT_DELETE_SELF' ? 'cannotDeleteSelf' : 'deleteFailed'}`
        setDeleteMsg(t(errKey))
        setShowDeleteConfirm(false)
      }
    } catch {
      setDeleteMsg(t('admin.userDetail.deleteFailed'))
      setShowDeleteConfirm(false)
    }
    setDeleting(false)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return '#D97706'
    return '#DC2626'
  }

  const getStatusStyle = (status) => {
    if (status === 'completed') return { bg: '#DCFCE7', color: '#16A34A', text: t('admin.userDetail.completed') }
    if (status === 'pending') return { bg: '#FEF3C7', color: '#D97706', text: t('admin.userDetail.pending') }
    return { bg: '#FEE2E2', color: '#DC2626', text: t('admin.userDetail.failed') }
  }

  if (loading) {
    return (
      <AuthLayout requiredRole="admin">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div style={{
            width: 36, height: 36, border: '3px solid var(--primary-light)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </AuthLayout>
    )
  }

  if (!profile) {
    return (
      <AuthLayout requiredRole="admin">
        <p style={{ color: '#DC2626', marginBottom: 16 }}>{t('admin.userDetail.notFound')}</p>
        <Link href="/admin/users" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
          ← {t('admin.userDetail.back')}
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout requiredRole="admin">
      <div>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link href="/admin/users" style={{ fontSize: 13, color: 'var(--text-gray)', textDecoration: 'none' }}>
            ← {t('admin.userDetail.back')}
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-dark)' }}>
            {t('admin.userDetail.title')}
          </h1>
        </div>

        {/* Profile card */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 4 }}>{t('admin.userDetail.username')}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{profile.username}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 4 }}>{t('admin.userDetail.email')}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{profile.email}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 4 }}>{t('admin.userDetail.studentId')}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>{profile.student_id || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 4 }}>{t('admin.userDetail.date')}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>
                {new Date(profile.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Role changer */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 8 }}>{t('admin.userDetail.changeRole')}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {['member', 'professor', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => changeRole(role)}
                  disabled={roleLoading || role === profile.role}
                  style={{
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 99,
                    border: role === profile.role ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: role === profile.role
                      ? (role === 'admin' ? '#F3E8FF' : role === 'professor' ? '#DBEAFE' : 'var(--primary-light)')
                      : 'var(--surface)',
                    color: role === profile.role
                      ? (role === 'admin' ? '#7C3AED' : role === 'professor' ? '#2563EB' : 'var(--primary)')
                      : 'var(--text-gray)',
                    cursor: roleLoading || role === profile.role ? 'default' : 'pointer',
                    opacity: roleLoading ? 0.6 : 1,
                    transition: 'all 0.15s'
                  }}
                >
                  {role === 'member' ? t('admin.userDetail.roleMember')
                    : role === 'professor' ? t('admin.userDetail.roleProfessor')
                    : t('admin.userDetail.roleAdmin')}
                </button>
              ))}
              {roleLoading && (
                <div style={{
                  width: 20, height: 20, border: '2px solid var(--primary-light)',
                  borderTopColor: 'var(--primary)', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              )}
            </div>
            {roleMsg && (
              <p style={{
                fontSize: 13, marginTop: 8,
                color: roleMsg.includes('สำเร็จ') || roleMsg.includes('success') ? '#16A34A' : '#DC2626'
              }}>{roleMsg}</p>
            )}
          </div>

          {/* Delete user */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{t('admin.userDetail.deleteUser')}</p>
                <p style={{ fontSize: 12, color: 'var(--text-gray)', marginTop: 2 }}>{t('admin.userDetail.deleteWarning')}</p>
              </div>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 600,
                    borderRadius: 99, border: '1px solid #DC2626',
                    background: 'transparent', color: '#DC2626',
                    cursor: 'pointer', transition: 'all 0.15s',
                    flexShrink: 0
                  }}
                >
                  {t('admin.userDetail.deleteUser')}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    style={{
                      padding: '8px 20px', fontSize: 13, fontWeight: 600,
                      borderRadius: 99, border: '1px solid var(--border)',
                      background: 'var(--surface)', color: 'var(--text-gray)',
                      cursor: 'pointer'
                    }}
                  >
                    {t('admin.userDetail.cancel')}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      padding: '8px 20px', fontSize: 13, fontWeight: 600,
                      borderRadius: 99, border: 'none',
                      background: '#DC2626', color: '#fff',
                      cursor: deleting ? 'wait' : 'pointer',
                      opacity: deleting ? 0.6 : 1
                    }}
                  >
                    {deleting ? '...' : t('admin.userDetail.confirmDelete')}
                  </button>
                </div>
              )}
            </div>
            {deleteMsg && (
              <p style={{ fontSize: 13, marginTop: 8, color: '#DC2626' }}>{deleteMsg}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
          {[
            { label: t('admin.userDetail.analyzeCount'), value: completedAnalyses.length, color: 'var(--primary)' },
            {
              label: t('admin.userDetail.averageScore'),
              value: completedAnalyses.length > 0 ? `${averageScore}` : '-',
              sub: completedAnalyses.length > 0 ? '/100' : '',
              color: completedAnalyses.length > 0 ? getScoreColor(averageScore) : 'var(--text-light)'
            },
            { label: t('admin.userDetail.interestedPositions'), value: jobPositions.length, color: 'var(--primary)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-gray)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-light)' }}>{s.sub}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Past positions */}
        {jobPositions.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 12 }}>
              {t('admin.userDetail.pastPositions')}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {jobPositions.map(pos => (
                <span key={pos} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 99,
                  background: 'var(--input-bg)', color: 'var(--text-gray)',
                  border: '1px solid var(--border)'
                }}>
                  {pos}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* History table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            {t('admin.userDetail.history')}
          </h2>
          {analyses.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '40px 20px', fontSize: 14 }}>
              {t('admin.userDetail.noHistory')}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[t('history.date'), t('history.file'), t('history.position'), t('history.score'), t('history.status')].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i >= 3 ? 'center' : 'left',
                      padding: '12px 16px', fontSize: 12, fontWeight: 600,
                      color: 'var(--text-gray)', background: 'var(--input-bg)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyses.map(item => {
                  const s = getStatusStyle(item.status)
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-gray)' }}>
                        {new Date(item.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                        {item.file_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                        {item.job_position}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {item.total_score !== null ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(item.total_score) }}>
                            {item.total_score}/100
                          </span>
                        ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 99,
                          background: s.bg, color: s.color
                        }}>{s.text}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
