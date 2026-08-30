import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, personalTrainers, clients, ptPackages, workoutSessions } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { getPTById } from '@/lib/actions/pt'
import { ArrowLeft, UserCheck, Pencil, Users, Package, Calendar, Award, Phone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'
import { PTForm } from '@/components/pt/pt-form'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Detail Personal Trainer' }

export default async function PTDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  const ptData = await getPTById(id)
  if (!ptData) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Personal Trainer tidak ditemukan</h3>
          <Link href="/pt" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>
            Kembali ke Daftar PT
          </Link>
        </div>
      </div>
    )
  }

  const isEdit = resolvedSearchParams.edit === 'true'

  // Fetch assigned clients
  const assignedClients = await db
    .select({
      id: clients.id,
      height: clients.height,
      currentWeight: clients.currentWeight,
      fitnessGoal: clients.fitnessGoal,
      createdAt: clients.createdAt,
      user: {
        fullName: users.fullName,
        username: users.username,
        phone: users.phone,
        email: users.email,
        isActive: users.isActive,
      },
    })
    .from(clients)
    .leftJoin(users, eq(clients.userId, users.id))
    .where(eq(clients.trainerId, ptData.id))
    .orderBy(desc(clients.createdAt))

  // Fetch package & session counts
  const [pkgCountResult] = await db
    .select({ count: count() })
    .from(ptPackages)
    .where(eq(ptPackages.trainerId, ptData.id))

  const [sessionCountResult] = await db
    .select({ count: count() })
    .from(workoutSessions)
    .where(eq(workoutSessions.trainerId, ptData.id))

  return (
    <div className="page-container">
      {isEdit ? (
        <>
          <div className="pt-detail-header animate-fade-in-up" style={{ marginBottom: 20 }}>
            <Link href={`/pt/${ptData.id}`} className="back-link">
              <ArrowLeft size={16} />
              Kembali ke Profil PT
            </Link>
            <div className="pt-title-row" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className="page-header-icon"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: 'var(--brand-primary)',
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserCheck size={22} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="pt-title" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Edit Personal Trainer
                </h2>
                <p className="pt-desc" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Perbarui profil dan spesialisasi {ptData.user?.fullName}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card animate-fade-in-up" style={{ padding: '24px' }}>
            <PTForm
              mode="edit"
              ptId={ptData.id}
              defaultValues={{
                fullName: ptData.user?.fullName ?? '',
                phone: ptData.user?.phone ?? '',
                specialization: ptData.specialization ?? '',
                bio: ptData.bio ?? '',
                experienceYears: ptData.experienceYears ?? 0,
                certifications: Array.isArray(ptData.certifications) ? ptData.certifications.join(', ') : (ptData.certifications ?? ''),
                isActive: ptData.user?.isActive ?? true,
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="pt-detail-header animate-fade-in-up" style={{ marginBottom: 20 }}>
            <Link href="/pt" className="back-link">
              <ArrowLeft size={16} />
              Kembali ke Daftar PT
            </Link>

            <div
              className="pt-title-row"
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  className="avatar-circle-lg"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                  }}
                >
                  {(ptData.user?.fullName?.[0] ?? 'P').toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ptData.user?.fullName ?? 'Personal Trainer'}
                    </h2>
                    <span className={`badge ${ptData.user?.isActive ? 'badge-success' : 'badge-error'}`}>
                      {ptData.user?.isActive ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    @{ptData.user?.username} • Bergabung {formatDate(ptData.createdAt)}
                  </p>
                </div>
              </div>

              <Link
                href={`/pt/${ptData.id}?edit=true`}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Pencil size={15} />
                Edit Profil PT
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div
            className="stats-grid animate-fade-in-up"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div className="glass-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--brand-primary)', marginBottom: 8 }}>
                <Users size={18} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Client</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {assignedClients.length}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--brand-secondary)', marginBottom: 8 }}>
                <Package size={18} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Paket Terjual</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {pkgCountResult?.count ?? 0}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--brand-accent)', marginBottom: 8 }}>
                <Calendar size={18} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Sesi Latihan</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {sessionCountResult?.count ?? 0}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b', marginBottom: 8 }}>
                <Award size={18} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pengalaman</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ptData.experienceYears ? `${ptData.experienceYears} Tahun` : '—'}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="glass-card animate-fade-in-up" style={{ padding: '24px', marginBottom: 20 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Informasi Detail & Spesialisasi
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nomor WhatsApp / HP</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="var(--brand-primary)" />
                  {ptData.user?.phone || '—'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Spesialisasi</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {ptData.specialization || 'Umum / All Round'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Sertifikasi</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {Array.isArray(ptData.certifications) ? ptData.certifications.join(', ') : (ptData.certifications || '—')}
                </span>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bio / Catatan Trainer</span>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg-elevated)', padding: '12px 14px', borderRadius: '10px' }}>
                  {ptData.bio || 'Belum ada bio singkat.'}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Clients Card */}
          <div className="glass-card animate-fade-in-up" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Daftar Client Binaan ({assignedClients.length})
            </h3>

            {assignedClients.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                Belum ada client yang ditugaskan ke trainer ini.
              </div>
            ) : (
              <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>Nama Client</th>
                      <th style={{ padding: '10px 14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>No. HP</th>
                      <th style={{ padding: '10px 14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>Fitness Goal</th>
                      <th style={{ padding: '10px 14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '10px 14px', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedClients.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13.5px' }}>{c.user?.fullName ?? '—'}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{c.user?.username ?? '—'}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {c.user?.phone || '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {c.fitnessGoal || 'General Fitness'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${c.user?.isActive ? 'badge-success' : 'badge-error'}`}>
                            {c.user?.isActive ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <Link href={`/clients/${c.id}`} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>
                            Hub Client
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  )
}
