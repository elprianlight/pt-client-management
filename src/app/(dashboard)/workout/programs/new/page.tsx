import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, clients, personalTrainers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { ProgramForm } from '@/components/workout/program-form'

export const metadata: Metadata = { title: 'Buat Program Latihan' }

export default async function NewProgramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/workout')

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
        <Link href="/workout?tab=programs" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Daftar Program
        </Link>
        <div className="new-client-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(59,130,246,0.2))', borderColor: 'rgba(56,189,248,0.25)', color: '#0ea5e9' }}>
            <Dumbbell size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-client-title">Buat Program Latihan</h2>
            <p className="new-client-desc">
              Rancang program latihan untuk klien Anda atau buat sebagai template umum.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card new-client-card animate-fade-in-up">
        <ProgramForm clients={myClients} />
      </div>
    </div>
  )
}
