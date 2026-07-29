import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, workoutSessions, ptPackages, clients } from '@/lib/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { BarChart3, TrendingUp, Calendar, CheckCircle2, Clock, Users, Award, Download, Dumbbell } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Laporan & Analytics' }

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, authUser.id))
  if (!profile) redirect('/login')

  // Fetch session history for report
  let sessionLogs: any[] = []
  let totalSessionsCount = 0
  let completedCount = 0
  let cancelledCount = 0
  let activeClientsCount = 0

  if (profile.role === 'client') {
    const [clientRec] = await db.select().from(clients).where(eq(clients.userId, profile.id))
    if (clientRec) {
      sessionLogs = await db
        .select({
          id: workoutSessions.id,
          scheduledAt: workoutSessions.scheduledAt,
          status: workoutSessions.status,
          programType: workoutSessions.programType,
          location: workoutSessions.location,
          rpe: workoutSessions.rpe,
          duration: workoutSessions.duration,
          pdfAttachmentUrl: workoutSessions.pdfAttachmentUrl,
        })
        .from(workoutSessions)
        .where(eq(workoutSessions.clientId, clientRec.id))
        .orderBy(desc(workoutSessions.scheduledAt))

      totalSessionsCount = sessionLogs.length
      completedCount = sessionLogs.filter(s => s.status === 'completed').length
      cancelledCount = sessionLogs.filter(s => s.status === 'cancelled').length
    }
  } else {
    // PT / Super Admin report
    sessionLogs = await db
      .select({
        id: workoutSessions.id,
        scheduledAt: workoutSessions.scheduledAt,
        status: workoutSessions.status,
        programType: workoutSessions.programType,
        location: workoutSessions.location,
        rpe: workoutSessions.rpe,
        duration: workoutSessions.duration,
        clientName: users.fullName,
        pdfAttachmentUrl: workoutSessions.pdfAttachmentUrl,
      })
      .from(workoutSessions)
      .leftJoin(clients, eq(workoutSessions.clientId, clients.id))
      .leftJoin(users, eq(clients.userId, users.id))
      .orderBy(desc(workoutSessions.scheduledAt))

    totalSessionsCount = sessionLogs.length
    completedCount = sessionLogs.filter(s => s.status === 'completed').length
    cancelledCount = sessionLogs.filter(s => s.status === 'cancelled').length

    const [clientsCountRes] = await db.select({ value: count() }).from(clients)
    activeClientsCount = clientsCountRes?.value || 0
  }

  const attendanceRate = totalSessionsCount > 0 ? Math.round((completedCount / totalSessionsCount) * 100) : 100

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 980, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div className="flex-between mb-6 flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Analytics & Insight</span>
          <h1 className="text-2xl font-black text-white mt-1">Laporan Performansi & Kehadiran</h1>
          <p className="text-sm text-slate-400">Rekapitulasi aktivitas sesi latihan, statistik kehadiran, dan progres</p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{completedCount}</span>
            <span className="block text-xs font-semibold text-slate-400">Sesi Selesai</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{attendanceRate}%</span>
            <span className="block text-xs font-semibold text-slate-400">Kehadiran (Rate)</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Dumbbell size={24} />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{totalSessionsCount}</span>
            <span className="block text-xs font-semibold text-slate-400">Total Sesi</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users size={24} />
          </div>
          <div>
            <span className="text-2xl font-black text-white">{profile.role === 'client' ? '1' : activeClientsCount}</span>
            <span className="block text-xs font-semibold text-slate-400">{profile.role === 'client' ? 'Akun Client' : 'Client Aktif'}</span>
          </div>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <div className="flex-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-400" />
            <span>Riwayat & Rekapitulasi Sesi Latihan</span>
          </h3>
          <span className="text-xs text-slate-400">{sessionLogs.length} Data Ditemukan</span>
        </div>

        {sessionLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Belum ada data sesi latihan yang tercatat dalam laporan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-2 font-semibold">Tanggal & Waktu</th>
                  {profile.role !== 'client' && <th className="pb-3 px-2 font-semibold">Nama Client</th>}
                  <th className="pb-3 px-2 font-semibold">Program</th>
                  <th className="pb-3 px-2 font-semibold">Lokasi</th>
                  <th className="pb-3 px-2 font-semibold">Status</th>
                  <th className="pb-3 px-2 font-semibold text-right">Aksi / Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {sessionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-medium">
                      {format(new Date(log.scheduledAt), 'dd MMM yyyy • HH:mm', { locale: idLocale })}
                    </td>
                    {profile.role !== 'client' && (
                      <td className="py-3 px-2 font-bold text-white">{log.clientName || 'Client'}</td>
                    )}
                    <td className="py-3 px-2 text-indigo-300 font-semibold">{log.programType || 'Total Body'}</td>
                    <td className="py-3 px-2 text-slate-300">{log.location || 'Hang Lekir'}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        log.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        log.status === 'scheduled' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {log.status === 'completed' ? 'Selesai' : log.status === 'scheduled' ? 'Terjadwal' : 'Batal'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {log.pdfAttachmentUrl ? (
                        <a
                          href={log.pdfAttachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <Download size={12} />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
