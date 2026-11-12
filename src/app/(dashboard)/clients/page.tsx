import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { listClients, getClientCount } from '@/lib/actions/client'
import { ClientListClient } from '@/components/clients/client-list-client'
import { PageHero } from '@/components/ui/page-hero'

export const metadata: Metadata = { title: 'Client' }

export default async function ClientsPage() {
  const supabase = await createClient()

  // Fetch auth and client data concurrently in 1 roundtrip
  const [authRes, clientList, totalCount] = await Promise.all([
    supabase.auth.getUser(),
    listClients(),
    getClientCount(),
  ])

  const user = authRes.data?.user
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  return (
    <div className="page-container">
      <PageHero
        eyebrow="Client Management"
        title="Kelola Client & Progres Latihan"
        subtitle="Pantau paket, sisa sesi, dan aktivitas setiap client dalam satu tampilan."
        chips={[`${totalCount} CLIENT`]}
      />
      <ClientListClient initialData={clientList} totalCount={totalCount} />
    </div>
  )
}
