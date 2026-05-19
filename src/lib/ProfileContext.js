'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error || !authUser) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    setUser(authUser)

    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, role, student_id, first_name, last_name, created_at')
      .eq('id', authUser.id)
      .single()

    setProfile(data || null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // Allow manual refresh (e.g. after admin changes a role)
  const refreshProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('id, username, email, role, student_id, first_name, last_name, created_at')
      .eq('id', user.id)
      .single()
    setProfile(data || null)
  }, [user])

  return (
    <ProfileContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
