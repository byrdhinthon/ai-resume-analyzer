'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'

const icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  upload: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  history: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  briefcase: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  criteria: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export default function Sidebar({ role }) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const memberLinks = [
    { href: '/dashboard', label: t('sidebar.home'), icon: icons.home },
    { href: '/dashboard/analyze', label: t('sidebar.analyze'), icon: icons.upload },
    { href: '/dashboard/history', label: t('sidebar.history'), icon: icons.history },
  ]

  const adminLinks = [
    { href: '/admin', label: t('sidebar.home'), icon: icons.home },
    { href: '/admin/users', label: t('sidebar.users'), icon: icons.users },
    { href: '/admin/positions', label: t('sidebar.positions'), icon: icons.briefcase },
    { href: '/admin/criteria', label: t('sidebar.criteria'), icon: icons.criteria },
  ]

  const links = role === 'admin' ? adminLinks : memberLinks

  return (
    <>
      {/* Hamburger - mobile only */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-[4.5rem] left-3 z-50"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '6px 8px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`
          ${open ? 'fixed inset-y-0 left-0 translate-x-0 z-40' : 'hidden'}
          md:block md:static md:translate-x-0 md:z-auto
          min-h-screen w-56 p-4 pt-6
        `}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <ul className="space-y-1 mt-8 md:mt-0">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--primary)' : 'var(--text-gray)',
                    background: active ? 'var(--primary-light)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </aside>
    </>
  )
}
