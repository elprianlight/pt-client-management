import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, ptPackages, workoutSessions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getClientById } from '@/lib/actions/client'
import { ArrowLeft, UserSquare2 } from 'lucide-react'
import Link from 'next/link'
import { ClientForm } from '@/components/clients/client-form'
import { ClientDetail } from '@/components/clients/client-detail'

export const metadata: Metadata = { title: 'Detail Client' }

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const clientData = await getClientById(id)
  if (!clientData) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Client tidak ditemukan</h3>
          <Link href="/clients" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  // Fetch active packages
  const activePackages = await db.select()
    .from(ptPackages)
    .where(eq(ptPackages.clientId, clientData.id))
    .orderBy(desc(ptPackages.createdAt))

  // Fetch recent sessions
  const recentSessions = await db.select({
    id: workoutSessions.id,
    packageId: workoutSessions.packageId,
    scheduledAt: workoutSessions.scheduledAt,
    status: workoutSessions.status,
    programType: workoutSessions.programType,
    rpe: workoutSessions.rpe,
    sessionNotes: workoutSessions.sessionNotes,
    packageName: ptPackages.packageName,
  })
    .from(workoutSessions)
    .innerJoin(ptPackages, eq(workoutSessions.packageId, ptPackages.id))
    .where(eq(workoutSessions.clientId, clientData.id))
    .orderBy(desc(workoutSessions.scheduledAt))

  const isEdit = resolvedSearchParams.edit === 'true'

  let formattedDob = ''
  if (clientData.dateOfBirth) {
    try {
      const d = new Date(clientData.dateOfBirth)
      if (!isNaN(d.getTime())) {
        formattedDob = d.toISOString().split('T')[0]
      }
    } catch {
      formattedDob = ''
    }
  }

  return (
    <div className="page-container">
      {isEdit ? (
        <>
          <div className="client-detail-header animate-fade-in-up" style={{ marginBottom: 20 }}>
            <Link href={`/clients/${clientData.id}`} className="back-link">
              <ArrowLeft size={16} />
              Kembali ke Detail Client
            </Link>
            <div className="client-title-row" style={{ marginTop: 12 }}>
              <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))', borderColor: 'rgba(139,92,246,0.25)', color: '#8b5cf6' }}>
                <UserSquare2 size={20} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="client-title">Edit Client</h2>
                <p className="client-desc">Perbarui informasi client</p>
              </div>
            </div>
          </div>
          <div className="glass-card client-detail-card animate-fade-in-up">
            <ClientForm
              mode="edit"
              clientId={clientData.id}
              defaultValues={{
                fullName: clientData.user?.fullName ?? '',
                phone: clientData.user?.phone ?? '',
                gender: (clientData.gender as any) ?? undefined,
                dateOfBirth: formattedDob,
                heightCm: clientData.heightCm ? Number(clientData.heightCm) : undefined,
                weightKg: clientData.weightKg ? Number(clientData.weightKg) : undefined,
                notes: clientData.notes ?? '',
                fitnessGoal: clientData.fitnessGoal ?? '',
                isActive: clientData.user?.isActive ?? true,
                emergencyContactName: clientData.emergencyContactName ?? '',
                emergencyContactPhone: clientData.emergencyContactPhone ?? '',
              }}
            />
          </div>
        </>
      ) : (
        <ClientDetail
          clientData={clientData}
          packages={activePackages}
          sessions={recentSessions}
          measurements={[]}
        />
      )}
    </div>
  )
}

