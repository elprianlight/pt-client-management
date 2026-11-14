'use server'

import { db } from '@/lib/db'
import {
  clients,
  paymentReports,
  ptBankAccounts,
  ptPackages,
  ptTransactions,
  personalTrainers,
  receiptCounters,
  users,
  workoutSessions,
} from '@/lib/db/schema'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { revalidatePath } from 'next/cache'
import { endOfMonth, format, startOfMonth } from 'date-fns'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from './audit'

// =============================================================================
// Pembayaran sesi (PRD v2)
// - Hanya Admin (super_admin) yang mencatat / void transaksi.
// - PT melaporkan pembayaran yang ia terima (bukti transfer wajib); Admin mengonfirmasi.
// - Saldo bayar dihitung dari transaksi, bukan diketik.
// =============================================================================

const cu = alias(users, 'cu') // pengguna klien
const tu = alias(users, 'tu') // pengguna PT

type Role = 'super_admin' | 'personal_trainer' | 'client'

interface Caller {
  userId: string
  role: Role
  fullName: string
  trainerId: string | null
  clientId: string | null
}

async function getCaller(): Promise<Caller | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null

  const [u] = await db.select().from(users).where(eq(users.id, authUser.id))
  if (!u || !u.isActive) return null

  let trainerId: string | null = null
  let clientId: string | null = null
  if (u.role === 'personal_trainer') {
    const [pt] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, u.id))
    trainerId = pt?.id ?? null
  } else if (u.role === 'client') {
    const [c] = await db.select().from(clients).where(eq(clients.userId, u.id))
    clientId = c?.id ?? null
  }
  return { userId: u.id, role: u.role as Role, fullName: u.fullName, trainerId, clientId }
}

const num = (v: unknown) => Number(v ?? 0) || 0

function jakartaYear(d = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(d))
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Nomor kuitansi berurutan: ELP-TAHUN-URUTAN (urutan mulai ulang tiap tahun). */
async function nextReceiptNumber(tx: Tx): Promise<string> {
  const year = jakartaYear()
  const [row] = await tx
    .insert(receiptCounters)
    .values({ year, lastNumber: 1 })
    .onConflictDoUpdate({
      target: receiptCounters.year,
      set: { lastNumber: sql`${receiptCounters.lastNumber} + 1` },
    })
    .returning({ n: receiptCounters.lastNumber })
  return `ELP-${year}-${String(row.n).padStart(4, '0')}`
}

function isPostpaidPackage(p: { billingType: string; packageName: string | null }) {
  const name = (p.packageName || '').toLowerCase()
  return p.billingType === 'postpaid' || name.includes('pascabayar') || name.includes('postpaid')
}

/** Total uang diterima paket (tanpa transaksi yang di-void; refund mengurangi). */
async function paidForPackage(tx: Tx | typeof db, packageId: string): Promise<number> {
  const [row] = await tx
    .select({
      paid: sql<string>`COALESCE(SUM(CASE WHEN ${ptTransactions.kind} = 'refund' THEN -${ptTransactions.amount} ELSE ${ptTransactions.amount} END), 0)`,
    })
    .from(ptTransactions)
    .where(
      and(
        eq(ptTransactions.packageId, packageId),
        isNull(ptTransactions.voidedAt),
        sql`${ptTransactions.paymentStatus} IN ('paid','partial')`
      )
    )
  return num(row?.paid)
}

/** Status bayar paket prabayar dihitung dari total transaksi (B2). */
async function recalcPackagePaymentStatus(tx: Tx, packageId: string) {
  const [pkg] = await tx.select().from(ptPackages).where(eq(ptPackages.id, packageId))
  if (!pkg || isPostpaidPackage(pkg)) return
  const paid = await paidForPackage(tx, packageId)
  const total = num(pkg.totalPrice)
  const status = paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending'
  await tx.update(ptPackages).set({ paymentStatus: status, updatedAt: new Date() }).where(eq(ptPackages.id, packageId))
}

function revalidateMoney() {
  revalidatePath('/payments')
  revalidatePath('/packages')
  revalidatePath('/clients')
  revalidatePath('/dashboard')
  revalidatePath('/reports')
}

// -----------------------------------------------------------------------------
// Admin: catat / void pembayaran
// -----------------------------------------------------------------------------

const recordSchema = z.object({
  packageId: z.guid(),
  amount: z.coerce.number().positive('Jumlah harus lebih dari 0'),
  notes: z.string().max(500).optional(),
  monthStr: z.string().regex(/^\d{4}-\d{2}$/).optional(), // untuk tagihan pascabayar
})

/** Dipakai bersama oleh pencatatan langsung Admin dan konfirmasi laporan PT. */
async function insertPayment(
  tx: Tx,
  input: { packageId: string; amount: number; notes?: string; monthStr?: string }
): Promise<{ id: string; receiptNumber: string; clientId: string }> {
  const [pkg] = await tx.select().from(ptPackages).where(eq(ptPackages.id, input.packageId))
  if (!pkg) throw new Error('Paket tidak ditemukan')

  const postpaid = isPostpaidPackage(pkg)
  if (!postpaid) {
    const paid = await paidForPackage(tx, pkg.id)
    const outstanding = num(pkg.totalPrice) - paid
    if (input.amount > outstanding + 0.005) {
      throw new Error(`Pembayaran melebihi sisa tagihan (sisa Rp ${Math.max(outstanding, 0).toLocaleString('id-ID')})`)
    }
  }

  const receiptNumber = await nextReceiptNumber(tx)
  const now = new Date()
  const noteParts = [
    postpaid && input.monthStr ? `Billing Pascabayar: ${input.monthStr}` : null,
    input.notes?.trim() || null,
  ].filter(Boolean)

  const [trx] = await tx
    .insert(ptTransactions)
    .values({
      packageId: pkg.id,
      trainerId: pkg.trainerId,
      clientId: pkg.clientId,
      amount: String(input.amount),
      paymentStatus: 'paid',
      paymentDate: now,
      receiptNumber,
      kind: 'payment',
      notes: noteParts.length ? noteParts.join(' — ') : null,
    })
    .returning({ id: ptTransactions.id })

  await recalcPackagePaymentStatus(tx, pkg.id)
  return { id: trx.id, receiptNumber, clientId: pkg.clientId }
}

export async function recordPayment(input: z.input<typeof recordSchema>) {
  try {
    const caller = await getCaller()
    if (!caller || caller.role !== 'super_admin') {
      return { success: false as const, error: 'Hanya Admin yang dapat mencatat pembayaran' }
    }
    const parsed = recordSchema.safeParse(input)
    if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message }

    const result = await db.transaction((tx) => insertPayment(tx, parsed.data))

    await logAudit({
      action: 'RECORD_PAYMENT',
      tableName: 'pt_transactions',
      recordId: result.id,
      newValues: { ...parsed.data, receiptNumber: result.receiptNumber },
    })
    revalidateMoney()
    return { success: true as const, transactionId: result.id, receiptNumber: result.receiptNumber }
  } catch (err: any) {
    console.error('recordPayment error:', err)
    return { success: false as const, error: err.message || 'Gagal mencatat pembayaran' }
  }
}

export async function voidTransaction(transactionId: string, reason: string) {
  try {
    const caller = await getCaller()
    if (!caller || caller.role !== 'super_admin') {
      return { success: false as const, error: 'Hanya Admin yang dapat mem-void transaksi' }
    }
    const why = (reason || '').trim()
    if (!why) return { success: false as const, error: 'Alasan void wajib diisi' }

    const [trx] = await db.select().from(ptTransactions).where(eq(ptTransactions.id, transactionId))
    if (!trx) return { success: false as const, error: 'Transaksi tidak ditemukan' }
    if (trx.voidedAt) return { success: false as const, error: 'Transaksi sudah di-void' }

    await db.transaction(async (tx) => {
      await tx
        .update(ptTransactions)
        .set({ voidedAt: new Date(), voidReason: why, voidedBy: caller.userId })
        .where(eq(ptTransactions.id, transactionId))
      await recalcPackagePaymentStatus(tx, trx.packageId)
    })

    await logAudit({
      action: 'VOID_TRANSACTION',
      tableName: 'pt_transactions',
      recordId: transactionId,
      oldValues: { amount: trx.amount, receiptNumber: trx.receiptNumber },
      newValues: { voidReason: why },
    })
    revalidateMoney()
    return { success: true as const }
  } catch (err: any) {
    console.error('voidTransaction error:', err)
    return { success: false as const, error: err.message || 'Gagal mem-void transaksi' }
  }
}

// -----------------------------------------------------------------------------
// PT melaporkan pembayaran; Admin mengonfirmasi / menolak (B8)
// -----------------------------------------------------------------------------

const reportSchema = z.object({
  packageId: z.guid('Pilih paket'),
  amount: z.coerce.number().positive('Jumlah harus lebih dari 0'),
  proofPath: z.string().min(3, 'Foto bukti transfer wajib diunggah'),
  notes: z.string().max(500).optional(),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export async function submitPaymentReport(input: z.input<typeof reportSchema>) {
  try {
    const caller = await getCaller()
    if (!caller || caller.role !== 'personal_trainer' || !caller.trainerId) {
      return { success: false as const, error: 'Hanya PT yang dapat melaporkan pembayaran' }
    }
    const parsed = reportSchema.safeParse(input)
    if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message }
    const data = parsed.data

    // Bukti harus berada di folder milik PT pelapor
    if (!data.proofPath.startsWith(`${caller.userId}/`)) {
      return { success: false as const, error: 'Bukti transfer tidak valid' }
    }

    const [pkg] = await db.select().from(ptPackages).where(eq(ptPackages.id, data.packageId))
    if (!pkg || pkg.trainerId !== caller.trainerId) {
      return { success: false as const, error: 'Paket bukan milik klien Anda' }
    }

    const [row] = await db
      .insert(paymentReports)
      .values({
        trainerId: caller.trainerId,
        clientId: pkg.clientId,
        packageId: pkg.id,
        amount: String(data.amount),
        proofPath: data.proofPath,
        notes: data.notes?.trim() || null,
        periodMonth: isPostpaidPackage(pkg) ? data.periodMonth ?? null : null,
      })
      .returning({ id: paymentReports.id })

    await logAudit({ action: 'SUBMIT_PAYMENT_REPORT', tableName: 'payment_reports', recordId: row.id, newValues: data })
    revalidatePath('/payments')
    return { success: true as const, reportId: row.id }
  } catch (err: any) {
    console.error('submitPaymentReport error:', err)
    return { success: false as const, error: err.message || 'Gagal mengirim laporan pembayaran' }
  }
}

export async function confirmPaymentReport(reportId: string) {
  try {
    const caller = await getCaller()
    if (!caller || caller.role !== 'super_admin') {
      return { success: false as const, error: 'Hanya Admin yang dapat mengonfirmasi' }
    }

    const result = await db.transaction(async (tx) => {
      const [rep] = await tx.select().from(paymentReports).where(eq(paymentReports.id, reportId))
      if (!rep) throw new Error('Laporan tidak ditemukan')
      if (rep.status !== 'pending') throw new Error('Laporan sudah diproses')

      const trx = await insertPayment(tx, {
        packageId: rep.packageId,
        amount: num(rep.amount),
        notes: `Laporan PT${rep.notes ? `: ${rep.notes}` : ''}`,
        monthStr: rep.periodMonth ?? undefined,
      })
      await tx
        .update(paymentReports)
        .set({ status: 'confirmed', transactionId: trx.id, reviewedBy: caller.userId, reviewedAt: new Date() })
        .where(eq(paymentReports.id, reportId))
      return trx
    })

    await logAudit({
      action: 'CONFIRM_PAYMENT_REPORT',
      tableName: 'payment_reports',
      recordId: reportId,
      newValues: { transactionId: result.id, receiptNumber: result.receiptNumber },
    })
    revalidateMoney()
    return { success: true as const, receiptNumber: result.receiptNumber, transactionId: result.id }
  } catch (err: any) {
    console.error('confirmPaymentReport error:', err)
    return { success: false as const, error: err.message || 'Gagal mengonfirmasi laporan' }
  }
}

export async function rejectPaymentReport(reportId: string, reason: string) {
  try {
    const caller = await getCaller()
    if (!caller || caller.role !== 'super_admin') {
      return { success: false as const, error: 'Hanya Admin yang dapat menolak laporan' }
    }
    const why = (reason || '').trim()
    if (!why) return { success: false as const, error: 'Alasan penolakan wajib diisi' }

    const [rep] = await db.select().from(paymentReports).where(eq(paymentReports.id, reportId))
    if (!rep) return { success: false as const, error: 'Laporan tidak ditemukan' }
    if (rep.status !== 'pending') return { success: false as const, error: 'Laporan sudah diproses' }

    await db
      .update(paymentReports)
      .set({ status: 'rejected', rejectReason: why, reviewedBy: caller.userId, reviewedAt: new Date() })
      .where(eq(paymentReports.id, reportId))

    await logAudit({ action: 'REJECT_PAYMENT_REPORT', tableName: 'payment_reports', recordId: reportId, newValues: { reason: why } })
    revalidatePath('/payments')
    return { success: true as const }
  } catch (err: any) {
    console.error('rejectPaymentReport error:', err)
    return { success: false as const, error: err.message || 'Gagal menolak laporan' }
  }
}

// -----------------------------------------------------------------------------
// Rekening tujuan transfer per PT
// -----------------------------------------------------------------------------

const bankSchema = z.object({
  id: z.guid().optional(),
  trainerId: z.guid('Pilih PT'),
  bankName: z.string().min(2, 'Nama bank wajib diisi').max(100),
  accountNumber: z.string().min(4, 'Nomor rekening wajib diisi').max(50),
  accountHolder: z.string().min(2, 'Nama pemilik rekening wajib diisi').max(150),
  isActive: z.boolean().default(true),
})

export async function saveBankAccount(input: z.input<typeof bankSchema>) {
  try {
    const caller = await getCaller()
    if (!caller || caller.role !== 'super_admin') {
      return { success: false as const, error: 'Hanya Admin yang dapat mengatur rekening' }
    }
    const parsed = bankSchema.safeParse(input)
    if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message }
    const { id, ...values } = parsed.data

    if (id) {
      await db.update(ptBankAccounts).set(values).where(eq(ptBankAccounts.id, id))
    } else {
      await db.insert(ptBankAccounts).values(values)
    }
    await logAudit({ action: id ? 'UPDATE_BANK_ACCOUNT' : 'CREATE_BANK_ACCOUNT', tableName: 'pt_bank_accounts', recordId: id, newValues: { ...values, accountNumber: '***' } })
    revalidatePath('/payments')
    return { success: true as const }
  } catch (err: any) {
    console.error('saveBankAccount error:', err)
    return { success: false as const, error: err.message || 'Gagal menyimpan rekening' }
  }
}

// -----------------------------------------------------------------------------
// Data halaman Pembayaran (per peran) dan rekonsiliasi
// -----------------------------------------------------------------------------

export interface PackageOption {
  packageId: string
  clientId: string
  clientName: string
  trainerId: string
  trainerName: string
  packageName: string
  billingType: 'prepaid' | 'postpaid'
  totalPrice: number
  paid: number
  outstanding: number
}

export interface ReconRow {
  packageId: string
  clientName: string
  trainerName: string
  packageName: string
  billingType: 'prepaid' | 'postpaid'
  totalSessions: number
  countedSessions: number
  remainingSessions: number
  owed: number
  paid: number
  outstanding: number
}

export interface PaymentsOverview {
  role: Role
  month: string
  monthLabel: string
  summary: {
    sessionsCounted: number
    sessionValue: number
    received: number
    outstandingTotal: number
    pendingReports: number
  }
  packages: PackageOption[]
  recon: ReconRow[]
  reports: Array<{
    id: string
    status: string
    amount: number
    createdAt: string
    clientName: string
    trainerName: string
    packageName: string
    notes: string | null
    rejectReason: string | null
    periodMonth: string | null
    proofUrl: string | null
  }>
  transactions: Array<{
    id: string
    receiptNumber: string | null
    amount: number
    kind: string
    paymentDate: string | null
    notes: string | null
    voidedAt: string | null
    voidReason: string | null
    clientName: string
    trainerName: string
    packageName: string
  }>
  bankAccounts: Array<{
    id: string
    trainerId: string
    trainerName: string
    bankName: string
    accountNumber: string
    accountHolder: string
    isActive: boolean
  }>
  trainers: Array<{ id: string; name: string }>
}

export async function getPaymentsOverview(monthStr?: string): Promise<PaymentsOverview | null> {
  try {
    const caller = await getCaller()
    if (!caller) return null

    const month = monthStr && /^\d{4}-\d{2}$/.test(monthStr) ? monthStr : format(new Date(), 'yyyy-MM')
    const monthDate = new Date(`${month}-01T00:00:00+07:00`)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const monthStartIso = monthStart.toISOString()
    const monthEndIso = monthEnd.toISOString()

    // Ruang lingkup data per peran
    const scope = (col: { trainer: any; client: any }) =>
      caller.role === 'super_admin'
        ? undefined
        : caller.role === 'personal_trainer'
        ? eq(col.trainer, caller.trainerId ?? '00000000-0000-0000-0000-000000000000')
        : eq(col.client, caller.clientId ?? '00000000-0000-0000-0000-000000000000')

    // --- Paket + nama
    const pkgRows = await db
      .select({
        pkg: ptPackages,
        clientName: cu.fullName,
        trainerName: tu.fullName,
      })
      .from(ptPackages)
      .innerJoin(clients, eq(ptPackages.clientId, clients.id))
      .innerJoin(personalTrainers, eq(ptPackages.trainerId, personalTrainers.id))
      .innerJoin(cu, eq(cu.id, clients.userId))
      .innerJoin(tu, eq(tu.id, personalTrainers.userId))
      .where(scope({ trainer: ptPackages.trainerId, client: ptPackages.clientId }))

    // --- Sesi yang dihitung per paket (semua waktu) dan pada bulan terpilih
    const counted = await db
      .select({
        packageId: workoutSessions.packageId,
        total: sql<number>`COUNT(*)`,
        inMonth: sql<number>`COUNT(*) FILTER (WHERE ${workoutSessions.scheduledAt} >= ${monthStartIso}::timestamptz AND ${workoutSessions.scheduledAt} <= ${monthEndIso}::timestamptz)`,
      })
      .from(workoutSessions)
      .where(
        and(
          sql`(${workoutSessions.status} = 'completed' OR (${workoutSessions.status} IN ('cancelled','no_show') AND ${workoutSessions.countsTowardBalance}))`,
          scope({ trainer: workoutSessions.trainerId, client: workoutSessions.clientId })
        )
      )
      .groupBy(workoutSessions.packageId)
    const countedMap = new Map(counted.map((c) => [c.packageId, { total: num(c.total), inMonth: num(c.inMonth) }]))

    // --- Uang diterima per paket
    const paidRows = await db
      .select({
        packageId: ptTransactions.packageId,
        paid: sql<string>`COALESCE(SUM(CASE WHEN ${ptTransactions.kind} = 'refund' THEN -${ptTransactions.amount} ELSE ${ptTransactions.amount} END), 0)`,
        paidInMonth: sql<string>`COALESCE(SUM(CASE WHEN ${ptTransactions.kind} = 'refund' THEN -${ptTransactions.amount} ELSE ${ptTransactions.amount} END) FILTER (WHERE ${ptTransactions.paymentDate} >= ${monthStartIso}::timestamptz AND ${ptTransactions.paymentDate} <= ${monthEndIso}::timestamptz), 0)`,
      })
      .from(ptTransactions)
      .where(
        and(
          isNull(ptTransactions.voidedAt),
          sql`${ptTransactions.paymentStatus} IN ('paid','partial')`,
          scope({ trainer: ptTransactions.trainerId, client: ptTransactions.clientId })
        )
      )
      .groupBy(ptTransactions.packageId)
    const paidMap = new Map(paidRows.map((r) => [r.packageId, { paid: num(r.paid), inMonth: num(r.paidInMonth) }]))

    const recon: ReconRow[] = []
    const packages: PackageOption[] = []
    let sessionsCounted = 0
    let sessionValue = 0
    let received = 0
    let outstandingTotal = 0

    for (const r of pkgRows) {
      const p = r.pkg
      const postpaid = isPostpaidPackage(p)
      const c = countedMap.get(p.id) ?? { total: 0, inMonth: 0 }
      const pay = paidMap.get(p.id) ?? { paid: 0, inMonth: 0 }
      const owed = postpaid ? c.total * num(p.pricePerSession) : num(p.totalPrice)
      const outstanding = Math.max(owed - pay.paid, 0)

      sessionsCounted += c.inMonth
      sessionValue += c.inMonth * num(p.pricePerSession)
      received += pay.inMonth
      outstandingTotal += outstanding

      recon.push({
        packageId: p.id,
        clientName: r.clientName,
        trainerName: r.trainerName,
        packageName: p.packageName,
        billingType: postpaid ? 'postpaid' : 'prepaid',
        totalSessions: p.totalSessions,
        countedSessions: c.total,
        remainingSessions: p.totalSessions - c.total,
        owed,
        paid: pay.paid,
        outstanding,
      })
      if (p.isActive) {
        packages.push({
          packageId: p.id,
          clientId: p.clientId,
          clientName: r.clientName,
          trainerId: p.trainerId,
          trainerName: r.trainerName,
          packageName: p.packageName,
          billingType: postpaid ? 'postpaid' : 'prepaid',
          totalPrice: num(p.totalPrice),
          paid: pay.paid,
          outstanding,
        })
      }
    }
    recon.sort((a, b) => b.outstanding - a.outstanding)

    // --- Laporan pembayaran PT
    const supabase = await createClient()
    const reportRows = await db
      .select({
        r: paymentReports,
        clientName: cu.fullName,
        trainerName: tu.fullName,
        packageName: ptPackages.packageName,
      })
      .from(paymentReports)
      .innerJoin(clients, eq(paymentReports.clientId, clients.id))
      .innerJoin(personalTrainers, eq(paymentReports.trainerId, personalTrainers.id))
      .innerJoin(ptPackages, eq(paymentReports.packageId, ptPackages.id))
      .innerJoin(cu, eq(cu.id, clients.userId))
      .innerJoin(tu, eq(tu.id, personalTrainers.userId))
      .where(caller.role === 'client' ? sql`false` : scope({ trainer: paymentReports.trainerId, client: paymentReports.clientId }))
      .orderBy(desc(paymentReports.createdAt))
      .limit(60)

    const reports = await Promise.all(
      reportRows.map(async ({ r, clientName, trainerName, packageName }) => {
        let proofUrl: string | null = null
        const { data } = await supabase.storage.from('payment-proofs').createSignedUrl(r.proofPath, 3600)
        proofUrl = data?.signedUrl ?? null
        return {
          id: r.id,
          status: r.status,
          amount: num(r.amount),
          createdAt: r.createdAt.toISOString(),
          clientName,
          trainerName,
          packageName,
          notes: r.notes,
          rejectReason: r.rejectReason,
          periodMonth: r.periodMonth,
          proofUrl,
        }
      })
    )

    // --- Transaksi terbaru
    const trxRows = await db
      .select({
        t: ptTransactions,
        clientName: cu.fullName,
        trainerName: tu.fullName,
        packageName: ptPackages.packageName,
      })
      .from(ptTransactions)
      .innerJoin(clients, eq(ptTransactions.clientId, clients.id))
      .innerJoin(personalTrainers, eq(ptTransactions.trainerId, personalTrainers.id))
      .innerJoin(ptPackages, eq(ptTransactions.packageId, ptPackages.id))
      .innerJoin(cu, eq(cu.id, clients.userId))
      .innerJoin(tu, eq(tu.id, personalTrainers.userId))
      .where(scope({ trainer: ptTransactions.trainerId, client: ptTransactions.clientId }))
      .orderBy(desc(ptTransactions.createdAt))
      .limit(60)

    // --- Rekening PT
    const bankRows = await db
      .select({ b: ptBankAccounts, trainerName: tu.fullName })
      .from(ptBankAccounts)
      .innerJoin(personalTrainers, eq(ptBankAccounts.trainerId, personalTrainers.id))
      .innerJoin(tu, eq(tu.id, personalTrainers.userId))

    let visibleBanks = bankRows
    if (caller.role === 'personal_trainer') visibleBanks = bankRows.filter((b) => b.b.trainerId === caller.trainerId)
    if (caller.role === 'client' && caller.clientId) {
      const [c] = await db.select().from(clients).where(eq(clients.id, caller.clientId))
      visibleBanks = bankRows.filter((b) => b.b.trainerId === c?.trainerId && b.b.isActive)
    }

    const trainers =
      caller.role === 'super_admin'
        ? (
            await db
              .select({ id: personalTrainers.id, name: tu.fullName })
              .from(personalTrainers)
              .innerJoin(tu, eq(tu.id, personalTrainers.userId))
          ).map((t) => ({ id: t.id, name: t.name }))
        : []

    return {
      role: caller.role,
      month,
      monthLabel: format(monthDate, 'MMMM yyyy'),
      summary: {
        sessionsCounted,
        sessionValue,
        received,
        outstandingTotal,
        pendingReports: reports.filter((r) => r.status === 'pending').length,
      },
      packages,
      recon,
      reports,
      transactions: trxRows.map(({ t, clientName, trainerName, packageName }) => ({
        id: t.id,
        receiptNumber: t.receiptNumber,
        amount: num(t.amount),
        kind: t.kind,
        paymentDate: t.paymentDate ? t.paymentDate.toISOString() : null,
        notes: t.notes,
        voidedAt: t.voidedAt ? t.voidedAt.toISOString() : null,
        voidReason: t.voidReason,
        clientName,
        trainerName,
        packageName,
      })),
      bankAccounts: visibleBanks.map(({ b, trainerName }) => ({
        id: b.id,
        trainerId: b.trainerId,
        trainerName,
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        accountHolder: b.accountHolder,
        isActive: b.isActive,
      })),
      trainers,
    }
  } catch (err) {
    console.error('getPaymentsOverview error:', err)
    return null
  }
}

// -----------------------------------------------------------------------------
// Kuitansi
// -----------------------------------------------------------------------------

export async function getReceipt(transactionId: string) {
  try {
    const caller = await getCaller()
    if (!caller) return null

    const rows = await db
      .select({
        t: ptTransactions,
        clientName: cu.fullName,
        trainerName: tu.fullName,
        packageName: ptPackages.packageName,
        totalPrice: ptPackages.totalPrice,
        billingType: ptPackages.billingType,
      })
      .from(ptTransactions)
      .innerJoin(clients, eq(ptTransactions.clientId, clients.id))
      .innerJoin(personalTrainers, eq(ptTransactions.trainerId, personalTrainers.id))
      .innerJoin(ptPackages, eq(ptTransactions.packageId, ptPackages.id))
      .innerJoin(cu, eq(cu.id, clients.userId))
      .innerJoin(tu, eq(tu.id, personalTrainers.userId))
      .where(eq(ptTransactions.id, transactionId))
    const row = rows[0]
    if (!row) return null

    // Hak akses: Admin, PT pemilik, atau klien yang bersangkutan
    const allowed =
      caller.role === 'super_admin' ||
      (caller.role === 'personal_trainer' && caller.trainerId === row.t.trainerId) ||
      (caller.role === 'client' && caller.clientId === row.t.clientId)
    if (!allowed) return null

    const [bank] = await db
      .select()
      .from(ptBankAccounts)
      .where(and(eq(ptBankAccounts.trainerId, row.t.trainerId), eq(ptBankAccounts.isActive, true)))
      .limit(1)

    const paid = await paidForPackage(db, row.t.packageId)
    return {
      id: row.t.id,
      receiptNumber: row.t.receiptNumber,
      amount: num(row.t.amount),
      kind: row.t.kind,
      paymentDate: row.t.paymentDate ? row.t.paymentDate.toISOString() : row.t.createdAt.toISOString(),
      notes: row.t.notes,
      voidedAt: row.t.voidedAt ? row.t.voidedAt.toISOString() : null,
      voidReason: row.t.voidReason,
      clientName: row.clientName,
      trainerName: row.trainerName,
      packageName: row.packageName,
      billingType: row.billingType,
      totalPrice: num(row.totalPrice),
      totalPaid: paid,
      bank: bank ? { bankName: bank.bankName, accountNumber: bank.accountNumber, accountHolder: bank.accountHolder } : null,
    }
  } catch (err) {
    console.error('getReceipt error:', err)
    return null
  }
}
