'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'

export function useClerkSupabaseClient() {
  const { session } = useSession()

  // Return null if session is not loaded yet
  if (!session) return null

  // Create a Supabase client that automatically uses Clerk token
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      async accessToken() {
        return session.getToken() ?? null
      },
    }
  )
}

