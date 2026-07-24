import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, ptPackages, personalTrainers, clients } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { ArrowLeft, CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import { SessionForm } from '@/components/sessions/session-form'

export const metadata: Metadata = { title: 'Jadwalkan Sesi' }

export default async function NewSessionPage() {
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
    name: p.name,
    clientName: p.clientName,
    remaining: p.totalSessions - p.usedSessions,
  }))

  return (
    <div className="page-container">
      <div className="new-client-header animate-fade-in-up">
        <Link href="/session" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Jadwal Sesi
        </Link>
        <div className="new-client-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(244,63,94,0.2))', borderColor: 'rgba(236,72,153,0.25)', color: '#ec4899' }}>
            <CalendarPlus size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-client-title">Jadwalkan Sesi Baru</h2>
            <p className="new-client-desc">
              Pilih paket client yang masih aktif untuk menjadwalkan pertemuan latihan.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card new-client-card animate-fade-in-up">
        <SessionForm packages={packageOptions} />
      </div>
    </div>
  )
}
