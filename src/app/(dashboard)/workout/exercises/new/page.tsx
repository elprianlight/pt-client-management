import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { ExerciseForm } from '@/components/workout/exercise-form'

export const metadata: Metadata = { title: 'Tambah Gerakan' }

export default async function NewExercisePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/workout')

  return (
    <div className="page-container">
      <div className="new-client-header animate-fade-in-up">
        <Link href="/workout?tab=library" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Library
        </Link>
        <div className="new-client-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(59,130,246,0.2))', borderColor: 'rgba(56,189,248,0.25)', color: '#0ea5e9' }}>
            <Dumbbell size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-client-title">Tambah Gerakan Latihan</h2>
            <p className="new-client-desc">
              Perkaya library latihan Anda dengan menambahkan gerakan baru.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card new-client-card animate-fade-in-up">
        <ExerciseForm />
      </div>
    </div>
  )
}
