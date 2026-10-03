'use client'

import { useState, useMemo } from 'react'
import {
  Download,
  Zap,
  BarChart3,
  Dumbbell,
  Users,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SessionLog {
  id: string
  scheduledAt: string
  status: string
  programType: string | null
  location: string | null
  rpe: number | null
  duration: number | null
  clientName?: string | null
  pdfAttachmentUrl?: string | null
}

interface ReportsViewProps {
  role: string
  completedCount: number
  totalSessionsCount: number
  attendanceRate: number
  activeClientsCount: number
  sessionLogs: SessionLog[]
}

const PAGE_SIZE = 10

// ─── COMPACT SPEED-OPS FEED ANALYTICS COMPONENT ────────────────────────────────

export function ReportsView({
  role,
  completedCount,
  totalSessionsCount,
  attendanceRate,
  activeClientsCount,
  sessionLogs,
}: ReportsViewProps) {
  // ── FILTER STATES ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedClient, setSelectedClient] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // ── EXTRACT DYNAMIC FILTER OPTIONS ────────────────────────────────────────
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, string>()
    sessionLogs.forEach((log) => {
      if (!log.scheduledAt) return
      const date = new Date(log.scheduledAt)
      if (isNaN(date.getTime())) return
      const key = format(date, 'yyyy-MM')
      const label = format(date, 'MMM yyyy', { locale: idLocale })
      if (!monthMap.has(key)) {
        monthMap.set(key, label)
      }
    })
    return Array.from(monthMap.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [sessionLogs])

  const availableClients = useMemo(() => {
    const set = new Set<string>()
    sessionLogs.forEach((log) => {
      if (log.clientName) set.add(log.clientName)
    })
    return Array.from(set).sort()
  }, [sessionLogs])

  const availablePrograms = useMemo(() => {
    const set = new Set<string>()
    sessionLogs.forEach((log) => {
      if (log.programType) set.add(log.programType)
    })
    return Array.from(set).sort()
  }, [sessionLogs])

  // ── FILTERED LOGS ─────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return sessionLogs.filter((log) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const clientMatch = log.clientName?.toLowerCase().includes(q)
        const programMatch = log.programType?.toLowerCase().includes(q)
        const locMatch = log.location?.toLowerCase().includes(q)
        if (!clientMatch && !programMatch && !locMatch) return false
      }

      if (selectedMonth !== 'all') {
        const logMonth = format(new Date(log.scheduledAt), 'yyyy-MM')
        if (logMonth !== selectedMonth) return false
      }

      if (selectedClient !== 'all') {
        if (log.clientName !== selectedClient) return false
      }

      if (selectedStatus !== 'all') {
        if (log.status !== selectedStatus) return false
      }

      if (selectedProgram !== 'all') {
        if (log.programType !== selectedProgram) return false
      }

      return true
    })
  }, [sessionLogs, searchQuery, selectedMonth, selectedClient, selectedStatus, selectedProgram])

  // ── PAGINATION ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedLogs = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE
    return filteredLogs.slice(start, start + PAGE_SIZE)
  }, [filteredLogs, safeCurrentPage])

  const activeFilterCount =
    (searchQuery.trim() !== '' ? 1 : 0) +
    (selectedMonth !== 'all' ? 1 : 0) +
    (selectedClient !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedProgram !== 'all' ? 1 : 0)

  const isFilterActive = activeFilterCount > 0

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedMonth('all')
    setSelectedClient('all')
    setSelectedStatus('all')
    setSelectedProgram('all')
    setCurrentPage(1)
  }

  // ── EXPORT CSV ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const dataToExport = filteredLogs.length > 0 ? filteredLogs : sessionLogs
    const headers = ['Tanggal', 'Waktu', 'Nama Client', 'Program', 'Lokasi', 'Status', 'RPE', 'Durasi (Menit)']
    
    const rows = dataToExport.map((log) => {
      const date = new Date(log.scheduledAt)
      const dateStr = format(date, 'yyyy-MM-dd')
      const timeStr = format(date, 'HH:mm')
      const client = `"${(log.clientName || 'Client').replace(/"/g, '""')}"`
      const program = `"${(log.programType || 'Total Body').replace(/"/g, '""')}"`
      const location = `"${(log.location || '-').replace(/"/g, '""')}"`
      const status = log.status === 'completed' ? 'Selesai' : log.status === 'scheduled' ? 'Terjadwal' : 'Batal'
      const rpe = log.rpe ? log.rpe.toString() : '-'
      const duration = log.duration ? log.duration.toString() : '60'

      return [dateStr, timeStr, client, program, location, status, rpe, duration].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_Sesi_PT_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const dynamicCompletedCount = filteredLogs.filter((s) => s.status === 'completed').length
  const dynamicAttendanceRate =
    filteredLogs.length > 0 ? Math.round((dynamicCompletedCount / filteredLogs.length) * 100) : 100

  const activeCompletedVal = isFilterActive ? dynamicCompletedCount : completedCount
  const activeAttendanceVal = isFilterActive ? dynamicAttendanceRate : attendanceRate
  const activeTotalVal = isFilterActive ? filteredLogs.length : totalSessionsCount
  const activeClientsVal = role === 'client' ? 1 : activeClientsCount

  return (
    <div className="speed-ops-root animate-fade-in">
      {/* ── 1. UNIFIED COMPACT HEADER ROW ────────────────────────────────────── */}
      <div className="ops-compact-header">
        <h1 className="ops-compact-title">Laporan Performansi &amp; Kehadiran</h1>
        <div className="ops-header-badges font-mono">
          <span className="ops-live-pill">
            <span className="ops-pulse-dot" /> LIVE
          </span>
          <span className="ops-trend-badge">▲ +12% VS LALU</span>
          <button
            type="button"
            className="ops-csv-mini-btn font-mono"
            onClick={handleExportCSV}
            title="Unduh data riwayat sesi ke CSV"
          >
            <Download size={10} />
            <span>UNDUH CSV ({filteredLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ── 2. ULTRA-SLIM 4-METRIC STRIP ─────────────────────────────────────── */}
      <div className="ops-compact-metric-strip">
        {/* Metric 1: Total Sesi */}
        <div className="ops-mini-metric-item">
          <div className="ops-mini-metric-icon bg-indigo-500/15 text-indigo-400">
            <Dumbbell size={13} />
          </div>
          <div className="ops-mini-metric-info">
            <span className="ops-mini-num text-indigo-400">
              {activeTotalVal < 10 ? `0${activeTotalVal}` : activeTotalVal}
            </span>
            <span className="ops-mini-lbl">Total Sesi</span>
          </div>
        </div>

        <div className="ops-metric-divider" />

        {/* Metric 2: Selesai */}
        <div className="ops-mini-metric-item">
          <div className="ops-mini-metric-icon bg-emerald-500/15 text-emerald-400">
            <Zap size={13} />
          </div>
          <div className="ops-mini-metric-info">
            <span className="ops-mini-num text-emerald-400">
              {activeCompletedVal < 10 ? `0${activeCompletedVal}` : activeCompletedVal}
            </span>
            <span className="ops-mini-lbl">Sesi Selesai</span>
          </div>
        </div>

        <div className="ops-metric-divider" />

        {/* Metric 3: Kehadiran */}
        <div className="ops-mini-metric-item">
          <div className="ops-mini-metric-icon bg-cyan-500/15 text-cyan-400">
            <BarChart3 size={13} />
          </div>
          <div className="ops-mini-metric-info">
            <span className="ops-mini-num text-cyan-400">{activeAttendanceVal}%</span>
            <span className="ops-mini-lbl">Kehadiran</span>
          </div>
        </div>

        <div className="ops-metric-divider" />

        {/* Metric 4: Client */}
        <div className="ops-mini-metric-item">
          <div className="ops-mini-metric-icon bg-amber-500/15 text-amber-400">
            <Users size={13} />
          </div>
          <div className="ops-mini-metric-info">
            <span className="ops-mini-num text-amber-400">
              {activeClientsVal < 10 ? `0${activeClientsVal}` : activeClientsVal}
            </span>
            <span className="ops-mini-lbl">{role === 'client' ? 'Akun' : 'Klien Aktif'}</span>
          </div>
        </div>
      </div>

      {/* ── 3. ULTRA-COMPACT MINI FILTER BAR ─────────────────────────────────── */}
      <div className="ops-mini-toolbar">
        {/* Search Input */}
        <div className="ops-mini-search">
          <Search size={12} className="ops-mini-search-icon" />
          <input
            type="text"
            placeholder="Cari sesi, nama klien, program..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="ops-mini-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="ops-mini-clear-btn"
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Micro Filter Pills */}
        <div className="ops-mini-pills-row font-mono">
          <div className={`ops-mini-select-wrap ${selectedMonth !== 'all' ? 'active-filter' : ''}`}>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value)
                setCurrentPage(1)
              }}
              className="ops-mini-select"
            >
              <option value="all">📅 Semua Bulan</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {role !== 'client' && (
            <div className={`ops-mini-select-wrap ${selectedClient !== 'all' ? 'active-filter' : ''}`}>
              <select
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value)
                  setCurrentPage(1)
                }}
                className="ops-mini-select"
              >
                <option value="all">👤 Semua Klien ({availableClients.length})</option>
                {availableClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={`ops-mini-select-wrap ${selectedStatus !== 'all' ? 'active-filter' : ''}`}>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="ops-mini-select"
            >
              <option value="all">⚡ Status</option>
              <option value="completed">✓ Selesai</option>
              <option value="scheduled">→ Terjadwal</option>
              <option value="cancelled">✕ Batal</option>
            </select>
          </div>

          <div className={`ops-mini-select-wrap ${selectedProgram !== 'all' ? 'active-filter' : ''}`}>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value)
                setCurrentPage(1)
              }}
              className="ops-mini-select"
            >
              <option value="all">🏋️ Program</option>
              {availablePrograms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ops-mini-reset-btn"
              title="Reset filter"
            >
              <RotateCcw size={10} />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 4. SPEED-OPS FEED STREAM (RIWAYAT SESI) ─────────────────────────── */}
      <div className="ops-feed-panel">
        {/* Header */}
        <div className="ops-feed-header-row">
          <div className="ops-feed-title-wrap">
            <span className="ops-feed-main-tag font-mono">RIWAYAT SESI</span>
            <span className="ops-feed-divider-line" />
          </div>
          <div className="ops-feed-stats font-mono">
            <span className="ops-feed-live-pill">
              <span className="ops-pulse-mini" /> LIVE
            </span>
            <span className="ops-feed-records font-bold text-white">
              {filteredLogs.length} Record
            </span>
          </div>
        </div>

        {/* Range Info */}
        <div className="ops-range-info font-mono">
          {filteredLogs.length > 0 ? (
            <span>
              Menampilkan baris <strong>{(safeCurrentPage - 1) * PAGE_SIZE + 1}</strong>&ndash;
              <strong>{Math.min(safeCurrentPage * PAGE_SIZE, filteredLogs.length)}</strong> dari{' '}
              <strong>{filteredLogs.length}</strong> record
            </span>
          ) : (
            <span className="text-amber-400">Tidak ada sesi yang cocok dengan filter</span>
          )}
        </div>

        {/* Stream List */}
        {filteredLogs.length === 0 ? (
          <div className="ops-empty-state font-mono">
            <AlertCircle size={22} className="text-slate-500 mb-1" />
            <p className="text-xs font-semibold text-slate-300 m-0">
              Tidak ada data yang cocok dengan kriteria pencarian / filter Anda.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="ops-reset-filter-btn font-mono"
            >
              <RotateCcw size={11} />
              <span>Reset Filter</span>
            </button>
          </div>
        ) : (
          <div className="ops-feed-stream">
            {paginatedLogs.map((log, idx) => {
              const isCompleted = log.status === 'completed'
              const isCancelled = log.status === 'cancelled'
              const isScheduled = log.status === 'scheduled'

              return (
                <div key={log.id} className="ops-feed-card">
                  <div
                    className={`ops-card-dot ${
                      isCompleted ? 'ops-dot-emerald' : isCancelled ? 'ops-dot-red' : 'ops-dot-indigo'
                    }`}
                  />

                  <div className="ops-card-body">
                    <div className="ops-card-line1">
                      <div className="ops-card-left-info">
                        {role !== 'client' && (
                          <span className="ops-client-name">
                            {log.clientName || 'Client'}
                          </span>
                        )}
                        <span className="ops-session-time font-mono">
                          {format(new Date(log.scheduledAt), 'dd MMM • HH:mm', { locale: idLocale })}
                        </span>
                      </div>

                      <span
                        className={`ops-status-label font-mono ${
                          isCompleted
                            ? 'ops-status-done'
                            : isCancelled
                            ? 'ops-status-batal'
                            : 'ops-status-sched'
                        }`}
                      >
                        {isCompleted ? '✓ SELESAI' : isCancelled ? '✕ BATAL' : '→ TERJADWAL'}
                      </span>
                    </div>

                    <div className="ops-card-line2">
                      <span className="ops-program-pill font-mono">
                        {log.programType || 'Total Body'}
                      </span>

                      {log.location && (
                        <>
                          <span className="ops-sep-bullet">•</span>
                          <span className="ops-loc-text">
                            <MapPin size={10} className="ops-inline-icon" />
                            {log.location}
                          </span>
                        </>
                      )}

                      {log.rpe && (
                        <>
                          <span className="ops-sep-bullet">•</span>
                          <span className="ops-rpe-badge font-mono">RPE: {log.rpe}</span>
                        </>
                      )}

                      {log.duration && (
                        <>
                          <span className="ops-sep-bullet">•</span>
                          <span className="ops-dur-text font-mono">{log.duration} Menit</span>
                        </>
                      )}
                    </div>
                  </div>

                  {idx < paginatedLogs.length - 1 && <div className="ops-dashed-divider" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > PAGE_SIZE && (
          <div className="ops-pagination-row font-mono">
            <div className="ops-page-summary">
              Halaman <strong>{safeCurrentPage}</strong> / <strong>{totalPages}</strong>
            </div>

            <div className="ops-page-btn-group">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="ops-page-btn"
                title="Halaman Pertama"
              >
                <ChevronsLeft size={12} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="ops-page-btn"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={12} />
                <span className="ops-page-btn-txt">PREV</span>
              </button>

              <div className="ops-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - safeCurrentPage) <= 1
                    )
                  })
                  .map((p, idx, arr) => {
                    const prevPage = arr[idx - 1]
                    const showEllipsis = prevPage && p - prevPage > 1

                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis && <span className="ops-page-ellipsis">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`ops-page-num-btn ${
                            p === safeCurrentPage ? 'active' : ''
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    )
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="ops-page-btn"
                title="Halaman Berikutnya"
              >
                <span className="ops-page-btn-txt">NEXT</span>
                <ChevronRight size={12} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="ops-page-btn"
                title="Halaman Terakhir"
              >
                <ChevronsRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── STYLES ───────────────────────────────────────────────────────── */}
      <style jsx>{`
        .speed-ops-root {
          max-width: 980px;
          margin: 0 auto;
          padding-bottom: 72px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-family: inherit;
        }

        /* ─── 1. UNIFIED COMPACT HEADER ROW ────────────────────────────── */
        .ops-compact-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 2px 2px;
          flex-wrap: wrap;
        }

        .ops-compact-title {
          font-size: 18px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.2;
        }

        :global([data-theme="light"]) .ops-compact-title {
          color: #0f172a;
        }

        .ops-header-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }

        .ops-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          font-weight: 800;
          color: #34d399;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 1px 6px;
          border-radius: 4px;
          height: 20px;
          box-sizing: border-box;
          line-height: 1;
        }

        .ops-pulse-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: pulseDot 1.5s infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .ops-trend-badge {
          display: inline-flex;
          align-items: center;
          font-size: 9.5px;
          font-weight: 800;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          padding: 1px 6px;
          border-radius: 4px;
          height: 20px;
          box-sizing: border-box;
          line-height: 1;
        }

        /* Mini Green CSV Button (Same size as badges, glows on hover & click) */
        .ops-csv-mini-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 1px 6px;
          height: 20px;
          box-sizing: border-box;
          line-height: 1;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 4px;
          color: #34d399;
          font-size: 9.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }

        .ops-csv-mini-btn:hover {
          background: rgba(16, 185, 129, 0.25);
          border-color: #34d399;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.65), 0 0 4px #34d399;
          transform: translateY(-1px);
        }

        .ops-csv-mini-btn:active {
          transform: scale(0.96);
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.9), inset 0 0 6px rgba(52, 211, 153, 0.4);
        }

        :global([data-theme="light"]) .ops-csv-mini-btn {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.35);
          color: #047857;
        }

        :global([data-theme="light"]) .ops-csv-mini-btn:hover {
          background: #10b981;
          border-color: #059669;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }

        /* ─── 2. ULTRA-SLIM 4-METRIC STRIP ─────────────────────────────── */
        .ops-compact-metric-strip {
          background: #080c14;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        :global([data-theme="light"]) .ops-compact-metric-strip {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .ops-mini-metric-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 2px 6px;
          flex: 1;
        }

        .ops-mini-metric-icon {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ops-mini-metric-info {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }

        .ops-mini-num {
          font-size: 17px;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .ops-mini-lbl {
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          white-space: nowrap;
        }

        .ops-metric-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.07);
          flex-shrink: 0;
        }

        :global([data-theme="light"]) .ops-metric-divider {
          background: #e2e8f0;
        }

        /* ─── 3. ULTRA-COMPACT MINI FILTER BAR ─────────────────────────── */
        .ops-mini-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #080c14;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 9px;
          padding: 5px 7px;
          flex-wrap: wrap;
        }

        :global([data-theme="light"]) .ops-mini-toolbar {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .ops-mini-search {
          flex: 1;
          min-width: 160px;
          position: relative;
          display: flex;
          align-items: center;
        }

        :global(.ops-mini-search-icon) {
          position: absolute;
          left: 8px;
          color: #64748b;
          pointer-events: none;
        }

        .ops-mini-search-input {
          width: 100%;
          height: 28px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 0 24px 0 26px;
          color: #f1f5f9;
          font-size: 11px;
          font-family: inherit;
          outline: none;
          transition: all 0.15s ease;
        }

        :global([data-theme="light"]) .ops-mini-search-input {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .ops-mini-search-input:focus {
          border-color: #818cf8;
        }

        .ops-mini-clear-btn {
          position: absolute;
          right: 6px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .ops-mini-pills-row {
          display: flex;
          align-items: center;
          gap: 5px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .ops-mini-pills-row::-webkit-scrollbar {
          display: none;
        }

        .ops-mini-select-wrap {
          flex-shrink: 0;
        }

        .ops-mini-select {
          height: 28px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 0 5px;
          color: #cbd5e1;
          font-size: 10.5px;
          font-weight: 600;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }

        :global([data-theme="light"]) .ops-mini-select {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }

        .ops-mini-select-wrap.active-filter .ops-mini-select {
          border-color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
        }

        .ops-mini-select option {
          background: #080c14;
          color: #f1f5f9;
        }

        :global([data-theme="light"]) .ops-mini-select option {
          background: #ffffff;
          color: #0f172a;
        }

        .ops-mini-reset-btn {
          height: 28px;
          padding: 0 7px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          color: #f87171;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* ─── 4. SPEED-OPS FEED PANEL ──────────────────────────────────── */
        .ops-feed-panel {
          background: #080c14;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 14px;
        }

        :global([data-theme="light"]) .ops-feed-panel {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .ops-feed-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 7px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        :global([data-theme="light"]) .ops-feed-header-row {
          border-bottom-color: #e2e8f0;
        }

        .ops-feed-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .ops-feed-main-tag {
          font-size: 12px;
          font-weight: 900;
          color: #f8fafc;
          letter-spacing: 0.06em;
          flex-shrink: 0;
        }

        :global([data-theme="light"]) .ops-feed-main-tag {
          color: #0f172a;
        }

        .ops-feed-divider-line {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          flex: 1;
          margin-right: 6px;
        }

        :global([data-theme="light"]) .ops-feed-divider-line {
          background: #e2e8f0;
        }

        .ops-feed-stats {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .ops-feed-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 8.5px;
          font-weight: 800;
          color: #34d399;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 1px 5px;
          border-radius: 4px;
        }

        .ops-pulse-mini {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #10b981;
          animation: pulseDot 1.5s infinite;
        }

        .ops-feed-records {
          font-size: 10.5px;
          color: #cbd5e1;
        }

        :global([data-theme="light"]) .ops-feed-records {
          color: #334155;
        }

        .ops-range-info {
          font-size: 10px;
          color: #94a3b8;
          padding: 5px 0 2px 0;
        }

        .ops-range-info strong {
          color: #f1f5f9;
        }

        :global([data-theme="light"]) .ops-range-info strong {
          color: #0f172a;
        }

        /* ─── FEED STREAM CARDS ────────────────────────────────────────── */
        .ops-feed-stream {
          display: flex;
          flex-direction: column;
        }

        .ops-feed-card {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 9px 0;
        }

        .ops-card-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
        }

        .ops-dot-emerald {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.7);
        }

        .ops-dot-red {
          background: #ef4444;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
        }

        .ops-dot-indigo {
          background: #818cf8;
          box-shadow: 0 0 6px rgba(129, 140, 248, 0.6);
        }

        .ops-card-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ops-card-line1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .ops-card-left-info {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          flex-wrap: wrap;
        }

        .ops-client-name {
          font-size: 13.5px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        :global([data-theme="light"]) .ops-client-name {
          color: #0f172a;
        }

        .ops-session-time {
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
        }

        .ops-status-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .ops-status-done {
          color: #34d399;
        }

        .ops-status-batal {
          color: #f87171;
        }

        .ops-status-sched {
          color: #818cf8;
        }

        .ops-card-line2 {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          flex-wrap: wrap;
        }

        .ops-program-pill {
          font-size: 9.5px;
          font-weight: 800;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1px 5px;
          border-radius: 4px;
        }

        :global([data-theme="light"]) .ops-program-pill {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #334155;
        }

        .ops-sep-bullet {
          color: #334155;
          font-size: 8px;
        }

        .ops-loc-text {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #94a3b8;
        }

        :global(.ops-inline-icon) {
          color: #64748b;
        }

        .ops-rpe-badge {
          color: #818cf8;
          font-weight: 800;
          font-size: 10px;
        }

        .ops-dur-text {
          color: #64748b;
          font-size: 10.5px;
        }

        .ops-dashed-divider {
          position: absolute;
          bottom: 0;
          left: 16px;
          right: 0;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
        }

        :global([data-theme="light"]) .ops-dashed-divider {
          border-bottom-color: #e2e8f0;
        }

        .ops-empty-state {
          text-align: center;
          padding: 28px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ops-reset-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          padding: 4px 8px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #818cf8;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        /* ─── 5. PAGINATION CONTROLS ───────────────────────────────────── */
        .ops-pagination-row {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        :global([data-theme="light"]) .ops-pagination-row {
          border-top-color: #e2e8f0;
        }

        .ops-page-summary {
          font-size: 10.5px;
          color: #64748b;
        }

        .ops-page-summary strong {
          color: #cbd5e1;
        }

        :global([data-theme="light"]) .ops-page-summary strong {
          color: #0f172a;
        }

        .ops-page-btn-group {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .ops-page-btn {
          height: 26px;
          padding: 0 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 5px;
          color: #cbd5e1;
          font-size: 10px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        :global([data-theme="light"]) .ops-page-btn {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
        }

        .ops-page-btn:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.4);
          color: #ffffff;
        }

        .ops-page-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .ops-page-numbers {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .ops-page-num-btn {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 5px;
          color: #94a3b8;
          font-size: 10.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        :global([data-theme="light"]) .ops-page-num-btn {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #64748b;
        }

        .ops-page-num-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .ops-page-num-btn.active {
          background: #6366f1;
          border-color: #6366f1;
          color: #ffffff;
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
        }

        .ops-page-ellipsis {
          padding: 0 2px;
          color: #64748b;
          font-size: 10px;
        }

        /* ─── RESPONSIVE DESIGN FOR HP/MOBILE ─────────────────────────── */
        @media (max-width: 640px) {
          .ops-compact-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .ops-compact-title {
            font-size: 17px;
          }
          .ops-compact-metric-strip {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          .ops-metric-divider {
            display: none;
          }
          .ops-mini-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 5px;
          }
          .ops-mini-search {
            width: 100%;
            min-width: 100%;
          }
          .ops-mini-pills-row {
            width: 100%;
            padding-bottom: 2px;
          }
          .ops-card-line1 {
            flex-wrap: wrap;
            gap: 3px;
          }
          .ops-client-name {
            font-size: 13px;
          }
          .ops-status-label {
            font-size: 9.5px;
          }
          .ops-page-btn-txt {
            display: none;
          }
          .ops-pagination-row {
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  )
}
