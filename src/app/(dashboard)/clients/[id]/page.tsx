import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getClientById } from '@/lib/actions/client'
import { ArrowLeft, UserSquare2 } from 'lucide-react'
import Link from 'next/link'
import { ClientForm } from '@/components/clients/client-form'

export const metadata: Metadata = { title: 'Detail Client' }

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { edit?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const clientData = await getClientById(params.id)
  if (!clientData) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Client tidak ditemukan</h3>
          <Link href="/clients" className="btn-primary" style={{ display: 'inline-flex', marginTop: '20px' }}>
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  const isEdit = searchParams.edit === 'true'

  return (
    <div className="page-container">
      <div className="client-detail-header animate-fade-in-up">
        <Link href="/clients" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Daftar Client
        </Link>
        <div className="client-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))', borderColor: 'rgba(139,92,246,0.25)', color: '#8b5cf6' }}>
            <UserSquare2 size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="client-title">{isEdit ? 'Edit Client' : 'Detail Client'}</h2>
            <p className="client-desc">
              {isEdit ? 'Perbarui informasi client' : 'Informasi lengkap mengenai client'}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card client-detail-card animate-fade-in-up">
        {isEdit ? (
          <ClientForm
            mode="edit"
            clientId={clientData.id}
            defaultValues={{
              fullName: clientData.user?.fullName ?? '',
              phone: clientData.user?.phone ?? '',
              gender: clientData.gender ?? undefined,
              dateOfBirth: clientData.dateOfBirth ? new Date(clientData.dateOfBirth).toISOString().split('T')[0] : '',
              heightCm: clientData.heightCm ?? undefined,
              weightKg: clientData.weightKg ?? undefined,
              notes: clientData.notes ?? '',
              isActive: clientData.user?.isActive ?? true,
            }}
          />
        ) : (
          <div className="detail-view">
            <div className="detail-section">
              <h3 className="detail-section-title">Informasi Akun</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Nama Lengkap</span>
                  <span className="detail-value">{clientData.user?.fullName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Username</span>
                  <span className="detail-value">@{clientData.user?.username}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nomor HP</span>
                  <span className="detail-value">{clientData.user?.phone || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status Akun</span>
                  <span className={`badge ${clientData.user?.isActive ? 'badge-success' : 'badge-error'}`}>
                    {clientData.user?.isActive ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="detail-section-title">Data Fisik</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Jenis Kelamin</span>
                  <span className="detail-value">
                    {clientData.gender === 'male' ? 'Laki-laki' : clientData.gender === 'female' ? 'Perempuan' : clientData.gender === 'other' ? 'Lainnya' : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tanggal Lahir</span>
                  <span className="detail-value">
                    {clientData.dateOfBirth ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(clientData.dateOfBirth)) : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tinggi Badan</span>
                  <span className="detail-value">{clientData.heightCm ? `${clientData.heightCm} cm` : '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Berat Badan</span>
                  <span className="detail-value">{clientData.weightKg ? `${clientData.weightKg} kg` : '—'}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Catatan</span>
                  <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{clientData.notes || '—'}</span>
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Link href="/clients" className="btn-secondary">Kembali</Link>
              <Link href={`/clients/${clientData.id}?edit=true`} className="btn-primary">Edit Data</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
