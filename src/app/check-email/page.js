'use client'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function CheckEmailPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
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

      <div className="flex-1 flex items-center justify-center px-4">
        <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="var(--primary)" strokeWidth="2"/>
              <path d="m22 6-10 7L2 6" stroke="var(--primary)" strokeWidth="2"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>
            {t('auth.checkEmailTitle')}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.6 }}>
            {t('auth.checkEmailDesc')}
          </p>

          <div className="card" style={{ borderRadius: 'var(--radius-lg)', padding: 32 }}>
            <div style={{
              background: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: 20
            }}>
              <p style={{ fontSize: 14, color: 'var(--primary)', lineHeight: 1.6 }}>
                {t('auth.checkEmailTip')}
              </p>
            </div>

            <Link
              href="/login"
              className="btn-primary"
              style={{
                display: 'block', width: '100%', padding: '14px',
                fontSize: 15, textDecoration: 'none', textAlign: 'center'
              }}
            >
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
