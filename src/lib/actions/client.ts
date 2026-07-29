'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, clients, personalTrainers, ptPackages, workoutSessions, sessionExercises, ptTransactions, measurements, nutritionLogs } from '@/lib/db/schema'
import { eq, desc, count, and, inArray, max, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const createClientSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  fullName: z.string().min(2).max(255),
  phone: z.string().optional(),
  password: z.string().min(6),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(20).max(300).optional(),
  notes: z.string().optional(),
  fitnessGoal: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
})

const updateClientSchema = z.object({
  fullName: z.string().min(2).max(255),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(20).max(300).optional(),
  notes: z.string().optional(),
  fitnessGoal: z.string().optional(),
  isActive: z.boolean().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) throw new Error('Profile not found')
  return profile
}

async function getPTRecordByUserId(userId: string) {
  const [pt] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, userId))
  return pt ?? null
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listClients(search?: string) {
  const profile = await getAuthProfile()

  let query = db
    .select({
      id: clients.id,
      trainerId: clients.trainerId,
      heightCm: clients.height,
      weightKg: clients.currentWeight,
      gender: clients.gender,
      dateOfBirth: clients.dateOfBirth,
      fitnessGoal: clients.fitnessGoal,
      notes: clients.medicalNotes,
      joinedAt: clients.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
      },
    })
    .from(clients)
    .leftJoin(users, eq(clients.userId, users.id))

  if (profile.role === 'personal_trainer') {
    const ptRecord = await getPTRecordByUserId(profile.id)
    if (ptRecord) {
      query = query.where(eq(clients.trainerId, ptRecord.id)) as any
    } else {
      return []
    }
  }

  const result = await query.orderBy(desc(clients.createdAt)).limit(50)

  const searched = search ? result.filter(c =>
      c.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.phone?.toLowerCase().includes(search.toLowerCase())
    ) : result

  const clientIds = searched.map(c => c.id)
  let packageMap: Record<string, { total: number, used: number, lastPackageName: string | null, lastBought: number }> = {}
  let lastSessionMap: Record<string, Date | null> = {}

  if (clientIds.length > 0) {
    // Aggregate package stats + find most recent package name
    const pkgs = await db.select({
      clientId: ptPackages.clientId,
      totalSessions: ptPackages.totalSessions,
      usedSessions: ptPackages.usedSessions,
      packageName: ptPackages.packageName,
      startDate: ptPackages.startDate,
      createdAt: ptPackages.createdAt,
    }).from(ptPackages)
      .where(inArray(ptPackages.clientId, clientIds))
      .orderBy(desc(ptPackages.createdAt))
    
    pkgs.forEach(pkg => {
      if (!packageMap[pkg.clientId]) {
        packageMap[pkg.clientId] = { total: 0, used: 0, lastPackageName: pkg.packageName, lastBought: 0 }
      }
      // Only accumulate active packages (where usedSessions < totalSessions)
      if (pkg.usedSessions < pkg.totalSessions) {
        packageMap[pkg.clientId].total += pkg.totalSessions
        packageMap[pkg.clientId].used += pkg.usedSessions
      }
    })

    // Fetch last session date per client
    const lastSessions = await db.select({
      clientId: workoutSessions.clientId,
      lastAt: max(workoutSessions.scheduledAt),
    }).from(workoutSessions)
      .where(inArray(workoutSessions.clientId, clientIds))
      .groupBy(workoutSessions.clientId)

    lastSessions.forEach(s => {
      lastSessionMap[s.clientId] = s.lastAt ? new Date(s.lastAt) : null
    })
  }

  return searched.map(c => ({
    ...c,
    packageStats: packageMap[c.id] || { total: 0, used: 0, lastPackageName: null, lastBought: 0 },
    lastSessionAt: lastSessionMap[c.id] ?? null,
  }))
}

export async function getClientById(clientId: string) {
  const [result] = await db
    .select({
      id: clients.id,
      userId: clients.userId,
      trainerId: clients.trainerId,
      heightCm: clients.height,
      weightKg: clients.currentWeight,
      gender: clients.gender,
      dateOfBirth: clients.dateOfBirth,
      fitnessGoal: clients.fitnessGoal,
      notes: clients.medicalNotes,
      emergencyContactName: clients.emergencyContactName,
      emergencyContactPhone: clients.emergencyContactPhone,
      joinedAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
      },
    })
    .from(clients)
    .leftJoin(users, eq(clients.userId, users.id))
    .where(eq(clients.id, clientId))

  return result ?? null
}

export async function getClientCount() {
  const profile = await getAuthProfile()

  if (profile.role === 'personal_trainer') {
    const ptRecord = await getPTRecordByUserId(profile.id)
    if (!ptRecord) return 0
    const [result] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.trainerId, ptRecord.id))
    return result?.count ?? 0
  }

  const [result] = await db.select({ count: count() }).from(clients)
  return result?.count ?? 0
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createClient_action(input: CreateClientInput) {
  const profile = await getAuthProfile()
  if (profile.role === 'client') return { success: false, error: 'Forbidden.' }

  const validated = createClientSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
  }

    const { username, fullName, phone, password, dateOfBirth, gender, heightCm, weightKg, notes, fitnessGoal, emergencyContactName, emergencyContactPhone } = validated.data
    const dummyEmail = `${username}@pt.local`

    // Get PT record
    let ptRecord: { id: string } | null = null
    if (profile.role === 'personal_trainer') {
      ptRecord = await getPTRecordByUserId(profile.id)
    } else if (profile.role === 'super_admin') {
      const [firstPt] = await db.select({ id: personalTrainers.id }).from(personalTrainers).limit(1)
      ptRecord = firstPt ?? null
    }
    if (!ptRecord) return { success: false, error: 'Tidak ada PT yang tersedia untuk di-assign.' }

    try {
      const supabaseAdmin = createAdminClient()
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, username, role: 'client' },
      })

      if (authError || !authData.user) {
        if (authError?.message.includes('already')) {
          return { success: false, error: 'Username sudah digunakan.' }
        }
        return { success: false, error: authError?.message ?? 'Gagal membuat akun.' }
      }

      const authUserId = authData.user.id

      await db.insert(users).values({
        id: authUserId,
        email: dummyEmail,
        username,
        fullName,
        phone: phone || null,
        role: 'client',
        isActive: true,
      })

      const [client] = await db.insert(clients).values({
        userId: authUserId,
        trainerId: ptRecord.id,
        gender: (gender as 'male' | 'female' | 'other') ?? null,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        height: heightCm ?? null,
        initialWeight: weightKg ?? null,
        currentWeight: weightKg ?? null,
        fitnessGoal: fitnessGoal || 'General Fitness',
        medicalNotes: notes || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
      }).returning({ id: clients.id })

    revalidatePath('/clients')
    return { success: true, clientId: client.id }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    return { success: false, error: msg }
  }
}

export async function updateClient(clientId: string, input: UpdateClientInput) {
  const profile = await getAuthProfile()
  if (profile.role === 'client') return { success: false, error: 'Forbidden.' }

  const validated = updateClientSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: 'Data tidak valid.' }
  }

  const { fullName, phone, dateOfBirth, gender, heightCm, weightKg, notes, fitnessGoal, isActive, emergencyContactName, emergencyContactPhone } = validated.data

  try {
    const client = await getClientById(clientId)
    if (!client) return { success: false, error: 'Client tidak ditemukan.' }

    await db.update(users)
      .set({ fullName, phone: phone || null, isActive: isActive ?? true, updatedAt: new Date() })
      .where(eq(users.id, client.userId))

    await db.update(clients)
      .set({
        gender: (gender as 'male' | 'female' | 'other') ?? undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        height: (heightCm ? Number(heightCm) : null) as any,
        currentWeight: (weightKg ? Number(weightKg) : null) as any,
        fitnessGoal: fitnessGoal || 'General Fitness',
        medicalNotes: notes || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId))

    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    return { success: true }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    return { success: false, error: msg }
  }
}

export async function toggleClientStatus(clientId: string, isActive: boolean) {
  const profile = await getAuthProfile()
  if (profile.role === 'client') return { success: false, error: 'Forbidden.' }

  const client = await getClientById(clientId)
  if (!client) return { success: false, error: 'Client tidak ditemukan.' }

  await db.update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, client.userId))

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const profile = await getAuthProfile()
  if (profile.role === 'client') return { success: false, error: 'Forbidden.' }

  const client = await getClientById(clientId)
  if (!client) return { success: false, error: 'Client tidak ditemukan.' }

  try {
    // 1. Get all session IDs for this client
    const clientSessions = await db.select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(eq(workoutSessions.clientId, clientId))
    const sessionIds = clientSessions.map(s => s.id)

    // 2. Delete session exercises
    if (sessionIds.length > 0) {
      await db.delete(sessionExercises).where(inArray(sessionExercises.sessionId, sessionIds))
    }

    // 3. Delete workout sessions
    await db.delete(workoutSessions).where(eq(workoutSessions.clientId, clientId))

    // 4. Delete PT transactions for this client's packages
    const clientPackages = await db.select({ id: ptPackages.id })
      .from(ptPackages)
      .where(eq(ptPackages.clientId, clientId))
    const packageIds = clientPackages.map(p => p.id)

    if (packageIds.length > 0) {
      await db.delete(ptTransactions).where(inArray(ptTransactions.packageId, packageIds))
    }

    // 5. Delete PT packages
    await db.delete(ptPackages).where(eq(ptPackages.clientId, clientId))

    // 6. Delete measurements & nutrition logs
    await db.delete(measurements).where(eq(measurements.clientId, clientId))
    await db.delete(nutritionLogs).where(eq(nutritionLogs.clientId, clientId))

    // 7. Delete client record
    await db.delete(clients).where(eq(clients.id, clientId))

    // 8. Delete user record
    await db.delete(users).where(eq(users.id, client.userId))

    // 9. Delete auth user from Supabase
    try {
      const supabaseAdmin = createAdminClient()
      await supabaseAdmin.auth.admin.deleteUser(client.userId)
    } catch (e) {
      console.error('Failed to delete auth user from Supabase:', e)
    }

    revalidatePath('/clients')
    return { success: true }
  } catch (error: unknown) {
    console.error('deleteClient error:', error)
    const msg = error instanceof Error ? error.message : 'Gagal menghapus client.'
    return { success: false, error: msg }
  }
}
