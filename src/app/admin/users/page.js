'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function AdminUsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase
        .from('profiles').select('*').order('created_at', { ascending: false })
      setUsers(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    loadUsers()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users)
    } else {
      const q = search.toLowerCase()
      setFiltered(users.filter(u =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      ))
    }
    setPage(1)
  }, [search, users])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <AuthLayout requiredRole="admin">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 24 }}>
          {t('admin.users.title')}
        </h1>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div className="input-wrap" style={{ maxWidth: 380 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('admin.users.search')}
            />
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-gray)', marginBottom: 16 }}>
          {t('admin.users.total')} <strong style={{ color: 'var(--text-dark)' }}>{filtered.length}</strong> {t('admin.users.person')}
        </p>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 36, height: 36, border: '3px solid var(--primary-light)',
              borderTopColor: 'var(--primary)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <p style={{ color: 'var(--text-gray)' }}>{t('admin.users.notFound')}</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[t('admin.users.username'), t('admin.users.email'), t('admin.users.role'), t('admin.users.date'), ''].map((h, i) => (
                      <th key={i} style={{
                        textAlign: i >= 2 ? 'center' : 'left',
                        padding: '14px 16px', fontSize: 13, fontWeight: 600,
                        color: 'var(--text-gray)', background: 'var(--input-bg)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>
                        {user.username}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-gray)' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                          background: user.role === 'admin' ? '#F3E8FF' : 'var(--primary-light)',
                          color: user.role === 'admin' ? '#7C3AED' : 'var(--primary)'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-gray)' }}>
                        {new Date(user.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <Link
                          href={`/admin/users/${user.id}`}
                          style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
                        >
                          {t('admin.users.detail')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  {t('admin.users.prev')}
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-gray)', padding: '0 8px' }}>
                  {t('admin.users.page')} {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  {t('admin.users.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  )
}
