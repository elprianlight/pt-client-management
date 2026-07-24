'use server'

import { db } from '@/lib/db'
import { workoutSessions, ptPackages, personalTrainers, clients, users } from '@/lib/db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Input validation schema for scheduling a session
const scheduleSessionSchema = z.object({
  packageId: z.string().uuid('Pilih paket terlebih dahulu'),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal dan waktu tidak valid' }),
  duration: z.number().min(15, 'Minimal durasi 15 menit'),
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

    const { packageId, scheduledAt, duration, location } = validated.data

    // 1. Validasi ketersediaan kuota paket
    const [selectedPackage] = await db.select().from(ptPackages).where(eq(ptPackages.id, packageId))
    if (!selectedPackage) return { success: false, error: 'Paket tidak ditemukan' }
    
    if (selectedPackage.usedSessions >= selectedPackage.totalSessions) {
      return { success: false, error: 'Kuota sesi paket ini sudah habis' }
    }

    // 2. Insert ke workoutSessions
    await db.insert(workoutSessions).values({
      packageId,
      trainerId: selectedPackage.trainerId,
      clientId: selectedPackage.clientId,
      scheduledAt: new Date(scheduledAt),
      duration,
      location: location || null,
      status: 'scheduled',
    })

    revalidatePath('/session')
    return { success: true }
  } catch (err: any) {
    console.error('Schedule session error:', err)
    return { success: false, error: err.message || 'Gagal menjadwalkan sesi' }
  }
}

export async function completeSession(sessionId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    // Dapatkan sesi saat ini
    const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId))
    if (!session) return { success: false, error: 'Sesi tidak ditemukan' }
    if (session.status === 'completed') return { success: false, error: 'Sesi sudah selesai' }

    // Mulai transaksi DB
    await db.transaction(async (tx) => {
      // 1. Update status sesi
      await tx.update(workoutSessions)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(workoutSessions.id, sessionId))

      // 2. Potong kuota paket (tambah usedSessions)
      await tx.update(ptPackages)
        .set({ usedSessions: sql`${ptPackages.usedSessions} + 1` })
        .where(eq(ptPackages.id, session.packageId))
    })

    revalidatePath('/session')
    revalidatePath('/packages') // Update package list as well
    return { success: true }
  } catch (err: any) {
    console.error('Complete session error:', err)
    return { success: false, error: 'Gagal menyelesaikan sesi' }
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
      clientName: users.fullName,
      packageName: ptPackages.packageName,
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

    const data = await query.orderBy(desc(workoutSessions.scheduledAt))
    return data
  } catch (err) {
    console.error('List sessions error:', err)
    return []
  }
}
