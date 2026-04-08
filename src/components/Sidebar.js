'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar({ role }) {
  const pathname = usePathname()

  const memberLinks = [
    { href: '/dashboard', label: 'หน้าหลัก' },
    { href: '/dashboard/analyze', label: 'วิเคราะห์เรซูเม่' },
    { href: '/dashboard/history', label: 'ประวัติการวิเคราะห์' },
  ]

  const adminLinks = [
    { href: '/admin', label: 'หน้าหลัก' },
    { href: '/admin/users', label: 'จัดการผู้ใช้งาน' },
    { href: '/admin/positions', label: 'จัดการตำแหน่งงาน' },
    { href: '/admin/criteria', label: 'จัดการเกณฑ์ประเมิน' },
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
