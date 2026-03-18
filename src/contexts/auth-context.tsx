'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    full_name: string
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useRef(createClient()).current
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        setProfile(data ?? null)
      } catch {
        setProfile(null)
      }
    },
    // supabase is a stable ref — will never change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Eagerly fetch the current session + subscribe to future auth changes
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )
    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Safety-net: if loading hasn't resolved after 5 s, force it off
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn('[AuthProvider] Loading timeout — forcing loading=false')
        return false
      })
    }, 5000)
    return () => clearTimeout(timeout)
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error as Error | null }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const signUp = useCallback(
    async (email: string, password: string, full_name: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } },
      })
      return { error: error as Error | null }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}