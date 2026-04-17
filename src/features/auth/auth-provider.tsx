import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient, hasSupabaseEnv } from '../../lib/supabase/client'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isLoading: boolean
  isConfigured: boolean
  signInWithMagicLink: (email: string) => Promise<{ errorMessage?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()
  const isConfigured = hasSupabaseEnv()

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      setSession(data.session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isConfigured,
      async signInWithMagicLink(email: string) {
        if (!supabase) {
          return { errorMessage: 'Missing Supabase configuration.' }
        }

        const explicitRedirect = import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined
        const emailRedirectTo = explicitRedirect || (import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin)

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo,
          },
        })

        if (error) {
          return { errorMessage: error.message }
        }

        return {}
      },
      async signOut() {
        if (!supabase) return
        await supabase.auth.signOut()
      },
    }),
    [isConfigured, isLoading, session, supabase],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
