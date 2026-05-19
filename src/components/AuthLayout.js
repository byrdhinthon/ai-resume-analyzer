'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useProfile } from '@/lib/ProfileContext'

export default function AuthLayout({ children, requiredRole }) {
  const router = useRouter()
  const { user, profile, loading } = useProfile()

  useEffect(() => {
    if (loading) return

    if (!user || !profile) {
      router.push('/login')
      return
    }

    // Admin can access everything; professor pages are also open to admin
    const hasAccess = !requiredRole
      || profile.role === requiredRole
      || (profile.role === 'admin' && (requiredRole === 'professor' || requiredRole === 'member'))
    if (!hasAccess) {
      if (profile.role === 'professor') router.push('/professor')
      else router.push('/dashboard')
    }
  }, [loading, user, profile, router, requiredRole])

  if (loading || !user || !profile) {
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
        <Sidebar role={profile.role} requiredRole={requiredRole} />
        <main className="flex-1 p-6 min-w-0" style={{ maxWidth: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
