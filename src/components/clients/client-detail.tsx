'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  User,
  Package,
  Calendar,
  Dumbbell,
  Apple,
  TrendingUp,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Clock,
  FileDown,
  Loader2,
  Power,
  UserX,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { deleteSession } from '@/lib/actions/session'
import { toggleClientStatus, deleteClient } from '@/lib/actions/client'

type SubTab = 'overview' | 'packages' | 'sessions' | 'workout' | 'nutrition' | 'progress' | 'reports'

interface ClientDetailProps {
  clientData: any
  packages: any[]
  sessions: any[]
  measurements?: any[]
  workouts?: any[]
  nutritionPlans?: any[]
}

export function ClientDetail({
  clientData,
  packages = [],
  sessions = [],
  measurements = [],
  workouts = [],
  nutritionPlans = [],
}: ClientDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SubTab>('sessions')

  // Client status & actions states
  const [isClientActive, setIsClientActive] = useState<boolean>(clientData.user?.isActive ?? true)
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false)
  const [isDeletingClient, setIsDeletingClient] = useState<boolean>(false)

  // In-App Modal confirmation states
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null)

  // Session states
  const [sessionList, setSessionList] = useState<any[]>(sessions)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  interface TabItem {
    id: SubTab
    label: string
    icon: any
    badge?: number
  }

  // Filter active packages (usedSessions < totalSessions)
  const activePackagesList = useMemo(() => {
    return packages.filter((p: any) => (p.usedSessions ?? 0) < (p.totalSessions ?? 0))
  }, [packages])

  const expiredPackagesList = useMemo(() => {
    return packages.filter((p: any) => (p.usedSessions ?? 0) >= (p.totalSessions ?? 0))
  }, [packages])

  const totalActiveSessions = useMemo(() => {
    return activePackagesList.reduce((acc: number, p: any) => acc + (p.totalSessions ?? 0), 0)
  }, [activePackagesList])

  const usedActiveSessions = useMemo(() => {
    return activePackagesList.reduce((acc: number, p: any) => acc + (p.usedSessions ?? 0), 0)
  }, [activePackagesList])

  const remainingActiveSessions = Math.max(0, totalActiveSessions - usedActiveSessions)

  // Initialize filter with the first ACTIVE package ID if available, otherwise 'all'
  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>(
    () => packages.find((p: any) => (p.usedSessions ?? 0) < (p.totalSessions ?? 0))?.id || 'all'
  )

  const TABS: TabItem[] = [
    { id: 'sessions', label: 'Riwayat Sesi', icon: Calendar, badge: sessionList.length },
    { id: 'packages', label: 'Paket & Sesi', icon: Package, badge: activePackagesList.length },
    { id: 'workout', label: 'Workout Plan', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrisi', icon: Apple },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'overview', label: 'Profil & Info', icon: User },
  ]

  // Filter sessions by selected package
  const filteredSessions = selectedPackageFilter === 'all'
    ? sessionList
    : sessionList.filter(s => s.packageId === selectedPackageFilter)

  // Handle Session Delete Trigger
  const handleTriggerDeleteSession = (sessionId: string) => {
    setConfirmDeleteSessionId(sessionId)
  }

  // Confirm Delete Session Action
  const confirmDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId)
    try {
      const res = await deleteSession(sessionId)
      if (res.success) {
        setSessionList(prev => prev.filter(s => s.id !== sessionId))
        setConfirmDeleteSessionId(null)
        router.refresh()
      } else {
        alert(res.error || 'Gagal menghapus sesi.')
      }
    } catch {
      alert('Terjadi kesalahan.')
    } finally {
      setDeletingId(null)
    }
  }

  // Handle HTML Export
  const handleExportHTML = () => {
    const clientName = clientData.user?.fullName || 'Client'
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Riwayat Sesi - ${clientName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; background: #09090b; color: #f4f4f5; }
          h1 { color: #f97316; margin-bottom: 4px; font-size: 24px; }
          .meta { color: #a1a1aa; margin-bottom: 24px; font-size: 14px; border-bottom: 1px solid #27272a; padding-bottom: 12px; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
          .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .title { font-weight: 700; font-size: 16px; color: #ffffff; }
          .badge { background: rgba(16,185,129,0.18); color: #10b981; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .time { font-size: 13px; color: #a1a1aa; margin-bottom: 8px; }
          .notes { font-size: 13.5px; color: #d4d4d8; line-height: 1.5; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Riwayat Sesi Latihan</h1>
        <div class="meta">Klien: <strong>${clientName}</strong> | Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}</div>
        ${filteredSessions.map(s => `
          <div class="card">
            <div class="card-header">
              <div class="title">${s.programType || 'Total Body'} · RPE ${s.rpe ?? '-'}</div>
              <div class="badge">${s.status === 'completed' ? 'Complete' : s.status}</div>
            </div>
            <div class="time">⏱ ${format(new Date(s.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: id })} | Paket: ${s.packageName || '-'}</div>
            <div class="notes">${s.sessionNotes || 'Tidak ada catatan.'}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(htmlContent)
      win.document.close()
      win.print()
    }
  }

  // Handle Client Deactivation / Activation
  const handleToggleClientStatus = async () => {
    const newStatus = !isClientActive
    setIsTogglingStatus(true)
    try {
      const res = await toggleClientStatus(clientData.id, newStatus)
      if (res.success) {
        setIsClientActive(newStatus)
        router.refresh()
      } else {
        alert(res.error || 'Gagal mengubah status client.')
      }
    } catch {
      alert('Terjadi kesalahan.')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  // Confirm Delete Client Action
  const confirmDeleteClient = async () => {
    setIsDeletingClient(true)
    try {
      const res = await deleteClient(clientData.id)
      if (res.success) {
        setShowDeleteModal(false)
        router.push('/clients')
        router.refresh()
      } else {
        alert(res.error || 'Gagal menghapus client.')
        setIsDeletingClient(false)
      }
    } catch {
      alert('Terjadi kesalahan.')
      setIsDeletingClient(false)
    }
  }

  return (
    <div className="client-hub">
      {/* Client Quick Card Header */}
      <div className="client-hub-header glass-card">
        <div className="client-avatar-row">
          <div className="client-avatar">
            {clientData.user?.fullName?.charAt(0).toUpperCase() ?? 'C'}
          </div>
          <div className="client-meta">
            <div className="client-name-wrap">
              <h2 className="client-name">{clientData.user?.fullName}</h2>
              <span className={`badge ${clientData.user?.isActive ? 'badge-success' : 'badge-error'}`}>
                {clientData.user?.isActive ? 'Aktif' : 'Non-aktif'}
              </span>
            </div>
            <p className="client-submeta">
              {[clientData.fitnessGoal || 'General Fitness', clientData.user?.phone].filter(Boolean).join(' • ')}
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="client-quick-stats">
          <div className="quick-stat-item">
            <span className="qs-label">Paket Aktif</span>
            <span className="qs-value">{activePackagesList.length} Paket</span>
          </div>
          <div className="quick-stat-divider" />
          <div className="quick-stat-item">
            <span className="qs-label">Sisa Sesi (Aktif)</span>
            <span className="qs-value">{remainingActiveSessions} / {totalActiveSessions} Sesi</span>
          </div>
          <div className="quick-stat-divider" />
          <div className="quick-stat-item">
            <span className="qs-label">Riwayat Sesi</span>
            <span className="qs-value">{sessionList.length} Sesi</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="client-subnav-container">
        <div className="client-subnav">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SubTab)}
                className={`client-subnav-item ${isActive ? 'active' : ''}`}
                id={`tab-client-${tab.id}`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} />
                <span>{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className="subnav-badge">{tab.badge}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="client-tab-content animate-fade-in">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            <div className="detail-section">
              <h3 className="detail-section-title">Informasi Akun & Kontak</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Nama Lengkap</span>
                  <span className="detail-value">{clientData.user?.fullName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{clientData.user?.email || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nomor HP</span>
                  <span className="detail-value">{clientData.user?.phone || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status Akun</span>
                  <span className="detail-value">
                    <span className={`badge ${clientData.user?.isActive ? 'badge-success' : 'badge-error'}`}>
                      {clientData.user?.isActive ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="detail-section-title">Data Fisik & Medis</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Jenis Kelamin</span>
                  <span className="detail-value">
                    {clientData.gender === 'male' ? 'Laki-laki' : clientData.gender === 'female' ? 'Perempuan' : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tanggal Lahir</span>
                  <span className="detail-value">
                    {clientData.dateOfBirth ? format(new Date(clientData.dateOfBirth), 'dd MMMM yyyy', { locale: id }) : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tinggi Badan</span>
                  <span className="detail-value">{clientData.heightCm ? `${clientData.heightCm} cm` : '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Berat Badan (Awal)</span>
                  <span className="detail-value">{clientData.weightKg ? `${clientData.weightKg} kg` : '—'}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Catatan Medis & Alergi</span>
                  <span className="detail-value text-pre">{clientData.notes || 'Tidak ada catatan khusus.'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 className="detail-section-title">Kontak Darurat</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Nama Kontak</span>
                  <span className="detail-value">{clientData.emergencyContactName || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Nomor HP Darurat</span>
                  <span className="detail-value">{clientData.emergencyContactPhone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Kelola & Aksi Akun Client */}
            <div className="detail-section" style={{ borderTop: '1px solid var(--border-default)', paddingTop: 20 }}>
              <h3 className="detail-section-title">Kelola & Pengaturan Akun</h3>
              <div className="account-actions-wrap">
                <Link
                  href={`/clients/${clientData.id}?edit=true`}
                  className="btn-primary"
                  id="btn-edit-profile-overview"
                >
                  <Pencil size={15} />
                  <span>Edit Profil Client</span>
                </Link>

                <button
                  type="button"
                  onClick={handleToggleClientStatus}
                  disabled={isTogglingStatus}
                  className={`btn-secondary ${isClientActive ? 'btn-deactivate' : 'btn-activate'}`}
                  id="btn-toggle-client-status"
                >
                  {isTogglingStatus ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <Power size={15} />
                  )}
                  <span>{isClientActive ? 'Non-aktifkan Akun' : 'Aktifkan Akun'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeletingClient}
                  className="btn-danger-outline"
                  id="btn-delete-client-account"
                >
                  {isDeletingClient ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <UserX size={15} />
                  )}
                  <span>Hapus Client</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. PACKAGES TAB */}
        {activeTab === 'packages' && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h3 className="pane-title">Paket Sesi Client</h3>
                <p className="pane-desc">Kelola paket sesi latihan yang dimiliki client ini</p>
              </div>
              <Link href={`/packages/new?clientId=${clientData.id}`} className="btn-primary">
                <Plus size={16} />
                Tambah Paket
              </Link>
            </div>

            {packages.length === 0 ? (
              <div className="empty-state">
                <Package size={36} className="empty-icon" />
                <p>Belum ada paket aktif untuk client ini.</p>
                <Link href={`/packages/new?clientId=${clientData.id}`} className="btn-secondary" style={{ marginTop: 12 }}>
                  Beli Paket Baru
                </Link>
              </div>
            ) : (
              <div className="packages-grid">
                {packages.map((pkg) => {
                  const isExpired = (pkg.usedSessions ?? 0) >= (pkg.totalSessions ?? 0)
                  return (
                    <div key={pkg.id} className={`glass-card pkg-card ${isExpired ? 'pkg-card-expired' : ''}`}>
                      <div className="pkg-card-header">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <h4 className="pkg-name">{pkg.packageName}</h4>
                          <span className={`badge ${isExpired ? 'badge-error' : 'badge-success'}`} style={{ width: 'fit-content', fontSize: 11 }}>
                            {isExpired ? 'Paket Habis (Tidak Aktif)' : 'Paket Aktif'}
                          </span>
                        </div>
                        <span className="badge badge-brand">
                          {pkg.usedSessions} / {pkg.totalSessions} Sesi
                        </span>
                      </div>
                      <div className="pkg-progress-bar">
                        <div
                          className="pkg-progress-fill"
                          style={{
                            width: `${Math.min(100, (pkg.usedSessions / pkg.totalSessions) * 100)}%`,
                            background: isExpired ? 'var(--error)' : 'var(--gradient-brand)',
                          }}
                        />
                      </div>
                      <div className="pkg-meta-row">
                        <span>Status Sesi:</span>
                        <strong>{isExpired ? 'Habis (100% Terpakai)' : `Sisa ${pkg.totalSessions - pkg.usedSessions} Sesi`}</strong>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. SESSIONS TAB (REDESIGNED MATCHING SCREENSHOT) */}
        {activeTab === 'sessions' && (
          <div className="tab-pane">
            {/* Filter Sesi & Actions Bar */}
            <div className="sess-filter-bar">
              <div className="sess-filter-left">
                <select
                  className="sess-package-select"
                  value={selectedPackageFilter}
                  onChange={(e) => setSelectedPackageFilter(e.target.value)}
                  id="select-package-filter"
                >
                  {activePackagesList.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.packageName} (Aktif - {p.usedSessions}/{p.totalSessions})
                    </option>
                  ))}
                  {expiredPackagesList.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.packageName} (Habis - {p.usedSessions}/{p.totalSessions})
                    </option>
                  ))}
                  <option value="all">Semua Paket ({sessionList.length} Sesi)</option>
                </select>
              </div>

              <div className="sess-filter-actions">
                <button
                  type="button"
                  onClick={handleExportHTML}
                  className="sess-export-btn"
                  id="btn-export-html"
                >
                  <FileDown size={15} />
                  <span>Export HTML</span>
                </button>
                <Link
                  href={`/session/new?clientId=${clientData.id}`}
                  className="sess-checkin-link"
                  id="btn-checkin-session"
                >
                  + Check-In
                </Link>
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="empty-state">
                <Calendar size={36} className="empty-icon" />
                <p>Belum ada riwayat sesi latihan untuk filter ini.</p>
                <Link href={`/session/new?clientId=${clientData.id}`} className="btn-secondary" style={{ marginTop: 12 }}>
                  Jadwalkan Sesi Pertamanya
                </Link>
              </div>
            ) : (
              <div className="sess-card-list">
                {filteredSessions.map((sess) => {
                  const d = new Date(sess.scheduledAt)
                  const dayNum = format(d, 'dd')
                  const monthAbbr = format(d, 'MMM', { locale: id }).toUpperCase()
                  const timeStr = format(d, 'HH:mm')
                  const dateStr = format(d, 'dd/MM/yyyy')

                  return (
                    <div key={sess.id} className="sess-card">
                      {/* Left: Big Orange Date */}
                      <div className="sess-date-col">
                        <span className="sess-day-num">{dayNum}</span>
                        <span className="sess-month-abbr">{monthAbbr}</span>
                      </div>

                      {/* Middle: Session Details */}
                      <div className="sess-content-col">
                        <div className="sess-title-row">
                          <h4 className="sess-title">
                            {sess.programType || 'Total Body'} · RPE {sess.rpe ?? '-'}
                          </h4>
                          <span
                            className={`badge ${
                              sess.status === 'completed'
                                ? 'badge-success'
                                : sess.status === 'scheduled'
                                ? 'badge-brand'
                                : 'badge-error'
                            }`}
                          >
                            {sess.status === 'completed'
                              ? 'Complete'
                              : sess.status === 'scheduled'
                              ? 'Scheduled'
                              : 'Cancelled'}
                          </span>
                        </div>

                        <div className="sess-time-row">
                          <Clock size={13} />
                          <span>{timeStr} · {dateStr}</span>
                        </div>

                        <p className="sess-notes">
                          {sess.sessionNotes || 'Tidak ada catatan khusus.'}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="sess-actions-col">
                        <Link
                          href={`/session/${sess.id}/edit`}
                          className="sess-icon-btn"
                          title="Edit Sesi"
                          id={`btn-edit-session-${sess.id}`}
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleTriggerDeleteSession(sess.id)}
                          disabled={deletingId === sess.id}
                          className="sess-icon-btn sess-delete-btn"
                          title="Hapus Sesi"
                          id={`btn-delete-session-${sess.id}`}
                        >
                          {deletingId === sess.id ? (
                            <Loader2 size={15} className="spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. WORKOUT TAB */}
        {activeTab === 'workout' && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h3 className="pane-title">Program Workout</h3>
                <p className="pane-desc">Rencana latihan dan target gerakan khusus client</p>
              </div>
              <Link href={`/workout/new?clientId=${clientData.id}`} className="btn-primary">
                <Plus size={16} />
                Buat Routine
              </Link>
            </div>

            <div className="empty-state">
              <Dumbbell size={36} className="empty-icon" />
              <p>Belum ada program workout khusus yang ditetapkan.</p>
              <Link href="/workout" className="btn-secondary" style={{ marginTop: 12 }}>
                Lihat Template Workout
              </Link>
            </div>
          </div>
        )}

        {/* 5. NUTRITION TAB */}
        {activeTab === 'nutrition' && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h3 className="pane-title">Nutrisi & Meal Plan</h3>
                <p className="pane-desc">Target kalori harian dan panduan makan client</p>
              </div>
              <Link href={`/nutrition/new?clientId=${clientData.id}`} className="btn-primary">
                <Plus size={16} />
                Atur Target Nutrisi
              </Link>
            </div>

            <div className="empty-state">
              <Apple size={36} className="empty-icon" />
              <p>Target nutrisi harian belum dikonfigurasi.</p>
            </div>
          </div>
        )}

        {/* 6. PROGRESS TAB */}
        {activeTab === 'progress' && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h3 className="pane-title">Progress & Pengukuran Tubuh</h3>
                <p className="pane-desc">Grafik perkembangan berat badan & lingkar tubuh</p>
              </div>
              <Link href={`/progress/new?clientId=${clientData.id}`} className="btn-primary">
                <Plus size={16} />
                Catat Progress
              </Link>
            </div>

            <div className="empty-state">
              <TrendingUp size={36} className="empty-icon" />
              <p>Belum ada rekaman catatan progress fisik.</p>
            </div>
          </div>
        )}

        {/* 7. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="tab-pane">
            <div className="pane-header">
              <div>
                <h3 className="pane-title">Laporan Client Individual</h3>
                <p className="pane-desc">Rekapitulasi kehadiran, kepatuhan, & performa latihan</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <BarChart3 size={24} style={{ color: 'var(--brand-primary)' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>Ringkasan Performa Client</h4>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Tingkat Kehadiran</span>
                  <span className="detail-value" style={{ fontWeight: 700, color: 'var(--success)' }}>100%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Sesi Selesai</span>
                  <span className="detail-value">{sessionList.filter(s => s.status === 'completed').length} Sesi</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Sesi Terjadwal</span>
                  <span className="detail-value">{sessionList.length} Sesi</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sisa Kuota Paket</span>
                  <span className="detail-value">{packages.reduce((acc, p) => acc + (p.totalSessions - p.usedSessions), 0)} Sesi</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .client-hub {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Header Card */
        .client-hub-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .client-avatar-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .client-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--gradient-brand);
          color: white;
          font-weight: 800;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 16px rgba(99,102,241,0.3);
        }
        .client-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .client-name-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .client-name {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .client-submeta {
          font-size: 13px;
          color: var(--text-muted);
        }

        .client-quick-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-elevated);
          padding: 10px 16px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
        }
        .quick-stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .qs-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .qs-value {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .quick-stat-divider {
          width: 1px;
          height: 24px;
          background: var(--border-default);
        }

        /* Sub-Nav Bar */
        .client-subnav-container {
          border-bottom: 1px solid var(--border-default);
          margin-bottom: 8px;
        }
        .client-subnav {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
        }
        .client-subnav::-webkit-scrollbar {
          display: none;
        }
        .client-subnav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
          min-height: 44px;
        }
        .client-subnav-item:hover {
          color: var(--text-primary);
          background: var(--bg-elevated);
        }
        .client-subnav-item.active {
          color: var(--brand-primary);
          border-bottom-color: var(--brand-primary);
          background: rgba(99,102,241,0.08);
          font-weight: 600;
        }
        .subnav-badge {
          background: var(--brand-primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 100px;
        }

        /* Session Filter Bar */
        .sess-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .sess-filter-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .sess-filter-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sess-package-select {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 10px 16px;
          border-radius: var(--radius-lg);
          font-size: 14px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          min-width: 220px;
          max-width: 100%;
          transition: border-color var(--transition-fast);
        }
        .sess-package-select:focus {
          border-color: var(--brand-primary);
        }
        :global(.sess-export-btn) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        :global(.sess-export-btn:hover) {
          background: var(--bg-elevated);
          border-color: var(--border-brand);
        }
        :global(.sess-checkin-link) {
          color: #f97316;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: opacity var(--transition-fast);
        }
        :global(.sess-checkin-link:hover) {
          opacity: 0.8;
        }

        /* Session Cards List - Compact Layout */
        .sess-card-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sess-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all var(--transition-fast);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .sess-card:hover {
          border-color: var(--border-brand);
          background: var(--bg-elevated);
        }
        .sess-date-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          flex-shrink: 0;
        }
        .sess-day-num {
          font-size: 20px;
          font-weight: 900;
          color: #f97316;
          line-height: 1;
        }
        .sess-month-abbr {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-top: 1px;
        }
        .sess-content-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sess-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sess-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .sess-time-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .sess-notes {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.35;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sess-actions-col {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        :global(.sess-icon-btn) {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        :global(.sess-icon-btn:hover) {
          background: rgba(99,102,241,0.12);
          color: var(--brand-primary);
          border-color: rgba(99,102,241,0.3);
        }
        :global(.sess-delete-btn:hover) {
          background: rgba(239,68,68,0.12);
          color: var(--error);
          border-color: rgba(239,68,68,0.3);
        }

        /* Tab Content */
        .tab-pane {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pane-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pane-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .pane-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Detail section inside tab */
        .detail-section {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .detail-section-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-default);
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-item.full-width {
          grid-column: span 2;
        }
        .detail-label {
          font-size: 12px;
          color: var(--text-muted);
        }
        .detail-value {
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 500;
        }
        .text-pre {
          white-space: pre-wrap;
        }

        /* Packages Grid */
        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .pkg-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pkg-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .pkg-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .pkg-progress-bar {
          height: 6px;
          background: var(--bg-subtle);
          border-radius: 100px;
          overflow: hidden;
        }
        .pkg-progress-fill {
          height: 100%;
          background: var(--gradient-brand);
          border-radius: 100px;
        }
        .pkg-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Empty State */
        .empty-state {
          background: var(--bg-surface);
          border: 1px dashed var(--border-default);
          border-radius: var(--radius-lg);
          padding: 40px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .client-hub-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .client-quick-stats {
            width: 100%;
            justify-content: space-around;
          }
          .detail-grid {
            grid-template-columns: 1fr;
          }
          .detail-item.full-width {
            grid-column: span 1;
          }
        .account-actions-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        :global(.btn-deactivate:hover) {
          background: rgba(239, 68, 68, 0.12);
          color: var(--error);
          border-color: rgba(239, 68, 68, 0.3);
        }
        :global(.btn-activate:hover) {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }
        :global(.btn-danger-outline) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          font-weight: 600;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--error);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        :global(.btn-danger-outline:hover) {
          background: rgba(239, 68, 68, 0.2);
          border-color: var(--error);
        }

        /* Custom In-App Modal */
        .custom-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .custom-modal-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 24px;
          max-width: 420px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }
        :global(.modal-icon-wrap) {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        :global(.modal-icon-danger) {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--error);
        }
        .modal-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .modal-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .modal-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        :global(.modal-actions button) {
          flex: 1;
          justify-content: center;
          min-height: 44px;
        }
        :global(.btn-danger) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          font-weight: 700;
          background: var(--error);
          border: 1px solid var(--error);
          color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        :global(.btn-danger:hover) {
          opacity: 0.9;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
        }
      `}</style>

      {/* Modal Confirm Delete Client */}
      {showDeleteModal && (
        <div className="custom-modal-backdrop animate-fade-in" onClick={() => !isDeletingClient && setShowDeleteModal(false)}>
          <div className="custom-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-danger">
              <AlertTriangle size={28} />
            </div>
            <h3 className="modal-title">Hapus Client Permanen?</h3>
            <p className="modal-desc">
              Apakah Anda yakin ingin menghapus akun client <strong>"{clientData.user?.fullName}"</strong>?
              Seluruh data sesi latihan, paket, dan catatan fisik client ini akan dihapus secara permanen.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingClient}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmDeleteClient}
                disabled={isDeletingClient}
              >
                {isDeletingClient ? (
                  <><Loader2 size={16} className="spin" /> Menghapus...</>
                ) : (
                  <><Trash2 size={16} /> Ya, Hapus Client</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete Session */}
      {confirmDeleteSessionId && (
        <div className="custom-modal-backdrop animate-fade-in" onClick={() => !deletingId && setConfirmDeleteSessionId(null)}>
          <div className="custom-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap modal-icon-danger">
              <AlertTriangle size={28} />
            </div>
            <h3 className="modal-title">Hapus Sesi Latihan?</h3>
            <p className="modal-desc">
              Apakah Anda yakin ingin menghapus catatan sesi latihan ini secara permanen?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmDeleteSessionId(null)}
                disabled={Boolean(deletingId)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => confirmDeleteSession(confirmDeleteSessionId)}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? (
                  <><Loader2 size={16} className="spin" /> Menghapus...</>
                ) : (
                  <><Trash2 size={16} /> Ya, Hapus Sesi</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
