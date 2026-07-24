'use server'

import { db } from '@/lib/db'
import { measurements, users, clients, personalTrainers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Input validation schema for logging a measurement
const logMeasurementSchema = z.object({
  clientId: z.string().uuid('Pilih client terlebih dahulu'),
  measuredAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Tanggal pengukuran tidak valid' }),
  weight: z.coerce.number().min(20, 'Berat badan tidak valid').max(300, 'Berat badan tidak valid'),
  bodyFatPercentage: z.coerce.number().min(1, 'Body Fat % tidak valid').max(70, 'Body Fat % tidak valid').optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function logMeasurement(input: z.infer<typeof logMeasurementSchema>) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = logMeasurementSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
    }

    const { clientId, measuredAt, weight, bodyFatPercentage, notes } = validated.data

    await db.insert(measurements).values({
      clientId,
      measuredAt: new Date(measuredAt),
      weight,
      bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : null,
      notes: notes || null,
    })

    // Update current weight in clients table
    await db.update(clients).set({ currentWeight: weight }).where(eq(clients.id, clientId))

    revalidatePath('/progress')
    return { success: true }
  } catch (err: any) {
    console.error('Log measurement error:', err)
    return { success: false, error: err.message || 'Gagal menyimpan data progress' }
  }
}

export async function listMeasurements() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return []

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser) return []

    let query = db.select({
      id: measurements.id,
      measuredAt: measurements.measuredAt,
      weight: measurements.weight,
      bodyFatPercentage: measurements.bodyFatPercentage,
      notes: measurements.notes,
      clientName: users.fullName,
    })
    .from(measurements)
    .innerJoin(clients, eq(measurements.clientId, clients.id))
    .innerJoin(users, eq(clients.userId, users.id))

    if (currentUser.role === 'personal_trainer') {
      const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, currentUser.id))
      query = query.where(eq(clients.trainerId, ptData.id)) as any
    } else if (currentUser.role === 'client') {
      const [clientData] = await db.select().from(clients).where(eq(clients.userId, currentUser.id))
      query = query.where(eq(measurements.clientId, clientData.id)) as any
    }

    const data = await query.orderBy(desc(measurements.measuredAt))
    return data
  } catch (err) {
    console.error('List measurements error:', err)
    return []
  }
}
