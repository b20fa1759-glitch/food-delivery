import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still checking, null = logged out, object = logged in
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  // 1. Check if someone is already logged in, then listen for login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    )
    return () => subscription.unsubscribe() // stop listening when app closes
  }, [])

  const userId = session === undefined ? undefined : (session?.user?.id ?? null)

  // 2. When a user logs in, load their row from the profiles table (name, role)
  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfile(data ?? { id: userId, full_name: '', role: 'customer' }))
  }, [userId])

  const currentProfile = userId && profile?.id === userId ? profile : null
  const loading = userId === undefined || (userId !== null && !currentProfile)

  const value = {
    user: session?.user ?? null,
    profile: currentProfile,
    isAdmin: currentProfile?.role === 'admin',
    loading,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Any component can call useAuth() to get the user
export function useAuth() {
  return useContext(AuthContext)
}
