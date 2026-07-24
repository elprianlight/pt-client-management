'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, clients, personalTrainers } from '@/lib/db/schema'
import { eq, desc, count, and } from 'drizzle-orm'
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
})

const updateClientSchema = z.object({
  fullName: z.string().min(2).max(255),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(20).max(300).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
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
      notes: clients.medicalNotes,
      joinedAt: clients.createdAt,
      createdAt: clients.createdAt,
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
    .orderBy(desc(clients.createdAt))

  const result = await query

  // Filter by trainer if role is PT
  const filtered = profile.role === 'personal_trainer'
    ? await (async () => {
        const ptRecord = await getPTRecordByUserId(profile.id)
        if (!ptRecord) return []
        return result.filter(c => c.trainerId === ptRecord.id)
      })()
    : result

  if (search) {
    const term = search.toLowerCase()
    return filtered.filter(c =>
      c.user?.fullName?.toLowerCase().includes(term) ||
      c.user?.username?.toLowerCase().includes(term) ||
      c.user?.phone?.toLowerCase().includes(term)
    )
  }

  return filtered
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
      notes: clients.medicalNotes,
      joinedAt: clients.createdAt,
      createdAt: clients.createdAt,
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

  const { username, fullName, phone, password, dateOfBirth, gender, heightCm, weightKg, notes } = validated.data
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
      medicalNotes: notes || null,
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

  const { fullName, phone, dateOfBirth, gender, heightCm, weightKg, notes, isActive } = validated.data

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
        height: heightCm ?? null,
        currentWeight: weightKg ?? null,
        medicalNotes: notes || null,
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
  return { success: true }
}
