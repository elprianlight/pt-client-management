import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Dumbbell, Plus } from 'lucide-react'
import Link from 'next/link'
import { ExerciseList } from '@/components/workout/exercise-list'
import { ProgramList } from '@/components/workout/program-list'
import { listExercises, listPrograms } from '@/lib/actions/workout'

export const metadata: Metadata = { title: 'Workout Builder' }

export default async function WorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')
  if (profile.role === 'super_admin' || profile.role === 'personal_trainer') redirect('/clients')

  const params = await searchParams
  const activeTab = params.tab || 'programs'

  const exercises = await listExercises()
  const programs = await listPrograms()

  return (
    <div className="page-container">

      <div className="tabs animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Link href="/workout?tab=programs" className={`tab-item ${activeTab === 'programs' ? 'active' : ''}`}>
          Program Latihan
        </Link>
        <Link href="/workout?tab=library" className={`tab-item ${activeTab === 'library' ? 'active' : ''}`}>
          Library Gerakan
        </Link>
      </div>

      <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.2s', marginTop: '16px' }}>
        {activeTab === 'programs' ? (
          <ProgramList data={programs} />
        ) : (
          <ExerciseList data={exercises} />
        )}
      </div>

    </div>
  )
}
