'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Minimal navbar */}
      <nav style={{ background: 'transparent', padding: '20px 32px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center gap-2">
          <div className="icon-wrap" style={{ width: 36, height: 36, borderRadius: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-dark)' }}>AI Resume Analyzer</span>
        </div>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div style={{ width: '100%', maxWidth: 460 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-dark)', textAlign: 'center', marginBottom: 8 }}>
            {t('auth.login')}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-gray)', textAlign: 'center', marginBottom: 32 }}>
            {t('auth.loginSubtitle')}
          </p>

          <div className="card" style={{ borderRadius: 'var(--radius-lg)', padding: 32 }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)', display: 'block', marginBottom: 8 }}>
                  {t('auth.email')}
                </label>
                <div className="input-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
                    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
                    <path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t('auth.emailPlaceholder')} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)', display: 'block', marginBottom: 8 }}>
                  {t('auth.password')}
                </label>
                <div className="input-wrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder={t('auth.passwordPlaceholder')} />
                </div>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: 10 }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 4 }}>
                {loading ? t('auth.logging') : t('auth.login')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/forgot-password" style={{ fontSize: 14, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                {t('auth.forgotPassword')}
              </Link>
              <p style={{ fontSize: 14, color: 'var(--text-gray)' }}>
                {t('auth.noAccount')}{' '}
                <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
