import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ProgressList } from '@/components/progress/progress-list'
import { listMeasurements } from '@/lib/actions/progress'

export const metadata: Metadata = { title: 'Progress Tracking' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')
  if (profile.role === 'super_admin' || profile.role === 'personal_trainer') redirect('/clients')

  const measurements = await listMeasurements()

  return (
    <div className="page-container">
      <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <ProgressList data={measurements} />
      </div>
    </div>
  )
}
