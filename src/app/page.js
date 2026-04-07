'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [status, setStatus] = useState('กำลังเชื่อมต่อ...')

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setStatus('เชื่อมต่อล้มเหลว: ' + error.message)
      } else {
        setStatus('เชื่อมต่อ Supabase สำเร็จ!')
      }
    }
    testConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">{status}</h1>
    </div>
  )
}