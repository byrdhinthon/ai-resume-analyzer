'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AuthLayout({ children, requiredRole }) {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) {
        router.push('/login')
        return
      }

      // ถ้าต้องการ role เฉพาะ แต่ user ไม่ใช่ role นั้น
      if (requiredRole && data.role !== requiredRole) {
        if (data.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        return
      }

      setProfile(data)
      setLoading(false)
    }
    checkAuth()
  }, [router, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar profile={profile} />
      <div className="flex">
        <Sidebar role={profile.role} />
        <main className="flex-1 p-4 md:p-6 min-w-0 pl-12 md:pl-6 pt-4 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
