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
    <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={profile?.role === 'admin' ? '/admin' : '/dashboard'} className="text-lg md:text-xl font-bold text-blue-600">
          {t('app.name')}
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 text-xs font-medium border rounded hover:bg-gray-50"
          >
            {t('nav.language')}
          </button>
          <span className="hidden sm:inline text-sm text-gray-600">
            {profile?.username}
          </span>
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
            {profile?.role}
          </span>
          <button
            onClick={handleLogout}
            className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  )
}