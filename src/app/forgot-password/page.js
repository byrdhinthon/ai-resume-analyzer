'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { t } = useLanguage()

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
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
            {t('auth.forgotPassword')}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-gray)', textAlign: 'center', marginBottom: 32 }}>
            Enter your email and we'll send you a reset link
          </p>

          <div className="card" style={{ borderRadius: 'var(--radius-lg)', padding: 32 }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                {/* Success icon */}
                <div style={{
                  width: 64, height: 64,
                  background: '#DCFCE7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 8 }}>
                  {t('auth.resetSent')}
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-gray)', marginBottom: 24 }}>
                  {t('auth.checkEmail')} <strong style={{ color: 'var(--text-dark)' }}>{email}</strong>
                </p>
                <Link href="/login" className="btn-primary" style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none' }}>
                  {t('auth.backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dark)', display: 'block', marginBottom: 8 }}>
                    {t('auth.email')}
                  </label>
                  <div className="input-wrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
                      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2"/>
                      <path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder={t('auth.emailRegistered')}
                    />
                  </div>
                </div>

                {error && (
                  <p style={{ fontSize: 13, color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: 10 }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 15 }}
                >
                  {loading ? t('auth.sending') : t('auth.sendReset')}
                </button>

                <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-gray)' }}>
                  <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
                    {t('auth.backToLogin')}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
