import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { listPTs, getPTCount } from '@/lib/actions/pt'
import { PTListClient } from '@/components/pt/pt-list-client'

export const metadata: Metadata = { title: 'Personal Trainer' }

export default async function PTPage() {
  const supabase = await createClient()

  // Fetch auth and PT data concurrently in 1 roundtrip
  const [authRes, ptList, totalCount] = await Promise.all([
    supabase.auth.getUser(),
    listPTs(),
    getPTCount(),
  ])

  const user = authRes.data?.user
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="page-container">
      <PTListClient initialData={ptList} totalCount={totalCount} />
    </div>
  )
}
