import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { JadwalView } from '@/components/jadwal/jadwal-view'
import { PageHero } from '@/components/ui/page-hero'

export const metadata: Metadata = {
  title: 'Jadwal & Check-In — Strength Lab / Elprian Training',
  description: 'Ringkasan analisa performa sesi latihan mingguan dan jadwal aktivitas client.',
}

export default async function JadwalPage({
  searchParams,
}: {
  searchParams?: Promise<{ new?: string; packageId?: string; clientId?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const initialOpenNew = resolvedParams?.new === 'true' || Boolean(resolvedParams?.packageId)
  const defaultPackageId = resolvedParams?.packageId
  const defaultClientId = resolvedParams?.clientId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')

  return (
    <div className="page-container" style={{ paddingTop: 4 }}>
      <PageHero
        eyebrow="Jadwal & Check-In"
        title="Jadwal Sesi Latihan"
        subtitle="Atur sesi, catat check-in, dan lihat performa mingguan tim Anda."
      />
      <JadwalView
        initialOpenNew={initialOpenNew}
        defaultPackageId={defaultPackageId}
        defaultClientId={defaultClientId}
      />
    </div>
  )
}
