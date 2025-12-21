import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const publicRoutes = ['/login', '/set-password']
  if (!session && !publicRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect('/login')
  }
  return res
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
