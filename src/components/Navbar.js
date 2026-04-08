'use client'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Navbar({ profile }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={profile?.role === 'admin' ? '/admin' : '/dashboard'} className="text-xl font-bold text-blue-600">
          AI Resume Analyzer
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {profile?.username}
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
              {profile?.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  )
}
