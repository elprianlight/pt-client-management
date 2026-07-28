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
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { listSessions, updateSessionStatus, deleteSession } from '@/lib/actions/session'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function SessionList() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // 5. TIMELINE & VIEW MODE SEGMENTED CONTROL OPTIONS
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

  // Filter derivations
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
    if (selectedClient) {
      result = result.filter(row => row.clientName === selectedClient)
    }
    if (selectedPackage) {
      result = result.filter(row => row.packageName === selectedPackage)
    }
    return result
  }, [data, selectedMonth, selectedPackage, selectedClient, searchQuery])

  // Helper for Status Pills
  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="sc-status-pill sc-pill-success">
            🟢 Selesai
          </span>
        )
      case 'cancelled':
        return (
          <span className="sc-status-pill sc-pill-danger">
            🔴 Dibatalkan
          </span>
        )
      case 'no_show':
        return (
          <span className="sc-status-pill sc-pill-danger">
            🚫 No Show
          </span>
        )
      default:
        return (
          <span className="sc-status-pill sc-pill-brand">
            🔵 Terjadwal
          </span>
        )
    }
  }

  return (
    <div className="session-history-wrapper">
      {/* 5. SEGMENTED CONTROL VIEW MODES & FILTERS BAR */}
      <div className="session-header-card animate-slide-down">
        <div className="session-header-top">
          <div>
            <h2 className="session-header-title">Riwayat & Jadwal Sesi</h2>
            <p className="session-header-desc">Kelola seluruh aktivitas sesi latihan client Anda</p>
          </div>

          {/* Segmented Control Buttons */}
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

        {/* Filter Inputs Grid */}
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

      {/* 6. GLASS SKELETON LOADING EXPERIENCE */}
      {isLoading ? (
        <div className="session-grid-layout">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="session-card skeleton-card">
              <div className="skeleton-line title-sk" />
              <div className="skeleton-line text-sk" />
              <div className="skeleton-line sub-sk" />
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="session-empty-card animate-fade-in">
          <CalendarIcon size={36} style={{ color: 'var(--text-muted)' }} />
          <h3>Belum Ada Data Sesi</h3>
          <p>Tidak ada riwayat atau jadwal sesi yang sesuai dengan kriteria filter Anda.</p>
        </div>
      ) : (
        <>
          {/* VIEW MODE 1: CARD VIEW (DEFAULT GRID 20PX ROUNDED) */}
          {viewMode === 'card' && (
            <div className="session-grid-layout">
              {filteredData.map((row, idx) => (
                <div
                  key={row.id}
                  className="session-card animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Top Bar: Date & Status */}
                  <div className="sc-header">
                    <div className="sc-date-badge">
                      <CalendarIcon size={13} />
                      <span>
                        {format(new Date(row.scheduledAt), 'E, dd MMM yyyy', { locale: id })}
                      </span>
                      <span className="sc-time-dot">•</span>
                      <Clock size={12} />
                      <span>{format(new Date(row.scheduledAt), 'HH:mm')}</span>
                    </div>
                    {renderStatusPill(row.status)}
                  </div>

                  {/* Body Details: Program, Location, RPE */}
                  <div className="sc-body">
                    <div className="sc-program-row">
                      <Dumbbell size={16} className="sc-prog-icon" />
                      <h4 className="sc-program-name">{row.programType || 'Latihan Regular'}</h4>
                    </div>

                    <div className="sc-meta-pills">
                      {row.location && (
                        <div className="sc-meta-pill">
                          <MapPin size={13} style={{ color: 'var(--brand-primary)' }} />
                          <span>{row.location}</span>
                        </div>
                      )}

                      {row.rpe && (
                        <div className="sc-meta-pill sc-rpe-pill">
                          <Flame size={13} style={{ color: '#f97316' }} />
                          <span>🔥 RPE {row.rpe}</span>
                        </div>
                      )}
                    </div>

                    {/* Client & Package info */}
                    <div className="sc-client-box">
                      <User size={14} style={{ color: 'var(--text-muted)' }} />
                      <span className="sc-client-name">{row.clientName || 'Client'}</span>
                      <span className="sc-pkg-name">({row.packageName || 'Paket Sesi'})</span>
                    </div>

                    {row.sessionNotes && (
                      <p className="sc-notes-text">"{row.sessionNotes}"</p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="sc-footer">
                    <select
                      className="sc-status-select"
                      value={row.status}
                      disabled={processingId === row.id}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                    >
                      <option value="completed">✓ Selesai</option>
                      <option value="scheduled">📅 Terjadwal</option>
                      <option value="cancelled">❌ Batal</option>
                      <option value="no_show">🚫 No Show</option>
                    </select>

                    <div className="sc-action-btns">
                      <Link href={`/session/${row.id}/edit`} className="sc-btn-edit" title="Edit Sesi">
                        <Edit size={15} />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={processingId === row.id}
                        className="sc-btn-delete"
                        title="Hapus Sesi"
                      >
                        {processingId === row.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 2: TIMELINE VIEW */}
          {viewMode === 'timeline' && (
            <div className="session-timeline-layout">
              {filteredData.map((row, idx) => (
                <div key={row.id} className="timeline-item animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="tl-node-line">
                    <div className="tl-node-dot" />
                    <div className="tl-line" />
                  </div>
                  <div className="tl-card session-card">
                    <div className="sc-header">
                      <span className="tl-time-badge">
                        📅 {format(new Date(row.scheduledAt), 'dd MMM yyyy — HH:mm', { locale: id })}
                      </span>
                      {renderStatusPill(row.status)}
                    </div>
                    <div className="sc-body" style={{ marginTop: 8 }}>
                      <h4 className="sc-program-name">🏋️ {row.programType || 'Latihan Regular'}</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        👤 {row.clientName} • 📍 {row.location || 'Gym Utama'} {row.rpe ? `• 🔥 RPE ${row.rpe}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 3: CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <div className="session-grid-layout">
              {filteredData.map((row, idx) => (
                <div key={row.id} className="session-card calendar-card-item animate-fade-in">
                  <div className="cal-date-header">
                    <span className="cal-day-num">{format(new Date(row.scheduledAt), 'dd')}</span>
                    <span className="cal-month-name">{format(new Date(row.scheduledAt), 'MMM yyyy', { locale: id })}</span>
                  </div>
                  <div className="cal-details">
                    <h4>{row.programType || 'Latihan'}</h4>
                    <p>{row.clientName} • {format(new Date(row.scheduledAt), 'HH:mm')}</p>
                    <div style={{ marginTop: 6 }}>{renderStatusPill(row.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 4: LIST VIEW */}
          {viewMode === 'list' && (
            <div className="session-list-compact-layout">
              {filteredData.map((row, idx) => (
                <div key={row.id} className="session-list-item animate-fade-in">
                  <div className="sli-left">
                    <div className="sli-icon">
                      <Dumbbell size={16} />
                    </div>
                    <div>
                      <h4 className="sli-title">{row.programType || 'Latihan'} — {row.clientName}</h4>
                      <p className="sli-sub">
                        {format(new Date(row.scheduledAt), 'dd MMM, HH:mm', { locale: id })} • 📍 {row.location || 'Gym Utama'}
                      </p>
                    </div>
                  </div>
                  <div className="sli-right">
                    {renderStatusPill(row.status)}
                    <Link href={`/session/${row.id}/edit`} className="sc-btn-edit">
                      <Edit size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .session-history-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .session-header-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(16px);
        }
        .session-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
        }
        .session-header-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .session-header-desc {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* 5. SEGMENTED CONTROL BUTTONS */
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
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .seg-btn:hover {
          color: var(--text-primary);
        }
        .seg-btn.active {
          background: var(--brand-primary);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        /* FILTERS GRID */
        .session-filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .filter-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .filter-search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .filter-input {
          width: 100%;
          height: 42px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 13px;
          padding: 0 12px 0 34px;
          outline: none;
          transition: all var(--transition-fast);
        }
        .filter-select {
          width: 100%;
          height: 42px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          padding: 0 12px;
          outline: none;
        }

        /* 2. PREMIUM SESSION CARD (20PX ROUNDED, SHADOW & GLASS) */
        .session-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 16px;
        }
        :global(.session-card) {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 18px 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 14px;
          transition: all var(--transition-fast);
        }
        :global(.session-card:hover) {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 14px 36px rgba(99, 102, 241, 0.15);
        }

        .sc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .sc-date-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .sc-time-dot {
          color: var(--text-muted);
        }

        /* 4. MODERN STATUS PILL */
        :global(.sc-status-pill) {
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        :global(.sc-pill-success) {
          background: rgba(16, 185, 129, 0.14);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        :global(.sc-pill-brand) {
          background: rgba(99, 102, 241, 0.14);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        :global(.sc-pill-danger) {
          background: rgba(239, 68, 68, 0.14);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* 3. PROGRAM DETAILS DISPLAY */
        .sc-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sc-program-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        :global(.sc-prog-icon) {
          color: #a855f7;
        }
        .sc-program-name {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .sc-meta-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sc-meta-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .sc-rpe-pill {
          background: rgba(249, 115, 22, 0.12);
          border-color: rgba(249, 115, 22, 0.25);
          color: #f97316;
          font-weight: 800;
        }
        .sc-client-box {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .sc-client-name {
          font-weight: 700;
          color: var(--text-primary);
        }
        .sc-pkg-name {
          color: var(--text-muted);
          font-size: 11.5px;
        }
        .sc-notes-text {
          font-size: 12px;
          font-style: italic;
          color: var(--text-muted);

        }

        .sc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid var(--border-default);
        }
        .sc-status-select {
          height: 34px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
          padding: 0 8px;
          outline: none;
        }
        .sc-action-btns {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        :global(.sc-btn-edit) {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        :global(.sc-btn-edit:hover) {
          color: var(--brand-primary);
          border-color: var(--brand-primary);
        }
        .sc-btn-delete {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sc-btn-delete:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        /* 5. TIMELINE VIEW STYLES */
        .session-timeline-layout {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-item {
          display: flex;
          gap: 14px;
        }
        .tl-node-line {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 20px;
        }
        .tl-node-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--brand-primary);
          box-shadow: 0 0 10px var(--brand-primary);
          margin-top: 6px;
        }
        .tl-line {
          flex: 1;
          width: 2px;
          background: var(--border-default);
          margin-top: 4px;
        }
        .tl-card {
          flex: 1;
        }
        .tl-time-badge {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* CALENDAR VIEW STYLES */
        .calendar-card-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cal-date-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 14px;
          color: var(--brand-primary);
          flex-shrink: 0;
        }
        .cal-day-num {
          font-size: 20px;
          font-weight: 900;
          line-height: 1;
        }
        .cal-month-name {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* LIST VIEW STYLES */
        .session-list-compact-layout {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .session-list-item {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 14px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .sli-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sli-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sli-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .sli-sub {
          font-size: 12px;
          color: var(--text-muted);
        }
        .sli-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* 6. GLASS SKELETON STYLES */
        .skeleton-card {
          height: 160px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .skeleton-line {
          background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
        .title-sk { height: 20px; width: 60%; }
        .text-sk { height: 16px; width: 80%; }
        .sub-sk { height: 14px; width: 40%; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .session-empty-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 40px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @media (max-width: 640px) {
          .session-header-card {
            padding: 14px;
            border-radius: 16px;
          }
          .segmented-control {
            width: 100%;
            overflow-x: auto;
          }
          .seg-btn {
            flex: 1;
            justify-content: center;
            padding: 6px 8px;
            font-size: 11.5px;
          }
          .session-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
