'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, clients, ptPackages, workoutSessions, ptTransactions } from '@/lib/db/schema'
import { eq, desc, and, gte, lte, sql, inArray } from 'drizzle-orm'
import { subDays as dateSubDays, format, startOfMonth as dateStartOfMonth } from 'date-fns'
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

  // 2. Fetch packages for remaining sessions calculation
  const packages = await db.select()
    .from(ptPackages)
    .where(inArray(ptPackages.clientId, clientIds))

  // 3. Fetch latest completed workout sessions
  const sessions = await db.select({
    clientId: workoutSessions.clientId,
    scheduledAt: workoutSessions.scheduledAt,
    status: workoutSessions.status,
  })
  .from(workoutSessions)
  .where(inArray(workoutSessions.clientId, clientIds))
  .orderBy(desc(workoutSessions.scheduledAt))

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
  const profile = await getAuthProfile()

  // 1. Total Active Clients
  const [activeClientsCount] = await db.select({ value: sql<number>`count(*)` })
    .from(clients)
    .innerJoin(users, eq(clients.userId, users.id))
    .where(eq(users.isActive, true))

  // 2. Fetch Packages
  const allPackages = await db.select().from(ptPackages)
  let activePkgs = 0
  let lowPkgs = 0
  let expiredPkgs = 0

  allPackages.forEach(p => {
    const rem = p.totalSessions - p.usedSessions
    if (rem <= 0) expiredPkgs++
    else if (rem <= 2) lowPkgs++
    else activePkgs++
  })

  // 3. Transactions & Revenue
  const allTransactions = await db.select().from(ptTransactions).orderBy(desc(ptTransactions.createdAt))
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

  const monthlyRevenueTrend = Object.entries(monthlyRevenueMap)
    .slice(0, 6)
    .map(([month, amount]) => ({ month, amount }))
    .reverse()

  // Fallback mock trend if database has no transaction history yet
  if (monthlyRevenueTrend.length === 0) {
    monthlyRevenueTrend.push(
      { month: 'Mei 2026', amount: 4500000 },
      { month: 'Jun 2026', amount: 7200000 },
      { month: 'Jul 2026', amount: 9800000 }
    )
  }

  // 4. Session activity
  const allSessions = await db.select().from(workoutSessions)
  const weeklySessionsMap: Record<string, number> = {}
  allSessions.forEach(s => {
    const d = new Date(s.scheduledAt)
    const weekKey = `Minggu ${Math.ceil(d.getDate() / 7)} (${format(d, 'MMM')})`
    weeklySessionsMap[weekKey] = (weeklySessionsMap[weekKey] || 0) + 1
  })

  const weeklySessions = Object.entries(weeklySessionsMap)
    .slice(0, 4)
    .map(([week, count]) => ({ week, count }))

  if (weeklySessions.length === 0) {
    weeklySessions.push(
      { week: 'Minggu 1', count: 12 },
      { week: 'Minggu 2', count: 18 },
      { week: 'Minggu 3', count: 15 },
      { week: 'Minggu 4', count: 22 }
    )
  }

  const alerts = await getCRMAlerts()

  return {
    totalRevenueThisMonth,
    totalActiveClients: activeClientsCount?.value || 0,
    lowSessionCount: alerts.filter(a => a.alertType === 'low_session').length,
    inactiveCount: alerts.filter(a => a.alertType === 'inactive').length,
    monthlyRevenueTrend,
    packageDistribution: {
      active: activePkgs,
      low: lowPkgs,
      expired: expiredPkgs,
    },
    weeklySessions,
  }
}
