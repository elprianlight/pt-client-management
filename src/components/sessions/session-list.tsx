'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Loader2,
  Trash2,
  Edit,
  Search,
  Dumbbell,
  Flame,
  User,
  LayoutGrid,
  List,
  GitCommit,
  CalendarDays,
  X,
  Eye,
  Package,
  RefreshCw,
  Info,
  CheckCircle2,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { listSessions, updateSessionStatus, deleteSession } from '@/lib/actions/session'
import { useAuthStore } from '@/store/auth-store'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function SessionList() {
  const { role } = useAuthStore()
  const isClient = role === 'client'

  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Detail Bottom Sheet state for Client & PT
  const [selectedDetailSession, setSelectedDetailSession] = useState<any | null>(null)

  // View Mode Options (For PT / Admin view)
  const [viewMode, setViewMode] = useState<'card' | 'timeline' | 'calendar' | 'list'>('card')

  // Filters & Search
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadData = async () => {
    setIsLoading(true)
    const res = await listSessions()
    setData(res)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (sessionId: string, status: any) => {
    if (isClient) return // Client Read-Only Protection

    let msg = `Ubah status sesi?`
    if (status === 'completed') msg = 'Tandai sesi ini sebagai selesai? Ini akan memotong kuota paket client.'
    if (!confirm(msg)) return

    setProcessingId(sessionId)
    const res = await updateSessionStatus(sessionId, status)
    if (res.success) {
      await loadData()
    } else {
      alert(res.error || 'Gagal memperbarui status sesi')
    }
    setProcessingId(null)
  }

  const handleDelete = async (sessionId: string) => {
    if (isClient) return // Client Read-Only Protection
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini? Tindakan ini tidak dapat dibatalkan.')) return

    setProcessingId(sessionId)
    const res = await deleteSession(sessionId)
    if (res.success) {
      await loadData()
    } else {
      alert(res.error || 'Gagal menghapus sesi')
    }
    setProcessingId(null)
  }

  // Client's unique packages for single PT Package Filter
  const clientPackages = useMemo(() => {
    const pkgs = new Set<string>()
    data.forEach(item => {
      if (item.packageName) pkgs.add(item.packageName)
    })
    return Array.from(pkgs)
  }, [data])

  const uniqueClients = useMemo(() => {
    const clients = new Set<string>()
    data.forEach(item => {
      if (item.clientName) clients.add(item.clientName)
    })
    return Array.from(clients).sort()
  }, [data])

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>()
    data.forEach(item => {
      if (item.scheduledAt) {
        months.add(format(new Date(item.scheduledAt), 'yyyy-MM'))
      }
    })
    return Array.from(months).sort().reverse()
  }, [data])

  const packageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    data.forEach(item => {
      if (item.packageName) {
        counts[item.packageName] = (counts[item.packageName] || 0) + 1
      }
    })
    return Object.entries(counts).sort((a, b) => a[1] - b[1])
  }, [data])

  const filteredData = useMemo(() => {
    let result = data
    if (searchQuery) {
      const term = searchQuery.toLowerCase()
      result = result.filter(row =>
        Object.values(row).some(val =>
          typeof val === 'string' && val.toLowerCase().includes(term)
        )
      )
    }
    if (selectedMonth) {
      result = result.filter(row => {
        const date = new Date(row.scheduledAt)
        return format(date, 'yyyy-MM') === selectedMonth
      })
    }
    if (selectedClient && !isClient) {
      result = result.filter(row => row.clientName === selectedClient)
    }
    if (selectedPackage) {
      result = result.filter(row => row.packageName === selectedPackage)
    }
    return result
  }, [data, selectedMonth, selectedPackage, selectedClient, searchQuery, isClient])

  // Proportional Status Pill
  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="compact-status-pill pill-success">🟢 Selesai</span>
      case 'cancelled':
        return <span className="compact-status-pill pill-danger">🔴 Dibatalkan</span>
      case 'no_show':
        return <span className="compact-status-pill pill-danger">🚫 No Show</span>
      default:
        return <span className="compact-status-pill pill-brand">🔵 Scheduled</span>
    }
  }

  return (
    <div className="compact-session-wrapper">
      {/* ==================== 1. FILTER SECTION ==================== */}
      {isClient ? (
        /* SINGLE FILTER UNTUK CLIENT: HANYA DROPDOWN PAKET PT */
        <div className="client-single-filter-card animate-slide-down">
          <div className="csf-inner">
            <Package size={16} className="csf-icon" />
            <select
              className="csf-select"
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              id="select-client-package-filter"
            >
              <option value="">▼ Semua Paket PT Anda</option>
              {clientPackages.map(pkg => (
                <option key={pkg} value={pkg}>
                  Paket: {pkg}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        /* FULL FILTER & SEGMENTED CONTROL UNTUK PT / ADMIN */
        <div className="session-header-card animate-slide-down">
          <div className="session-header-top">
            <div>
              <h2 className="session-header-title">Riwayat & Jadwal Sesi</h2>
              <p className="session-header-desc">Kelola seluruh aktivitas sesi latihan client Anda</p>
            </div>

            <div className="segmented-control">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`seg-btn ${viewMode === 'card' ? 'active' : ''}`}
              >
                <LayoutGrid size={14} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`seg-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              >
                <GitCommit size={14} />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`seg-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              >
                <CalendarDays size={14} />
                <span>Kalender</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`seg-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <List size={14} />
                <span>List</span>
              </button>
            </div>
          </div>

          <div className="session-filter-grid">
            <div className="filter-input-wrap search-wrap">
              <Search size={14} className="filter-search-icon" />
              <input
                type="text"
                placeholder="Cari client, program, lokasi..."
                className="filter-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-input-wrap">
              <select
                className="filter-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Semua Client</option>
                {uniqueClients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-input-wrap">
              <select
                className="filter-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Semua Bulan</option>
                {uniqueMonths.map(m => {
                  const [year, month] = m.split('-')
                  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
                  return <option key={m} value={m}>{format(date, 'MMMM yyyy', { locale: id })}</option>
                })}
              </select>
            </div>

            <div className="filter-input-wrap">
              <select
                className="filter-select"
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
              >
                <option value="">Semua Paket</option>
                {packageCounts.map(([pkg, count]) => (
                  <option key={pkg} value={pkg}>{pkg} ({count} sesi)</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 11. GLASS SKELETON LOADING EXPERIENCE ==================== */}
      {isLoading ? (
        <div className="compact-session-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="compact-card skeleton-card">
              <div className="skeleton-line sk-title" />
              <div className="skeleton-line sk-subtitle" />
              <div className="skeleton-line sk-body" />
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        /* 12. EMPTY STATE MODEL MODERN */
        <div className="compact-empty-card animate-fade-in">
          <div className="empty-icon-wrap">
            <Dumbbell size={36} />
          </div>
          <h3 className="empty-title">Belum Ada Riwayat Latihan</h3>
          <p className="empty-desc">
            Riwayat sesi latihan akan muncul setelah Personal Trainer menjadwalkan atau menyelesaikan sesi Anda.
          </p>
          <button type="button" onClick={loadData} className="empty-refresh-btn">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      ) : (
        /* ==================== COMPACT SESSION CARD GRID ==================== */
        <div className="compact-session-grid">
          {filteredData.map((row, idx) => (
            <div
              key={row.id}
              onClick={() => setSelectedDetailSession(row)}
              className="compact-card animate-slide-up"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {/* BARIS 1: Tanggal, Jam, Status Pill */}
              <div className="c-row-1">
                <div className="c-datetime-group">
                  <span className="c-date-text">
                    📅 {format(new Date(row.scheduledAt), 'dd MMM yyyy', { locale: id })}
                  </span>
                  <span className="c-dot">•</span>
                  <span className="c-time-text">
                    🕘 {format(new Date(row.scheduledAt), 'HH:mm')}
                  </span>
                </div>
                {renderStatusPill(row.status)}
              </div>

              {/* BARIS 2: Judul Program (22px bold) & RPE */}
              <div className="c-row-2">
                <h3 className="c-program-title">
                  🏋️ {row.programType || 'Total Body'}
                </h3>
                {row.rpe && (
                  <span className="c-rpe-badge">
                    🔥 RPE {row.rpe}
                  </span>
                )}
              </div>

              {/* BARIS 3: Lokasi & Nama Paket */}
              <div className="c-row-3">
                <span className="c-meta-item">
                  📍 {row.location || 'Gym Hang Lekir'}
                </span>
                <span className="c-meta-dot">•</span>
                <span className="c-meta-item c-package-tag">
                  📦 {row.packageName || 'Paket PT'}
                </span>
              </div>

              {/* BARIS 4: Ringkasan Catatan PT (Max 2 Baris + ... Selengkapnya) */}
              {row.sessionNotes && (
                <div className="c-row-4">
                  <p className="c-notes-preview">
                    💬 "{row.sessionNotes.length > 80 ? `${row.sessionNotes.slice(0, 80)}...` : row.sessionNotes}"
                    <span className="c-read-more"> ... Selengkapnya</span>
                  </p>
                </div>
              )}

              {/* BARIS 5: BUTTON HANYA LIHAT DETAIL (UNTUK CLIENT) ATAU MANAJEMEN PT */}
              <div className="c-row-5">
                {isClient ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDetailSession(row)
                    }}
                    className="c-detail-btn"
                  >
                    <Eye size={14} />
                    <span>Lihat Detail</span>
                  </button>
                ) : (
                  /* PT / ADMIN FULL MANAGEMENT CONTROLS */
                  <div className="pt-control-bar" onClick={e => e.stopPropagation()}>
                    <select
                      className="pt-status-select"
                      value={row.status}
                      disabled={processingId === row.id}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    >
                      <option value="completed">✓ Selesai</option>
                      <option value="scheduled">📅 Terjadwal</option>
                      <option value="cancelled">❌ Batal</option>
                      <option value="no_show">🚫 No Show</option>
                    </select>

                    <div className="pt-btn-group">
                      <Link href={`/session/${row.id}/edit`} className="pt-edit-btn" title="Edit Sesi">
                        <Edit size={14} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={processingId === row.id}
                        className="pt-delete-btn"
                        title="Hapus Sesi"
                      >
                        {processingId === row.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== 9. PREMIUM BOTTOM SHEET DETAIL (CARD ON-CLICK) ==================== */}
      {selectedDetailSession && (
        <div
          className="bottom-sheet-backdrop animate-fade-in"
          onClick={() => setSelectedDetailSession(null)}
        >
          <div
            className="bottom-sheet-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="sheet-handle-bar" />

            {/* Sheet Header */}
            <div className="sheet-header">
              <div className="sheet-title-group">
                <div className="sheet-icon-badge">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <h3 className="sheet-title">Detail Sesi Latihan</h3>
                  <p className="sheet-subtitle">Informasi lengkap pelaksanaan latihan</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailSession(null)}
                className="sheet-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Body Content */}
            <div className="sheet-body">
              {/* Program & Status */}
              <div className="sheet-section-card">
                <div className="bs-row-between">
                  <h2 className="bs-program-title">
                    🏋️ {selectedDetailSession.programType || 'Total Body'}
                  </h2>
                  {renderStatusPill(selectedDetailSession.status)}
                </div>

                <div className="bs-grid-2">
                  <div className="bs-info-item">
                    <span className="bs-label">Tanggal & Jam</span>
                    <span className="bs-val">
                      📅 {format(new Date(selectedDetailSession.scheduledAt), 'EEEE, dd MMMM yyyy', { locale: id })} • {format(new Date(selectedDetailSession.scheduledAt), 'HH:mm')}
                    </span>
                  </div>

                  <div className="bs-info-item">
                    <span className="bs-label">Lokasi Latihan</span>
                    <span className="bs-val">
                      📍 {selectedDetailSession.location || 'Gym Hang Lekir'}
                    </span>
                  </div>

                  <div className="bs-info-item">
                    <span className="bs-label">Tingkat Intensitas (RPE)</span>
                    <span className="bs-val" style={{ color: '#f97316', fontWeight: 800 }}>
                      🔥 RPE {selectedDetailSession.rpe || 8}
                    </span>
                  </div>

                  <div className="bs-info-item">
                    <span className="bs-label">Paket Sesi</span>
                    <span className="bs-val">
                      📦 {selectedDetailSession.packageName || 'Paket PT'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan PT Lengkap */}
              {selectedDetailSession.sessionNotes && (
                <div className="sheet-section-card">
                  <h4 className="sheet-sec-title">
                    <FileText size={15} />
                    <span>Catatan Latihan dari Personal Trainer</span>
                  </h4>
                  <p className="bs-full-notes">
                    "{selectedDetailSession.sessionNotes}"
                  </p>
                </div>
              )}

              {/* Progress Summary */}
              <div className="sheet-section-card">
                <h4 className="sheet-sec-title">
                  <TrendingUp size={15} />
                  <span>Ringkasan Evaluasi Performance</span>
                </h4>
                <div className="bs-eval-box">
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  <span>Sesi telah tercatat resmi di database StrengthLab System.</span>
                </div>
              </div>
            </div>

            {/* Sheet Footer Button */}
            <div className="sheet-footer">
              <button
                type="button"
                onClick={() => setSelectedDetailSession(null)}
                className="sheet-close-action-btn"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STYLES ==================== */}
      <style jsx>{`
        .compact-session-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* CLIENT SINGLE FILTER */
        .client-single-filter-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 10px 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(16px);
        }
        .csf-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--brand-primary);
        }
        .csf-select {
          width: 100%;
          height: 40px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 13.5px;
          font-weight: 700;
          padding: 0 12px;
          outline: none;
          cursor: pointer;
        }

        /* PT HEADER & FILTERS */
        .session-header-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(16px);
        }
        .session-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-default);
        }
        .session-header-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .session-header-desc {
          font-size: 12px;
          color: var(--text-muted);
        }
        .segmented-control {
          display: flex;
          align-items: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }
        .seg-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .seg-btn.active {
          background: var(--brand-primary);
          color: white;
        }
        .session-filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }
        .filter-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .filter-search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
        }
        .filter-input {
          width: 100%;
          height: 38px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 12.5px;
          padding: 0 10px 0 32px;
          outline: none;
        }
        .filter-select {
          width: 100%;
          height: 38px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 12.5px;
          padding: 0 10px;
          outline: none;
        }

        /* COMPACT CARD LAYOUT (35-40% REDUCED HEIGHT) */
        .compact-session-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 10px;
        }
        .compact-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .compact-card:hover {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 10px 28px rgba(99, 102, 241, 0.15);
        }

        /* BARIS 1: Tanggal (15px), Jam (15px), Status Pill (14px) */
        .c-row-1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .c-datetime-group {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .c-date-text, .c-time-text {
          font-size: 14px;
          font-weight: 700;
        }
        .c-dot {
          color: var(--text-muted);
        }

        /* 10. STATUS BADGE PROPORSI */
        .compact-status-pill {
          padding: 3px 9px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          line-height: 1;
        }
        .pill-success {
          background: rgba(16, 185, 129, 0.14);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .pill-brand {
          background: rgba(99, 102, 241, 0.14);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .pill-danger {
          background: rgba(239, 68, 68, 0.14);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* BARIS 2: Judul Program (22px) & RPE */
        .c-row-2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .c-program-title {
          font-size: 20px;
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .c-rpe-badge {
          background: rgba(249, 115, 22, 0.12);
          border: 1px solid rgba(249, 115, 22, 0.3);
          color: #f97316;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* BARIS 3: Lokasi (14px) & Paket */
        .c-row-3 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          color: var(--text-secondary);
        }
        .c-meta-item {
          font-size: 13.5px;
          font-weight: 600;
        }
        .c-meta-dot {
          color: var(--text-muted);
        }
        .c-package-tag {
          color: var(--text-muted);
          font-size: 12.5px;
        }

        /* BARIS 4: Catatan PT (13px max 2 baris) */
        .c-row-4 {
          background: var(--bg-elevated);
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid var(--border-default);
        }
        .c-notes-preview {
          font-size: 12.5px;
          line-height: 1.35;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .c-read-more {
          color: var(--brand-primary);
          font-weight: 700;
        }

        /* BARIS 5: BUTTON LIHAT DETAIL */
        .c-row-5 {
          margin-top: 2px;
        }
        .c-detail-btn {
          width: 100%;
          height: 38px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.28);
          border-radius: 10px;
          color: var(--brand-primary);
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .c-detail-btn:hover {
          background: rgba(99, 102, 241, 0.22);
          border-color: var(--brand-primary);
        }

        /* PT CONTROLS */
        .pt-control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
        }
        .pt-status-select {
          height: 34px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
          padding: 0 6px;
        }
        .pt-btn-group {
          display: flex;
          gap: 6px;
        }
        :global(.pt-edit-btn) {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pt-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* 12. EMPTY STATE MODEL MODERN */
        .compact-empty-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 36px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }
        .empty-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          background: rgba(99, 102, 241, 0.12);
          color: var(--brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .empty-title {
          font-size: 16.5px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .empty-desc {
          font-size: 12.5px;
          color: var(--text-muted);
          max-width: 360px;
          line-height: 1.4;
        }
        .empty-refresh-btn {
          margin-top: 6px;
          padding: 8px 18px;
          background: var(--brand-primary);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }

        /* 11. SKELETON STYLES */
        .skeleton-card {
          height: 130px;
        }
        .skeleton-line {
          background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
        .sk-title { height: 18px; width: 50%; }
        .sk-subtitle { height: 24px; width: 70%; }
        .sk-body { height: 14px; width: 90%; }

        /* 9. PREMIUM BOTTOM SHEET STYLES */
        .bottom-sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(14px);
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .bottom-sheet-card {
          width: 100%;
          max-width: 600px;
          background: var(--bg-elevated);
          border-top-left-radius: 28px;
          border-top-right-radius: 28px;
          border: 1px solid var(--border-default);
          border-bottom: none;
          padding: 16px 20px 24px;
          box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.6);
          max-height: 85vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sheet-handle-bar {
          width: 42px;
          height: 5px;
          background: var(--border-default);
          border-radius: 100px;
          align-self: center;
        }
        .sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sheet-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sheet-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sheet-title {
          font-size: 16.5px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .sheet-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }
        .sheet-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .sheet-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sheet-section-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bs-row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bs-program-title {
          font-size: 20px;
          font-weight: 900;
          color: var(--text-primary);
        }
        .bs-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .bs-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .bs-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .bs-val {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .sheet-sec-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--brand-primary);
        }
        .bs-full-notes {
          font-size: 13px;
          line-height: 1.45;
          color: var(--text-secondary);
          font-style: italic;
          background: var(--bg-elevated);
          padding: 10px 12px;
          border-radius: 10px;
        }
        .bs-eval-box {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--text-secondary);
        }
        .sheet-footer {
          margin-top: 4px;
        }
        .sheet-close-action-btn {
          width: 100%;
          height: 44px;
          border-radius: 14px;
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .compact-session-grid {
            grid-template-columns: 1fr;
          }
          .c-program-title {
            font-size: 18px;
          }
          .bs-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
