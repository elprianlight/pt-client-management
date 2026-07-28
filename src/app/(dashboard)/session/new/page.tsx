import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, ptPackages, personalTrainers, clients } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { ArrowLeft, CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'
import { SessionForm } from '@/components/sessions/session-form'

export const metadata: Metadata = { title: 'Smart Check-In Latihan' }

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams?: Promise<{ packageId?: string; clientId?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const defaultPackageId = resolvedSearchParams?.packageId
  const defaultClientId = resolvedSearchParams?.clientId

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  let trainerId: string | null = null
  if (profile.role === 'personal_trainer') {
    const [ptData] = await db.select().from(personalTrainers).where(eq(personalTrainers.userId, profile.id))
    if (ptData) trainerId = ptData.id
  }

  let condition: any = sql`${ptPackages.usedSessions} < ${ptPackages.totalSessions}`
  if (trainerId) {
    condition = and(condition, eq(ptPackages.trainerId, trainerId))
  }

  // Ambil daftar paket aktif (kuota masih ada)
  const activePackages = await db.select({
    id: ptPackages.id,
    clientId: ptPackages.clientId,
    name: ptPackages.packageName,
    clientName: users.fullName,
    totalSessions: ptPackages.totalSessions,
    usedSessions: ptPackages.usedSessions,
  })
  .from(ptPackages)
  .innerJoin(clients, eq(ptPackages.clientId, clients.id))
  .innerJoin(users, eq(clients.userId, users.id))
  .where(condition)

  const packageOptions = activePackages.map(p => ({
    id: p.id,
    clientId: p.clientId,
    name: p.name,
    clientName: p.clientName,
    totalSessions: p.totalSessions,
    usedSessions: p.usedSessions,
    remaining: p.totalSessions - p.usedSessions,
  }))

  return (
    <div className="page-container smart-checkin-page animate-fade-in">
      {/* Back link */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/session" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Jadwal Sesi
        </Link>
      </div>

      {/* Hero Glass Banner Header */}
      <div className="smart-checkin-banner animate-slide-down">
        <div className="sc-badge">
          <Zap size={14} className="sc-zap-icon" />
          <span>SMART CHECK-IN SYSTEM</span>
        </div>
        <div className="sc-header-main">
          <div className="sc-icon-wrap">
            <CheckCircle2 size={24} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="sc-title">Smart Check-In Latihan</h1>
            <p className="sc-subtitle">
              Catat kehadiran & jalankan sesi latihan client dalam hitungan detik.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Component */}
      <SessionForm
        packages={packageOptions}
        defaultPackageId={defaultPackageId}
        defaultClientId={defaultClientId}
      />

      <style jsx>{`
        .smart-checkin-page {
          max-width: 680px;
          margin: 0 auto;
          padding-bottom: 40px;
        }
        .smart-checkin-banner {
          background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 18px 20px;
          margin-bottom: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .sc-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: var(--brand-primary);
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 10px;
        }
        .sc-header-main {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sc-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
          flex-shrink: 0;
        }
        .sc-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .sc-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        @media (max-width: 640px) {
          .smart-checkin-banner {
            padding: 14px 16px;
            border-radius: 16px;
          }
          .sc-icon-wrap {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
          .sc-title {
            font-size: 17px;
          }
          .sc-subtitle {
            font-size: 11.5px;
          }
        }
      `}</style>
    </div>
  )
}
