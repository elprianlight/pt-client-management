import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/register', '/forgot-password']
const PROTECTED_BASE = ['/dashboard', '/pt', '/clients', '/packages', '/workout', '/session', '/nutrition', '/progress', '/reports', '/settings']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            const customOptions = { ...options, maxAge: 6 * 60 * 60 }
            supabaseResponse.cookies.set(name, value, customOptions)
          })
        },
      },
    }
  )

  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some((c) => c.name.includes('auth-token') || c.name.startsWith('sb-'))

  let user = null
  if (hasAuthCookie) {
    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
      const userPromise = supabase.auth.getUser().then((res) => res.data?.user ?? null)
      user = await Promise.race([userPromise, timeoutPromise])
    } catch {
      user = null
    }
  }

  const pathname = request.nextUrl.pathname

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isProtectedRoute = PROTECTED_BASE.some((r) => pathname.startsWith(r))

  // Not logged in → redirect to login
  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in → redirect away from auth pages
  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Root → redirect based on auth state
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
