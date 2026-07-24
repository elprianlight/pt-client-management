'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, personalTrainers } from '@/lib/db/schema'
import { eq, ilike, desc, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Validasi Form ──────────────────────────────────────────────────────────

const createPTSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
  fullName: z.string().min(2).max(255),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  certifications: z.string().optional(),
})

const updatePTSchema = z.object({
  fullName: z.string().min(2).max(255),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  certifications: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreatePTInput = z.infer<typeof createPTSchema>
export type UpdatePTInput = z.infer<typeof updatePTSchema>

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

async function assertSuperAdmin() {
  const authUser = await getAuthUser()
  const [profile] = await db.select().from(users).where(eq(users.id, authUser.id))
  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Forbidden: Super Admin only')
  }
  return profile
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listPTs(search?: string) {
  const query = db
    .select({
      id: personalTrainers.id,
      userId: personalTrainers.userId,
      specialization: personalTrainers.specialization,
      experienceYears: personalTrainers.yearsExperience,
      certifications: personalTrainers.certifications,
      bio: personalTrainers.bio,
      createdAt: personalTrainers.createdAt,
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
    .from(personalTrainers)
    .leftJoin(users, eq(personalTrainers.userId, users.id))
    .orderBy(desc(personalTrainers.createdAt))

  const result = await query
  if (search) {
    const term = search.toLowerCase()
    return result.filter(pt =>
      pt.user?.fullName?.toLowerCase().includes(term) ||
      pt.user?.username?.toLowerCase().includes(term)
    )
  }
  return result
}

export async function getPTById(ptId: string) {
  const [result] = await db
    .select({
      id: personalTrainers.id,
      userId: personalTrainers.userId,
      specialization: personalTrainers.specialization,
      experienceYears: personalTrainers.yearsExperience,
      certifications: personalTrainers.certifications,
      bio: personalTrainers.bio,
      createdAt: personalTrainers.createdAt,
      updatedAt: personalTrainers.updatedAt,
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
    .from(personalTrainers)
    .leftJoin(users, eq(personalTrainers.userId, users.id))
    .where(eq(personalTrainers.id, ptId))

  return result ?? null
}

export async function getPTCount() {
  const [result] = await db.select({ count: count() }).from(personalTrainers)
  return result?.count ?? 0
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createPT(input: CreatePTInput) {
  await assertSuperAdmin()

  const validated = createPTSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
  }

  const { username, fullName, phone, password, specialization, bio, experienceYears, certifications } = validated.data
  const dummyEmail = `${username}@pt.local`

  try {
    // 1. Buat user di Supabase Auth
    const supabaseAdmin = createAdminClient()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dummyEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username, role: 'personal_trainer' },
    })

    if (authError || !authData.user) {
      if (authError?.message.includes('already')) {
        return { success: false, error: 'Username sudah digunakan.' }
      }
      return { success: false, error: authError?.message ?? 'Gagal membuat akun.' }
    }

    const authUserId = authData.user.id

    // 2. Insert ke tabel users
    await db.insert(users).values({
      id: authUserId,
      email: dummyEmail,
      username,
      fullName,
      phone: phone || null,
      role: 'personal_trainer',
      isActive: true,
    })

    // 3. Insert ke tabel personal_trainers
    const [pt] = await db.insert(personalTrainers).values({
      userId: authUserId,
      specialization: specialization || null,
      bio: bio || null,
      yearsExperience: experienceYears ?? null,
      certifications: certifications ? [certifications] : null,
    }).returning({ id: personalTrainers.id })

    revalidatePath('/pt')
    return { success: true, ptId: pt.id }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    return { success: false, error: msg }
  }
}

export async function updatePT(ptId: string, input: UpdatePTInput) {
  await assertSuperAdmin()

  const validated = updatePTSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: 'Data tidak valid.' }
  }

  const { fullName, phone, specialization, bio, experienceYears, certifications, isActive } = validated.data

  try {
    // Get PT record for userId
    const pt = await getPTById(ptId)
    if (!pt) return { success: false, error: 'PT tidak ditemukan.' }

    // Update users table
    await db.update(users)
      .set({ fullName, phone: phone || null, isActive: isActive ?? true, updatedAt: new Date() })
      .where(eq(users.id, pt.userId))

    // Update personal_trainers table
    await db.update(personalTrainers)
      .set({
        specialization: specialization || null,
        bio: bio || null,
        yearsExperience: experienceYears ?? null,
        certifications: certifications ? [certifications] : null,
        updatedAt: new Date(),
      })
      .where(eq(personalTrainers.id, ptId))

    revalidatePath('/pt')
    revalidatePath(`/pt/${ptId}`)
    return { success: true }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Terjadi kesalahan.'
    return { success: false, error: msg }
  }
}

export async function togglePTStatus(ptId: string, isActive: boolean) {
  await assertSuperAdmin()

  const pt = await getPTById(ptId)
  if (!pt) return { success: false, error: 'PT tidak ditemukan.' }

  await db.update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, pt.userId))

  revalidatePath('/pt')
  return { success: true }
}
