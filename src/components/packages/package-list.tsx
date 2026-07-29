'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Dumbbell,
  ChevronRight,
  Search,
  MessageCircle,
  PhoneCall,
  X,
  User,
  Eye,
} from 'lucide-react'
import { listPackages, deletePackage } from '@/lib/actions/package'
import { listSessions } from '@/lib/actions/session'
import { useAuthStore } from '@/store/auth-store'
import { CustomModal, ModalType } from '@/components/ui/custom-modal'
import { DataTable } from '@/components/ui/data-table'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function PackageList() {
  const { role } = useAuthStore()
  const isClient = role === 'client'

  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [sessionsData, setSessionsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Package Detail Modal State for Client
  const [selectedDetailPkg, setSelectedDetailPkg] = useState<any | null>(null)
  // Contact PT Modal State for Client
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  // Search state for PT/Admin
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when modal is active
  useEffect(() => {
    if (selectedDetailPkg || isContactModalOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [selectedDetailPkg, isContactModalOpen])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pkgsRes, sessionsRes] = await Promise.all([
        listPackages(),
        listSessions(),
      ])
      setData(pkgsRes || [])
      setSessionsData(sessionsRes || [])
    } catch (err) {
      console.error('Error loading package data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: ModalType
    title?: string
    message: string
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  })

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    pkgId: string
    packageName: string
  }>({
    isOpen: false,
    pkgId: '',
    packageName: '',
  })

  const handleDelete = (pkgId: string, packageName: string) => {
    if (isClient) return
    setConfirmDelete({
      isOpen: true,
      pkgId,
      packageName,
    })
  }

  const executeDeletePackage = async () => {
    const { pkgId } = confirmDelete
    if (!pkgId) return

    setDeletingId(pkgId)
    setConfirmDelete({ isOpen: false, pkgId: '', packageName: '' })

    try {
      const res = await deletePackage(pkgId)
      if (res.success) {
        fetchData()
        setModalConfig({
          isOpen: true,
          type: 'success',
          title: 'Paket Dihapus',
          message: 'Paket berhasil dihapus dari sistem.',
        })
      } else {
        setModalConfig({
          isOpen: true,
          type: 'error',
          title: 'Gagal Menghapus',
          message: res.error || 'Gagal menghapus paket',
        })
      }
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: err.message || 'Gagal menghapus paket',
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered packages for PT/Admin search
  const filteredData = useMemo(() => {
    let result = data
    if (searchQuery && !isClient) {
      const term = searchQuery.toLowerCase()
      result = result.filter(row =>
        (row.packageName && row.packageName.toLowerCase().includes(term)) ||
        (row.clientName && row.clientName.toLowerCase().includes(term))
      )
    }
    return result
  }, [data, searchQuery, isClient])

  // Helper for Status Pills
  const renderStatusPill = (pkg: any) => {
    const isExpired = pkg.expiresAt && new Date(pkg.expiresAt) < new Date()
    const isFinished = (pkg.usedSessions ?? 0) >= (pkg.totalSessions ?? 0)

    if (isFinished) {
      return <span className="pkg-status-pill pill-danger">🔴 Selesai</span>
    }
    if (isExpired) {
      return <span className="pkg-status-pill pill-warning">🟡 Kedaluwarsa</span>
    }
    return <span className="pkg-status-pill pill-success">🟢 Aktif</span>
  }

  // ==================== PT / ADMIN DATA TABLE COLUMNS ====================
  const ptColumns = [
    { key: 'packageName', label: 'Nama Paket' },
    { key: 'clientName', label: 'Client' },
    {
      key: 'sessions',
      label: 'Sesi',
      render: (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{row.usedSessions} / {row.totalSessions} Terpakai</span>
          <div style={{ width: '100%', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (row.usedSessions / row.totalSessions) * 100)}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: '2px' }} />
          </div>
        </div>
      )
    },
    {
      key: 'totalPrice',
      label: 'Total Harga',
      render: (row: any) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(row.totalPrice || 0))}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => renderStatusPill(row)
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row: any) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href={`/packages/${row.id}/edit`} className="pt-action-btn" title="Edit Paket">
            <Edit size={16} />
          </Link>
          <button
            type="button"
            onClick={() => handleDelete(row.id, row.packageName)}
            className="pt-action-btn pt-action-btn-danger"
            disabled={deletingId === row.id}
            title="Hapus Paket"
          >
            {deletingId === row.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      )
    }
  ]

  // ==================== RENDER PT / ADMIN VIEW (DATA TABLE) ====================
  if (!isClient) {
    return (
      <div className="pt-package-container animate-fade-in">
        <div className="pt-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Link href="/packages/new" className="pt-add-btn">
            <Plus size={16} />
            <span>Tambah Paket Sesi Baru</span>
          </Link>
        </div>

        <DataTable
          data={data}
          columns={ptColumns}
          isLoading={loading}
          searchPlaceholder="Cari paket atau client..."
        />

        <style jsx>{`
          :global(.pt-add-btn) {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: var(--brand-primary);
            color: white;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          }
          :global(.pt-action-btn) {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: var(--bg-elevated);
            color: var(--text-secondary);
            border: 1px solid var(--border-default);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          :global(.pt-action-btn:hover:not(:disabled)) {
            background: rgba(139, 92, 246, 0.1);
            color: var(--brand-primary);
            border-color: rgba(139, 92, 246, 0.3);
          }
          :global(.pt-action-btn-danger:hover:not(:disabled)) {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.3);
          }
          .pkg-status-pill {
            padding: 3px 9px;
            border-radius: 100px;
            font-size: 11.5px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
          .pill-success {
            background: rgba(16, 185, 129, 0.14);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .pill-danger {
            background: rgba(239, 68, 68, 0.14);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .pill-warning {
            background: rgba(245, 158, 11, 0.14);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
          }
        `}</style>
      </div>
    )
  }

  // ==================== RENDER CLIENT VIEW (PREMIUM MEMBERSHIP CARDS) ====================
  return (
    <div className="package-wrapper">
      {/* SKELETON LOADING EXPERIENCE FOR CLIENT */}
      {loading ? (
        <div className="package-grid">
          {[1, 2].map(n => (
            <div key={n} className="membership-card skeleton-card">
              <div className="skeleton-line sk-title" />
              <div className="skeleton-line sk-body" />
              <div className="skeleton-line sk-footer" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        /* EMPTY STATE UNTUK CLIENT */
        <div className="package-empty-card animate-fade-in">
          <div className="empty-icon-wrap">
            <Package size={36} />
          </div>
          <h3 className="empty-title">Belum Memiliki Paket</h3>
          <p className="empty-desc">
            Hubungi Personal Trainer Anda untuk membeli atau mengaktifkan paket sesi latihan baru.
          </p>
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="empty-contact-btn"
          >
            <MessageCircle size={14} />
            <span>Hubungi PT</span>
          </button>
        </div>
      ) : (
        /* PREMIUM MEMBERSHIP CARDS FOR CLIENT */
        <div className="package-grid">
          {data.map((pkg, idx) => {
            const total = pkg.totalSessions || 10
            const used = pkg.usedSessions || 0
            const remaining = Math.max(0, total - used)
            const percent = Math.min(100, Math.round((used / total) * 100))
            const formattedPrice = `Rp ${new Intl.NumberFormat('id-ID').format(Number(pkg.totalPrice || 0))}`

            const pkgSessions = sessionsData.filter(
              s => s.packageName === pkg.packageName || s.packageId === pkg.id
            ).slice(0, 3)

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedDetailPkg(pkg)}
                className="membership-card animate-slide-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* RENEWAL WARNING BANNER IF REMAINING SESSIONS <= 3 */}
                {remaining <= 3 && remaining > 0 && (
                  <div className="renewal-warning-banner" onClick={(e) => e.stopPropagation()}>
                    <div className="rwb-left">
                      <AlertTriangle size={14} className="rwb-icon" />
                      <span>⚠️ Paket Anda hampir habis. Sisa <strong>{remaining} sesi</strong> lagi.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsContactModalOpen(true)}
                      className="rwb-btn"
                    >
                      Hubungi PT
                    </button>
                  </div>
                )}

                {/* CARD HEADER */}
                <div className="mc-header">
                  <div className="mc-pkg-title-wrap">
                    <div className="mc-icon-badge">
                      <Package size={18} />
                    </div>
                    <h3 className="mc-pkg-name">{pkg.packageName || 'Paket PT'}</h3>
                  </div>
                  {renderStatusPill(pkg)}
                </div>

                {/* PROGRESS SECTION */}
                <div className="mc-progress-section">
                  <div className="mc-prog-top">
                    <span className="mc-prog-label">
                      <strong>{used}</strong> dari <strong>{total}</strong> sesi digunakan
                    </span>
                    <span className="mc-prog-percent">{percent}%</span>
                  </div>

                  <div className="mc-progress-bar-wrap">
                    <div className="mc-progress-fill" style={{ width: `${percent}%` }} />
                  </div>

                  <div className="mc-prog-bottom">
                    <span className="mc-rem-tag">⏳ Sisa {remaining} Session</span>
                  </div>
                </div>

                {/* PACKAGE INFO 2-COLUMN GRID */}
                <div className="mc-info-grid">
                  <div className="mc-info-box">
                    <span className="mc-label">💰 Harga Paket</span>
                    <span className="mc-val-price">{formattedPrice}</span>
                  </div>

                  <div className="mc-info-box">
                    <span className="mc-label">🏋️ Total Session</span>
                    <span className="mc-val">{total} Sesi</span>
                  </div>

                  <div className="mc-info-box">
                    <span className="mc-label">📅 Tanggal Mulai</span>
                    <span className="mc-val">
                      {pkg.createdAt ? format(new Date(pkg.createdAt), 'dd MMM yyyy', { locale: id }) : '01 Jul 2026'}
                    </span>
                  </div>

                  <div className="mc-info-box">
                    <span className="mc-label">📅 Berakhir</span>
                    <span className="mc-val">
                      {pkg.expiresAt ? format(new Date(pkg.expiresAt), 'dd MMM yyyy', { locale: id }) : '31 Jul 2026'}
                    </span>
                  </div>
                </div>

                {/* AI INSIGHT CARD */}
                <div className="mc-ai-card">
                  <div className="mc-ai-header">
                    <Sparkles size={14} className="mc-ai-icon" />
                    <span>✨ AI Insight</span>
                  </div>
                  <p className="mc-ai-text">
                    Anda telah menggunakan <strong>{percent}%</strong> paket ini. Disarankan rutin menjadwalkan sesi agar target tercapai sebelum masa berakhir.
                  </p>
                </div>

                {/* MEMBERSHIP TIMELINE */}
                <div className="mc-timeline">
                  <div className="tl-step completed">
                    <div className="tl-dot" />
                    <span>Paket Dibuat</span>
                  </div>
                  <div className="tl-line active" />
                  <div className={`tl-step ${used > 0 ? 'completed' : ''}`}>
                    <div className="tl-dot" />
                    <span>Sesi 1</span>
                  </div>
                  <div className="tl-line" />
                  <div className={`tl-step ${remaining <= 3 ? 'active' : ''}`}>
                    <div className="tl-dot" />
                    <span>Sesi Akhir</span>
                  </div>
                  <div className="tl-line" />
                  <div className="tl-step">
                    <div className="tl-dot" />
                    <span>Selesai</span>
                  </div>
                </div>

                {/* SESSION HISTORY PREVIEW */}
                {pkgSessions.length > 0 && (
                  <div className="mc-sessions-preview" onClick={(e) => e.stopPropagation()}>
                    <span className="sp-title">Pratinjau Sesi Terakhir:</span>
                    <div className="sp-list">
                      {pkgSessions.map(s => (
                        <div key={s.id} className="sp-item">
                          <span className="sp-date">
                            {format(new Date(s.scheduledAt), 'dd MMM', { locale: id })}
                          </span>
                          <span className="sp-prog">{s.programType || 'Latihan'}</span>
                          <span className="sp-status">
                            {s.status === 'completed' ? '✅' : '📅'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FOOTER ACTION FOR CLIENT */}
                <div className="mc-footer">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDetailPkg(pkg)
                    }}
                    className="mc-detail-btn"
                  >
                    <Eye size={14} />
                    <span>Lihat Detail Paket</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DETAIL MODAL FOR CLIENT */}
      {mounted && selectedDetailPkg && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedDetailPkg(null)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-header">
              <div className="mc-modal-title-group">
                <div className="mc-modal-icon-badge">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="mc-modal-title">Detail Paket Sesi</h3>
                  <p className="mc-modal-sub">Rincian status dan penggunaan paket</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedDetailPkg(null)} className="mc-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="mc-modal-body">
              <div className="mc-modal-sec">
                <div className="bs-row-between">
                  <h2 className="bs-pkg-name">📦 {selectedDetailPkg.packageName}</h2>
                  {renderStatusPill(selectedDetailPkg)}
                </div>

                <div className="bs-grid-2">
                  <div className="bs-info-item">
                    <span className="bs-label">Total Harga Paket</span>
                    <span className="bs-val" style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
                      Rp {new Intl.NumberFormat('id-ID').format(Number(selectedDetailPkg.totalPrice || 0))}
                    </span>
                  </div>

                  <div className="bs-info-item">
                    <span className="bs-label">Total Sesi Paket</span>
                    <span className="bs-val">{selectedDetailPkg.totalSessions} Sesi</span>
                  </div>

                  <div className="bs-info-item">
                    <span className="bs-label">Sesi Digunakan</span>
                    <span className="bs-val">{selectedDetailPkg.usedSessions} Sesi</span>
                  </div>

                  <div className="bs-info-item">
                    <span className="bs-label">Sesi Tersisa</span>
                    <span className="bs-val" style={{ color: '#10b981', fontWeight: 800 }}>
                      {Math.max(0, (selectedDetailPkg.totalSessions || 0) - (selectedDetailPkg.usedSessions || 0))} Sesi
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mc-modal-footer">
              <button type="button" onClick={() => setSelectedDetailPkg(null)} className="mc-modal-action-btn">
                Tutup Detail Paket
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONTACT PT MODAL FOR CLIENT */}
      {mounted && isContactModalOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsContactModalOpen(false)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-header">
              <div className="mc-modal-title-group">
                <User size={20} style={{ color: 'var(--brand-primary)' }} />
                <h3 className="mc-modal-title">Hubungi Personal Trainer</h3>
              </div>
              <button type="button" onClick={() => setIsContactModalOpen(false)} className="mc-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="mc-modal-body">
              <p className="mc-modal-text">
                Hubungi Personal Trainer Anda untuk menambah paket sesi baru atau memperpanjang masa berlaku paket:
              </p>

              <div className="mc-contact-btns">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Coach,%20saya%20ingin%20membeli/memperpanjang%20paket%20sesi%20latihan."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mc-wa-btn"
                >
                  <MessageCircle size={18} />
                  <span>Kirim WhatsApp ke PT</span>
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        .package-wrapper { display: flex; flex-direction: column; gap: 14px; }
        .package-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 14px; }
        .membership-card {
          background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 24px; padding: 18px 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(20px); display: flex; flex-direction: column; gap: 12px; cursor: pointer;
        }
        .renewal-warning-banner {
          background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 12px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: #f59e0b;
        }
        .rwb-left { display: flex; align-items: center; gap: 6px; }
        .rwb-btn { background: #f59e0b; color: black; border: none; border-radius: 100px; padding: 4px 10px; font-size: 11px; font-weight: 800; cursor: pointer; }
        .mc-header { display: flex; align-items: center; justify-content: space-between; }
        .mc-pkg-title-wrap { display: flex; align-items: center; gap: 8px; }
        .mc-icon-badge { width: 34px; height: 34px; border-radius: 10px; background: rgba(234, 179, 8, 0.15); color: #eab308; display: flex; align-items: center; justify-content: center; }
        .mc-pkg-name { font-size: 17px; font-weight: 900; color: var(--text-primary); }
        .pkg-status-pill { padding: 3px 9px; border-radius: 100px; font-size: 11.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; }
        .pill-success { background: rgba(16, 185, 129, 0.14); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .pill-danger { background: rgba(239, 68, 68, 0.14); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .pill-warning { background: rgba(245, 158, 11, 0.14); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .mc-progress-section { background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
        .mc-prog-top { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; }
        .mc-prog-label { color: var(--text-secondary); }
        .mc-prog-percent { font-weight: 800; color: var(--brand-primary); }
        .mc-progress-bar-wrap { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 100px; overflow: hidden; }
        .mc-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%); border-radius: 100px; }
        .mc-prog-bottom { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; }
        .mc-rem-tag { font-weight: 700; color: #10b981; }
        .mc-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .mc-info-box { background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 1px; }
        .mc-label { font-size: 11px; color: var(--text-muted); }
        .mc-val { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }
        .mc-val-price { font-size: 13.5px; font-weight: 900; color: var(--brand-primary); }
        .mc-ai-card { background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
        .mc-ai-header { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 800; color: #a855f7; }
        :global(.mc-ai-icon) { color: #a855f7; }
        .mc-ai-text { font-size: 11.5px; color: var(--text-secondary); line-height: 1.35; }
        .mc-timeline { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
        .tl-step { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 9.5px; color: var(--text-muted); font-weight: 600; }
        .tl-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-default); }
        .tl-step.completed .tl-dot, .tl-step.active .tl-dot { background: var(--brand-primary); box-shadow: 0 0 8px var(--brand-primary); }
        .tl-step.completed span, .tl-step.active span { color: var(--text-primary); }
        .tl-line { flex: 1; height: 2px; background: var(--border-default); margin: 0 4px; margin-bottom: 12px; }
        .tl-line.active { background: var(--brand-primary); }
        .mc-sessions-preview { background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 4px; }
        .sp-title { font-size: 10.5px; font-weight: 700; color: var(--text-muted); }
        .sp-list { display: flex; flex-direction: column; gap: 4px; }
        .sp-item { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--text-secondary); }
        .sp-date { font-weight: 700; color: var(--brand-primary); }
        .sp-prog { font-weight: 600; }
        .mc-detail-btn { width: 100%; height: 38px; background: rgba(99, 102, 241, 0.14); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; color: var(--brand-primary); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
        .package-empty-card { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 24px; padding: 36px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .empty-icon-wrap { width: 60px; height: 60px; border-radius: 18px; background: rgba(234, 179, 8, 0.15); color: #eab308; display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 16.5px; font-weight: 800; color: var(--text-primary); }
        .empty-desc { font-size: 12.5px; color: var(--text-muted); max-width: 360px; line-height: 1.4; }
        .empty-contact-btn { margin-top: 4px; padding: 8px 18px; background: var(--brand-primary); color: white; border: none; border-radius: 100px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(16px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-card { width: 100%; max-width: 500px; background: var(--bg-elevated); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.15); padding: 20px 22px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; gap: 14px; max-height: 85vh; overflow-y: auto; }
        .mc-modal-header { display: flex; align-items: center; justify-content: space-between; }
        .mc-modal-title-group { display: flex; align-items: center; gap: 8px; }
        .mc-modal-icon-badge { width: 36px; height: 36px; border-radius: 10px; background: rgba(234, 179, 8, 0.15); color: #eab308; display: flex; align-items: center; justify-content: center; }
        .mc-modal-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .mc-modal-sub { font-size: 11.5px; color: var(--text-muted); }
        .mc-modal-close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .mc-modal-body { display: flex; flex-direction: column; gap: 12px; }
        .mc-modal-sec { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .bs-row-between { display: flex; align-items: center; justify-content: space-between; }
        .bs-pkg-name { font-size: 18px; font-weight: 900; color: var(--text-primary); }
        .bs-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .bs-info-item { display: flex; flex-direction: column; }
        .bs-label { font-size: 10.5px; color: var(--text-muted); }
        .bs-val { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .mc-modal-footer { margin-top: 4px; }
        .mc-modal-action-btn { width: 100%; height: 42px; border-radius: 12px; border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer; }
        .mc-contact-btns { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .mc-wa-btn { height: 42px; background: #10b981; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13.5px; font-weight: 700; text-decoration: none; }
      `}</style>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <CustomModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, pkgId: '', packageName: '' })}
        onConfirm={executeDeletePackage}
        type="confirm"
        title="Konfirmasi Hapus Paket"
        message={`Yakin ingin menghapus paket "${confirmDelete.packageName}"? Semua sesi yang terhubung dengan paket ini juga akan ikut terhapus.`}
        confirmText="Hapus Paket"
        cancelText="Batal"
        isSubmitting={Boolean(deletingId)}
      />

      {/* ==================== GLOBAL ALERT MODAL ==================== */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  )
}
