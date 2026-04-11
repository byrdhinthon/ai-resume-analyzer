'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'

export default function Sidebar({ role }) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const memberLinks = [
    { href: '/dashboard', label: t('sidebar.home') },
    { href: '/dashboard/analyze', label: t('sidebar.analyze') },
    { href: '/dashboard/history', label: t('sidebar.history') },
  ]

  const adminLinks = [
    { href: '/admin', label: t('sidebar.home') },
    { href: '/admin/users', label: t('sidebar.users') },
    { href: '/admin/positions', label: t('sidebar.positions') },
    { href: '/admin/criteria', label: t('sidebar.criteria') },
  ]

  const links = role === 'admin' ? adminLinks : memberLinks

  return (
    <>
      {/* Hamburger button - มือถือเท่านั้น */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-[4.5rem] left-2 z-50 p-1.5 bg-white border rounded-md shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay - มือถือ */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
            ${open ? 'fixed inset-y-0 left-0 translate-x-0 z-40' : 'hidden'}
            md:block md:static md:translate-x-0 md:z-auto
            bg-white border-r min-h-screen p-4 w-64
            transition-transform duration-200
          `}>

        <ul className="space-y-1 mt-8 md:mt-0">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm ${pathname === link.href
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}