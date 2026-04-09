'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'

export default function Sidebar({ role }) {
  const pathname = usePathname()
  const { t } = useLanguage()

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
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`block px-4 py-2 rounded-md text-sm ${
                pathname === link.href
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
  )
}