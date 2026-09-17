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
  Edit3,
} from 'lucide-react'
import { listSessions, updateSessionStatus, deleteSession, scheduleSession, updateSessionData } from '@/lib/actions/session'
import { listPackages } from '@/lib/actions/package'
import { useAuthStore } from '@/store/auth-store'
import { useLayoutStore } from '@/store/layout-store'
import { WorkoutBuilder } from '@/components/sessions/workout-builder'
import { CustomModal, ModalType } from '@/components/ui/custom-modal'
import { WhatsAppModal } from '@/components/crm/whatsapp-modal'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { getCleanNotes } from '@/lib/utils'
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

  // Edit Session Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [openedEditDirectly, setOpenedEditDirectly] = useState(false)
  const [editSessionDate, setEditSessionDate] = useState('')
  const [editSessionTime, setEditSessionTime] = useState('')
  const [editSessionProgram, setEditSessionProgram] = useState('Total Body')
  const [editSessionLocation, setEditSessionLocation] = useState('')
  const [editSessionRpe, setEditSessionRpe] = useState('8')
  const [editSessionNotes, setEditSessionNotes] = useState('')
  const [editSessionStatus, setEditSessionStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'no_show'>('scheduled')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

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

  // Presets for 1-tap quick selection
  const PROGRAM_PRESETS = [
    'Total Body',
    'Chest & Tri',
    'Back & Bi',
    'Legs & Core',
    'Upper Body',
    'Cardio & HIIT',
    'Mobility',
  ]
  const TIME_PRESETS = ['05:30', '06:00', '07:00', '08:00', '08:30', '09:00', '09:30']
  const LOCATION_PRESETS = ['Essence', 'Hang Lekir', '1 Park', 'FTL Pasar Minggu', 'Studio Fit', 'Home Gym']

  // Lock body scroll when any modal is open to ensure 100% viewport stability on Mobile HP
  useEffect(() => {
    const isAnyModalOpen =
      isFormModalOpen ||
      Boolean(selectedDetailSession) ||
      Boolean(deleteConfirmId) ||
      Boolean(selectedWASession) ||
      isEditModalOpen
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFormModalOpen, selectedDetailSession, deleteConfirmId, selectedWASession, isEditModalOpen])

  // Horizontal Day Wheel 7-day strip (3 days before, today, 3 days after)
  const dayWheelDays = useMemo(() => {
    const today = new Date()
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const d = addDays(today, offset)
      const dateStr = format(d, 'yyyy-MM-dd')
      const isToday = offset === 0
      const isYesterday = offset === -1
      const isTomorrow = offset === 1
      const dayName = isToday
        ? 'TODAY'
        : isYesterday
        ? 'KEMARIN'
        : isTomorrow
        ? 'BESOK'
        : format(d, 'EEE', { locale: idLocale }).toUpperCase()
      const dayNum = format(d, 'dd')
      const monthName = format(d, 'MMM', { locale: idLocale }).toUpperCase()
      return {
        date: d,
        dateStr,
        dayName,
        dayNum,
        monthName,
        offset,
        isToday,
        isPast: offset < 0,
        isFuture: offset > 0,
      }
    })
  }, [])

  const setQuickDate = (type: 'today' | 'tomorrow' | 'dayAfter') => {
    const today = new Date()
    if (type === 'today') {
      setNewSessionDate(format(today, 'yyyy-MM-dd'))
    } else if (type === 'tomorrow') {
      setNewSessionDate(format(addDays(today, 1), 'yyyy-MM-dd'))
    } else {
      setNewSessionDate(format(addDays(today, 2), 'yyyy-MM-dd'))
    }
  }

  const isDateToday = useMemo(() => {
    try {
      return isSameDay(new Date(newSessionDate), new Date())
    } catch {
      return false
    }
  }, [newSessionDate])

  const isDateTomorrow = useMemo(() => {
    try {
      return isSameDay(new Date(newSessionDate), addDays(new Date(), 1))
    } catch {
      return false
    }
  }, [newSessionDate])

  const isDateDayAfter = useMemo(() => {
    try {
      return isSameDay(new Date(newSessionDate), addDays(new Date(), 2))
    } catch {
      return false
    }
  }, [newSessionDate])

  const getRpeDetails = (score: number) => {
    if (score <= 4) {
      return {
        label: 'Ringan',
        desc: 'Warmup / Recovery',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.18)',
        border: 'rgba(16, 185, 129, 0.35)',
      }
    }
    if (score <= 7) {
      return {
        label: 'Sedang',
        desc: 'Hypertrophy / Moderate',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.18)',
        border: 'rgba(56, 189, 248, 0.35)',
      }
    }
    if (score <= 9) {
      return {
        label: 'Berat',
        desc: 'High Intensity / Near Limit',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.18)',
        border: 'rgba(245, 158, 11, 0.35)',
      }
    }
    return {
      label: 'Maksimal',
      desc: 'Max Effort / PR Attempt 🔥',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(239, 68, 68, 0.35)',
    }
  }

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
    const startMonth = format(currentWeekStart, 'MMM', { locale: idLocale })
    const endMonth = format(currentWeekEnd, 'MMM', { locale: idLocale })
    const startYear = format(currentWeekStart, 'yyyy')
    const endYear = format(currentWeekEnd, 'yyyy')

    if (startYear !== endYear) {
      return `${format(currentWeekStart, 'd MMM yyyy', { locale: idLocale })} – ${format(currentWeekEnd, 'd MMM yyyy', { locale: idLocale })}`
    }
    if (startMonth !== endMonth) {
      return `${format(currentWeekStart, 'd MMM', { locale: idLocale })} – ${format(currentWeekEnd, 'd MMM yyyy', { locale: idLocale })}`
    }
    return `${format(currentWeekStart, 'd')} – ${format(currentWeekEnd, 'd MMMM yyyy', { locale: idLocale })}`
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
      const localDateTime = new Date(`${newSessionDate}T${newSessionTime}:00`)
      const scheduledAtStr = !isNaN(localDateTime.getTime())
        ? localDateTime.toISOString()
        : `${newSessionDate}T${newSessionTime}:00+07:00`

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

  // Open Edit Session Modal
  const handleOpenEditModal = (session: any, isDirect: boolean = false) => {
    if (!session) return
    setOpenedEditDirectly(isDirect)
    setSelectedDetailSession(session)
    const sDate = new Date(session.scheduledAt)
    setEditSessionDate(format(sDate, 'yyyy-MM-dd'))
    setEditSessionTime(format(sDate, 'HH:mm'))
    setEditSessionProgram(session.programType || 'Total Body')
    setEditSessionLocation(session.location || '')
    setEditSessionRpe(session.rpe ? String(session.rpe) : '8')
    setEditSessionNotes(getCleanNotes(session.ptNotes, session.sessionNotes))
    setEditSessionStatus(session.status || 'scheduled')
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    if (openedEditDirectly) {
      setSelectedDetailSession(null)
      setOpenedEditDirectly(false)
    }
  }

  // Save Edited Session
  const handleSaveEditSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDetailSession || isClient) return

    setIsSubmittingEdit(true)
    try {
      const localDateTime = new Date(`${editSessionDate}T${editSessionTime}:00`)
      const scheduledAtStr = !isNaN(localDateTime.getTime())
        ? localDateTime.toISOString()
        : `${editSessionDate}T${editSessionTime}:00+07:00`

      // 1. Update core session data
      const resData = await updateSessionData(selectedDetailSession.id, {
        scheduledAt: scheduledAtStr,
        programType: editSessionProgram,
        rpe: Number(editSessionRpe),
        location: editSessionLocation,
        sessionNotes: editSessionNotes,
        ptNotes: editSessionNotes,
      })

      if (!resData.success) {
        showAlert(resData.error || 'Gagal memperbarui sesi latihan', 'error')
        return
      }

      // 2. If status was changed, update status to trigger quota adjustments if needed
      if (editSessionStatus !== selectedDetailSession.status) {
        const resStatus = await updateSessionStatus(selectedDetailSession.id, editSessionStatus)
        if (!resStatus.success) {
          showAlert(resStatus.error || 'Gagal memperbarui status sesi', 'error')
        }
      }

      // 3. Refresh list and update detail view
      await loadData()

      if (openedEditDirectly) {
        setSelectedDetailSession(null)
        setOpenedEditDirectly(false)
      } else {
        setSelectedDetailSession((prev: any) =>
          prev
            ? {
                ...prev,
                scheduledAt: scheduledAtStr,
                programType: editSessionProgram,
                location: editSessionLocation,
                rpe: Number(editSessionRpe),
                sessionNotes: editSessionNotes,
                ptNotes: editSessionNotes,
                status: editSessionStatus,
              }
            : null
        )
      }

      setIsEditModalOpen(false)
      showAlert('Sesi latihan berhasil diperbarui!', 'success', 'Perubahan Disimpan')
    } catch (err: any) {
      showAlert(err.message || 'Terjadi kesalahan saat memperbarui sesi', 'error')
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Active packages with quota (include postpaid packages)
  const activePackages = useMemo(() => {
    return packagesData.filter((pkg) => {
      const isPostpaid =
        pkg.billingType === 'postpaid' ||
        (pkg.packageName && pkg.packageName.toLowerCase().includes('pascabayar')) ||
        (pkg.packageName && pkg.packageName.toLowerCase().includes('postpaid'))

      if (isPostpaid) {
        return pkg.status !== 'expired' && pkg.status !== 'inactive'
      }

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
            className={`jd-metric-pill pill-total ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
            title="Semua Sesi Minggu Ini"
          >
            <span className="jd-pill-dot dot-all" />
            <span className="jd-pill-val font-mono">{metrics.total}</span>
            <span className="jd-pill-label">Total Sesi</span>
          </button>

          <button
            type="button"
            className={`jd-metric-pill pill-booked ${statusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'scheduled' ? 'all' : 'scheduled')}
            title="Filter Sesi Booked / Terjadwal"
          >
            <span className="jd-pill-dot dot-sky" />
            <span className="jd-pill-val font-mono text-sky">{metrics.booked}</span>
            <span className="jd-pill-label">Booked</span>
          </button>

          <button
            type="button"
            className={`jd-metric-pill pill-completed ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
            title="Filter Sesi Completed / Selesai"
          >
            <span className="jd-pill-dot dot-emerald" />
            <span className="jd-pill-val font-mono text-emerald">{metrics.completed}</span>
            <span className="jd-pill-label">Completed</span>
          </button>

          <button
            type="button"
            className={`jd-metric-pill pill-cancelled ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
            title="Filter Sesi Cancel / No-Show"
          >
            <span className="jd-pill-dot dot-rose" />
            <span className="jd-pill-val font-mono text-rose">{metrics.cancelled + metrics.noShow}</span>
            <span className="jd-pill-label">Batal</span>
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
        {/* Navigation & Controls Row (Adaptive Two-Tier on Mobile) */}
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
              <ChevronLeft size={9} />
            </button>

            <button
              type="button"
              className="jd-today-pill font-mono"
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
              <ChevronRight size={9} />
            </button>
          </div>

          {/* Action Toolbar: View Switcher + Search Button */}
          <div className="jd-nav-actions">
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

            <button
              type="button"
              className={`jd-icon-btn ${isSearchOpen ? 'active' : ''}`}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Cari Sesi / Klien"
            >
              <Search size={8} />
              <span className="jd-search-btn-txt">Cari</span>
            </button>
          </div>
        </div>

        {/* ─── MINI WEEK 7-DAY STRIP (Interactive Day Columns with Session Dots) ─── */}
        <div className="jd-mini-week-strip">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date())
            const isSelected = isSameDay(day, currentDate)
            const isPast = day < new Date() && !isToday
            const statusClass = isToday ? 'today' : isPast ? 'past' : 'future'
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayStats = daySessionsMap[dayKey] || { total: 0, completed: 0, scheduled: 0, cancelled: 0 }
            const dayNameShort = format(day, 'EEE', { locale: idLocale }).toUpperCase()
            const dayNum = format(day, 'd')

            return (
              <button
                key={dayKey}
                type="button"
                className={`jd-mini-day-col ${statusClass} ${isSelected ? 'selected' : ''}`}
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
                  {!isClient && (
                    <button
                      type="button"
                      className="jd-act-btn jd-act-edit"
                      onClick={() => handleOpenEditModal(s, true)}
                      title="Edit Jadwal & Sesi"
                    >
                      <Edit3 size={12} strokeWidth={2.2} />
                      <span className="jd-act-txt">Edit</span>
                    </button>
                  )}

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
                          {!isClient && (
                            <button
                              type="button"
                              className="jd-act-btn jd-act-edit"
                              onClick={() => handleOpenEditModal(s, true)}
                              title="Edit Jadwal & Sesi"
                            >
                              <Edit3 size={12} strokeWidth={2.2} />
                              <span className="jd-act-txt">Edit</span>
                            </button>
                          )}

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
      {mounted && selectedDetailSession && createPortal(
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
                <div className="mc-icon-badge jd-badge-sched">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="mc-title">Detail Sesi Latihan</h3>
                  <p className="mc-sub">
                    {selectedDetailSession.clientName} • {format(new Date(selectedDetailSession.scheduledAt), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!isClient && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedDetailSession, false)}
                    className="jd-modal-header-edit-btn"
                    title="Edit Sesi Latihan"
                  >
                    <Edit3 size={13} strokeWidth={2.2} />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDetailSession(null)}
                  className="mc-close-btn"
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mc-modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
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
                {(() => {
                  const cleanNotes = getCleanNotes(selectedDetailSession.ptNotes, selectedDetailSession.sessionNotes)
                  if (!cleanNotes) return null
                  return (
                    <div className="jd-info-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span className="jd-info-label">Catatan Sesi:</span>
                      <p className="jd-info-notes">{cleanNotes}</p>
                    </div>
                  )
                })()}
              </div>

              {/* Workout Builder */}
              <div style={{ marginTop: 14 }}>
                <WorkoutBuilder
                  sessionId={selectedDetailSession.id}
                />
              </div>

              {/* Action Buttons: Edit (Blue) & Delete */}
              {!isClient && (
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    className="jd-edit-session-btn"
                    onClick={() => handleOpenEditModal(selectedDetailSession)}
                  >
                    <Edit3 size={14} />
                    <span>Edit Sesi Latihan</span>
                  </button>

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
        </div>,
        document.body
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

      {/* ─── 6. UNIFIED CREATE / CHECK-IN SESSION CUSTOM MODAL (HYBRID DEV & EDITORIAL MINIMAL) ─── */}
      {mounted && isFormModalOpen && createPortal(
        <div
          className="modal-backdrop animate-fade-in"
          onClick={closeFormModal}
        >
          <div
            className="modal-card dev-modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            {/* Header: Editorial Minimal with Dev Micro-Label */}
            <div className="dev-modal-header">
              <div>
                <div className="dev-mono-tag font-mono">
                  {newSessionStatus === 'completed' ? '// QUICK_CHECKIN_DISPATCH' : '// SCHEDULE_NEW_SESSION'}
                </div>
                <h3 className="dev-modal-title">
                  {newSessionStatus === 'completed' ? 'Check-In Sesi Latihan' : 'Jadwalkan Sesi Baru'}
                </h3>
                <p className="dev-modal-subtitle">
                  {newSessionStatus === 'completed'
                    ? 'Catat sesi selesai & kurangi kuota paket 1 sesi otomatis'
                    : 'Atur jadwal latihan mendatang untuk klien'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="dev-close-btn"
                aria-label="Tutup Dialog"
              >
                <X size={17} />
              </button>
            </div>

            {/* Mode Switcher: Underline Tabs (Konsep 1 Layout + Linear Vibe) */}
            <div className="dev-underline-tabs">
              <button
                type="button"
                className={`dev-tab-btn tab-sched ${newSessionStatus === 'scheduled' ? 'active-sched' : ''}`}
                onClick={() => setNewSessionStatus('scheduled')}
              >
                <CalendarCheck size={14} />
                <span>Jadwalkan Sesi</span>
              </button>
              <button
                type="button"
                className={`dev-tab-btn tab-checkin ${newSessionStatus === 'completed' ? 'active-checkin' : ''}`}
                onClick={() => setNewSessionStatus('completed')}
              >
                <Zap size={14} />
                <span>Check-In Sekarang</span>
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="dev-modal-body">
              {/* SECTION 1: Client & Package Selection */}
              <div className="dev-field-group">
                <div className="dev-field-label font-mono">
                  <span className="dev-label-txt sec-label-client">01 // CLIENT & PACKAGE</span>
                  {(() => {
                    const sel = activePackages.find((p) => p.id === newSessionPkgId)
                    if (!sel) return <span className="dev-req-star">* Required</span>
                    const isPostpaid =
                      sel.billingType === 'postpaid' ||
                      (sel.packageName && sel.packageName.toLowerCase().includes('pascabayar')) ||
                      (sel.packageName && sel.packageName.toLowerCase().includes('postpaid'))

                    if (isPostpaid) {
                      return (
                        <span className="dev-quota-pill font-mono" style={{ background: 'rgba(56, 189, 248, 0.18)', borderColor: '#38bdf8', color: '#38bdf8' }}>
                          ⚡ PASCABAYAR
                        </span>
                      )
                    }

                    const rem = (sel.totalSessions || 0) - (sel.usedSessions || 0)
                    return (
                      <span className="dev-quota-pill font-mono">
                        {rem} SESI TERSISA
                      </span>
                    )
                  })()}
                </div>

                <div className="dev-select-wrapper">
                  <select
                    className="dev-select-input"
                    value={newSessionPkgId}
                    onChange={(e) => setNewSessionPkgId(e.target.value)}
                    required
                  >
                    <option value="">-- PILIH KLIEN / PAKET AKTIF --</option>
                    {activePackages.map((pkg) => {
                      const isPostpaid =
                        pkg.billingType === 'postpaid' ||
                        (pkg.packageName && pkg.packageName.toLowerCase().includes('pascabayar')) ||
                        (pkg.packageName && pkg.packageName.toLowerCase().includes('postpaid'))
                      const remaining = (pkg.totalSessions || 0) - (pkg.usedSessions || 0)
                      return (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.clientName || 'Client'} — {pkg.packageName} {isPostpaid ? '(Pascabayar / Billing Bulanan)' : `(${remaining} Sesi Tersisa)`}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {activePackages.length === 0 ? (
                  <div className="dev-alert-box font-mono">
                    ⚠️ TIDAK ADA PAKET AKTIF. Tambahkan paket baru untuk klien terlebih dahulu.
                  </div>
                ) : (() => {
                  const sel = activePackages.find((p) => p.id === newSessionPkgId)
                  if (!sel) return null
                  const isPostpaid =
                    sel.billingType === 'postpaid' ||
                    (sel.packageName && sel.packageName.toLowerCase().includes('pascabayar')) ||
                    (sel.packageName && sel.packageName.toLowerCase().includes('postpaid'))
                  const rem = (sel.totalSessions || 0) - (sel.usedSessions || 0)
                  return (
                    <div className="dev-package-card animate-fade-in">
                      <div className="dev-pkg-avatar">
                        {(sel.clientName || 'C').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="dev-pkg-info">
                        <div className="dev-pkg-name">{sel.clientName || 'Client'}</div>
                        <div className="dev-pkg-detail font-mono">
                          {isPostpaid ? `${sel.packageName} • ${sel.usedSessions || 0} Sesi Selesai` : `${sel.packageName} • ${sel.usedSessions || 0}/${sel.totalSessions} Sesi Terpakai`}
                        </div>
                      </div>
                      <div className="dev-pkg-badge font-mono" style={isPostpaid ? { color: '#38bdf8', borderColor: '#38bdf8' } : undefined}>
                        {isPostpaid ? 'PASCABAYAR' : `${rem} SESI`}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* SECTION 2: Date & Time Selection (CONCEPT 8: HORIZONTAL DAY WHEEL + TIME PRESETS) */}
              <div className="dev-field-group">
                <div className="dev-field-label font-mono">
                  <span className="dev-label-txt sec-label-time">02 // HORIZONTAL DAY WHEEL</span>
                  <span className="dev-val-indicator font-mono">
                    {format(new Date(newSessionDate), 'd MMM yyyy', { locale: idLocale })} @ {newSessionTime}
                  </span>
                </div>

                {/* Concept 8: Horizontal Day Wheel (Swipeable 7-Day Strip: -3 to +3) */}
                <div className="dev-day-wheel-container">
                  <div className="dev-day-wheel-strip">
                    {dayWheelDays.map((item) => {
                      const isSelected = newSessionDate === item.dateStr
                      const statusClass = item.isToday ? 'is-today' : item.isPast ? 'is-past' : 'is-future'
                      return (
                        <button
                          key={item.dateStr}
                          type="button"
                          className={`dev-day-wheel-card ${statusClass} ${isSelected ? 'active' : ''}`}
                          onClick={() => setNewSessionDate(item.dateStr)}
                        >
                          <span className="dev-wheel-day">{item.dayName}</span>
                          <span className="dev-wheel-num font-mono">{item.dayNum}</span>
                          <span className="dev-wheel-mon">{item.monthName}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Native Date & Time Custom Pickers */}
                <div className="dev-custom-datetime-row">
                  <div className="dev-dt-input-box">
                    <Calendar size={13} className="dev-dt-icon" />
                    <input
                      type="date"
                      className="dev-clean-input font-mono"
                      value={newSessionDate}
                      onChange={(e) => setNewSessionDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="dev-dt-input-box">
                    <Clock size={13} className="dev-dt-icon" />
                    <input
                      type="time"
                      className="dev-clean-input font-mono"
                      value={newSessionTime}
                      onChange={(e) => setNewSessionTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Time Quick Chips (Morning Sunrise Single Horizontal Row) */}
                <div className="dev-time-chips-bar">
                  {TIME_PRESETS.map((time, idx) => (
                    <button
                      key={time}
                      type="button"
                      className={`dev-time-chip font-mono time-slot-${idx} ${newSessionTime === time ? 'active' : ''}`}
                      onClick={() => setNewSessionTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Program & Location */}
              <div className="dev-grid-2col">
                {/* Program Focus */}
                <div className="dev-field-group">
                  <div className="dev-field-label font-mono">
                    <span className="dev-label-txt sec-label-prog">03 // PROGRAM</span>
                  </div>
                  <input
                    type="text"
                    className="dev-clean-input"
                    placeholder="Total Body, Chest..."
                    value={newSessionProgram}
                    onChange={(e) => setNewSessionProgram(e.target.value)}
                  />
                  <div className="dev-mini-chips">
                    {PROGRAM_PRESETS.slice(0, 4).map((prog, idx) => (
                      <button
                        key={prog}
                        type="button"
                        className={`dev-mini-chip prog-chip-${idx} ${newSessionProgram === prog ? 'active' : ''}`}
                        onClick={() => setNewSessionProgram(prog)}
                      >
                        {prog}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="dev-field-group">
                  <div className="dev-field-label font-mono">
                    <span className="dev-label-txt sec-label-loc">04 // LOCATION</span>
                  </div>
                  <input
                    type="text"
                    className="dev-clean-input"
                    placeholder="Essence, Hang Lekir..."
                    value={newSessionLocation}
                    onChange={(e) => setNewSessionLocation(e.target.value)}
                  />
                  <div className="dev-mini-chips">
                    {LOCATION_PRESETS.slice(0, 3).map((loc, idx) => (
                      <button
                        key={loc}
                        type="button"
                        className={`dev-mini-chip loc-chip-${idx} ${newSessionLocation === loc ? 'active' : ''}`}
                        onClick={() => setNewSessionLocation(loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 4: RPE Target Intensity (KONSEP 4: 10-ZONE TAP BOXES) */}
              <div className="dev-field-group">
                {(() => {
                  const currentRpeNum = Number(newSessionRpe) || 8
                  const rpeInfo = getRpeDetails(currentRpeNum)
                  return (
                    <>
                      <div className="dev-field-label font-mono">
                        <span className="dev-label-txt sec-label-rpe">05 // INTENSITY (RPE)</span>
                        <span
                          className="dev-rpe-status-badge font-mono"
                          style={{
                            color: rpeInfo.color,
                            borderColor: rpeInfo.border,
                            background: rpeInfo.bg,
                          }}
                        >
                          RPE {currentRpeNum}/10 • {rpeInfo.label.toUpperCase()}
                        </span>
                      </div>

                      {/* 10-Box Tap Zones (Konsep 4) */}
                      <div className="dev-rpe-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const isSelected = currentRpeNum === num
                          let zoneColorClass = 'dev-rpe-light'
                          if (num >= 5 && num <= 7) zoneColorClass = 'dev-rpe-mod'
                          if (num >= 8 && num <= 9) zoneColorClass = 'dev-rpe-heavy'
                          if (num === 10) zoneColorClass = 'dev-rpe-max'

                          return (
                            <button
                              key={num}
                              type="button"
                              className={`dev-rpe-box font-mono ${zoneColorClass} ${isSelected ? 'active' : ''}`}
                              onClick={() => setNewSessionRpe(String(num))}
                              aria-label={`RPE ${num}`}
                            >
                              <span className="dev-rpe-num">{num}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="dev-rpe-scale-legend font-mono">
                        <span style={{ color: '#10b981' }}>1-4 Light</span>
                        <span style={{ color: '#38bdf8' }}>5-7 Moderate</span>
                        <span style={{ color: '#f59e0b' }}>8-9 Heavy</span>
                        <span style={{ color: '#ef4444' }}>10 Max Effort 🔥</span>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* SECTION 5: Session Notes */}
              <div className="dev-field-group">
                <div className="dev-field-label font-mono">
                  <span className="dev-label-txt sec-label-notes">06 // SESSION NOTES (OPTIONAL)</span>
                </div>
                <textarea
                  className="dev-clean-textarea font-mono"
                  rows={2}
                  placeholder="Fokus progressive overload, koreksi postur squat, target RPE..."
                  value={newSessionNotes}
                  onChange={(e) => setNewSessionNotes(e.target.value)}
                />
              </div>

              {/* Footer Actions (CONCEPT 8: 1-THUMB ERGONOMIC PRIMARY BUTTON) */}
              <div className="dev-modal-actions dev-speed-actions">
                <button
                  type="button"
                  className="dev-btn-cancel font-mono"
                  onClick={closeFormModal}
                  disabled={isSubmitting}
                >
                  [ ESC ] BATAL
                </button>
                <button
                  type="submit"
                  className={`dev-btn-speed-submit font-mono ${newSessionStatus === 'completed' ? 'dev-speed-checkin' : 'dev-speed-sched'}`}
                  disabled={isSubmitting || !newSessionPkgId}
                >
                  {isSubmitting ? (
                    <span>PROCESSING...</span>
                  ) : newSessionStatus === 'completed' ? (
                    <>
                      <Zap size={16} strokeWidth={2.5} className="dev-speed-icon" />
                      <span>⚡ CONFIRM CHECK-IN (1-TAP)</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck size={16} strokeWidth={2.5} className="dev-speed-icon" />
                      <span>SIMPAN JADWAL SESI →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── 6.5. EDIT WORKOUT SESSION MODAL ─── */}
      {mounted && isEditModalOpen && selectedDetailSession && createPortal(
        <div
          className="modal-backdrop animate-fade-in"
          onClick={handleCloseEditModal}
          style={{ zIndex: 100005 }}
        >
          <div
            className="modal-card dev-modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            {/* Header */}
            <div className="dev-modal-header">
              <div>
                <div className="dev-mono-tag font-mono">
                  // EDIT_WORKOUT_SESSION
                </div>
                <h3 className="dev-modal-title">Edit Sesi Latihan</h3>
                <p className="dev-modal-subtitle">
                  {selectedDetailSession.clientName || 'Klien'} • {selectedDetailSession.packageName || 'Paket Latihan'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="dev-close-btn"
                aria-label="Tutup Dialog"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSession} className="dev-modal-body">
              {/* SECTION 1: Status Sesi */}
              <div className="dev-field-group">
                <div className="dev-field-label font-mono">
                  <span className="dev-label-txt">01 // STATUS SESI</span>
                </div>
                <div className="jd-status-select-grid">
                  <button
                    type="button"
                    className={`jd-status-opt ${editSessionStatus === 'scheduled' ? 'active-scheduled' : ''}`}
                    onClick={() => setEditSessionStatus('scheduled')}
                  >
                    <CalendarCheck size={14} /> Scheduled
                  </button>
                  <button
                    type="button"
                    className={`jd-status-opt ${editSessionStatus === 'completed' ? 'active-completed' : ''}`}
                    onClick={() => setEditSessionStatus('completed')}
                  >
                    <CheckCircle2 size={14} /> Completed
                  </button>
                  <button
                    type="button"
                    className={`jd-status-opt ${editSessionStatus === 'cancelled' ? 'active-cancelled' : ''}`}
                    onClick={() => setEditSessionStatus('cancelled')}
                  >
                    <XCircle size={14} /> Cancelled
                  </button>
                  <button
                    type="button"
                    className={`jd-status-opt ${editSessionStatus === 'no_show' ? 'active-noshow' : ''}`}
                    onClick={() => setEditSessionStatus('no_show')}
                  >
                    <AlertTriangle size={14} /> No Show
                  </button>
                </div>
              </div>

              {/* SECTION 2: Tanggal & Waktu */}
              <div className="dev-field-group">
                <div className="dev-field-label font-mono">
                  <span className="dev-label-txt">02 // TANGGAL & WAKTU</span>
                  <span className="dev-val-indicator font-mono">
                    {editSessionDate ? format(new Date(editSessionDate), 'd MMM yyyy', { locale: idLocale }) : ''} @ {editSessionTime}
                  </span>
                </div>

                <div className="dev-custom-datetime-row">
                  <div className="dev-dt-input-box">
                    <Calendar size={13} className="dev-dt-icon" />
                    <input
                      type="date"
                      className="dev-clean-input font-mono"
                      value={editSessionDate}
                      onChange={(e) => setEditSessionDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="dev-dt-input-box">
                    <Clock size={13} className="dev-dt-icon" />
                    <input
                      type="time"
                      className="dev-clean-input font-mono"
                      value={editSessionTime}
                      onChange={(e) => setEditSessionTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Quick Time Chips */}
                <div className="dev-time-chips-bar">
                  {TIME_PRESETS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`dev-time-chip font-mono ${editSessionTime === time ? 'active' : ''}`}
                      onClick={() => setEditSessionTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Program Focus & Location */}
              <div className="dev-grid-2col">
                {/* Program Focus */}
                <div className="dev-field-group">
                  <div className="dev-field-label font-mono">
                    <span className="dev-label-txt">03 // PROGRAM</span>
                  </div>
                  <input
                    type="text"
                    className="dev-clean-input"
                    placeholder="Total Body, Chest..."
                    value={editSessionProgram}
                    onChange={(e) => setEditSessionProgram(e.target.value)}
                    required
                  />
                  <div className="dev-mini-chips">
                    {PROGRAM_PRESETS.slice(0, 4).map((prog) => (
                      <button
                        key={prog}
                        type="button"
                        className={`dev-mini-chip ${editSessionProgram === prog ? 'active' : ''}`}
                        onClick={() => setEditSessionProgram(prog)}
                      >
                        {prog}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="dev-field-group">
                  <div className="dev-field-label font-mono">
                    <span className="dev-label-txt">04 // LOKASI</span>
                  </div>
                  <input
                    type="text"
                    className="dev-clean-input"
                    placeholder="Essence, Hang Lekir..."
                    value={editSessionLocation}
                    onChange={(e) => setEditSessionLocation(e.target.value)}
                  />
                  <div className="dev-mini-chips">
                    {LOCATION_PRESETS.slice(0, 3).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        className={`dev-mini-chip ${editSessionLocation === loc ? 'active' : ''}`}
                        onClick={() => setEditSessionLocation(loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 4: RPE Target Intensity */}
              <div className="dev-field-group">
                {(() => {
                  const currentRpeNum = Number(editSessionRpe) || 8
                  const rpeInfo = getRpeDetails(currentRpeNum)
                  return (
                    <>
                      <div className="dev-field-label font-mono">
                        <span className="dev-label-txt">05 // INTENSITY (RPE)</span>
                        <span
                          className="dev-rpe-status-badge font-mono"
                          style={{
                            color: rpeInfo.color,
                            borderColor: rpeInfo.border,
                            background: rpeInfo.bg,
                          }}
                        >
                          RPE {currentRpeNum}/10 • {rpeInfo.label.toUpperCase()}
                        </span>
                      </div>

                      {/* 10-Box Tap Zones */}
                      <div className="dev-rpe-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const isSelected = currentRpeNum === num
                          let zoneColorClass = 'dev-rpe-light'
                          if (num >= 5 && num <= 7) zoneColorClass = 'dev-rpe-mod'
                          if (num >= 8 && num <= 9) zoneColorClass = 'dev-rpe-heavy'
                          if (num === 10) zoneColorClass = 'dev-rpe-max'

                          return (
                            <button
                              key={num}
                              type="button"
                              className={`dev-rpe-box font-mono ${zoneColorClass} ${isSelected ? 'active' : ''}`}
                              onClick={() => setEditSessionRpe(String(num))}
                              aria-label={`RPE ${num}`}
                            >
                              <span className="dev-rpe-num">{num}</span>
                            </button>
                          )
                        })}
                      </div>

                      <div className="dev-rpe-scale-legend font-mono">
                        <span style={{ color: '#10b981' }}>1-4 Light</span>
                        <span style={{ color: '#38bdf8' }}>5-7 Moderate</span>
                        <span style={{ color: '#f59e0b' }}>8-9 Heavy</span>
                        <span style={{ color: '#ef4444' }}>10 Max Effort 🔥</span>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* SECTION 5: Session Notes */}
              <div className="dev-field-group">
                <div className="dev-field-label font-mono">
                  <span className="dev-label-txt">06 // CATATAN SESI (OPTIONAL)</span>
                </div>
                <textarea
                  className="dev-clean-textarea font-mono"
                  rows={2}
                  placeholder="Fokus progressive overload, koreksi postur, target RPE..."
                  value={editSessionNotes}
                  onChange={(e) => setEditSessionNotes(e.target.value)}
                />
              </div>

              {/* Footer Actions */}
              <div className="dev-modal-actions dev-speed-actions">
                <button
                  type="button"
                  className="dev-btn-cancel font-mono"
                  onClick={handleCloseEditModal}
                  disabled={isSubmittingEdit}
                >
                  [ ESC ] BATAL
                </button>
                <button
                  type="submit"
                  className="dev-btn-speed-submit dev-speed-edit font-mono"
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? (
                    <span>MENYIMPAN...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} strokeWidth={2.5} className="dev-speed-icon" />
                      <span>SIMPAN PERUBAHAN →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── 7. DELETE CONFIRMATION MODAL ─── */}
      <CustomModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        type="confirm"
        title="Hapus Sesi Latihan?"
        message="Apakah Anda yakin ingin menghapus sesi latihan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Sesi"
        cancelText="Batal"
        isSubmitting={Boolean(processingId)}
      />

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
