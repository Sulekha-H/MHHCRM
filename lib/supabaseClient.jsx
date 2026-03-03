'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

export function useClerkSupabaseClient() {
  const { session } = useSession()

  const supabase = useMemo(() => {
    if (!session) return null

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY,
      {
        async accessToken() {
          return session.getToken() ?? null
        },
      }
    )
  }, [session]) // only recreate if session changes

  return supabase
}
