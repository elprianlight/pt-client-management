import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, ptPackages, clients } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { SessionForm } from '@/components/sessions/session-form'
import { getSessionById } from '@/lib/actions/session'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Edit Sesi' }

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const sessionData = await getSessionById(resolvedParams.id)
  if (!sessionData) return notFound()

  // Ambil paket yang sedang dipakai oleh sesi ini
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
  .where(eq(ptPackages.id, sessionData.packageId))

  const packageOptions = activePackages.map(p => ({
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    remaining: p.totalSessions - p.usedSessions,
  }))

  const initialData = {
    ...sessionData,
    scheduledAt: format(new Date(sessionData.scheduledAt), "yyyy-MM-dd'T'HH:mm")
  }

  return (
    <div className="page-container">
      <div className="new-client-header animate-fade-in-up">
        <Link href="/session" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Jadwal Sesi
        </Link>
        <div className="new-client-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))', borderColor: 'rgba(59,130,246,0.25)', color: '#3b82f6' }}>
            <Edit size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-client-title">Edit Sesi Latihan</h2>
            <p className="new-client-desc">
              Perbarui detail sesi latihan yang telah dijadwalkan.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card new-client-card animate-fade-in-up">
        <SessionForm packages={packageOptions} initialData={initialData} />
      </div>
    </div>
  )
}
