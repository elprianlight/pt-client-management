import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const isDeleting = options?.maxAge === 0 || value === '' || (options?.expires && new Date(options.expires).getTime() <= Date.now())
              const customOptions = isDeleting
                ? { ...options, maxAge: 0 }
                : { ...options, maxAge: 6 * 60 * 60 }
              cookieStore.set(name, value, customOptions)
            })
          } catch {
            // Server Component - cookies can only be set in Server Actions / Route Handlers
          }
        },
      },
    }
  )
}

/**
 * Admin client menggunakan service_role key — bypass RLS
 * Digunakan di Server Actions untuk operasi admin (create user, dll)
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

