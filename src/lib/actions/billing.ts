'use server'

import { db } from '@/lib/db'
import { ptPackages, ptTransactions, clients, personalTrainers, users, workoutSessions } from '@/lib/db/schema'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export interface MonthlyBillingSummary {
  clientId: string
  clientName: string
  clientPhone: string | null
  monthStr: string // 'yyyy-MM'
  monthLabel: string // 'September 2026'
  hasPostpaidPackage: boolean
  postpaidPackageId: string | null
  ratePerSession: number
  totalCompletedSessions: number
  totalAmount: number
  isPaid: boolean
  paymentDate: string | null
  transactionId: string | null
  sessions: {
    id: string
    scheduledAt: string
    status: string
    programType: string | null
    location: string | null
  }[]
}

export async function getMonthlyBillingSummary(clientId: string, monthStrInput?: string): Promise<MonthlyBillingSummary | null> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    // Determine month range
    const now = new Date()
    const currentMonthStr = format(now, 'yyyy-MM')
    const targetMonthStr = monthStrInput || currentMonthStr
    const monthDate = new Date(`${targetMonthStr}-01T00:00:00`)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const monthLabel = format(monthDate, 'MMMM yyyy', { locale: idLocale })

    // 1. Get Client & User Info
    const [clientRow] = await db
      .select({
        id: clients.id,
        trainerId: clients.trainerId,
        fullName: users.fullName,
        phone: users.phone,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(eq(clients.id, clientId))

    if (!clientRow) return null

    // 2. Get Postpaid Package
    const packages = await db
      .select()
      .from(ptPackages)
      .where(eq(ptPackages.clientId, clientId))
      .orderBy(desc(ptPackages.createdAt))

    const postpaidPkg = packages.find(
      (p) =>
        p.billingType === 'postpaid' ||
        (p.packageName && p.packageName.toLowerCase().includes('pascabayar')) ||
        (p.packageName && p.packageName.toLowerCase().includes('postpaid'))
    )

    const ratePerSession = postpaidPkg ? Number(postpaidPkg.pricePerSession) || 350000 : 350000

    // 3. Get Sessions in Target Month
    const monthSessions = await db
      .select({
        id: workoutSessions.id,
        scheduledAt: workoutSessions.scheduledAt,
        status: workoutSessions.status,
        programType: workoutSessions.programType,
        location: workoutSessions.location,
      })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.clientId, clientId),
          gte(workoutSessions.scheduledAt, monthStart),
          lte(workoutSessions.scheduledAt, monthEnd)
        )
      )
      .orderBy(workoutSessions.scheduledAt)

    const completedSessions = monthSessions.filter((s) => s.status === 'completed')
    const totalCompleted = completedSessions.length
    const totalAmount = totalCompleted * ratePerSession

    // 4. Check if already marked as Paid in ptTransactions
    let isPaid = false
    let paymentDate: string | null = null
    let transactionId: string | null = null

    const transactions = await db
      .select()
      .from(ptTransactions)
      .where(eq(ptTransactions.clientId, clientId))
      .orderBy(desc(ptTransactions.createdAt))

    // Match transaction notes containing the month e.g. "Billing Pascabayar: 2026-09" or "September 2026"
    const matchingTrx = transactions.find(
      (trx) =>
        trx.notes &&
        (trx.notes.includes(targetMonthStr) ||
          trx.notes.toLowerCase().includes(monthLabel.toLowerCase()))
    )

    if (matchingTrx && matchingTrx.paymentStatus === 'paid') {
      isPaid = true
      paymentDate = matchingTrx.paymentDate ? new Date(matchingTrx.paymentDate).toISOString() : null
      transactionId = matchingTrx.id
    }

    return {
      clientId,
      clientName: clientRow.fullName,
      clientPhone: clientRow.phone,
      monthStr: targetMonthStr,
      monthLabel,
      hasPostpaidPackage: Boolean(postpaidPkg),
      postpaidPackageId: postpaidPkg ? postpaidPkg.id : null,
      ratePerSession,
      totalCompletedSessions: totalCompleted,
      totalAmount,
      isPaid,
      paymentDate,
      transactionId,
      sessions: monthSessions.map((s) => ({
        id: s.id,
        scheduledAt: new Date(s.scheduledAt).toISOString(),
        status: s.status,
        programType: s.programType,
        location: s.location,
      })),
    }
  } catch (err) {
    console.error('getMonthlyBillingSummary error:', err)
    return null
  }
}

export async function recordMonthlyBillingPayment(input: {
  clientId: string
  packageId: string
  monthStr: string
  amount: number
  notes?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    const [clientData] = await db.select().from(clients).where(eq(clients.id, input.clientId))
    if (!clientData) return { success: false, error: 'Client tidak ditemukan' }

    let trainerId = clientData.trainerId
    if (!trainerId && currentUser.role === 'personal_trainer') {
      const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, currentUser.id))
      if (ptData) trainerId = ptData.id
    }

    if (!trainerId) return { success: false, error: 'Trainer tidak ditemukan' }

    const pDate = new Date()
    const noteText = `Billing Pascabayar: ${input.monthStr}${input.notes ? ` (${input.notes})` : ''}`

    const [newTrx] = await db.insert(ptTransactions).values({
      packageId: input.packageId,
      trainerId,
      clientId: input.clientId,
      amount: String(input.amount),
      paymentStatus: 'paid',
      paymentDate: pDate,
      createdAt: pDate,
      notes: noteText,
    }).returning({ id: ptTransactions.id })

    revalidatePath(`/clients/${input.clientId}`)
    revalidatePath('/packages')
    revalidatePath('/dashboard')

    return { success: true, transactionId: newTrx.id }
  } catch (err: any) {
    console.error('recordMonthlyBillingPayment error:', err)
    return { success: false, error: err.message || 'Gagal mencatat pembayaran' }
  }
}

export async function deleteMonthlyBillingPayment(transactionId: string, clientId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    await db.delete(ptTransactions).where(eq(ptTransactions.id, transactionId))

    revalidatePath(`/clients/${clientId}`)
    revalidatePath('/packages')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: any) {
    console.error('deleteMonthlyBillingPayment error:', err)
    return { success: false, error: err.message || 'Gagal membatalkan pembayaran' }
  }
}

export async function updatePostpaidRate(packageId: string, newRate: number, clientId?: string) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    if (!newRate || newRate <= 0 || isNaN(newRate)) {
      return { success: false, error: 'Tarif per sesi tidak valid' }
    }

    await db
      .update(ptPackages)
      .set({ pricePerSession: String(newRate) })
      .where(eq(ptPackages.id, packageId))

    if (clientId) {
      revalidatePath(`/clients/${clientId}`)
    }
    revalidatePath('/clients')
    revalidatePath('/packages')
    return { success: true }
  } catch (err: any) {
    console.error('updatePostpaidRate error:', err)
    return { success: false, error: err.message || 'Gagal mengubah tarif' }
  }
}
