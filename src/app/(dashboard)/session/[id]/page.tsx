import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, Dumbbell, Calendar, MapPin, FileText, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getSessionById } from '@/lib/actions/session'
import { WorkoutBuilder } from '@/components/sessions/workout-builder'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Detail Sesi Latihan' }

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')

  const sessionData = await getSessionById(resolvedParams.id)
  if (!sessionData) return notFound()

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="status-pill status-completed">✅ Completed</span>
      case 'scheduled':
        return <span className="status-pill status-scheduled">🔵 Scheduled</span>
      case 'cancelled':
        return <span className="status-pill status-cancelled">🔴 Cancelled</span>
      case 'no_show':
        return <span className="status-pill status-noshow">⚠️ No Show</span>
      default:
        return <span className="status-pill status-scheduled">{status}</span>
    }
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 40 }}>
      <div className="flex-between mb-4">
        <Link href="/session" className="back-link">
          <ArrowLeft size={16} />
          <span>Kembali ke Jadwal Sesi</span>
        </Link>
        {profile.role !== 'client' && (
          <Link href={`/session/${sessionData.id}/edit`} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }}>
            Edit Sesi
          </Link>
        )}
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 mb-6">
        <div className="flex-between mb-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Program Latihan</span>
            <h1 className="text-2xl font-black text-white mt-1">{sessionData.programType || 'Total Body'}</h1>
          </div>
          <div>{renderStatusBadge(sessionData.status)}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 text-xs flex items-center gap-1 mb-1">
              <Calendar size={14} className="text-indigo-400" /> Tanggal & Waktu
            </span>
            <span className="font-bold text-white">
              {format(new Date(sessionData.scheduledAt), 'EEEE, dd MMM yyyy • HH:mm', { locale: idLocale })}
            </span>
          </div>

          <div className="bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 text-xs flex items-center gap-1 mb-1">
              <MapPin size={14} className="text-emerald-400" /> Lokasi
            </span>
            <span className="font-bold text-white">{sessionData.location || 'Hang Lekir'}</span>
          </div>
        </div>
      </div>

      {/* WORKOUT PROGRAM EXERCISES */}
      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <WorkoutBuilder sessionId={sessionData.id} />
      </div>
    </div>
  )
}
