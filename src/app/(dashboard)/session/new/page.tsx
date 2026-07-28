import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, ptPackages, personalTrainers, clients } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { SessionForm } from '@/components/sessions/session-form'

export const metadata: Metadata = { title: 'Smart Check-In Latihan' }

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams?: Promise<{ packageId?: string; clientId?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const defaultPackageId = resolvedSearchParams?.packageId
  const defaultClientId = resolvedSearchParams?.clientId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  let trainerId: string | null = null
  if (profile.role === 'personal_trainer') {
    const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, profile.id))
    if (ptData) trainerId = ptData.id
  }

  let condition: any = sql`${ptPackages.usedSessions} < ${ptPackages.totalSessions}`
  if (trainerId) {
    condition = and(condition, eq(ptPackages.trainerId, trainerId))
  }

  // Ambil daftar paket aktif (kuota masih ada)
  const activePackages = await db.select({
    id: ptPackages.id,
    clientId: ptPackages.clientId,
    name: ptPackages.packageName,
    clientName: users.fullName,
    totalSessions: ptPackages.totalSessions,
    usedSessions: ptPackages.usedSessions,
  })
  .from(ptPackages)
  .innerJoin(clients, eq(ptPackages.clientId, clients.id))
  .innerJoin(users, eq(clients.userId, users.id))
  .where(condition)

  const packageOptions = activePackages.map(p => ({
    id: p.id,
    clientId: p.clientId,
    name: p.name,
    clientName: p.clientName,
    totalSessions: p.totalSessions,
    usedSessions: p.usedSessions,
    remaining: p.totalSessions - p.usedSessions,
  }))

  return (
    <div className="page-container" style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>
      {/* Main Client Form Component (Handles Header Banner & Styled JSX) */}
      <SessionForm
        packages={packageOptions}
        defaultPackageId={defaultPackageId}
        defaultClientId={defaultClientId}
      />
    </div>
  )
}
