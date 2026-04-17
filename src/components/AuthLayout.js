'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useLanguage } from '@/lib/LanguageContext'

export default function AuthLayout({ children, requiredRole }) {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) { router.push('/login'); return }

      if (requiredRole && data.role !== requiredRole) {
        router.push(data.role === 'admin' ? '/admin' : '/dashboard')
        return
      }

      setProfile(data)
      setLoading(false)
    }
    checkAuth()
  }, [router, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid var(--primary-light)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar profile={profile} />
      <div className="flex">
        <Sidebar role={profile.role} />
        <main className="flex-1 p-6 min-w-0" style={{ maxWidth: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
