'use server'

import { db } from '@/lib/db'
import { ptPackages, ptTransactions, clients, personalTrainers, users, workoutSessions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Input validation schema for selling a package
const createPackageSchema = z.object({
  clientId: z.string().uuid('Pilih client terlebih dahulu'),
  packageName: z.string().min(2, 'Nama paket wajib diisi').max(255),
  totalSessions: z.number().min(1, 'Minimal 1 sesi'),
  pricePerSession: z.number().min(0, 'Harga tidak valid'),
  purchaseDate: z.string().min(1, 'Tanggal penjualan wajib diisi'),
  notes: z.string().optional(),
})

export async function sellPackage(input: z.infer<typeof createPackageSchema>) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    // Dapatkan data user & trainer
    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    let trainerId: string | null = null

    if (currentUser.role === 'personal_trainer') {
      const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, currentUser.id))
      if (!ptData) return { success: false, error: 'Data PT tidak ditemukan' }
      trainerId = ptData.id
    } else if (currentUser.role === 'super_admin') {
      // Super Admin menjualkan paket untuk Client?
      // Cari trainerId dari client tersebut
      const [clientData] = await db.select().from(clients).where(eq(clients.id, input.clientId))
      if (!clientData) return { success: false, error: 'Client tidak ditemukan' }
      trainerId = clientData.trainerId
    }

    if (!trainerId) return { success: false, error: 'Gagal menentukan Personal Trainer' }

    const validated = createPackageSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
    }

    const { clientId, packageName, totalSessions, pricePerSession, purchaseDate, notes } = validated.data
    const totalPrice = totalSessions * pricePerSession

    const pDate = new Date(purchaseDate)
    // Tanggal kadaluarsa: asumsikan 1 minggu per sesi sebagai standar (bisa diedit di versi berikutnya)
    const startDate = pDate
    const expiresAt = new Date(pDate)
    expiresAt.setDate(expiresAt.getDate() + (totalSessions * 7)) // e.g. 10 session = 70 days

    // Insert menggunakan db transaction
    await db.transaction(async (tx) => {
      // 1. Buat record pt_packages
      const [newPackage] = await tx.insert(ptPackages).values({
        trainerId,
        clientId,
        packageName,
        totalSessions,
        usedSessions: 0,
        pricePerSession: String(pricePerSession),
        totalPrice: String(totalPrice),
        paymentStatus: 'paid', // Default langsung paid untuk MVP
        startDate: startDate.toISOString().split('T')[0],
        expiresAt: expiresAt.toISOString().split('T')[0],
        notes: notes || null,
        createdAt: pDate,
      }).returning({ id: ptPackages.id })

      // 2. Catat transaksi
      await tx.insert(ptTransactions).values({
        packageId: newPackage.id,
        trainerId,
        clientId,
        amount: String(totalPrice),
        paymentStatus: 'paid',
        paymentDate: pDate,
        createdAt: pDate,
        notes: `Pembelian: ${packageName}`,
      })
    })

    revalidatePath('/packages')
    return { success: true }
  } catch (err: any) {
    console.error('Sell package error:', err)
    return { success: false, error: err.message || 'Gagal menjual paket' }
  }
}

export async function listPackages() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return []

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser) return []

    let query = db.select({
      id: ptPackages.id,
      packageName: ptPackages.packageName,
      totalSessions: ptPackages.totalSessions,
      usedSessions: ptPackages.usedSessions,
      totalPrice: ptPackages.totalPrice,
      paymentStatus: ptPackages.paymentStatus,
      startDate: ptPackages.startDate,
      expiresAt: ptPackages.expiresAt,
      isActive: ptPackages.isActive,
      clientName: users.fullName,
    })
    .from(ptPackages)
    .innerJoin(clients, eq(ptPackages.clientId, clients.id))
    // We join the clients table with users table again to get the client's name
    .innerJoin(users, eq(clients.userId, users.id))

    if (currentUser.role === 'personal_trainer') {
      const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, currentUser.id))
      query = query.where(eq(ptPackages.trainerId, ptData.id)) as any
    } else if (currentUser.role === 'client') {
      const [clientData] = await db.select().from(clients).where(eq(clients.userId, currentUser.id))
      query = query.where(eq(ptPackages.clientId, clientData.id)) as any
    }

    const data = await query.orderBy(desc(ptPackages.createdAt))
    return data
  } catch (err) {
    console.error('List packages error:', err)
    return []
  }
}

export async function getPackageById(packageId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const [pkg] = await db.select().from(ptPackages).where(eq(ptPackages.id, packageId))
    return pkg || null
  } catch (err) {
    console.error('Get package by id error:', err)
    return null
  }
}

export async function updatePackageData(packageId: string, input: any) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') return { success: false, error: 'Unauthorized' }

    const validated = createPackageSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: 'Data tidak valid: ' + validated.error.issues[0].message }
    }

    const { packageName, totalSessions, pricePerSession, purchaseDate, notes } = validated.data
    const totalPrice = totalSessions * pricePerSession
    const pDate = new Date(purchaseDate)
    const expiresAt = new Date(pDate)
    expiresAt.setDate(expiresAt.getDate() + (totalSessions * 7))

    await db.update(ptPackages)
      .set({
        packageName,
        totalSessions,
        pricePerSession: String(pricePerSession),
        totalPrice: String(totalPrice),
        notes: notes || null,
        startDate: pDate.toISOString().split('T')[0],
        expiresAt: expiresAt.toISOString().split('T')[0],
        createdAt: pDate,
        updatedAt: new Date(),
      })
      .where(eq(ptPackages.id, packageId))

    // Update the transaction record too so revenue matches
    await db.update(ptTransactions)
      .set({
        paymentDate: pDate,
        createdAt: pDate,
      })
      .where(eq(ptTransactions.packageId, packageId))

    revalidatePath('/packages')
    return { success: true }
  } catch (err: any) {
    console.error('Update package error:', err)
    return { success: false, error: err.message || 'Gagal mengubah paket' }
  }
}

export async function deletePackage(packageId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') return { success: false, error: 'Unauthorized' }

    await db.transaction(async (tx) => {
      // Hapus transaksi yang berelasi
      await tx.delete(ptTransactions).where(eq(ptTransactions.packageId, packageId))
      
      // Hapus sesi yang berelasi
      // (sessionExercises akan terhapus berkat onDelete: 'cascade' di database level jika sudah di-migrate,
      // tetapi untuk amannya kita hapus manual jika tidak ada cascade)
      // Note: sessionExercises ada onDelete: 'cascade', jadi aman.
      await tx.delete(workoutSessions).where(eq(workoutSessions.packageId, packageId))

      // Terakhir hapus paketnya
      await tx.delete(ptPackages).where(eq(ptPackages.id, packageId))
    })

    revalidatePath('/packages')
    return { success: true }
  } catch (err: any) {
    console.error('Delete package error:', err)
    return { success: false, error: err.message || 'Gagal menghapus paket' }
  }
}
