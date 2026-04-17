'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/LanguageContext'

export default function Home() {
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        // ถ้ายังไม่ login → ไปหน้า login
        router.push('/login')
        return
      }

      // ถ้า login อยู่แล้ว → ไป dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">{t('common.loading')}</p>
    </div>
  )
}
