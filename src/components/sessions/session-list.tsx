'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Check,
  Ban,
  Activity,
  Award,
} from 'lucide-react'
import { listSessions, updateSessionStatus, deleteSession, scheduleSession } from '@/lib/actions/session'
import { listPackages } from '@/lib/actions/package'
import { useAuthStore } from '@/store/auth-store'
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { WorkoutBuilder } from './workout-builder'
import { CustomModal, ModalType } from '@/components/ui/custom-modal'
import './session-list.css'

export function SessionList() {
  const { role, user } = useAuthStore()
  const isClient = role === 'client'

  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [packagesData, setPackagesData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // PT Selected Date for Day/Week Schedule View
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // View Mode: 'day' (Hari) vs 'week' (Minggu)
  const [scheduleViewMode, setScheduleViewMode] = useState<'day' | 'week'>('day')

  // Filter Chip selection for PT (Default: Hari Ini)
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'today' | 'tomorrow' | 'scheduled' | 'completed' | 'cancelled'>('today')
  const [visibleSessionsCount, setVisibleSessionsCount] = useState<number>(5)

  useEffect(() => {
    setVisibleSessionsCount(5)
  }, [activeFilterChip])

  // Search Query & Search Modal state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  // Session Detail Bottom Sheet Modal state
  const [selectedDetailSession, setSelectedDetailSession] = useState<any | null>(null)

  // Add / Edit Session Bottom Sheet Modal state
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false)
  const [newSessionPkgId, setNewSessionPkgId] = useState('')
  const [newSessionStatus, setNewSessionStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'no_show'>('scheduled')
  const [newSessionProgram, setNewSessionProgram] = useState('Total Body')
  const [newSessionTime, setNewSessionTime] = useState('09:00')
  const [newSessionLocation, setNewSessionLocation] = useState('')
  const [newSessionRpe, setNewSessionRpe] = useState('8')
  const [newSessionNotes, setNewSessionNotes] = useState('')
  const [isSubmittingNewSession, setIsSubmittingNewSession] = useState(false)

  // Smart Location Reminder & Storage
  const [recentLocations, setRecentLocations] = useState<string[]>(['Hang Lekir', 'Essence', '1 Park', 'Studio Fit'])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocs = localStorage.getItem('pt_recent_locations')
      if (savedLocs) {
        try {
          const parsed = JSON.parse(savedLocs)
          if (Array.isArray(parsed) && parsed.length > 0) setRecentLocations(parsed)
        } catch (e) {}
      }
    }
  }, [])

  const filteredLocationSuggestions = useMemo(() => {
    if (!newSessionLocation.trim()) return recentLocations
    const q = newSessionLocation.toLowerCase()
    return recentLocations.filter(loc => loc.toLowerCase().includes(q))
  }, [newSessionLocation, recentLocations])

  // Active packages with remaining sessions > 0 only
  const activePackages = useMemo(() => {
    return packagesData.filter(pkg => {
      const remaining = (pkg.totalSessions || 0) - (pkg.usedSessions || 0)
      return remaining > 0 && pkg.status !== 'expired' && pkg.status !== 'inactive'
    })
  }, [packagesData])

  // Delete Confirmation Modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Client Single Package Filter State
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [hasDefaultPackageBeenSet, setHasDefaultPackageBeenSet] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when any modal is open to ensure 100% viewport centering on mobile HP
  useEffect(() => {
    const isAnyModalOpen =
      Boolean(selectedDetailSession) ||
      isAddSessionModalOpen ||
      isSearchModalOpen ||
      Boolean(deleteConfirmId)

    if (isAnyModalOpen) {
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
  }, [selectedDetailSession, isAddSessionModalOpen, isSearchModalOpen, deleteConfirmId])

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
      console.error('Error loading schedule data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Client's unique packages
  const clientPackages = useMemo(() => {
    const pkgs = new Set<string>()
    const sortedData = [...data].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    )
    sortedData.forEach(item => {
      if (item.packageName) pkgs.add(item.packageName)
    })
    return Array.from(pkgs)
  }, [data])

  // Set default package filter for Client
  useEffect(() => {
    if (isClient && clientPackages.length > 0 && !hasDefaultPackageBeenSet) {
      setSelectedPackage(clientPackages[0])
      setHasDefaultPackageBeenSet(true)
    }
  }, [isClient, clientPackages, hasDefaultPackageBeenSet])

  // Dynamic Greeting based on time of day
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return '🌅 Good Morning'
    if (hour < 18) return '☀️ Good Afternoon'
    return '🌙 Good Evening'
  }, [])

  // Filtered Sessions for the active selected date (PT Day View)
  const sessionsForCurrentDate = useMemo(() => {
    return data.filter(item => {
      if (!item.scheduledAt) return false
      const sessionDate = new Date(item.scheduledAt)
      return isSameDay(sessionDate, currentDate)
    })
  }, [data, currentDate])

  // Filtered Sessions with Filter Chips & Search for PT
  const ptFilteredSessions = useMemo(() => {
    let result = data

    // Date Filter Chip
    if (activeFilterChip === 'today') {
      result = result.filter(item => isSameDay(new Date(item.scheduledAt), new Date()))
    } else if (activeFilterChip === 'tomorrow') {
      const tomorrow = addDays(new Date(), 1)
      result = result.filter(item => isSameDay(new Date(item.scheduledAt), tomorrow))
    } else if (activeFilterChip === 'scheduled') {
      result = result.filter(item => item.status === 'scheduled')
    } else if (activeFilterChip === 'completed') {
      result = result.filter(item => item.status === 'completed')
    } else if (activeFilterChip === 'cancelled') {
      result = result.filter(item => item.status === 'cancelled')
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase()
      result = result.filter(item =>
        (item.clientName && item.clientName.toLowerCase().includes(term)) ||
        (item.programType && item.programType.toLowerCase().includes(term)) ||
        (item.location && item.location.toLowerCase().includes(term))
      )
    }

    return result
  }, [data, activeFilterChip, searchQuery])

  // Quick Stats Calculation for Today's PT View
  const todayStats = useMemo(() => {
    const todaySessions = data.filter(item => isSameDay(new Date(item.scheduledAt), currentDate))
    const uniqueClientsCount = new Set(todaySessions.map(s => s.clientName)).size
    const totalSessionsCount = todaySessions.length
    const occupiedHours = Math.min(12, totalSessionsCount) // assuming 1 hr per session
    const availableHours = Math.max(0, 10 - occupiedHours)

    return {
      uniqueClients: uniqueClientsCount,
      totalSessions: totalSessionsCount,
      occupiedHours,
      availableHours,
    }
  }, [data, currentDate])

  // Active Package Info for Client
  const activePackageInfo = useMemo(() => {
    const targetPackageName = selectedPackage || (clientPackages.length > 0 ? clientPackages[0] : '')
    const pkgSessions = targetPackageName
      ? data.filter(s => s.packageName === targetPackageName)
      : data

    const firstRow = pkgSessions[0]
    const total = firstRow?.totalSessions || 10
    const completed = pkgSessions.filter(s => s.status === 'completed').length
    const used = firstRow?.usedSessions !== undefined ? firstRow.usedSessions : completed
    const remaining = Math.max(0, total - used)
    const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0

    return { used, total, remaining, percent }
  }, [data, selectedPackage, clientPackages])

  // Custom Modal Dialog State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: ModalType
    title?: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  })

  const showAlert = (message: string, type: ModalType = 'error', title?: string) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
    })
  }

  // Status Change Handler for PT
  const handleStatusChange = async (sessionId: string, status: any) => {
    if (isClient) return

    setProcessingId(sessionId)
    try {
      const res = await updateSessionStatus(sessionId, status)
      if (res.success) {
        await loadData()
        if (selectedDetailSession && selectedDetailSession.id === sessionId) {
          setSelectedDetailSession({ ...selectedDetailSession, status })
        }
        showAlert(`Status sesi berhasil diperbarui ke '${status === 'completed' ? 'Selesai' : 'Batal'}'!`, 'success', 'Status Diperbarui')
      } else {
        showAlert(res.error || 'Gagal memperbarui status sesi', 'error')
      }
    } catch (err: any) {
      showAlert(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  // Delete Session Handler for PT
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

  // Add Session Submission Handler for PT
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isClient || !newSessionPkgId) return

    setIsSubmittingNewSession(true)
    try {
      // Build ISO date time string
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const scheduledAtStr = `${dateStr}T${newSessionTime}:00`

      const res = await scheduleSession({
        packageId: newSessionPkgId,
        scheduledAt: scheduledAtStr,
        status: newSessionStatus,
        programType: newSessionProgram,
        rpe: Number(newSessionRpe),
        location: newSessionLocation,
        sessionNotes: newSessionNotes,
      })

      if (res.success) {
        if (newSessionLocation.trim()) {
          const trimmedLoc = newSessionLocation.trim()
          if (!recentLocations.includes(trimmedLoc)) {
            const updatedLocs = [trimmedLoc, ...recentLocations.slice(0, 9)]
            setRecentLocations(updatedLocs)
            if (typeof window !== 'undefined') {
              localStorage.setItem('pt_recent_locations', JSON.stringify(updatedLocs))
            }
          }
        }
        await loadData()
        setIsAddSessionModalOpen(false)
        setNewSessionNotes('')
        setNewSessionLocation('')
        showAlert('Sesi latihan baru berhasil dijadwalkan!', 'success', 'Jadwal Dibuat')
      } else {
        showAlert(res.error || 'Gagal menambah sesi baru', 'error')
      }
    } catch (err: any) {
      showAlert(err.message || 'Terjadi kesalahan', 'error')
    } finally {
      setIsSubmittingNewSession(false)
    }
  }

  // Status Badge Helper
  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="pt-status-pill pill-completed">✅ Completed</span>
      case 'cancelled':
        return <span className="pt-status-pill pill-cancelled">🔴 Cancelled</span>
      case 'check_in':
        return <span className="pt-status-pill pill-checkin">🟢 Check-In</span>
      default:
        return <span className="pt-status-pill pill-scheduled">🔵 Scheduled</span>
    }
  }

  // Week View Days Array (7 days starting from Monday of currentDate)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  // ==================== RENDER CLIENT VIEW (PRESERVATION OF CLIENT SPEC) ====================
  if (isClient) {
    return (
      <div className="compact-session-wrapper">
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

          <div className="csf-usage-box">
            <div className="csf-usage-top">
              <span className="csf-usage-text">
                <strong>{activePackageInfo.used}</strong> dari <strong>{activePackageInfo.total}</strong> sesi digunakan
              </span>
              <span className="csf-usage-percent">{activePackageInfo.percent}%</span>
            </div>

            <div className="csf-progress-bar-bg">
              <div
                className="csf-progress-bar-fill"
                style={{ width: `${activePackageInfo.percent}%` }}
              />
            </div>

            <div className="csf-usage-bottom">
              <span className="csf-remaining-text">⌛ Sisa {activePackageInfo.remaining} Session</span>
            </div>
          </div>
        </div>

        {/* CLIENT SESSIONS LIST */}
        <div className="compact-session-grid">
          {data.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setSelectedDetailSession(s)}
              className="compact-card animate-slide-up"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="c-row-1">
                <span className="c-datetime">
                  📅 {format(new Date(s.scheduledAt), 'EEEE, dd MMM yyyy • HH:mm', { locale: idLocale })}
                </span>
                {renderStatusPill(s.status)}
              </div>
              <h4 className="c-program">{s.programType || 'Total Body Workout'}</h4>
              <div className="c-details-row">
                <span>📍 {s.location || 'Gym Hang Lekir'}</span>
                <span>🔥 RPE {s.rpe || 8}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CLIENT DETAIL MODAL */}
        {mounted && selectedDetailSession && createPortal(
          <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedDetailSession(null)}>
            <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="mc-header">
                <div className="mc-title-group">
                  <div className="mc-icon-badge">
                    <Dumbbell size={18} />
                  </div>
                  <div>
                    <h3 className="mc-title">Detail Sesi Latihan</h3>
                    <p className="mc-sub">Program & Jadwal Latihan Dari PT Anda</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedDetailSession(null)} className="mc-close-btn"><X size={18} /></button>
              </div>
              <div className="mc-modal-body">
                <div className="pt-detail-sec">
                  <div className="flex-between">
                    <h3 className="pt-dt-client">{selectedDetailSession.programType || 'Total Body'}</h3>
                    {renderStatusPill(selectedDetailSession.status)}
                  </div>

                  <div className="pt-dt-grid">
                    <div className="pt-dt-item">
                      <span className="pt-dt-lbl">📅 Waktu</span>
                      <span className="pt-dt-val">
                        {format(new Date(selectedDetailSession.scheduledAt), 'dd MMM yyyy • HH:mm', { locale: idLocale })}
                      </span>
                    </div>

                    <div className="pt-dt-item">
                      <span className="pt-dt-lbl">📍 Lokasi</span>
                      <span className="pt-dt-val">{selectedDetailSession.location || 'Gym Hang Lekir'}</span>
                    </div>
                  </div>
                </div>

                {/* WORKOUT PROGRAM BUATAN PT UNTUK CLIENT */}
                <WorkoutBuilder sessionId={selectedDetailSession.id} />

                {selectedDetailSession.pdfAttachmentUrl && (
                  <div className="pdf-attachment-banner" style={{ marginTop: 12 }}>
                    <a
                      href={selectedDetailSession.pdfAttachmentUrl}
                      download={`Rekap_Sesi_${selectedDetailSession.clientName || 'Latihan'}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-view-pdf-attachment"
                    >
                      <FileText size={16} />
                      <span>📄 Buka & Download PDF Rekap Asli</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    )
  }

  // ==================== RENDER PT MOBILE SCHEDULING SYSTEM (Jadwal Role PT.prd) ====================
  return (
    <div className="pt-scheduling-system animate-fade-in">
      {/* 1. PREMIUM SCHEDULE HERO HEADER */}
      <div className="pt-hero-header animate-slide-down">
        <div className="pt-hero-top">
          <div>
            <span className="pt-greeting">{dynamicGreeting}</span>
            <h1 className="pt-name">{user?.fullName || 'Elprian Light'}</h1>
            <p className="pt-date-str">{format(currentDate, 'EEEE, dd MMMM yyyy', { locale: idLocale })}</p>
          </div>
          <div className="flex-center gap-2 flex-wrap">
            <div className="pt-session-badge">
              <span>{todayStats.totalSessions} Session Hari Ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. QUICK STATISTICS (4 COMPACT 1:1 SQUARE CARDS) */}
      <div className="pt-quick-stats-grid">
        <div className="pt-stat-card">
          <span className="pt-stat-icon">👥</span>
          <span className="pt-stat-val">{todayStats.uniqueClients}</span>
          <span className="pt-stat-lbl">Client</span>
        </div>

        <div className="pt-stat-card">
          <span className="pt-stat-icon">🏋️</span>
          <span className="pt-stat-val">{todayStats.totalSessions}</span>
          <span className="pt-stat-lbl">Session</span>
        </div>

        <div className="pt-stat-card">
          <span className="pt-stat-icon">🟢</span>
          <span className="pt-stat-val">{todayStats.availableHours} Jam</span>
          <span className="pt-stat-lbl">Available</span>
        </div>

        <div className="pt-stat-card">
          <span className="pt-stat-icon">⏰</span>
          <span className="pt-stat-val">{todayStats.occupiedHours} Jam</span>
          <span className="pt-stat-lbl">Occupied</span>
        </div>
      </div>

      {/* 2 & 5. TOGGLE VIEW & DATE NAVIGATION BAR */}
      <div className="pt-nav-control-bar">
        {/* Date Navigation Switcher */}
        <div className="pt-date-switcher">
          <button
            type="button"
            onClick={() => setCurrentDate(subDays(currentDate, scheduleViewMode === 'day' ? 1 : 7))}
            className="pt-date-nav-btn"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="pt-today-btn"
          >
            Hari Ini
          </button>

          <span className="pt-current-date-txt">
            {format(currentDate, scheduleViewMode === 'day' ? 'dd MMM yyyy' : 'dd MMM', { locale: idLocale })}
          </span>

          <button
            type="button"
            onClick={() => setCurrentDate(addDays(currentDate, scheduleViewMode === 'day' ? 1 : 7))}
            className="pt-date-nav-btn"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Toggle View Mode (Hari vs Minggu) - Clean Text Without Icons */}
        <div className="pt-segmented-control">
          <button
            type="button"
            onClick={() => setScheduleViewMode('day')}
            className={`pt-seg-btn ${scheduleViewMode === 'day' ? 'active' : ''}`}
          >
            Hari
          </button>
          <button
            type="button"
            onClick={() => setScheduleViewMode('week')}
            className={`pt-seg-btn ${scheduleViewMode === 'week' ? 'active' : ''}`}
          >
            Minggu
          </button>
        </div>

        {/* Search Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="pt-search-trigger-btn"
          title="Cari Sesi / Client"
        >
          <Search size={15} />
        </button>
      </div>

      {/* 17. SMART FILTER CHIPS (HORIZONTAL SCROLL) */}
      <div className="pt-filter-chips-wrap">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'today', label: 'Hari Ini' },
          { id: 'tomorrow', label: 'Besok' },
          { id: 'scheduled', label: 'Scheduled 🔵' },
          { id: 'completed', label: 'Completed ✅' },
          { id: 'cancelled', label: 'Cancelled 🔴' },
        ].map(chip => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setActiveFilterChip(chip.id as any)}
            className={`pt-chip-btn ${activeFilterChip === chip.id ? 'active' : ''}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ==================== 5 & 13. SCHEDULE VIEWS ==================== */}
      {scheduleViewMode === 'day' ? (
        /* DAY VIEW TIMELINE GRID */
        <div className="pt-day-timeline">
          {isLoading ? (
            <div className="pt-skeleton-timeline">
              {[1, 2, 3].map(n => <div key={n} className="pt-sk-card" />)}
            </div>
          ) : ptFilteredSessions.length === 0 ? (
            /* EMPTY STATE MODEL MODERN */
            <div className="pt-empty-schedule animate-fade-in">
              <div className="pt-empty-icon">📅</div>
              <h3 className="pt-empty-title">Belum Ada Jadwal</h3>
              <p className="pt-empty-desc">
                {activeFilterChip === 'today'
                  ? 'Tidak ada sesi latihan terjadwal untuk Hari Ini.'
                  : 'Tidak ada sesi latihan yang sesuai dengan filter ini.'}
              </p>
              {!isClient && (
                <button
                  type="button"
                  onClick={() => setIsAddSessionModalOpen(true)}
                  className="pt-empty-add-btn"
                >
                  <Plus size={15} />
                  <span>Tambah Session</span>
                </button>
              )}
            </div>
          ) : (
            /* COMPACT SESSION TIMELINE CARDS */
            <div className="pt-timeline-list">
              {(activeFilterChip === 'all'
                ? ptFilteredSessions.slice(0, visibleSessionsCount)
                : ptFilteredSessions
              ).map((session, idx) => {
                const sessionTime = format(new Date(session.scheduledAt), 'HH:mm')
                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedDetailSession(session)}
                    className="pt-timeline-row animate-slide-up"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="pt-time-col">
                      <span className="pt-time-txt">{sessionTime}</span>
                      <div className="pt-time-dot" />
                    </div>

                    <div className={`pt-compact-card ${session.status}`}>
                      <div className="pt-cc-header">
                        <span className="pt-cc-client">{session.clientName}</span>
                        {renderStatusPill(session.status)}
                      </div>

                      <div className="pt-cc-body">
                        <span className="pt-cc-prog">🏋️ {session.programType || 'Total Body'}</span>
                        <span className="pt-cc-meta">📍 {session.location || 'Gym Hang Lekir'} • 🔥 RPE {session.rpe || 8}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* LOAD MORE BUTTON FOR 'ALL' FILTER */}
              {activeFilterChip === 'all' && ptFilteredSessions.length > visibleSessionsCount && (
                <div className="pt-load-more-wrap">
                  <button
                    type="button"
                    className="btn-load-more-sessions"
                    onClick={() => setVisibleSessionsCount(prev => prev + 5)}
                  >
                    Load more...
                  </button>
                </div>
              )}

              {/* AVAILABLE SLOT CARD */}
              <div
                className="pt-available-slot-card"
                onClick={() => setIsAddSessionModalOpen(true)}
              >
                <span>➕ Slot Kosong (2 Jam Available) • Klik untuk Tambah Session</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* WEEK VIEW SCHEDULE GRID */
        <div className="pt-week-grid-container">
          <div className="pt-week-header-row">
            {weekDays.map(day => {
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, currentDate)
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setCurrentDate(day)}
                  className={`pt-week-day-col ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                >
                  <span className="pt-wd-name">{format(day, 'EEE', { locale: idLocale })}</span>
                  <span className="pt-wd-num">{format(day, 'dd')}</span>
                </div>
              )
            })}
          </div>

          <div className="pt-week-body-list">
            {weekDays.map(day => {
              const daySessions = data.filter(s => isSameDay(new Date(s.scheduledAt), day))
              return (
                <div key={day.toISOString()} className="pt-week-day-row">
                  <div className="pt-wdr-header">
                    <span>{format(day, 'EEEE, dd MMMM', { locale: idLocale })}</span>
                    <span className="pt-wdr-count">{daySessions.length} Sesi</span>
                  </div>

                  {daySessions.length === 0 ? (
                    <div className="pt-week-empty-slot" onClick={() => { setCurrentDate(day); setIsAddSessionModalOpen(true); }}>
                      + Tambah Sesi
                    </div>
                  ) : (
                    <div className="pt-week-cards-grid">
                      {daySessions.map(s => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedDetailSession(s)}
                          className="pt-week-card"
                        >
                          <span className="pt-wc-time">{format(new Date(s.scheduledAt), 'HH:mm')}</span>
                          <span className="pt-wc-name">{s.clientName}</span>
                          <span className="pt-wc-prog">{s.programType}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 10. FLOATING GLASS ADD BUTTON (FAB) */}
      <button
        type="button"
        onClick={() => setIsAddSessionModalOpen(true)}
        className="pt-floating-fab animate-scale"
        title="Tambah Sesi Latihan Baru"
      >
        <Plus size={24} />
      </button>

      {/* ==================== 11. ADD SESSION BOTTOM SHEET MODAL (PORTAL) ==================== */}
      {mounted && isAddSessionModalOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsAddSessionModalOpen(false)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="mc-title">Tambah Sesi Latihan Baru</h3>
                  <p className="mc-sub">Jadwalkan sesi untuk client Anda</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsAddSessionModalOpen(false)} className="mc-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="mc-form">
              <div className="mc-field-grid">
                <div className="mc-field">
                  <label className="mc-label">Pilih Paket / Client (Aktif)</label>
                  <select
                    required
                    value={newSessionPkgId}
                    onChange={(e) => setNewSessionPkgId(e.target.value)}
                    className="mc-select"
                  >
                    <option value="">-- Pilih Paket Client --</option>
                    {activePackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.clientName} • {pkg.packageName} (Sisa {pkg.totalSessions - pkg.usedSessions} Sesi)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mc-field">
                  <label className="mc-label">Status Sesi</label>
                  <select
                    value={newSessionStatus}
                    onChange={(e) => setNewSessionStatus(e.target.value as any)}
                    className="mc-select"
                  >
                    <option value="scheduled">🔵 Scheduled</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">🔴 Cancelled</option>
                    <option value="no_show">⚠️ No Show</option>
                  </select>
                </div>
              </div>

              <div className="mc-field-grid">
                <div className="mc-field">
                  <label className="mc-label">Program Latihan</label>
                  <select
                    value={newSessionProgram}
                    onChange={(e) => setNewSessionProgram(e.target.value)}
                    className="mc-select"
                  >
                    <option value="Total Body">Total Body 🔥</option>
                    <option value="Upper Body">Upper Body 💪</option>
                    <option value="Lower Body">Lower Body 🦵</option>
                    <option value="Hybrid Training">Hybrid Training ⚡</option>
                    <option value="Muaythai">Muaythai 🥊</option>
                    <option value="Circuit Training">Circuit Training 🔄</option>
                  </select>
                </div>

                <div className="mc-field">
                  <label className="mc-label">Jam Latihan</label>
                  <input
                    type="time"
                    required
                    value={newSessionTime}
                    onChange={(e) => setNewSessionTime(e.target.value)}
                    className="mc-input"
                  />
                </div>
              </div>

              <div className="mc-field-grid">
                <div className="mc-field" style={{ position: 'relative' }}>
                  <label className="mc-label">Lokasi Latihan</label>
                  <input
                    type="text"
                    value={newSessionLocation}
                    onChange={(e) => {
                      setNewSessionLocation(e.target.value)
                      setShowLocationSuggestions(true)
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    className="mc-input"
                    placeholder="Masukkan lokasi (cth: Hang Lekir)..."
                  />

                  {showLocationSuggestions && (
                    <div className="smart-location-dropdown animate-fade-in">
                      <div className="sld-header">
                        <MapPin size={12} />
                        <span>Smart Reminder (Riwayat Lokasi)</span>
                      </div>
                      {filteredLocationSuggestions.length > 0 ? (
                        filteredLocationSuggestions.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            className="sld-item"
                            onClick={() => {
                              setNewSessionLocation(loc)
                              setShowLocationSuggestions(false)
                            }}
                          >
                            📍 {loc}
                          </button>
                        ))
                      ) : (
                        <div className="sld-item-empty">
                          Lokasi baru &quot;{newSessionLocation}&quot; akan disimpan otomatis
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mc-field">
                  <label className="mc-label">Target RPE (1-10)</label>
                  <select
                    value={newSessionRpe}
                    onChange={(e) => setNewSessionRpe(e.target.value)}
                    className="mc-select"
                  >
                    {[5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>RPE {n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mc-field">
                <label className="mc-label">Catatan Sesi (Opsional)</label>
                <textarea
                  rows={2}
                  value={newSessionNotes}
                  onChange={(e) => setNewSessionNotes(e.target.value)}
                  className="mc-textarea"
                  placeholder="Instruksi khusus latihan..."
                />
              </div>

              <div className="mc-actions">
                <button type="button" onClick={() => setIsAddSessionModalOpen(false)} className="mc-btn-cancel">
                  Batal
                </button>
                <button type="submit" disabled={isSubmittingNewSession} className="mc-btn-save">
                  {isSubmittingNewSession ? <Loader2 size={16} className="spin" /> : 'Simpan Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== 12. SESSION DETAIL BOTTOM SHEET MODAL (PORTAL) ==================== */}
      {mounted && selectedDetailSession && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedDetailSession(null)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge">
                  <Dumbbell size={18} />
                </div>
                <div>
                  <h3 className="mc-title">Detail Sesi Latihan PT</h3>
                  <p className="mc-sub">Rincian & Kelola Status Sesi Client</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedDetailSession(null)} className="mc-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="mc-modal-body">
              <div className="pt-detail-sec">
                <div className="flex-between">
                  <h3 className="pt-dt-client">{selectedDetailSession.clientName}</h3>
                  {renderStatusPill(selectedDetailSession.status)}
                </div>

                <div className="pt-dt-grid">
                  <div className="pt-dt-item">
                    <span className="pt-dt-lbl">🏋️ Program</span>
                    <span className="pt-dt-val">{selectedDetailSession.programType || 'Total Body'}</span>
                  </div>

                  <div className="pt-dt-item">
                    <span className="pt-dt-lbl">📅 Tanggal & Jam</span>
                    <span className="pt-dt-val">
                      {format(new Date(selectedDetailSession.scheduledAt), 'dd MMM yyyy • HH:mm', { locale: idLocale })}
                    </span>
                  </div>

                  <div className="pt-dt-item">
                    <span className="pt-dt-lbl">📍 Lokasi</span>
                    <span className="pt-dt-val">{selectedDetailSession.location || 'Gym Hang Lekir'}</span>
                  </div>

                  <div className="pt-dt-item">
                    <span className="pt-dt-lbl">🔥 Intensitas RPE</span>
                    <span className="pt-dt-val">RPE {selectedDetailSession.rpe || 8}</span>
                  </div>
                </div>
              </div>

              {/* NEW: WORKOUT PLAN BUILDER FOR PHASE 3 */}
              <WorkoutBuilder sessionId={selectedDetailSession.id} />

              {/* PT STATUS ACTION BUTTONS */}
              <div className="pt-action-buttons-wrap">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedDetailSession.id, 'completed')}
                  disabled={processingId === selectedDetailSession.id}
                  className="pt-act-btn btn-complete"
                >
                  ✅ Complete Sesi
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedDetailSession.id, 'cancelled')}
                  disabled={processingId === selectedDetailSession.id}
                  className="pt-act-btn btn-cancel"
                >
                  🔴 Cancel
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(selectedDetailSession.id)}
                  disabled={processingId === selectedDetailSession.id}
                  className="pt-act-btn btn-delete"
                >
                  🗑️ Hapus Sesi
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== 16. SMART SEARCH MODAL (PORTAL) ==================== */}
      {mounted && isSearchModalOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsSearchModalOpen(false)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-group">
                <Search size={18} className="text-brand" />
                <h3 className="mc-title">Pencarian Pintar Sesi</h3>
              </div>
              <button type="button" onClick={() => setIsSearchModalOpen(false)} className="mc-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="mc-body">
              <div className="pt-search-input-wrap">
                <Search size={16} className="pt-si-icon" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Ketik nama client, program, lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pt-si-input"
                />
              </div>

              <div className="pt-search-results">
                <span className="pt-sr-count">Ditemukan {ptFilteredSessions.length} sesi</span>
                {ptFilteredSessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedDetailSession(s)
                      setIsSearchModalOpen(false)
                    }}
                    className="pt-sr-item"
                  >
                    <span>{s.clientName} • {s.programType}</span>
                    <span>{format(new Date(s.scheduledAt), 'dd MMM HH:mm')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <CustomModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        type="confirm"
        title="Konfirmasi Hapus Sesi"
        message="Yakin ingin menghapus sesi latihan ini? Kuota paket client akan diperbarui secara otomatis."
        confirmText="Hapus Sesi"
        cancelText="Batal"
        isSubmitting={Boolean(processingId)}
      />

      {/* ==================== GLOBAL ALERT / NOTIFICATION MODAL ==================== */}
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
