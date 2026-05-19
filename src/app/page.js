'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/ProfileContext'
import { useLanguage } from '@/lib/LanguageContext'

export default function Home() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user, profile, loading } = useProfile()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (profile?.role === 'admin') router.push('/admin')
    else if (profile?.role === 'professor') router.push('/professor')
    else router.push('/dashboard')
  }, [loading, user, profile, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">{t('common.loading')}</p>
    </div>
  )
}
