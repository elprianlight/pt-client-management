import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, workoutSessions, ptPackages, clients } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { ReportsView } from '@/components/reports/reports-view'

export const metadata: Metadata = { title: 'Laporan & Analytics' }

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, authUser.id))
  if (!profile) redirect('/login')

  // Fetch session history for report
  let sessionLogs: any[] = []
  let totalSessionsCount = 0
  let completedCount = 0
  let cancelledCount = 0
  let activeClientsCount = 0

  if (profile.role === 'client') {
    const [clientRec] = await db.select().from(clients).where(eq(clients.userId, profile.id))
    if (clientRec) {
      sessionLogs = await db
        .select({
          id: workoutSessions.id,
          scheduledAt: workoutSessions.scheduledAt,
          status: workoutSessions.status,
          programType: workoutSessions.programType,
          location: workoutSessions.location,
          rpe: workoutSessions.rpe,
          duration: workoutSessions.duration,
          pdfAttachmentUrl: workoutSessions.pdfAttachmentUrl,
        })
        .from(workoutSessions)
        .where(eq(workoutSessions.clientId, clientRec.id))
        .orderBy(desc(workoutSessions.scheduledAt))

      totalSessionsCount = sessionLogs.length
      completedCount = sessionLogs.filter(s => s.status === 'completed').length
      cancelledCount = sessionLogs.filter(s => s.status === 'cancelled').length
    }
  } else {
    // PT / Super Admin report
    sessionLogs = await db
      .select({
        id: workoutSessions.id,
        scheduledAt: workoutSessions.scheduledAt,
        status: workoutSessions.status,
        programType: workoutSessions.programType,
        location: workoutSessions.location,
        rpe: workoutSessions.rpe,
        duration: workoutSessions.duration,
        clientName: users.fullName,
        pdfAttachmentUrl: workoutSessions.pdfAttachmentUrl,
      })
      .from(workoutSessions)
      .leftJoin(clients, eq(workoutSessions.clientId, clients.id))
      .leftJoin(users, eq(clients.userId, users.id))
      .orderBy(desc(workoutSessions.scheduledAt))

    totalSessionsCount = sessionLogs.length
    completedCount = sessionLogs.filter(s => s.status === 'completed').length
    cancelledCount = sessionLogs.filter(s => s.status === 'cancelled').length

    const [clientsCountRes] = await db.select({ value: count() }).from(clients)
    activeClientsCount = clientsCountRes?.value || 0
  }

  const attendanceRate = totalSessionsCount > 0
    ? Math.round((completedCount / totalSessionsCount) * 100)
    : 100

  return (
    <div className="page-container">
      <ReportsView
        role={profile.role ?? 'client'}
        completedCount={completedCount}
        totalSessionsCount={totalSessionsCount}
        attendanceRate={attendanceRate}
        activeClientsCount={activeClientsCount}
        sessionLogs={sessionLogs}
      />
    </div>
  )
}
