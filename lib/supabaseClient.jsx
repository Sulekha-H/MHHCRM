'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Standard client for non-authenticated calls or backward compatibility
// Safe initialization to prevent "supabaseKey is required" crash
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export function useClerkSupabaseClient() {
  const { session } = useSession()

  // Return null if session or keys are missing
  if (!session || !supabaseUrl || !supabaseKey) return null

  // Create a Supabase client that automatically uses Clerk token
  return createClient(supabaseUrl, supabaseKey, {
    async accessToken() {
      // Use the 'supabase' JWT template for consistent auth
      return session.getToken({ template: 'supabase' }) ?? null
    },
  })
}
