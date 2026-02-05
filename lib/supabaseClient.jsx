'use client'

import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Standard client for non-authenticated calls or backward compatibility
// Safe initialization to prevent "supabaseKey is required" crash
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export function useClerkSupabaseClient() {
  const { session } = useSession()
  const [client, setClient] = useState(null)

  useEffect(() => {
    // If keys are missing, we can't create a client
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables are missing.")
      return
    }

    if (!session) {
      setClient(null)
      return
    }

    const initClient = async () => {
      try {
        const token = await session.getToken({ template: 'supabase' })

        if (!token) {
          console.warn("No 'supabase' JWT template found in Clerk or user not authenticated.")
          // Fallback to anonymous client if possible, or null
          setClient(supabase)
          return
        }

        const cl = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              // Explicitly include apikey to prevent "No API key found" error
              apikey: supabaseKey,
              Authorization: `Bearer ${token}`,
            },
          },
        })
        setClient(cl)
      } catch (error) {
        console.error("Error initializing authenticated Supabase client:", error)
        setClient(supabase) // Fallback
      }
    }

    initClient()
  }, [session])

  return client
}
