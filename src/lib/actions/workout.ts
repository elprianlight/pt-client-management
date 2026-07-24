'use server'

import { db } from '@/lib/db'
import { exercises, workoutPrograms, users, clients, personalTrainers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Input validation for creating an exercise
const createExerciseSchema = z.object({
  name: z.string().min(2, 'Nama gerakan wajib diisi'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  instructions: z.string().optional(),
  videoUrl: z.string().url('URL Video tidak valid').optional().or(z.literal('')),
})

export async function createExercise(input: z.infer<typeof createExerciseSchema>) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const validated = createExerciseSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
    }

    const { name, difficulty, instructions, videoUrl } = validated.data

    await db.insert(exercises).values({
      name,
      difficulty,
      instructions: instructions || null,
      videoUrl: videoUrl || null,
    })

    revalidatePath('/workout')
    return { success: true }
  } catch (err: any) {
    console.error('Create exercise error:', err)
    return { success: false, error: err.message || 'Gagal menambahkan gerakan' }
  }
}

export async function listExercises() {
  try {
    const data = await db.select().from(exercises).orderBy(desc(exercises.createdAt))
    return data
  } catch (err) {
    console.error('List exercises error:', err)
    return []
  }
}

export async function listPrograms() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return []

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser) return []

    let query = db.select({
      id: workoutPrograms.id,
      name: workoutPrograms.name,
      description: workoutPrograms.description,
      durationWeeks: workoutPrograms.durationWeeks,
      clientName: users.fullName,
      createdAt: workoutPrograms.createdAt,
    })
    .from(workoutPrograms)
    .leftJoin(clients, eq(workoutPrograms.clientId, clients.id))
    .leftJoin(users, eq(clients.userId, users.id))

    if (currentUser.role === 'personal_trainer') {
      const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, currentUser.id))
      query = query.where(eq(workoutPrograms.trainerId, ptData.id)) as any
    } else if (currentUser.role === 'client') {
      const [clientData] = await db.select().from(clients).where(eq(clients.userId, currentUser.id))
      query = query.where(eq(workoutPrograms.clientId, clientData.id)) as any
    }

    const data = await query.orderBy(desc(workoutPrograms.createdAt))
    return data
  } catch (err) {
    console.error('List programs error:', err)
    return []
  }
}

// Input validation for creating a program
const createProgramSchema = z.object({
  name: z.string().min(2, 'Nama program wajib diisi'),
  description: z.string().optional(),
  durationWeeks: z.number().min(1, 'Minimal 1 minggu'),
  clientId: z.string().uuid('Client ID tidak valid').optional().or(z.literal('')),
})

export async function createProgram(input: z.infer<typeof createProgramSchema>) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    let trainerId: string | null = null
    if (currentUser.role === 'personal_trainer') {
      const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, currentUser.id))
      if (!ptData) return { success: false, error: 'Data PT tidak ditemukan' }
      trainerId = ptData.id
    }

    // Untuk MVP, anggap Super Admin harus assign trainer jika dia yg buat (kita skip dlu, anggap cuma PT yg buat program idealnya)
    if (currentUser.role === 'super_admin') {
      // Dummy logic for super admin (bisa dikembangkan nanti)
      // Idealnya super admin memilih PT dari form
      return { success: false, error: 'Hanya PT yang dapat membuat program saat ini' }
    }

    const validated = createProgramSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
    }

    const { name, description, durationWeeks, clientId } = validated.data

    await db.insert(workoutPrograms).values({
      trainerId: trainerId!,
      clientId: clientId || null,
      name,
      description: description || null,
      durationWeeks,
      isTemplate: !clientId, // Jika tidak ada clientId, maka ini template
    })

    revalidatePath('/workout')
    return { success: true }
  } catch (err: any) {
    console.error('Create program error:', err)
    return { success: false, error: err.message || 'Gagal membuat program' }
  }
}
