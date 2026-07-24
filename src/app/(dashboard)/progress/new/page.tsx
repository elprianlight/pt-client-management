import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, clients, personalTrainers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ProgressForm } from '@/components/progress/progress-form'

export const metadata: Metadata = { title: 'Catat Progress' }

export default async function NewProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/progress')

  // Dapatkan daftar klien milik PT
  let myClients: any[] = []
  if (profile.role === 'personal_trainer') {
    const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, profile.id))
    if (ptData) {
      myClients = await db.select({
        id: clients.id,
        name: users.fullName,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(eq(clients.trainerId, ptData.id))
    }
  }

  return (
    <div className="page-container">
      <div className="new-client-header animate-fade-in-up">
        <Link href="/progress" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Progress
        </Link>
        <div className="new-client-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(21,128,61,0.2))', borderColor: 'rgba(34,197,94,0.25)', color: '#22c55e' }}>
            <TrendingUp size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-client-title">Catat Data Pengukuran</h2>
            <p className="new-client-desc">
              Masukkan metrik tubuh klien terbaru untuk melacak progress mereka.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card new-client-card animate-fade-in-up">
        <ProgressForm clients={myClients} />
      </div>
    </div>
  )
}
