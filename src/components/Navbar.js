'use client'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function Navbar({ profile }) {
  const router = useRouter()
  const { locale, toggleLanguage, t } = useLanguage()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={profile?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div className="icon-wrap" style={{ width: 36, height: 36, borderRadius: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: 'var(--text-dark)', fontWeight: 700, fontSize: 16 }}>
            {t('app.name')}
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            style={{
              background: 'var(--input-bg)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-gray)',
              cursor: 'pointer'
            }}
          >
            {t('nav.language')}
          </button>
          <span style={{ fontSize: 14, color: 'var(--text-gray)' }} className="hidden sm:inline">
            {profile?.username}
          </span>
          <span style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: 'var(--radius-pill)',
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 600
          }}>
            {profile?.role}
          </span>
          <button onClick={handleLogout} className="btn-primary" style={{ padding: '7px 18px', fontSize: 13 }}>
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  )
}
