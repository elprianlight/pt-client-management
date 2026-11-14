import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { personalTrainers, ptPackages, users } from '@/lib/db/schema'
import { getSessionById } from '@/lib/actions/session'
import { LiveSession } from '@/components/sessions/live-session'

export const metadata: Metadata = { title: 'Sesi Berjalan' }

export default async function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, authUser.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const session = await getSessionById(id)
  if (!session) notFound()

  // PT hanya boleh membuka sesi klien miliknya
  if (profile.role === 'personal_trainer') {
    const [pt] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, profile.id))
    if (!pt || pt.id !== session.trainerId) notFound()
  }

  const [pkg] = await db.select().from(ptPackages).where(eq(ptPackages.id, session.packageId))

  return (
    <LiveSession
      session={{
        id: session.id,
        status: session.status,
        clientName: session.clientName ?? 'Klien',
        packageName: session.packageName ?? '',
        programType: session.programType,
        location: session.location,
        scheduledAt: session.scheduledAt.toISOString(),
        checkInAt: session.checkInAt ? session.checkInAt.toISOString() : null,
        duration: session.duration ?? 60,
        remaining: pkg ? pkg.totalSessions - pkg.usedSessions : null,
        total: pkg ? pkg.totalSessions : null,
        postpaid: pkg ? pkg.billingType === 'postpaid' : false,
      }}
    />
  )
}
