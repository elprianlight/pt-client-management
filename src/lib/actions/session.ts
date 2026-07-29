'use server'

import { db } from '@/lib/db'
import { workoutSessions, ptPackages, personalTrainers, clients, users } from '@/lib/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from './audit'

// Input validation schema for scheduling a session
const scheduleSessionSchema = z.object({
  packageId: z.string().uuid('Pilih paket terlebih dahulu'),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal dan waktu tidak valid' }),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
  programType: z.string().min(1, 'Pilih program latihan'),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
  sessionNotes: z.string().optional(),
  location: z.string().optional(),
})

export async function scheduleSession(input: z.infer<typeof scheduleSessionSchema>) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = scheduleSessionSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
    }

    const { packageId, scheduledAt, status, programType, rpe, sessionNotes, location } = validated.data
    const targetStatus = status || 'scheduled'

    // 1. Validasi ketersediaan kuota paket
    const [selectedPackage] = await db.select().from(ptPackages).where(eq(ptPackages.id, packageId))
    if (!selectedPackage) return { success: false, error: 'Paket tidak ditemukan' }
    
    if (selectedPackage.usedSessions >= selectedPackage.totalSessions) {
      return { success: false, error: 'Kuota sesi paket ini sudah habis' }
    }

    // 2. Insert ke workoutSessions & update kuota jika completed
    await db.transaction(async (tx) => {
      await tx.insert(workoutSessions).values({
        packageId,
        trainerId: selectedPackage.trainerId,
        clientId: selectedPackage.clientId,
        scheduledAt: new Date(scheduledAt),
        completedAt: targetStatus === 'completed' ? new Date() : null,
        duration: 60, // hardcoded 60 minutes
        programType,
        rpe: rpe || null,
        sessionNotes: sessionNotes || null,
        location: location || null,
        status: targetStatus,
      })

      if (targetStatus === 'completed') {
        await tx.update(ptPackages)
          .set({ usedSessions: sql`${ptPackages.usedSessions} + 1` })
          .where(eq(ptPackages.id, packageId))
      }
    })

    revalidatePath('/session')
    revalidatePath('/packages')
    return { success: true }
  } catch (err: any) {
    console.error('Schedule session error:', err)
    return { success: false, error: err.message || 'Gagal menjadwalkan sesi' }
  }
}



export async function updateSessionStatus(sessionId: string, newStatus: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show') {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    // Dapatkan sesi saat ini
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId))
    if (!session) return { success: false, error: 'Sesi tidak ditemukan' }
    if (session.status === newStatus) return { success: true } // No change

    const oldStatus = session.status

    // Mulai transaksi DB
    await db.transaction(async (tx) => {
      // 1. Update status sesi
      await tx.update(workoutSessions)
        .set({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date() : (oldStatus === 'completed' ? null : session.completedAt),
          updatedAt: new Date(),
        })
        .where(eq(workoutSessions.id, sessionId))

      // 2. Potong/Kembalikan kuota paket jika ada perubahan state 'completed'
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        // Kurangi sesi (tambah usedSessions)
        await tx.update(ptPackages)
          .set({ usedSessions: sql`${ptPackages.usedSessions} + 1` })
          .where(eq(ptPackages.id, session.packageId))
      } else if (oldStatus === 'completed' && newStatus !== 'completed') {
        // Kembalikan sesi (kurangi usedSessions)
        await tx.update(ptPackages)
          .set({ usedSessions: sql`${ptPackages.usedSessions} - 1` })
          .where(eq(ptPackages.id, session.packageId))
      }
    })

    // 3. Catat di Audit Log
    await logAudit({
      action: 'UPDATE_SESSION_STATUS',
      tableName: 'workout_sessions',
      recordId: sessionId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
    })

    revalidatePath('/session')
    revalidatePath('/packages') // Update package list as well
    return { success: true }
  } catch (err: any) {
    console.error('Update session status error:', err)
    return { success: false, error: 'Gagal memperbarui status sesi' }
  }
}

export async function listSessions() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return []

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser) return []

    let query = db.select({
      id: workoutSessions.id,
      scheduledAt: workoutSessions.scheduledAt,
      completedAt: workoutSessions.completedAt,
      status: workoutSessions.status,
      duration: workoutSessions.duration,
      location: workoutSessions.location,
      programType: workoutSessions.programType,
      rpe: workoutSessions.rpe,
      sessionNotes: workoutSessions.sessionNotes,
      clientName: users.fullName,
      packageName: ptPackages.packageName,
      totalSessions: ptPackages.totalSessions,
      usedSessions: ptPackages.usedSessions,
    })
    .from(workoutSessions)
    .innerJoin(clients, eq(workoutSessions.clientId, clients.id))
    .innerJoin(users, eq(clients.userId, users.id))
    .innerJoin(ptPackages, eq(workoutSessions.packageId, ptPackages.id))

    if (currentUser.role === 'personal_trainer') {
      const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, currentUser.id))
      query = query.where(eq(workoutSessions.trainerId, ptData.id)) as any
    } else if (currentUser.role === 'client') {
      const [clientData] = await db.select().from(clients).where(eq(clients.userId, currentUser.id))
      query = query.where(eq(workoutSessions.clientId, clientData.id)) as any
    }

    const data = await query.orderBy(desc(workoutSessions.scheduledAt)).limit(50)
    return data
  } catch (err) {
    console.error('List sessions error:', err)
    return []
  }
}

export async function getSessionById(sessionId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId))
    return session || null
  } catch (err) {
    console.error('Get session error:', err)
    return null
  }
}

export async function deleteSession(sessionId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId))
    if (!session) return { success: false, error: 'Sesi tidak ditemukan' }

    await db.transaction(async (tx) => {
      // If completed, we need to return the quota
      if (session.status === 'completed') {
        await tx.update(ptPackages)
          .set({ usedSessions: sql`${ptPackages.usedSessions} - 1` })
          .where(eq(ptPackages.id, session.packageId))
      }
      
      // Delete session
      await tx.delete(workoutSessions).where(eq(workoutSessions.id, sessionId))
    })

    await logAudit({
      action: 'DELETE_SESSION',
      tableName: 'workout_sessions',
      recordId: sessionId,
      oldValues: session as any,
      newValues: null
    })

    revalidatePath('/session')
    revalidatePath('/packages')
    return { success: true }
  } catch (err: any) {
    console.error('Delete session error:', err)
    return { success: false, error: 'Gagal menghapus sesi' }
  }
}

const updateSessionSchema = z.object({
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal dan waktu tidak valid' }),
  programType: z.string().min(1, 'Pilih program latihan'),
  rpe: z.coerce.number().min(1).max(10).optional().nullable(),
  sessionNotes: z.string().optional(),
  location: z.string().optional(),
})

export async function updateSessionData(sessionId: string, input: z.infer<typeof updateSessionSchema>) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = updateSessionSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
    }

    const { scheduledAt, programType, rpe, sessionNotes, location } = validated.data

    await db.update(workoutSessions)
      .set({
        scheduledAt: new Date(scheduledAt),
        programType,
        rpe: rpe || null,
        sessionNotes: sessionNotes || null,
        location: location || null,
        updatedAt: new Date(),
      })
      .where(eq(workoutSessions.id, sessionId))

    revalidatePath('/session')
    return { success: true }
  } catch (err: any) {
    console.error('Update session data error:', err)
    return { success: false, error: 'Gagal memperbarui sesi' }
  }
}
