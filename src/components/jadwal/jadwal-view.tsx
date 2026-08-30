'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isWithinInterval,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CalendarCheck,
  MapPin,
  Flame,
  Dumbbell,
  X,
  ClipboardList,
  Trash2,
  Zap,
  Calendar,
  Clock,
  User,
  SlidersHorizontal,
} from 'lucide-react'
import { listSessions, updateSessionStatus, deleteSession, scheduleSession } from '@/lib/actions/session'
import { listPackages } from '@/lib/actions/package'
import { useAuthStore } from '@/store/auth-store'
import { useLayoutStore } from '@/store/layout-store'
import { WorkoutBuilder } from '@/components/sessions/workout-builder'
import { CustomModal, ModalType } from '@/components/ui/custom-modal'
import { WhatsAppModal } from '@/components/crm/whatsapp-modal'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import './jadwal.css'

interface JadwalViewProps {
  initialOpenNew?: boolean
  defaultPackageId?: string
  defaultClientId?: string
}

export function JadwalView({ initialOpenNew, defaultPackageId, defaultClientId }: JadwalViewProps = {}) {
  const { role, user } = useAuthStore()
  const { isSessionModalOpen, closeSessionModal, openSessionModal } = useLayoutStore()
  const isClient = role === 'client'

  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [packagesData, setPackagesData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Current Date & View Mode ('day' | 'week')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [scheduleViewMode, setScheduleViewMode] = useState<'day' | 'week'>('week')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')

  // Search Query & Toggle
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Modals
  const [selectedDetailSession, setSelectedDetailSession] = useState<any | null>(null)
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(Boolean(initialOpenNew))
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedWASession, setSelectedWASession] = useState<any | null>(null)

  const isFormModalOpen = isAddSessionModalOpen || isSessionModalOpen
  const closeFormModal = () => {
    setIsAddSessionModalOpen(false)
    closeSessionModal()
  }

  // Add Session Form State
  const [newSessionPkgId, setNewSessionPkgId] = useState(defaultPackageId || '')
  const [newSessionStatus, setNewSessionStatus] = useState<'scheduled' | 'completed'>('scheduled')
  const [newSessionProgram, setNewSessionProgram] = useState('Total Body')
  const [newSessionDate, setNewSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newSessionTime, setNewSessionTime] = useState('09:00')
  const [newSessionLocation, setNewSessionLocation] = useState('')
  const [newSessionRpe, setNewSessionRpe] = useState('8')
  const [newSessionNotes, setNewSessionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Quick Locations
  const recentLocations = ['Essence', 'Hang Lekir', '1 Park', 'FTL Pasar Minggu', 'Studio Fit']

  useEffect(() => {
    if (initialOpenNew) {
      setIsAddSessionModalOpen(true)
    }
  }, [initialOpenNew])

  useEffect(() => {
    if (defaultPackageId) {
      setNewSessionPkgId(defaultPackageId)
    } else if (defaultClientId && packagesData.length > 0) {
      const match = packagesData.find((p) => p.clientId === defaultClientId)
      if (match) setNewSessionPkgId(match.id)
    }
  }, [defaultPackageId, defaultClientId, packagesData])

  // Toast / Alert State
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

  const showAlert = (message: string, type: ModalType = 'info', title?: string) => {
    setModalConfig({ isOpen: true, type, title, message })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load Sessions & Packages
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [sessionsRes, pkgsRes] = await Promise.all([
        listSessions(),
        listPackages(),
      ])
      setData(sessionsRes || [])
      setPackagesData(pkgsRes || [])
    } catch (err) {
      console.error('Error loading jadwal data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Current Week Range
  const currentWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const currentWeekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])

  const weekRangeFormatted = useMemo(() => {
    const startStr = format(currentWeekStart, 'd', { locale: idLocale })
    const endStr = format(currentWeekEnd, 'd MMMM yyyy', { locale: idLocale })
    return `${startStr}–${endStr}`
  }, [currentWeekStart, currentWeekEnd])

  // 7 Days for Mini Week Overview Strip
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }, [currentWeekStart])

  // Week Sessions for Metrics
  const weekSessions = useMemo(() => {
    return data.filter((item) => {
      if (!item.scheduledAt) return false
      const sessionDate = new Date(item.scheduledAt)
      return isWithinInterval(sessionDate, { start: currentWeekStart, end: currentWeekEnd })
    })
  }, [data, currentWeekStart, currentWeekEnd])

  // 4 Core Metrics
  const metrics = useMemo(() => {
    const total = weekSessions.length
    let booked = 0
    let completed = 0
    let cancelled = 0
    let noShow = 0

    weekSessions.forEach((s) => {
      const st = s.status || 'scheduled'
      if (st === 'completed') completed++
      else if (st === 'cancelled') cancelled++
      else if (st === 'no_show' || st === 'noshow') noShow++
      else booked++
    })

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, booked, completed, cancelled, noShow, completionRate }
  }, [weekSessions])

  // Filtered Sessions for the View
  const filteredSessions = useMemo(() => {
    let result = data

    // Time / Mode filter
    if (scheduleViewMode === 'day') {
      result = result.filter((item) => isSameDay(new Date(item.scheduledAt), currentDate))
    } else {
      result = result.filter((item) => {
        if (!item.scheduledAt) return false
        const sDate = new Date(item.scheduledAt)
        return isWithinInterval(sDate, { start: currentWeekStart, end: currentWeekEnd })
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'scheduled') {
        result = result.filter((item) => (item.status || 'scheduled') === 'scheduled')
      } else if (statusFilter === 'completed') {
        result = result.filter((item) => item.status === 'completed')
      } else if (statusFilter === 'cancelled') {
        result = result.filter((item) => item.status === 'cancelled' || item.status === 'no_show' || item.status === 'noshow')
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (item) =>
          (item.clientName && item.clientName.toLowerCase().includes(q)) ||
          (item.programType && item.programType.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q))
      )
    }

    return result.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [data, scheduleViewMode, currentDate, currentWeekStart, currentWeekEnd, statusFilter, searchQuery])

  // Week Groups
  const weekGroups = useMemo(() => {
    return weekDays.map((day) => {
      const daySessions = filteredSessions.filter((s) => isSameDay(new Date(s.scheduledAt), day))
      return {
        date: day,
        dayName: format(day, 'EEEE', { locale: idLocale }),
        dateStr: format(day, 'd MMM yyyy', { locale: idLocale }),
        sessions: daySessions,
      }
    })
  }, [weekDays, filteredSessions])

  // Helper to get sessions map for Mini Week Overview dots
  const daySessionsMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number; scheduled: number; cancelled: number }> = {}
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd')
      const dayList = data.filter((s) => s.scheduledAt && isSameDay(new Date(s.scheduledAt), day))
      let completed = 0
      let scheduled = 0
      let cancelled = 0
      dayList.forEach((s) => {
        const st = s.status || 'scheduled'
        if (st === 'completed') completed++
        else if (st === 'cancelled' || st === 'no_show') cancelled++
        else scheduled++
      })
      map[key] = { total: dayList.length, completed, scheduled, cancelled }
    })
    return map
  }, [weekDays, data])

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="jd-badge jd-badge-completed">
            <CheckCircle2 size={11} strokeWidth={2.5} />
            Completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="jd-badge jd-badge-cancelled">
            <XCircle size={11} strokeWidth={2.5} />
            Cancelled
          </span>
        )
      case 'no_show':
      case 'noshow':
        return (
          <span className="jd-badge jd-badge-noshow">
            <AlertTriangle size={11} strokeWidth={2.5} />
            No Show
          </span>
        )
      default:
        return (
          <span className="jd-badge jd-badge-scheduled">
            <CalendarCheck size={11} strokeWidth={2.5} />
            Scheduled
          </span>
        )
    }
  }

  // Update Status
  const handleUpdateStatus = async (
    sessionId: string,
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  ) => {
    if (isClient) return
    setProcessingId(sessionId)
    try {
      const res = await updateSessionStatus(sessionId, newStatus)
      if (res.success) {
        await loadData()
        if (selectedDetailSession && selectedDetailSession.id === sessionId) {
          setSelectedDetailSession({ ...selectedDetailSession, status: newStatus })
        }
        const label =
          newStatus === 'completed'
            ? 'Selesai'
            : newStatus === 'cancelled'
            ? 'Dibatalkan'
            : newStatus === 'no_show'
            ? 'No-Show'
            : 'Scheduled'
        showAlert(`Status sesi berhasil diperbarui ke '${label}'!`, 'success', 'Status Diperbarui')
      } else {
        showAlert(res.error || 'Gagal memperbarui status', 'error')
      }
    } catch (err: any) {
      showAlert(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // Delete Session
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId || isClient) return
    setProcessingId(deleteConfirmId)
    try {
      const res = await deleteSession(deleteConfirmId)
      if (res.success) {
        await loadData()
        setSelectedDetailSession(null)
        setDeleteConfirmId(null)
        showAlert('Sesi latihan berhasil dihapus!', 'success', 'Sesi Dihapus')
      } else {
        showAlert(res.error || 'Gagal menghapus sesi', 'error')
      }
    } catch (err: any) {
      showAlert(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // Create Session (Unified Schedule & Check-In)
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isClient || !newSessionPkgId) return

    setIsSubmitting(true)
    try {
      const scheduledAtStr = `${newSessionDate}T${newSessionTime}:00`
      const res = await scheduleSession({
        packageId: newSessionPkgId,
        scheduledAt: scheduledAtStr,
        status: newSessionStatus,
        programType: newSessionProgram,
        rpe: Number(newSessionRpe),
        location: newSessionLocation,
        sessionNotes: newSessionNotes,
        ptNotes: newSessionNotes,
      })

      if (res.success) {
        await loadData()
        closeFormModal()
        setNewSessionNotes('')
        setNewSessionLocation('')
        showAlert(
          newSessionStatus === 'completed'
            ? 'Sesi latihan berhasil di-Check-In dan kuota telah tercatat!'
            : 'Sesi latihan baru berhasil dijadwalkan!',
          'success',
          newSessionStatus === 'completed' ? 'Check-In Berhasil' : 'Jadwal Dibuat'
        )
      } else {
        showAlert(res.error || 'Gagal menyimpan sesi latihan', 'error')
      }
    } catch (err: any) {
      showAlert(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Active packages with quota
  const activePackages = useMemo(() => {
    return packagesData.filter((pkg) => {
      const remaining = (pkg.totalSessions || 0) - (pkg.usedSessions || 0)
      return remaining > 0 && pkg.status !== 'expired' && pkg.status !== 'inactive'
    })
  }, [packagesData])

  return (
    <div className="jd-container animate-fade-in">
      {/* ─── 1. TOP PERFORMANCE SUMMARY STRIP (Konsep 2 + 3) ─── */}
      <div className="jd-hero">
        <div className="jd-metrics-strip">
          <button
            type="button"
            className={`jd-metric-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            title="Semua Sesi Minggu Ini"
          >
            <span className="jd-pill-dot dot-all" />
            <span className="jd-pill-val font-mono">{metrics.total}</span>
            <span className="jd-pill-label">Total Sesi</span>
          </button>

          <button
            type="button"
            className={`jd-metric-pill ${statusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'scheduled' ? 'all' : 'scheduled')}
            title="Filter Sesi Booked / Terjadwal"
          >
            <span className="jd-pill-dot dot-sky" />
            <span className="jd-pill-val font-mono text-sky">{metrics.booked}</span>
            <span className="jd-pill-label">Booked</span>
          </button>

          <button
            type="button"
            className={`jd-metric-pill ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
            title="Filter Sesi Completed / Selesai"
          >
            <span className="jd-pill-dot dot-emerald" />
            <span className="jd-pill-val font-mono text-emerald">{metrics.completed}</span>
            <span className="jd-pill-label">Completed</span>
          </button>

          <button
            type="button"
            className={`jd-metric-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
            title="Filter Sesi Cancel / No-Show"
          >
            <span className="jd-pill-dot dot-rose" />
            <span className="jd-pill-val font-mono text-rose">{metrics.cancelled + metrics.noShow}</span>
            <span className="jd-pill-label">Cancel / NoShow</span>
          </button>
        </div>

        {/* Completion Progress Bar */}
        <div className="jd-progress-wrap">
          <div className="jd-progress-info">
            <span>
              Performa Minggu Ini: <strong>{metrics.completed}</strong> dari <strong>{metrics.total}</strong> sesi selesai
            </span>
            <span className="jd-progress-pct font-mono">{metrics.completionRate}%</span>
          </div>
          <div className="jd-progress-bar">
            <div
              className="jd-progress-fill"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── 2. MINI WEEK OVERVIEW & NAVIGATION BAR (Konsep 2) ─── */}
      <div className="jd-week-overview-card">
        {/* Navigation & Controls Row */}
        <div className="jd-nav-bar">
          <div className="jd-date-control">
            <button
              type="button"
              className="jd-date-btn"
              onClick={() => {
                if (scheduleViewMode === 'day') {
                  setCurrentDate((prev) => subDays(prev, 1))
                } else {
                  setCurrentDate((prev) => subWeeks(prev, 1))
                }
              }}
              title="Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="jd-today-pill"
              onClick={() => setCurrentDate(new Date())}
            >
              {scheduleViewMode === 'day' ? 'Hari Ini' : 'Minggu Ini'}
            </button>

            <span className="jd-date-text">
              {scheduleViewMode === 'day'
                ? format(currentDate, 'dd MMM yyyy', { locale: idLocale })
                : weekRangeFormatted}
            </span>

            <button
              type="button"
              className="jd-date-btn"
              onClick={() => {
                if (scheduleViewMode === 'day') {
                  setCurrentDate((prev) => addDays(prev, 1))
                } else {
                  setCurrentDate((prev) => addWeeks(prev, 1))
                }
              }}
              title="Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View Switcher (Hari vs Minggu) */}
          <div className="jd-view-switch">
            <button
              type="button"
              className={`jd-view-btn ${scheduleViewMode === 'day' ? 'active' : ''}`}
              onClick={() => setScheduleViewMode('day')}
            >
              Hari
            </button>
            <button
              type="button"
              className={`jd-view-btn ${scheduleViewMode === 'week' ? 'active' : ''}`}
              onClick={() => setScheduleViewMode('week')}
            >
              Minggu
            </button>
          </div>

          {/* Search Trigger Button */}
          <button
            type="button"
            className={`jd-icon-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Cari Sesi / Klien"
          >
            <Search size={15} />
          </button>
        </div>

        {/* ─── MINI WEEK 7-DAY STRIP (Interactive Day Columns with Session Dots) ─── */}
        <div className="jd-mini-week-strip">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date())
            const isSelected = isSameDay(day, currentDate)
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayStats = daySessionsMap[dayKey] || { total: 0, completed: 0, scheduled: 0, cancelled: 0 }
            const dayNameShort = format(day, 'EEE', { locale: idLocale }).toUpperCase()
            const dayNum = format(day, 'd')

            return (
              <button
                key={dayKey}
                type="button"
                className={`jd-mini-day-col ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => {
                  setCurrentDate(day)
                  setScheduleViewMode('day')
                }}
                title={`${format(day, 'EEEE, d MMMM yyyy', { locale: idLocale })} - ${dayStats.total} Sesi`}
              >
                <span className="jd-mini-day-name">{dayNameShort}</span>
                <span className="jd-mini-day-num font-mono">{dayNum}</span>

                {/* Session Dots Indicator */}
                <div className="jd-mini-dots-row">
                  {dayStats.total === 0 ? (
                    <span className="jd-mini-dot dot-empty" />
                  ) : (
                    <>
                      {Array.from({ length: Math.min(dayStats.completed, 3) }).map((_, i) => (
                        <span key={`c-${i}`} className="jd-mini-dot dot-emerald" />
                      ))}
                      {Array.from({ length: Math.min(dayStats.scheduled, 3) }).map((_, i) => (
                        <span key={`s-${i}`} className="jd-mini-dot dot-sky" />
                      ))}
                      {Array.from({ length: Math.min(dayStats.cancelled, 2) }).map((_, i) => (
                        <span key={`x-${i}`} className="jd-mini-dot dot-rose" />
                      ))}
                    </>
                  )}
                </div>

                {isToday && <span className="jd-mini-today-badge">TODAY</span>}
              </button>
            )
          })}
        </div>

        {/* Inline Search Bar */}
        {isSearchOpen && (
          <div className="jd-search-expand animate-slide-down">
            <Search size={14} className="text-indigo-400" />
            <input
              type="text"
              autoFocus
              placeholder="Cari nama klien, program latihan, lokasi gym..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="jd-search-input-field"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="jd-search-clear-btn"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── 3. COMPACT LOG TIMELINE (Konsep 3) ─── */}
      {isLoading ? (
        <div className="pt-skeleton-timeline">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="pt-sk-card" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="jd-empty-card animate-fade-in">
          <div style={{ fontSize: 32 }}>📅</div>
          <h3 className="jd-empty-title">Belum Ada Sesi Latihan</h3>
          <p className="jd-empty-desc">
            {searchQuery
              ? 'Tidak ada sesi latihan yang cocok dengan pencarian Anda.'
              : scheduleViewMode === 'day'
              ? 'Tidak ada jadwal latihan untuk tanggal ini.'
              : 'Tidak ada jadwal latihan untuk minggu ini.'}
          </p>
          {!isClient && (
            <button
              type="button"
              onClick={() => {
                setNewSessionDate(format(currentDate, 'yyyy-MM-dd'))
                openSessionModal()
              }}
              className="jd-empty-schedule-btn"
            >
              <CalendarCheck size={16} strokeWidth={2.5} />
              <span>Jadwalkan / Check-In Sesi</span>
            </button>
          )}
        </div>
      ) : scheduleViewMode === 'day' ? (
        // ─── A. DAY VIEW TIMELINE ───
        <div className="jd-timeline-list">
          {filteredSessions.map((s, idx) => {
            const sDate = s.scheduledAt ? new Date(s.scheduledAt) : new Date()
            const timeStr = format(sDate, 'HH:mm')
            const isCompleted = s.status === 'completed'
            const isCancelled = s.status === 'cancelled'
            const isNoShow = s.status === 'no_show' || s.status === 'noshow'
            const isScheduled = !isCompleted && !isCancelled && !isNoShow

            return (
              <div
                key={s.id}
                onClick={() => setSelectedDetailSession(s)}
                className={`jd-compact-row animate-slide-up ${isScheduled ? 'row-scheduled' : isCompleted ? 'row-completed' : 'row-cancelled'}`}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                {/* Time Column with Status Dot */}
                <div className="jd-time-column">
                  <span className="jd-time-label font-mono">{timeStr}</span>
                  <span
                    className={`jd-time-dot ${
                      isCompleted ? 'dot-emerald' : isCancelled ? 'dot-rose' : isNoShow ? 'dot-amber' : 'dot-sky pulse'
                    }`}
                  />
                </div>

                {/* Main Session Content */}
                <div className="jd-compact-body">
                  <div className="jd-compact-top">
                    <span className="jd-client-name">{s.clientName || 'Klien'}</span>
                    <div className="jd-status-badge-wrap">
                      {renderStatusBadge(s.status)}
                    </div>
                  </div>

                  <div className="jd-compact-details">
                    <span className="jd-tag jd-tag-prog">🏋️ {s.programType || 'Total Body'}</span>
                    {s.location && (
                      <span className="jd-tag jd-tag-loc">
                        <MapPin size={10} /> {s.location}
                      </span>
                    )}
                    {s.rpe != null && (
                      <span className="jd-tag jd-tag-rpe font-mono">
                        <Flame size={10} /> RPE {s.rpe}
                      </span>
                    )}
                    {s.sessionNotes && (
                      <span className="jd-tag jd-tag-notes">
                        📝 {s.sessionNotes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Quick Action Buttons (Konsep 3) */}
                <div className="jd-inline-actions" onClick={(e) => e.stopPropagation()}>
                  {isScheduled && !isClient && (
                    <>
                      <button
                        type="button"
                        className="jd-act-btn jd-act-checkin"
                        onClick={() => handleUpdateStatus(s.id, 'completed')}
                        disabled={processingId === s.id}
                        title="Check-In Sesi Sekarang"
                      >
                        <Zap size={12} strokeWidth={2.5} />
                        <span>Check In</span>
                      </button>

                      <button
                        type="button"
                        className="jd-act-btn jd-act-cancel"
                        onClick={() => handleUpdateStatus(s.id, 'cancelled')}
                        disabled={processingId === s.id}
                        title="Batalkan Sesi"
                      >
                        <X size={12} />
                      </button>
                    </>
                  )}

                  {s.clientPhone && (
                    <button
                      type="button"
                      className="jd-act-btn jd-act-wa"
                      onClick={() => setSelectedWASession(s)}
                      title={`WhatsApp ke ${s.clientName}`}
                    >
                      <WhatsAppIcon size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // ─── B. WEEK VIEW GROUPED BY DAYS (Konsep 3 Compact Log) ───
        <div className="jd-week-groups-wrap">
          {weekGroups.map((group) => {
            const isToday = isSameDay(group.date, new Date())
            if (group.sessions.length === 0) return null

            return (
              <div key={group.date.toISOString()} className={`jd-week-group animate-slide-up ${isToday ? 'group-today' : ''}`}>
                <div className="jd-week-group-header">
                  <div className="jd-group-title-row">
                    <span className="jd-group-title font-mono">
                      {group.dayName}, {group.dateStr}
                    </span>
                    {isToday && <span className="jd-today-badge">HARI INI</span>}
                  </div>
                  <span className="jd-group-count font-mono">{group.sessions.length} Sesi</span>
                </div>

                <div className="jd-timeline-list">
                  {group.sessions.map((s) => {
                    const sDate = s.scheduledAt ? new Date(s.scheduledAt) : new Date()
                    const timeStr = format(sDate, 'HH:mm')
                    const isCompleted = s.status === 'completed'
                    const isCancelled = s.status === 'cancelled'
                    const isNoShow = s.status === 'no_show' || s.status === 'noshow'
                    const isScheduled = !isCompleted && !isCancelled && !isNoShow

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedDetailSession(s)}
                        className={`jd-compact-row ${isScheduled ? 'row-scheduled' : isCompleted ? 'row-completed' : 'row-cancelled'}`}
                      >
                        {/* Time Column with Status Dot */}
                        <div className="jd-time-column">
                          <span className="jd-time-label font-mono">{timeStr}</span>
                          <span
                            className={`jd-time-dot ${
                              isCompleted ? 'dot-emerald' : isCancelled ? 'dot-rose' : isNoShow ? 'dot-amber' : 'dot-sky pulse'
                            }`}
                          />
                        </div>

                        {/* Main Session Content */}
                        <div className="jd-compact-body">
                          <div className="jd-compact-top">
                            <span className="jd-client-name">{s.clientName || 'Klien'}</span>
                            <div className="jd-status-badge-wrap">
                              {renderStatusBadge(s.status)}
                            </div>
                          </div>

                          <div className="jd-compact-details">
                            <span className="jd-tag jd-tag-prog">🏋️ {s.programType || 'Total Body'}</span>
                            {s.location && (
                              <span className="jd-tag jd-tag-loc">
                                <MapPin size={10} /> {s.location}
                              </span>
                            )}
                            {s.rpe != null && (
                              <span className="jd-tag jd-tag-rpe font-mono">
                                <Flame size={10} /> RPE {s.rpe}
                              </span>
                            )}
                            {s.sessionNotes && (
                              <span className="jd-tag jd-tag-notes">
                                📝 {s.sessionNotes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Quick Action Buttons (Konsep 3) */}
                        <div className="jd-inline-actions" onClick={(e) => e.stopPropagation()}>
                          {isScheduled && !isClient && (
                            <>
                              <button
                                type="button"
                                className="jd-act-btn jd-act-checkin"
                                onClick={() => handleUpdateStatus(s.id, 'completed')}
                                disabled={processingId === s.id}
                                title="Check-In Sesi Sekarang"
                              >
                                <Zap size={12} strokeWidth={2.5} />
                                <span>Check In</span>
                              </button>

                              <button
                                type="button"
                                className="jd-act-btn jd-act-cancel"
                                onClick={() => handleUpdateStatus(s.id, 'cancelled')}
                                disabled={processingId === s.id}
                                title="Batalkan Sesi"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}

                          {s.clientPhone && (
                            <button
                              type="button"
                              className="jd-act-btn jd-act-wa"
                              onClick={() => setSelectedWASession(s)}
                              title={`WhatsApp ke ${s.clientName}`}
                            >
                              <WhatsAppIcon size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── 4. SESSION DETAIL & WORKOUT BUILDER MODAL ─── */}
      {selectedDetailSession && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setSelectedDetailSession(null)}
        >
          <div
            className="modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h3 className="mc-title">Detail Sesi Latihan</h3>
                  <p className="mc-sub">
                    {selectedDetailSession.clientName} • {format(new Date(selectedDetailSession.scheduledAt), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailSession(null)}
                className="mc-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mc-modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
              {/* Status Selector */}
              {!isClient && (
                <div className="jd-modal-section">
                  <label className="jd-modal-label">Status Sesi</label>
                  <div className="jd-status-select-grid">
                    <button
                      type="button"
                      className={`jd-status-opt ${selectedDetailSession.status === 'scheduled' ? 'active-scheduled' : ''}`}
                      onClick={() => handleUpdateStatus(selectedDetailSession.id, 'scheduled')}
                    >
                      <CalendarCheck size={14} /> Scheduled
                    </button>
                    <button
                      type="button"
                      className={`jd-status-opt ${selectedDetailSession.status === 'completed' ? 'active-completed' : ''}`}
                      onClick={() => handleUpdateStatus(selectedDetailSession.id, 'completed')}
                    >
                      <CheckCircle2 size={14} /> Completed
                    </button>
                    <button
                      type="button"
                      className={`jd-status-opt ${selectedDetailSession.status === 'cancelled' ? 'active-cancelled' : ''}`}
                      onClick={() => handleUpdateStatus(selectedDetailSession.id, 'cancelled')}
                    >
                      <XCircle size={14} /> Cancelled
                    </button>
                    <button
                      type="button"
                      className={`jd-status-opt ${selectedDetailSession.status === 'no_show' ? 'active-noshow' : ''}`}
                      onClick={() => handleUpdateStatus(selectedDetailSession.id, 'no_show')}
                    >
                      <AlertTriangle size={14} /> No Show
                    </button>
                  </div>
                </div>
              )}

              {/* Info Details */}
              <div className="jd-modal-info-box">
                <div className="jd-info-item">
                  <span className="jd-info-label">Program Latihan:</span>
                  <span className="jd-info-val font-mono">{selectedDetailSession.programType || 'Total Body'}</span>
                </div>
                <div className="jd-info-item">
                  <span className="jd-info-label">Lokasi:</span>
                  <span className="jd-info-val">{selectedDetailSession.location || 'Essence'}</span>
                </div>
                {selectedDetailSession.rpe != null && (
                  <div className="jd-info-item">
                    <span className="jd-info-label">RPE (Intensitas):</span>
                    <span className="jd-info-val font-mono">🔥 RPE {selectedDetailSession.rpe} / 10</span>
                  </div>
                )}
                {selectedDetailSession.sessionNotes && (
                  <div className="jd-info-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="jd-info-label">Catatan Sesi:</span>
                    <p className="jd-info-notes">{selectedDetailSession.sessionNotes}</p>
                  </div>
                )}
              </div>

              {/* Workout Builder */}
              <div style={{ marginTop: 14 }}>
                <WorkoutBuilder
                  sessionId={selectedDetailSession.id}
                  isReadOnly={isClient}
                />
              </div>

              {/* Delete Button */}
              {!isClient && (
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    className="jd-delete-session-btn"
                    onClick={() => setDeleteConfirmId(selectedDetailSession.id)}
                  >
                    <Trash2 size={14} />
                    <span>Hapus Sesi Ini</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. WHATSAPP QUICK ACTION MODAL ─── */}
      {selectedWASession && (
        <WhatsAppModal
          isOpen={Boolean(selectedWASession)}
          onClose={() => setSelectedWASession(null)}
          clientData={{
            id: selectedWASession.clientId,
            fullName: selectedWASession.clientName || 'Client',
            phone: selectedWASession.clientPhone,
            fitnessGoal: selectedWASession.programType,
            remainingSessions: 5,
          }}
          defaultTemplate="schedule"
        />
      )}

      {/* ─── 6. UNIFIED CREATE / CHECK-IN SESSION MODAL ─── */}
      {isFormModalOpen && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={closeFormModal}
        >
          <div
            className="modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge">
                  <CalendarCheck size={18} />
                </div>
                <div>
                  <h3 className="mc-title">
                    {newSessionStatus === 'completed' ? 'Check-In Sesi Latihan' : 'Jadwalkan Sesi Baru'}
                  </h3>
                  <p className="mc-sub">
                    {newSessionStatus === 'completed'
                      ? 'Catat sesi selesai dan potong kuota paket langsung'
                      : 'Atur jadwal latihan mendatang untuk klien'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="mc-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="mc-modal-body">
              {/* Mode Toggle: Jadwalkan vs Check-In */}
              <div className="jd-form-mode-switch">
                <button
                  type="button"
                  className={`jd-mode-pill ${newSessionStatus === 'scheduled' ? 'active-sched' : ''}`}
                  onClick={() => setNewSessionStatus('scheduled')}
                >
                  <CalendarCheck size={13} />
                  <span>Jadwalkan Saja</span>
                </button>
                <button
                  type="button"
                  className={`jd-mode-pill ${newSessionStatus === 'completed' ? 'active-comp' : ''}`}
                  onClick={() => setNewSessionStatus('completed')}
                >
                  <Zap size={13} />
                  <span>Langsung Check-In (Selesai)</span>
                </button>
              </div>

              {/* Package / Client Select */}
              <div className="form-group">
                <label className="form-label">
                  Pilih Klien & Paket Sesi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-input"
                  value={newSessionPkgId}
                  onChange={(e) => setNewSessionPkgId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Klien / Paket Aktif --</option>
                  {activePackages.map((pkg) => {
                    const remaining = (pkg.totalSessions || 0) - (pkg.usedSessions || 0)
                    return (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.clientName || 'Client'} — {pkg.packageName} (Sisa: {remaining} Sesi)
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Tanggal Latihan</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Latihan</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newSessionTime}
                    onChange={(e) => setNewSessionTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Program & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Fokus Program</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Total Body, Chest, Leg..."
                    value={newSessionProgram}
                    onChange={(e) => setNewSessionProgram(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lokasi Latihan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Essence, Hang Lekir..."
                    value={newSessionLocation}
                    onChange={(e) => setNewSessionLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* RPE & Intensity */}
              <div className="form-group">
                <label className="form-label">
                  Target Intensitas (RPE: {newSessionRpe} / 10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newSessionRpe}
                  onChange={(e) => setNewSessionRpe(e.target.value)}
                  className="jd-rpe-slider"
                />
              </div>

              {/* Session Notes */}
              <div className="form-group">
                <label className="form-label">Catatan Latihan / Pesan untuk Klien</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Contoh: Fokus progressive overload leg press hari ini..."
                  value={newSessionNotes}
                  onChange={(e) => setNewSessionNotes(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeFormModal}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !newSessionPkgId}
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : newSessionStatus === 'completed'
                    ? 'Check-In Sekarang ⚡'
                    : 'Simpan Jadwal 📅'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 7. DELETE CONFIRMATION MODAL ─── */}
      {deleteConfirmId && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400, textAlign: 'center' }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
              Hapus Sesi Latihan?
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px 0' }}>
              Apakah Anda yakin ingin menghapus sesi ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={Boolean(processingId)}
              >
                {processingId ? 'Menghapus...' : 'Ya, Hapus Sesi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. CUSTOM ALERT MODAL ─── */}
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
