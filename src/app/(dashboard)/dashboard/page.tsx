import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  SuperAdminDashboard,
  PTDashboard,
  ClientDashboard,
} from '@/components/dashboard/pt-dashboard'
import { getCRMTasks, getCRMAnalytics } from '@/lib/actions/crm'
import { CRMTaskManager } from '@/components/crm/crm-task-manager'
import { CRMAnalyticsCharts } from '@/components/crm/crm-analytics-charts'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'client'

  // Fetch stats based on role
  // Common dates
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString()

  let saStats = { totalClients: 0, totalPTs: 0, monthSessions: 0, monthRevenue: 0, sessionsTrend: 0, revenueTrend: 0, recentActivity: [] as any[] }
  let ptStats = { totalClients: 0, todaySessions: 0, monthSessions: 0, monthRevenue: 0, sessionsTrend: 0, revenueTrend: 0, todaySessionsList: [] as any[], recentClientsList: [] as any[], recentRevenueList: [] as any[] }
  let clientStats = { remainingSessions: 0, completedSessions: 0, streakDays: 0, nextSession: null as any, recentProgress: null as any }

  if (role === 'super_admin') {
    const { count: clientsCount } = await supabase.from('clients').select('*', { count: 'exact', head: true })
    const { count: ptsCount } = await supabase.from('personal_trainers').select('*', { count: 'exact', head: true })
    saStats.totalClients = clientsCount || 0
    saStats.totalPTs = ptsCount || 0

    const { count: monthSessionsCount } = await supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).gte('scheduled_at', startOfMonth).lte('scheduled_at', endOfMonth)
    saStats.monthSessions = monthSessionsCount || 0
    const { count: lastMonthSessionsCount } = await supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).gte('scheduled_at', startOfLastMonth).lte('scheduled_at', endOfLastMonth)
    saStats.sessionsTrend = lastMonthSessionsCount === 0 ? (saStats.monthSessions > 0 ? 100 : 0) : Math.round(((saStats.monthSessions - (lastMonthSessionsCount || 0)) / (lastMonthSessionsCount || 1)) * 100)

    const { data: allPackages } = await supabase.from('pt_packages').select('total_price, created_at')
    
    const thisMonthPackages = allPackages?.filter(p => p.created_at >= startOfMonth && p.created_at <= endOfMonth) || []
    saStats.monthRevenue = thisMonthPackages.reduce((acc, pkg) => acc + Number(pkg.total_price), 0) || 0
    
    const lastMonthPackagesSA = allPackages?.filter(p => p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth) || []
    const lastMonthRevenueSA = lastMonthPackagesSA.reduce((acc, pkg) => acc + Number(pkg.total_price), 0) || 0
    saStats.revenueTrend = lastMonthRevenueSA === 0 ? (saStats.monthRevenue > 0 ? 100 : 0) : Math.round(((saStats.monthRevenue - lastMonthRevenueSA) / lastMonthRevenueSA) * 100)

    const { data: recentUsers } = await supabase.from('users').select('full_name, role, created_at').order('created_at', { ascending: false }).limit(5)
    saStats.recentActivity = recentUsers?.map(u => ({
      title: `Pengguna baru: ${u.full_name}`,
      desc: `Role: ${u.role}`,
      time: new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    })) || []

  } else if (role === 'personal_trainer') {
    const { data: ptData } = await supabase.from('personal_trainers').select('id').eq('user_id', user.id).single()
    if (ptData) {
      const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('trainer_id', ptData.id)
      ptStats.totalClients = count || 0

      // Today sessions
      const { data: todaySessionsData, count: todayCount } = await supabase
        .from('workout_sessions')
        .select('id, scheduled_at, status, clients(users(full_name))', { count: 'exact' })
        .eq('trainer_id', ptData.id)
        .gte('scheduled_at', startOfDay)
        .lte('scheduled_at', endOfDay)
        .order('scheduled_at', { ascending: true })
      ptStats.todaySessions = todayCount || 0
      ptStats.todaySessionsList = todaySessionsData || []

      // Month sessions
      const { count: monthCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', ptData.id)
        .gte('scheduled_at', startOfMonth)
        .lte('scheduled_at', endOfMonth)
      ptStats.monthSessions = monthCount || 0

      const { count: lastMonthCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', ptData.id)
        .gte('scheduled_at', startOfLastMonth)
        .lte('scheduled_at', endOfLastMonth)
      ptStats.sessionsTrend = lastMonthCount === 0 ? (ptStats.monthSessions > 0 ? 100 : 0) : Math.round(((ptStats.monthSessions - (lastMonthCount || 0)) / (lastMonthCount || 1)) * 100)

      // Month revenue & recent packages
      const { data: packages } = await supabase
        .from('pt_packages')
        .select('package_name, total_price, created_at, clients(users(full_name))')
        .eq('trainer_id', ptData.id)
        
      const thisMonthPackages = packages?.filter(p => p.created_at >= startOfMonth && p.created_at <= endOfMonth) || []
      ptStats.monthRevenue = thisMonthPackages.reduce((acc, pkg) => acc + Number(pkg.total_price), 0) || 0
      
      const lastMonthPackagesPT = packages?.filter(p => p.created_at >= startOfLastMonth && p.created_at <= endOfLastMonth) || []
      const lastMonthRevenuePT = lastMonthPackagesPT.reduce((acc, pkg) => acc + Number(pkg.total_price), 0) || 0
      ptStats.revenueTrend = lastMonthRevenuePT === 0 ? (ptStats.monthRevenue > 0 ? 100 : 0) : Math.round(((ptStats.monthRevenue - lastMonthRevenuePT) / lastMonthRevenuePT) * 100)
      
      ptStats.recentRevenueList = (packages || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)

      // Recent clients
      const { data: recentClients } = await supabase
        .from('clients')
        .select('id, created_at, users(full_name, email)')
        .eq('trainer_id', ptData.id)
        .order('created_at', { ascending: false })
        .limit(4)
      ptStats.recentClientsList = recentClients || []
    }
  } else if (role === 'client') {
    const { data: clientData } = await supabase.from('clients').select('id').eq('user_id', user.id).single()
    if (clientData) {
      const { data: packages } = await supabase.from('pt_packages').select('total_sessions, used_sessions').eq('client_id', clientData.id)
      if (packages) {
        clientStats.remainingSessions = packages.reduce((acc, p) => acc + (p.total_sessions - p.used_sessions), 0)
        clientStats.completedSessions = packages.reduce((acc, p) => acc + p.used_sessions, 0)
      }
      
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('scheduled_at')
        .eq('client_id', clientData.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
      if (sessions && sessions.length > 0) clientStats.nextSession = sessions[0].scheduled_at

      // Streak
      const { data: completedSessions } = await supabase
        .from('workout_sessions')
        .select('scheduled_at')
        .eq('client_id', clientData.id)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
      
      let streak = 0
      if (completedSessions && completedSessions.length > 0) {
        let currentDate = new Date()
        currentDate.setHours(0,0,0,0)
        for (let s of completedSessions) {
          const sDate = new Date(s.scheduled_at)
          sDate.setHours(0,0,0,0)
          const diffTime = Math.abs(currentDate.getTime() - sDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays <= 1) {
            streak++
            currentDate = sDate
          } else {
            break
          }
        }
      }
      clientStats.streakDays = streak

      // Recent Progress
      const { data: measurements } = await supabase
        .from('measurements')
        .select('weight, body_fat_percentage, measured_at')
        .eq('client_id', clientData.id)
        .order('measured_at', { ascending: false })
        .limit(1)
      if (measurements && measurements.length > 0) {
        clientStats.recentProgress = measurements[0]
      }
    }
  }

  let crmTasks: any[] = []
  let crmAnalytics: any = null

  if (role === 'super_admin' || role === 'personal_trainer') {
    try {
      crmTasks = await getCRMTasks()
      crmAnalytics = await getCRMAnalytics()
    } catch (e) {
      console.error('Failed to fetch CRM data:', e)
    }
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {role === 'super_admin' && <SuperAdminDashboard stats={saStats} userName={profile?.full_name} />}
      {role === 'personal_trainer' && <PTDashboard stats={ptStats} userName={profile?.full_name} />}
      
      {(role === 'super_admin' || role === 'personal_trainer') && (
        <>
          {/* Daily Task Manager */}
          <CRMTaskManager initialTasks={crmTasks} />

          {/* CRM Analytics Charts */}
          {crmAnalytics && <CRMAnalyticsCharts data={crmAnalytics} />}
        </>
      )}

      {role === 'client' && <ClientDashboard stats={clientStats} />}
    </div>
  )
}
