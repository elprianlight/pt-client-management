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

  // Filter Chip selection for PT
  const [activeFilterChip, setActiveFilterChip] = useState<'all' | 'today' | 'tomorrow' | 'scheduled' | 'completed' | 'cancelled'>('all')

  // Search Query & Search Modal state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  // Session Detail Bottom Sheet Modal state
  const [selectedDetailSession, setSelectedDetailSession] = useState<any | null>(null)

  // Add / Edit Session Bottom Sheet Modal state
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false)
  const [newSessionPkgId, setNewSessionPkgId] = useState('')
  const [newSessionProgram, setNewSessionProgram] = useState('Total Body')
  const [newSessionTime, setNewSessionTime] = useState('09:00')
  const [newSessionLocation, setNewSessionLocation] = useState('Gym Hang Lekir')
  const [newSessionRpe, setNewSessionRpe] = useState('8')
  const [newSessionNotes, setNewSessionNotes] = useState('')
  const [isSubmittingNewSession, setIsSubmittingNewSession] = useState(false)

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
      } else {
        alert(res.error || 'Gagal memperbarui status sesi')
      }
    } catch (err: any) {
      alert(err.message)
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
      } else {
        alert(res.error || 'Gagal menghapus sesi')
      }
    } catch (err: any) {
      alert(err.message)
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
        status: 'scheduled',
        programType: newSessionProgram,
        rpe: Number(newSessionRpe),
        location: newSessionLocation,
        sessionNotes: newSessionNotes,
      })

      if (res.success) {
        await loadData()
        setIsAddSessionModalOpen(false)
        setNewSessionNotes('')
      } else {
        alert(res.error || 'Gagal menambah sesi baru')
      }
    } catch (err: any) {
      alert(err.message)
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
                <h3>Detail Sesi Latihan</h3>
                <button type="button" onClick={() => setSelectedDetailSession(null)} className="mc-close-btn"><X size={18} /></button>
              </div>
              <div className="mc-body">
                <p><strong>Program:</strong> {selectedDetailSession.programType}</p>
                <p><strong>Waktu:</strong> {format(new Date(selectedDetailSession.scheduledAt), 'dd MMMM yyyy HH:mm', { locale: idLocale })}</p>
                <p><strong>Lokasi:</strong> {selectedDetailSession.location || 'Gym Hang Lekir'}</p>
                <p><strong>Status:</strong> {selectedDetailSession.status}</p>
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
          <div className="pt-session-badge">
            <span>{todayStats.totalSessions} Session Hari Ini</span>
          </div>
        </div>
      </div>

      {/* 2. AI SCHEDULE INSIGHT CARD */}
      <div className="pt-ai-insight-card">
        <div className="pt-ai-header">
          <Sparkles size={16} className="pt-ai-sparkle" />
          <h4 className="pt-ai-title">✨ AI Schedule Insight</h4>
        </div>
        <p className="pt-ai-text">
          Hari ini Anda memiliki <strong>{todayStats.totalSessions} sesi latihan</strong>. Masih tersedia <strong>{todayStats.availableHours} jam kosong</strong>. Disarankan menambahkan maksimal 2 sesi lagi agar jadwal tetap optimal.
        </p>
      </div>

      {/* 4. QUICK STATISTICS (4 COMPACT CARDS) */}
      <div className="pt-quick-stats-grid">
        <div className="pt-stat-card">
          <span className="pt-stat-icon">👥</span>
          <div>
            <span className="pt-stat-val">{todayStats.uniqueClients}</span>
            <span className="pt-stat-lbl">Client</span>
          </div>
        </div>

        <div className="pt-stat-card">
          <span className="pt-stat-icon">🏋️</span>
          <div>
            <span className="pt-stat-val">{todayStats.totalSessions}</span>
            <span className="pt-stat-lbl">Session</span>
          </div>
        </div>

        <div className="pt-stat-card">
          <span className="pt-stat-icon">🟢</span>
          <div>
            <span className="pt-stat-val">{todayStats.availableHours} Jam</span>
            <span className="pt-stat-lbl">Available</span>
          </div>
        </div>

        <div className="pt-stat-card">
          <span className="pt-stat-icon">⏰</span>
          <div>
            <span className="pt-stat-val">{todayStats.occupiedHours} Jam</span>
            <span className="pt-stat-lbl">Occupied</span>
          </div>
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
            <ChevronLeft size={16} />
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
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Toggle View Mode (Hari vs Minggu) */}
        <div className="pt-segmented-control">
          <button
            type="button"
            onClick={() => setScheduleViewMode('day')}
            className={`pt-seg-btn ${scheduleViewMode === 'day' ? 'active' : ''}`}
          >
            📅 Hari
          </button>
          <button
            type="button"
            onClick={() => setScheduleViewMode('week')}
            className={`pt-seg-btn ${scheduleViewMode === 'week' ? 'active' : ''}`}
          >
            📆 Minggu
          </button>
        </div>

        {/* Search Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="pt-search-trigger-btn"
          title="Cari Sesi / Client"
        >
          <Search size={16} />
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
              <p className="pt-empty-desc">Tekan tombol + untuk membuat sesi latihan baru pada tanggal ini.</p>
              <button
                type="button"
                onClick={() => setIsAddSessionModalOpen(true)}
                className="pt-empty-add-btn"
              >
                <Plus size={15} />
                <span>Tambah Session</span>
              </button>
            </div>
          ) : (
            /* COMPACT SESSION TIMELINE CARDS */
            <div className="pt-timeline-list">
              {ptFilteredSessions.map((session, idx) => {
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
              <div className="mc-field">
                <label className="mc-label">Pilih Paket / Client</label>
                <select
                  required
                  value={newSessionPkgId}
                  onChange={(e) => setNewSessionPkgId(e.target.value)}
                  className="mc-select"
                >
                  <option value="">-- Pilih Paket Client --</option>
                  {packagesData.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.clientName} • {pkg.packageName} (Sisa {pkg.totalSessions - pkg.usedSessions} Sesi)
                    </option>
                  ))}
                </select>
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
                <div className="mc-field">
                  <label className="mc-label">Lokasi Latihan</label>
                  <input
                    type="text"
                    value={newSessionLocation}
                    onChange={(e) => setNewSessionLocation(e.target.value)}
                    className="mc-input"
                    placeholder="e.g. Gym Hang Lekir"
                  />
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

              {/* PT STATUS ACTION BUTTONS */}
              <div className="pt-action-buttons-wrap">
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedDetailSession.id, 'check_in')}
                  disabled={processingId === selectedDetailSession.id}
                  className="pt-act-btn btn-checkin"
                >
                  🟢 Check-In
                </button>

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

      {/* ==================== DELETE CONFIRMATION MODAL (PORTAL) ==================== */}
      {mounted && deleteConfirmId && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <h3 className="mc-title">Konfirmasi Hapus Sesi</h3>
            </div>
            <p className="mc-modal-desc">Yakin ingin menghapus sesi latihan ini? Kuota paket client akan diperbarui secara otomatis.</p>
            <div className="mc-actions">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="mc-btn-cancel">Batal</button>
              <button type="button" onClick={handleConfirmDelete} className="mc-btn-danger">Hapus Sesi</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== STYLES ==================== */}
      <style jsx>{`
        .pt-scheduling-system {
          display: flex; flex-direction: column; gap: 14px;
          max-width: 680px; margin: 0 auto; padding-bottom: 70px;
        }

        /* HERO COMPACT */
        .pt-hero-header {
          background: linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.85) 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 24px; padding: 18px 20px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2); backdrop-filter: blur(20px);
        }
        .pt-hero-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .pt-greeting { font-size: 12px; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 0.5px; }
        .pt-name { font-size: 20px; font-weight: 900; color: #ffffff; line-height: 1.2; }
        .pt-date-str { font-size: 12.5px; color: #cbd5e1; }
        .pt-session-badge {
          background: rgba(99, 102, 241, 0.28); border: 1px solid rgba(165, 180, 252, 0.4);
          color: #e0e7ff; padding: 6px 12px; border-radius: 100px; font-size: 12px; font-weight: 800;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* AI SCHEDULE INSIGHT CARD */
        .pt-ai-insight-card {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(99, 102, 241, 0.1) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 18px; padding: 12px 16px;
          backdrop-filter: blur(16px); display: flex; flex-direction: column; gap: 4px;
        }
        .pt-ai-header { display: flex; align-items: center; gap: 6px; }
        :global(.pt-ai-sparkle) { color: #a855f7; }
        .pt-ai-title { font-size: 13px; font-weight: 800; color: #a855f7; }
        .pt-ai-text { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }

        /* QUICK STATS */
        .pt-quick-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .pt-stat-card {
          background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 16px; padding: 10px 8px; display: flex; align-items: center; gap: 8px;
          backdrop-filter: blur(14px);
        }
        .pt-stat-icon { font-size: 16px; }
        .pt-stat-val { font-size: 14px; font-weight: 800; color: var(--text-primary); display: block; line-height: 1.1; }
        .pt-stat-lbl { font-size: 10px; color: var(--text-muted); display: block; }

        /* CONTROL BAR & DATE NAV */
        .pt-nav-control-bar {
          display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
        }
        .pt-date-switcher {
          display: flex; align-items: center; gap: 6px; background: var(--bg-surface);
          border: 1px solid var(--border-default); border-radius: 16px; padding: 4px 8px;
        }
        .pt-date-nav-btn, .pt-search-trigger-btn {
          background: transparent; border: none; color: var(--text-primary);
          width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .pt-today-btn {
          background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3);
          color: var(--brand-primary); font-size: 11.5px; font-weight: 800; padding: 3px 8px; border-radius: 8px; cursor: pointer;
        }
        .pt-current-date-txt { font-size: 12px; font-weight: 700; color: var(--text-primary); min-width: 80px; text-align: center; }

        /* SEGMENTED CONTROL */
        .pt-segmented-control {
          display: flex; align-items: center; background: var(--bg-surface);
          border: 1px solid var(--border-default); border-radius: 16px; padding: 3px; gap: 4px;
        }
        .pt-seg-btn {
          padding: 5px 12px; border-radius: 12px; border: none; background: transparent;
          color: var(--text-muted); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .pt-seg-btn.active { background: var(--brand-primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

        /* FILTER CHIPS */
        .pt-filter-chips-wrap {
          display: flex; align-items: center; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;
        }
        .pt-chip-btn {
          padding: 5px 12px; border-radius: 100px; background: var(--bg-surface);
          border: 1px solid var(--border-default); color: var(--text-secondary); font-size: 11.5px; font-weight: 600;
          white-space: nowrap; cursor: pointer; transition: all 0.2s;
        }
        .pt-chip-btn.active { background: rgba(99, 102, 241, 0.15); border-color: var(--brand-primary); color: var(--brand-primary); font-weight: 800; }

        /* DAY TIMELINE GRID */
        .pt-day-timeline { display: flex; flex-direction: column; gap: 10px; }
        .pt-timeline-list { display: flex; flex-direction: column; gap: 10px; }
        .pt-timeline-row { display: flex; gap: 12px; cursor: pointer; }
        .pt-time-col {
          width: 50px; display: flex; flex-direction: column; align-items: center; pt-2; flex-shrink: 0;
        }
        .pt-time-txt { font-size: 12.5px; font-weight: 800; color: var(--text-muted); }
        .pt-time-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-primary); margin-top: 4px; }

        .pt-compact-card {
          flex: 1; background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 18px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
          backdrop-filter: blur(16px); transition: all 0.2s;
        }
        .pt-compact-card:hover { transform: translateY(-2px); border-color: rgba(99, 102, 241, 0.4); }
        .pt-cc-header { display: flex; align-items: center; justify-content: space-between; }
        .pt-cc-client { font-size: 14.5px; font-weight: 800; color: var(--text-primary); }
        .pt-cc-body { display: flex; flex-direction: column; gap: 2px; }
        .pt-cc-prog { font-size: 13px; font-weight: 700; color: var(--brand-primary); }
        .pt-cc-meta { font-size: 11.5px; color: var(--text-muted); }

        .pt-status-pill {
          padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 800;
        }
        .pill-scheduled { background: rgba(99, 102, 241, 0.14); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3); }
        .pill-checkin { background: rgba(16, 185, 129, 0.14); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .pill-completed { background: rgba(16, 185, 129, 0.18); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
        .pill-cancelled { background: rgba(239, 68, 68, 0.14); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

        .pt-available-slot-card {
          background: rgba(99, 102, 241, 0.06); border: 1px dashed rgba(99, 102, 241, 0.3);
          border-radius: 16px; padding: 12px; text-align: center; color: var(--brand-primary);
          font-size: 12px; font-weight: 700; cursor: pointer; margin-top: 4px;
        }

        /* WEEK VIEW GRID */
        .pt-week-grid-container { display: flex; flex-direction: column; gap: 10px; }
        .pt-week-header-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .pt-week-day-col {
          background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 14px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; gap: 2px; cursor: pointer;
        }
        .pt-week-day-col.is-today { border-color: var(--brand-primary); background: rgba(99, 102, 241, 0.1); }
        .pt-week-day-col.is-selected { background: var(--brand-primary); color: white; }
        .pt-wd-name { font-size: 10.5px; font-weight: 600; }
        .pt-wd-num { font-size: 13px; font-weight: 800; }

        .pt-week-body-list { display: flex; flex-direction: column; gap: 8px; }
        .pt-week-day-row {
          background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 16px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px;
        }
        .pt-wdr-header { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--text-primary); }
        .pt-wdr-count { font-size: 11px; color: var(--brand-primary); }
        .pt-week-empty-slot { font-size: 11.5px; color: var(--text-muted); cursor: pointer; padding: 4px 0; }
        .pt-week-cards-grid { display: flex; flex-direction: column; gap: 4px; }
        .pt-week-card {
          background: var(--bg-elevated); border-radius: 8px; padding: 6px 10px;
          display: flex; align-items: center; justify-content: space-between; font-size: 12px; cursor: pointer;
        }
        .pt-wc-time { font-weight: 800; color: var(--brand-primary); }
        .pt-wc-name { font-weight: 700; color: var(--text-primary); }
        .pt-wc-prog { color: var(--text-muted); font-size: 11px; }

        /* FAB */
        .pt-floating-fab {
          position: fixed; bottom: 80px; right: 20px;
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white; border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 28px rgba(99, 102, 241, 0.5);
          display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 99;
        }

        /* EMPTY STATE */
        .pt-empty-schedule {
          background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 20px; padding: 32px 20px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .pt-empty-icon { font-size: 36px; }
        .pt-empty-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .pt-empty-desc { font-size: 12px; color: var(--text-muted); max-width: 320px; }
        .pt-empty-add-btn {
          margin-top: 6px; padding: 8px 16px; background: var(--brand-primary);
          color: white; border: none; border-radius: 100px; font-size: 12.5px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
        }

        /* DETAIL MODAL SECTIONS */
        .pt-detail-sec { display: flex; flex-direction: column; gap: 10px; }
        .pt-dt-client { font-size: 18px; font-weight: 900; color: var(--text-primary); }
        .pt-dt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pt-dt-item { background: var(--bg-surface); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
        .pt-dt-lbl { font-size: 10.5px; color: var(--text-muted); }
        .pt-dt-val { font-size: 12.5px; font-weight: 700; color: var(--text-primary); }

        .pt-action-buttons-wrap { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 10px; }
        .pt-act-btn {
          height: 38px; border-radius: 12px; border: none; font-size: 12.5px; font-weight: 800; cursor: pointer;
        }
        .btn-checkin { background: rgba(16, 185, 129, 0.16); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .btn-complete { background: #10b981; color: white; }
        .btn-cancel { background: rgba(239, 68, 68, 0.16); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-delete { background: var(--bg-surface); border: 1px solid var(--border-default); color: var(--text-secondary); }

        /* SEARCH MODAL */
        .pt-search-input-wrap { position: relative; display: flex; align-items: center; }
        :global(.pt-si-icon) { position: absolute; left: 12px; color: var(--text-muted); }
        .pt-si-input {
          width: 100%; height: 42px; background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 12px; color: var(--text-primary); font-size: 13px; padding-left: 36px; padding-right: 12px; outline: none;
        }
        .pt-search-results { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .pt-sr-count { font-size: 11px; color: var(--text-muted); font-weight: 600; }
        .pt-sr-item {
          background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 10px;
          padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; color: var(--text-primary); cursor: pointer;
        }

        /* CLIENT STYLES */
        .compact-session-wrapper { display: flex; flex-direction: column; gap: 12px; }
        .client-single-filter-card { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 16px; padding: 10px 14px; backdrop-filter: blur(16px); }
        .csf-inner { display: flex; align-items: center; gap: 10px; color: var(--brand-primary); }
        .csf-select { width: 100%; height: 40px; background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: 12px; color: var(--text-primary); font-size: 13.5px; font-weight: 700; padding: 0 12px; outline: none; }
        .csf-usage-box { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 8px; }
        .csf-usage-top { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; }
        .csf-usage-text { color: var(--text-secondary); font-weight: 500; }
        .csf-usage-percent { color: #818cf8; font-weight: 900; font-size: 15px; }
        .csf-progress-bar-bg { width: 100%; height: 7px; background: rgba(255, 255, 255, 0.08); border-radius: 100px; overflow: hidden; }
        .csf-progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%); border-radius: 100px; }
        .csf-usage-bottom { display: flex; align-items: center; font-size: 13px; }
        .csf-remaining-text { color: #10b981; font-weight: 800; }
        .compact-session-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 10px; }
        .compact-card { background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 16px; padding: 14px 16px; backdrop-filter: blur(16px); display: flex; flex-direction: column; gap: 8px; cursor: pointer; }
        .c-row-1 { display: flex; align-items: center; justify-content: space-between; }
        .c-datetime { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
        .c-program { font-size: 15px; font-weight: 800; color: var(--text-primary); }
        .c-details-row { display: flex; gap: 12px; font-size: 11.5px; color: var(--text-muted); }

        /* MODAL COMMON */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(16px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-card { width: 100%; max-width: 500px; background: var(--bg-elevated); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.15); padding: 20px 22px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5); display: flex; flex-direction: column; gap: 14px; max-height: 85vh; overflow-y: auto; }
        .mc-header { display: flex; align-items: center; justify-content: space-between; }
        .mc-title-group { display: flex; align-items: center; gap: 8px; }
        .mc-icon-badge { width: 36px; height: 36px; border-radius: 10px; background: rgba(99, 102, 241, 0.15); color: #6366f1; display: flex; align-items: center; justify-content: center; }
        .mc-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .mc-sub { font-size: 11.5px; color: var(--text-muted); }
        .mc-close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
        .mc-form { display: flex; flex-direction: column; gap: 10px; }
        .mc-field { display: flex; flex-direction: column; gap: 4px; }
        .mc-field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .mc-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .mc-input, .mc-select, .mc-textarea { width: 100%; background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 10px; color: var(--text-primary); font-size: 13px; padding: 8px 12px; outline: none; }
        .mc-actions { display: flex; gap: 8px; margin-top: 8px; }
        .mc-btn-cancel { flex: 1; height: 40px; border-radius: 12px; background: var(--bg-surface); border: 1px solid var(--border-default); color: var(--text-secondary); font-size: 13px; font-weight: 700; cursor: pointer; }
        .mc-btn-save { flex: 1; height: 40px; border-radius: 12px; background: var(--brand-primary); border: none; color: white; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .mc-btn-danger { flex: 1; height: 40px; border-radius: 12px; background: #ef4444; border: none; color: white; font-size: 13px; font-weight: 700; cursor: pointer; }

        @media (max-width: 640px) {
          .pt-quick-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .pt-action-buttons-wrap { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
