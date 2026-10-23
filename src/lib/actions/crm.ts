'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, clients, ptPackages, workoutSessions, ptTransactions } from '@/lib/db/schema'
import { eq, desc, and, gte, lte, sql, inArray } from 'drizzle-orm'
import { subDays as dateSubDays, subMonths, format, startOfMonth as dateStartOfMonth } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) throw new Error('Profile not found')
  return profile
}

export interface CRMAlertClient {
  clientId: string
  clientName: string
  phone?: string | null
  fitnessGoal?: string | null
  alertType: 'low_session' | 'inactive' | 'birthday'
  details: string
  remainingSessions?: number
  packageName?: string
  daysInactive?: number
}

export async function getCRMAlerts(): Promise<CRMAlertClient[]> {
  const profile = await getAuthProfile()
  if (profile.role === 'client') return []

  const alerts: CRMAlertClient[] = []

  // 1. Fetch all clients with user info
  const allClients = await db.select({
    id: clients.id,
    userId: clients.userId,
    fullName: users.fullName,
    phone: users.phone,
    dateOfBirth: clients.dateOfBirth,
    fitnessGoal: clients.fitnessGoal,
  })
  .from(clients)
  .innerJoin(users, eq(clients.userId, users.id))
  .where(eq(users.isActive, true))

  if (allClients.length === 0) return []

  const clientIds = allClients.map(c => c.id)

  // 2 & 3. Fetch packages and latest completed workout sessions in parallel
  const [packages, sessions] = await Promise.all([
    db.select()
      .from(ptPackages)
      .where(inArray(ptPackages.clientId, clientIds)),
    db.select({
      clientId: workoutSessions.clientId,
      scheduledAt: workoutSessions.scheduledAt,
      status: workoutSessions.status,
    })
    .from(workoutSessions)
    .where(inArray(workoutSessions.clientId, clientIds))
    .orderBy(desc(workoutSessions.scheduledAt)),
  ])

  const now = new Date()
  const sevenDaysAgo = dateSubDays(now, 7)

  // Process alerts per client
  for (const client of allClients) {
    const clientPkgs = packages.filter(p => p.clientId === client.id)
    const totalSessions = clientPkgs.reduce((acc, p) => acc + p.totalSessions, 0)
    const usedSessions = clientPkgs.reduce((acc, p) => acc + p.usedSessions, 0)
    const remaining = totalSessions - usedSessions
    const activePkg = clientPkgs.find(p => p.usedSessions < p.totalSessions)

    // Check Low Session Alert (remaining <= 2)
    if (clientPkgs.length > 0 && remaining <= 2) {
      alerts.push({
        clientId: client.id,
        clientName: client.fullName,
        phone: client.phone,
        fitnessGoal: client.fitnessGoal,
        alertType: 'low_session',
        details: remaining === 0 ? 'Sesi latihan sudah habis (0 Sesi)' : `Sisa ${remaining} Sesi latihan`,
        remainingSessions: remaining,
        packageName: activePkg?.packageName || clientPkgs[0]?.packageName || 'Paket PT',
      })
    }

    // Check Inactivity Alert (> 7 days without session)
    const clientSessions = sessions.filter(s => s.clientId === client.id && s.status === 'completed')
    const lastSession = clientSessions[0]
    if (lastSession) {
      const lastDate = new Date(lastSession.scheduledAt)
      if (lastDate < sevenDaysAgo) {
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24))
        alerts.push({
          clientId: client.id,
          clientName: client.fullName,
          phone: client.phone,
          fitnessGoal: client.fitnessGoal,
          alertType: 'inactive',
          details: `Tidak latihan selama ${diffDays} hari terakhir (Terakhir: ${format(lastDate, 'dd MMM', { locale: idLocale })})`,
          daysInactive: diffDays,
        })
      }
    } else if (clientPkgs.length > 0) {
      // Has package but never completed a session
      alerts.push({
        clientId: client.id,
        clientName: client.fullName,
        phone: client.phone,
        fitnessGoal: client.fitnessGoal,
        alertType: 'inactive',
        details: 'Belum pernah latihan sejak mendaftar',
        daysInactive: 7,
      })
    }

    // Check Birthday Alert (Birthday in current month)
    if (client.dateOfBirth) {
      const dob = new Date(client.dateOfBirth)
      if (dob.getMonth() === now.getMonth()) {
        const isToday = dob.getDate() === now.getDate()
        alerts.push({
          clientId: client.id,
          clientName: client.fullName,
          phone: client.phone,
          fitnessGoal: client.fitnessGoal,
          alertType: 'birthday',
          details: isToday ? '🎂 Ulang tahun HARI INI!' : `🎂 Ulang tahun tanggal ${dob.getDate()} bulan ini`,
        })
      }
    }
  }

  return alerts
}

export interface CRMTaskItem {
  id: string
  clientId: string
  clientName: string
  phone?: string | null
  taskType: 'renewal' | 'followup' | 'birthday' | 'confirmation'
  title: string
  desc: string
  isCompleted: boolean
  dueDate: string
}

export async function getCRMTasks(): Promise<CRMTaskItem[]> {
  const alerts = await getCRMAlerts()
  const tasks: CRMTaskItem[] = []

  alerts.forEach((alert, i) => {
    if (alert.alertType === 'low_session') {
      tasks.push({
        id: `task-renewal-${alert.clientId}-${i}`,
        clientId: alert.clientId,
        clientName: alert.clientName,
        phone: alert.phone,
        taskType: 'renewal',
        title: `Follow-up perpanjangan paket ${alert.clientName}`,
        desc: `Sisa sesi tinggal ${alert.remainingSessions ?? 0} sesi. Kirim penawaran paket renewal.`,
        isCompleted: false,
        dueDate: 'Hari ini',
      })
    } else if (alert.alertType === 'inactive') {
      tasks.push({
        id: `task-inactive-${alert.clientId}-${i}`,
        clientId: alert.clientId,
        clientName: alert.clientName,
        phone: alert.phone,
        taskType: 'followup',
        title: `Sapa & tanyakan kabar ${alert.clientName}`,
        desc: alert.details,
        isCompleted: false,
        dueDate: 'Hari ini',
      })
    } else if (alert.alertType === 'birthday') {
      tasks.push({
        id: `task-birthday-${alert.clientId}-${i}`,
        clientId: alert.clientId,
        clientName: alert.clientName,
        phone: alert.phone,
        taskType: 'birthday',
        title: `Kirim ucapan selamat ulang tahun ke ${alert.clientName}`,
        desc: alert.details,
        isCompleted: false,
        dueDate: 'Hari ini',
      })
    }
  })

  return tasks.slice(0, 6) // Top 6 priority tasks
}

export interface CRMAnalyticsData {
  totalRevenueThisMonth: number
  totalActiveClients: number
  lowSessionCount: number
  inactiveCount: number
  monthlyRevenueTrend: { month: string; amount: number }[]
  packageDistribution: { active: number; low: number; expired: number }
  weeklySessions: { week: string; count: number }[]
}

export async function getCRMAnalytics(): Promise<CRMAnalyticsData> {
  await getAuthProfile()

  // Fetch all analytics datasets in parallel in 1 roundtrip
  const [
    [activeClientsCount],
    allPackages,
    allTransactions,
    allSessions,
    alerts,
  ] = await Promise.all([
    db.select({ value: sql<number>`count(*)` })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(eq(users.isActive, true)),
    db.select().from(ptPackages),
    db.select().from(ptTransactions).orderBy(desc(ptTransactions.createdAt)),
    db.select().from(workoutSessions),
    getCRMAlerts(),
  ])

  let activePkgs = 0
  let lowPkgs = 0
  let expiredPkgs = 0

  allPackages.forEach(p => {
    const rem = p.totalSessions - p.usedSessions
    if (rem <= 0) expiredPkgs++
    else if (rem <= 2) lowPkgs++
    else activePkgs++
  })

  const now = new Date()
  const currentMonthStart = dateStartOfMonth(now)

  let totalRevenueThisMonth = 0
  const monthlyRevenueMap: Record<string, number> = {}

  allTransactions.forEach(t => {
    const d = t.createdAt ? new Date(t.createdAt) : new Date()
    const amount = Number(t.amount) || 0

    if (d >= currentMonthStart) {
      totalRevenueThisMonth += amount
    }

    const monthKey = format(d, 'MMM yyyy', { locale: idLocale })
    monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + amount
  })

  // Construct monthly trend chronologically for the past 4 months up to current month
  const monthlyRevenueTrend: { month: string; amount: number }[] = []
  for (let i = 3; i >= 0; i--) {
    const targetDate = subMonths(now, i)
    const monthKey = format(targetDate, 'MMM yyyy', { locale: idLocale })
    monthlyRevenueTrend.push({
      month: monthKey,
      amount: monthlyRevenueMap[monthKey] || 0,
    })
  }

  // Session activity for current month
  const weeklySessionsMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  allSessions.forEach(s => {
    const d = new Date(s.scheduledAt)
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const weekNum = Math.min(4, Math.ceil(d.getDate() / 7))
      weeklySessionsMap[weekNum] = (weeklySessionsMap[weekNum] || 0) + 1
    }
  })

  const weeklySessions = [
    { week: 'Mgg 1', count: weeklySessionsMap[1] || 0 },
    { week: 'Mgg 2', count: weeklySessionsMap[2] || 0 },
    { week: 'Mgg 3', count: weeklySessionsMap[3] || 0 },
    { week: 'Mgg 4', count: weeklySessionsMap[4] || 0 },
  ]

  const lowFromAlerts = alerts.filter(a => a.alertType === 'low_session').length
  const effectiveLow = Math.max(lowPkgs, lowFromAlerts)

  return {
    totalRevenueThisMonth,
    totalActiveClients: activeClientsCount?.value || 0,
    lowSessionCount: effectiveLow,
    inactiveCount: alerts.filter(a => a.alertType === 'inactive').length,
    monthlyRevenueTrend,
    packageDistribution: {
      active: activePkgs,
      low: effectiveLow,
      expired: expiredPkgs,
    },
    weeklySessions,
  }
}
