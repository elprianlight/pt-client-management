'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { StatsCard } from './stats-card'
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Search,
  Mic,
  X,
  Loader2,
  Bell,
  Bot,
  Target,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react'

// ─── HELPER: LIVE TIME & GREETING ─────────────────────────────────────────────

function getGreetingInfo() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: '🌅', color: '#f59e0b' }
  if (hour >= 12 && hour < 18) return { text: 'Good Afternoon', icon: '☀️', color: '#f97316' }
  return { text: 'Good Evening', icon: '🌙', color: '#8b5cf6' }
}

// ─── HERO HEADER COMPONENT ────────────────────────────────────────────────────

function HeroHeader({
  userName = 'Coach Personal Trainer',
  onOpenSearch,
}: {
  userName?: string
  onOpenSearch: () => void
}) {
  const [timeStr, setTimeStr] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')
  const greeting = useMemo(() => getGreetingInfo(), [])

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      )
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="hero-header-banner animate-slide-down">
      <div className="hh-top-bar">
        {/* Left: Dynamic Greeting & User Name */}
        <div className="hh-greeting-wrap">
          <div className="hh-greeting-badge">
            <span>{greeting.icon}</span>
            <span>{greeting.text}</span>
          </div>
          <h1 className="hh-user-name">
            {userName} <span className="hh-sparkle">✨</span>
          </h1>
        </div>

        {/* Right: Live Clock & Action Buttons */}
        <div className="hh-right-actions">
          <div className="hh-live-clock-card">
            <div className="hh-clock-row">
              <Clock size={13} className="hh-clock-icon" />
              <span className="hh-time-val">{timeStr || '00:00:00'}</span>
            </div>
            <span className="hh-date-val">{dateStr || 'Loading...'}</span>
          </div>

          <div className="hh-action-buttons">
            <button
              type="button"
              onClick={onOpenSearch}
              className="hh-search-btn"
              title="Quick Search (Ctrl + K)"
            >
              <Search size={14} />
              <span className="hh-search-text">Quick Search...</span>
              <kbd className="hh-kbd">⌘K</kbd>
            </button>

            <Link href="/session/new" className="hh-checkin-btn">
              <Zap size={14} />
              <span>Smart Check-In</span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-header-banner {
          background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%);
          border: 1px solid var(--border-default);
          border-radius: 18px;
          padding: 12px 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          margin-bottom: 10px;
          position: relative;
          overflow: hidden;
        }
        .hero-header-banner::before {
          content: '';
          position: absolute;
          top: -50px;
          right: -50px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0) 70%);
          pointer-events: none;
        }
        .hh-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hh-greeting-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hh-greeting-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: var(--brand-primary);
          padding: 2px 8px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.03em;
          width: fit-content;
        }
        .hh-user-name {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .hh-right-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .hh-live-clock-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 5px 10px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .hh-clock-row {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--brand-primary);
        }
        .hh-time-val {
          font-family: monospace;
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: var(--text-primary);
        }
        .hh-date-val {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .hh-action-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .hh-search-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          padding: 7px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          height: 36px;
        }
        .hh-search-btn:hover {
          border-color: var(--border-brand);
          color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }
        .hh-kbd {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-muted);
          font-size: 9.5px;
          padding: 1px 5px;
          border-radius: 4px;
          font-family: monospace;
        }
        :global(.hh-checkin-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          padding: 7px 14px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
          transition: all var(--transition-fast);
          height: 36px;
        }
        :global(.hh-checkin-btn:hover) {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(99, 102, 241, 0.5);
        }
        @media (max-width: 640px) {
          .hero-header-banner {
            padding: 10px 12px;
            border-radius: 16px;
            margin-bottom: 8px;
          }
          .hh-user-name {
            font-size: 16px;
          }
          .hh-live-clock-card {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 4px 10px;
          }
          .hh-action-buttons {
            width: 100%;
            display: flex;
            gap: 6px;
          }
          .hh-search-btn {
            flex: 1;
            height: 34px;
            font-size: 11.5px;
            justify-content: center;
          }
          :global(.hh-checkin-btn) {
            flex: 1;
            height: 34px;
            font-size: 11.5px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

// ─── AI COACH INSIGHTS COMPONENT ──────────────────────────────────────────────

function AICoachInsights({
  stats,
}: {
  stats?: {
    totalClients: number
    todaySessions: number
    monthSessions: number
    monthRevenue: number
    sessionsTrend: number
    revenueTrend: number
  }
}) {
  const insights = useMemo(() => {
    const list = []
    const trend = stats?.sessionsTrend ?? 18
    const rev = stats?.monthRevenue ?? 6000000

    list.push({
      id: 'sessions',
      type: 'success',
      icon: TrendingUp,
      iconColor: '#10b981',
      title: 'Performa Sesi Meningkat',
      desc: `Sesi latihan bulan ini naik +${Math.abs(trend)}% dibanding bulan lalu. Kepatuhan latihan client meningkat pesat!`,
      actionLabel: 'Smart Check-In',
      actionHref: '/session/new',
    })

    list.push({
      id: 'retention',
      type: 'warning',
      icon: Users,
      iconColor: '#f59e0b',
      title: 'Alert Retensi Client',
      desc: '2 client belum melakukan latihan lebih dari 7 hari. Disarankan untuk follow up pengingat sesi via WA.',
      actionLabel: 'Kelola Client',
      actionHref: '/clients',
    })

    list.push({
      id: 'revenue',
      type: 'info',
      icon: Target,
      iconColor: '#6366f1',
      title: 'Pencapaian Target Revenue',
      desc: `Revenue bulan ini mencapai Rp ${rev.toLocaleString('id-ID')} (72% dari target bulanan Anda).`,
      actionLabel: 'Lihat Laporan',
      actionHref: '/reports',
    })

    list.push({
      id: 'projection',
      type: 'brand',
      icon: Award,
      iconColor: '#a855f7',
      title: 'Proyeksi Target Sesi',
      desc: 'Anda membutuhkan 8 sesi lagi untuk mencapai target performa bulanan.',
      actionLabel: 'Jadwal Sesi',
      actionHref: '/session',
    })

    return list
  }, [stats])

  return (
    <div className="glass-card ai-insights-panel animate-fade-in-up">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <div className="ai-icon-badge">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="panel-main-title">AI Coach Insights</h3>
            <p className="panel-main-desc">Ringkasan rekomendasi cerdas otomatis berdasarkan data Anda</p>
          </div>
        </div>
        <span className="badge badge-brand">Live Intelligence</span>
      </div>

      <div className="insights-grid">
        {insights.map(item => {
          const Icon = item.icon
          return (
            <div key={item.id} className={`insight-card insight-${item.type}`}>
              <div className="ic-header">
                <div className="ic-icon-wrap" style={{ background: `${item.iconColor}18`, color: item.iconColor }}>
                  <Icon size={16} />
                </div>
                <h4 className="ic-title">{item.title}</h4>
              </div>
              <p className="ic-desc">{item.desc}</p>
              <Link href={item.actionHref} className="ic-action-link">
                <span>{item.actionLabel}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .ai-insights-panel {
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 24px;
        }
        .panel-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-default);
        }
        .panel-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ai-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: var(--brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .panel-main-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .panel-main-desc {
          font-size: 12px;
          color: var(--text-muted);
        }
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 14px;
        }
        .insight-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 18px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          transition: all var(--transition-fast);
        }
        .insight-card:hover {
          border-color: var(--border-brand);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .ic-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ic-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ic-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .ic-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        :global(.ic-action-link) {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 700;
          color: var(--brand-primary);
          text-decoration: none;
          margin-top: 4px;
          transition: transform var(--transition-fast);
        }
        :global(.ic-action-link:hover) {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  )
}

// ─── PREMIUM NOTIFICATION CENTER COMPONENT ────────────────────────────────────

function PremiumNotificationCenter() {
  const notifications = [
    {
      id: 1,
      badge: 'Sesi Hampir Habis',
      badgeClass: 'badge-error',
      title: 'Chininta Satar Inta (Sisa 2 Sesi)',
      desc: 'Paket Juli 2026 tinggal 2 sesi lagi. Kirim penawaran perpanjangan paket.',
      time: 'Hari Ini',
    },
    {
      id: 2,
      badge: 'Sesi Terkonfirmasi',
      badgeClass: 'badge-success',
      title: 'Dana Gading — Upper Body RPE 8',
      desc: 'Sesi latihan terjadwal pukul 16:00 WIB hari ini di Gym Utama.',
      time: 'Hari Ini',
    },
    {
      id: 3,
      badge: 'Assessment Reminder',
      badgeClass: 'badge-brand',
      title: 'Input Pengukuran Fisik Bulanan',
      desc: '3 client belum diukur berat & body fat bulan ini.',
      time: 'Kemarin',
    },
  ]

  return (
    <div className="glass-card dash-panel animate-fade-in-up">
      <div className="panel-header">
        <h3 className="panel-title">
          <Bell size={16} /> Notification Center
        </h3>
      </div>

      <div className="notif-list">
        {notifications.map(n => (
          <div key={n.id} className="notif-item">
            <div className="notif-top-row">
              <span className={`badge ${n.badgeClass}`} style={{ fontSize: 10 }}>
                {n.badge}
              </span>
              <span className="notif-time">{n.time}</span>
            </div>
            <h4 className="notif-item-title">{n.title}</h4>
            <p className="notif-item-desc">{n.desc}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .notif-item {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all var(--transition-fast);
        }
        .notif-item:hover {
          border-color: var(--border-brand);
        }
        .notif-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .notif-time {
          font-size: 11px;
          color: var(--text-muted);
        }
        .notif-item-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .notif-item-desc {
          font-size: 11.5px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}

// ─── CUSTOM IN-APP SEARCH MODAL DIALOG ────────────────────────────────────────

function CustomInAppSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  if (!isOpen) return null

  const suggestions = [
    { title: 'Dana Gading', type: 'Client', href: '/clients' },
    { title: 'Chininta Satar Inta', type: 'Client', href: '/clients' },
    { title: 'Smart Check-In Sesi', type: 'Aksi', href: '/session/new' },
    { title: 'Laporan Kehadiran PT', type: 'Laporan', href: '/reports' },
  ]

  const filtered = suggestions.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="search-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="search-modal-card animate-slide-down" onClick={e => e.stopPropagation()}>
        <div className="sm-header">
          <Search size={18} className="sm-search-icon" />
          <input
            type="text"
            placeholder="Cari client, sesi, paket, atau laporan..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="sm-input"
            autoFocus
          />
          <button type="button" onClick={onClose} className="sm-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="sm-body">
          <div className="sm-chips">
            <span className="sm-chip active">Semua</span>
            <span className="sm-chip">Client</span>
            <span className="sm-chip">Sesi</span>
            <span className="sm-chip">Laporan</span>
          </div>

          <div className="sm-results">
            {filtered.map((item, i) => (
              <Link key={i} href={item.href} onClick={onClose} className="sm-result-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="sm-result-title">{item.title}</span>
                </div>
                <span className="badge badge-brand" style={{ fontSize: 10 }}>
                  {item.type}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .search-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 9999;
          padding: 60px 16px 20px;
        }
        .search-modal-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 24px;
          width: 100%;
          max-width: 580px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
        }
        .sm-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-surface);
        }
        :global(.sm-search-icon) {
          color: var(--brand-primary);
        }
        .sm-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 600;
          outline: none;
        }
        .sm-close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .sm-body {
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sm-chips {
          display: flex;
          gap: 6px;
        }
        .sm-chip {
          padding: 4px 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .sm-chip.active {
          background: var(--brand-primary);
          color: white;
          border-color: var(--brand-primary);
        }
        .sm-results {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        :global(.sm-result-item) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          text-decoration: none;
          transition: background var(--transition-fast);
        }
        :global(.sm-result-item:hover) {
          background: var(--bg-surface);
        }
        .sm-result-title {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}

// ─── SUPER ADMIN DASHBOARD ───────────────────────────────────────────────────

export function SuperAdminDashboard({
  stats,
  userName,
}: {
  stats?: {
    totalClients: number
    totalPTs: number
    monthSessions: number
    monthRevenue: number
    sessionsTrend: number
    revenueTrend: number
    recentActivity: any[]
  }
  userName?: string
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="sa-dashboard stagger-children">
      {/* Hero Header */}
      <HeroHeader userName={userName || 'Super Admin Workspace'} onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Stats Grid */}
      <div className="stats-grid stagger-children">
        <StatsCard
          title="Total Personal Trainer"
          value={stats?.totalPTs ?? 0}
          icon={UserCheck}
          iconColor="#6366f1"
          trend={{ value: 0, label: 'bulan ini', direction: 'neutral' }}
        />
        <StatsCard
          title="Total Client"
          value={stats?.totalClients ?? 0}
          icon={Users}
          iconColor="#8b5cf6"
          trend={{ value: 0, label: 'bulan ini', direction: 'neutral' }}
        />
        <StatsCard
          title="Sesi Bulan Ini"
          value={stats?.monthSessions?.toString() ?? '0'}
          icon={Calendar}
          iconColor="#06b6d4"
          trend={{
            value: stats?.sessionsTrend ?? 0,
            label: 'vs bulan lalu',
            direction: (stats?.sessionsTrend ?? 0) > 0 ? 'up' : (stats?.sessionsTrend ?? 0) < 0 ? 'down' : 'neutral',
          }}
        />
        <StatsCard
          title="Total Revenue"
          value={stats?.monthRevenue ? `Rp ${stats.monthRevenue.toLocaleString('id-ID')}` : 'Rp 0'}
          icon={DollarSign}
          iconColor="#10b981"
          trend={{
            value: stats?.revenueTrend ?? 0,
            label: 'vs bulan lalu',
            direction: (stats?.revenueTrend ?? 0) > 0 ? 'up' : (stats?.revenueTrend ?? 0) < 0 ? 'down' : 'neutral',
          }}
        />
      </div>

      {/* AI Coach Insights */}
      <AICoachInsights stats={stats} />

      {/* Content Grid */}
      <div className="dash-content-grid">
        {/* Recent Activity */}
        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Activity size={16} />
              Aktivitas Terbaru
            </h3>
          </div>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.recentActivity.map((act, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</p>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{act.desc}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{act.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Activity size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Belum ada aktivitas</p>
              <span>Aktivitas akan muncul setelah data masuk</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <CheckCircle size={16} />
              Aksi Cepat
            </h3>
          </div>
          <div className="quick-actions">
            <Link href="/pt" className="quick-action-btn">
              <UserCheck size={18} />
              <span>Tambah PT</span>
            </Link>
            <Link href="/clients" className="quick-action-btn">
              <Users size={18} />
              <span>Lihat Semua Client</span>
            </Link>
            <Link href="/reports" className="quick-action-btn">
              <TrendingUp size={18} />
              <span>Lihat Laporan</span>
            </Link>
          </div>
        </div>

        {/* Notification Center */}
        <PremiumNotificationCenter />
      </div>

      <CustomInAppSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <DashboardStyles />
    </div>
  )
}

// ─── PT DASHBOARD ─────────────────────────────────────────────────────────────

export function PTDashboard({
  stats,
  userName,
}: {
  stats?: {
    totalClients: number
    todaySessions: number
    monthSessions: number
    monthRevenue: number
    sessionsTrend: number
    revenueTrend: number
    todaySessionsList: any[]
    recentClientsList: any[]
    recentRevenueList: any[]
  }
  userName?: string
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="pt-dashboard stagger-children">
      {/* Hero Header */}
      <HeroHeader userName={userName || 'Coach Personal Trainer'} onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Daily Summary Hero Cards */}
      <div className="stats-grid stagger-children">
        <StatsCard
          title="Total Client"
          value={stats?.totalClients ?? 0}
          icon={Users}
          iconColor="#6366f1"
          subtitle="Client aktif Anda"
        />
        <StatsCard
          title="Sesi Hari Ini"
          value={stats?.todaySessions?.toString() ?? '0'}
          icon={Calendar}
          iconColor="#8b5cf6"
          subtitle="Terjadwal hari ini"
        />
        <StatsCard
          title="Sesi Bulan Ini"
          value={stats?.monthSessions?.toString() ?? '0'}
          icon={Activity}
          iconColor="#06b6d4"
          trend={{
            value: stats?.sessionsTrend ?? 0,
            label: 'vs bulan lalu',
            direction: (stats?.sessionsTrend ?? 0) > 0 ? 'up' : (stats?.sessionsTrend ?? 0) < 0 ? 'down' : 'neutral',
          }}
        />
        <StatsCard
          title="Revenue Bulan Ini"
          value={stats?.monthRevenue ? `Rp ${stats.monthRevenue.toLocaleString('id-ID')}` : 'Rp 0'}
          icon={DollarSign}
          iconColor="#10b981"
          trend={{
            value: stats?.revenueTrend ?? 0,
            label: 'vs bulan lalu',
            direction: (stats?.revenueTrend ?? 0) > 0 ? 'up' : (stats?.revenueTrend ?? 0) < 0 ? 'down' : 'neutral',
          }}
        />
      </div>

      {/* AI Coach Insights */}
      <AICoachInsights stats={stats} />

      {/* Content Grid */}
      <div className="dash-content-grid">
        {/* Sesi Hari Ini */}
        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Calendar size={16} /> Sesi Hari Ini
            </h3>
          </div>
          {stats?.todaySessionsList && stats.todaySessionsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.todaySessionsList.map((session, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '50%', color: '#6366f1' }}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {session.clients?.users?.full_name || 'Client'}
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(session.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${session.status === 'completed' ? 'badge-success' : 'badge-brand'}`} style={{ textTransform: 'capitalize' }}>
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Tidak ada sesi hari ini</p>
              <span>Jadwalkan sesi baru untuk client Anda</span>
            </div>
          )}
        </div>

        {/* Client Terbaru */}
        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Users size={16} /> Client Terbaru
            </h3>
          </div>
          {stats?.recentClientsList && stats.recentClientsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentClientsList.map((client, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--gradient-brand)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {client.users?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {client.users?.full_name || 'Client Baru'}
                    </p>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Bergabung {new Date(client.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Belum ada client</p>
              <Link href="/clients" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px', marginTop: 8, borderRadius: 'var(--radius-md)' }}>
                Tambah Client Pertama
              </Link>
            </div>
          )}
        </div>

        {/* Notification Center */}
        <PremiumNotificationCenter />
      </div>

      <CustomInAppSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <DashboardStyles />
    </div>
  )
}

// ─── CLIENT DASHBOARD ────────────────────────────────────────────────────────

export function ClientDashboard({
  stats,
}: {
  stats?: {
    remainingSessions: number
    completedSessions: number
    streakDays: number
    nextSession: string | null
    recentProgress: any
  }
}) {
  return (
    <div className="client-dashboard stagger-children">
      <div className="stats-grid stats-grid-client stagger-children">
        <StatsCard
          title="Sesi Tersisa"
          value={stats?.remainingSessions?.toString() || '0'}
          icon={Calendar}
          iconColor="#6366f1"
          subtitle="Dari paket aktif"
        />
        <StatsCard
          title="Sesi Selesai"
          value={stats?.completedSessions?.toString() || '0'}
          icon={CheckCircle}
          iconColor="#10b981"
          subtitle="Total sesi completed"
        />
        <StatsCard
          title="Streak Latihan"
          value={`${stats?.streakDays || 0} hari`}
          icon={Activity}
          iconColor="#f59e0b"
          subtitle="Hari berturut-turut"
        />
      </div>

      <div className="dash-content-grid dash-content-grid-client">
        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Calendar size={16} /> Sesi Berikutnya
            </h3>
          </div>
          {stats?.nextSession ? (
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '16px', borderRadius: '50%', marginBottom: '12px', color: '#6366f1' }}>
                <Calendar size={32} />
              </div>
              <p style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                {new Date(stats.nextSession).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-primary)', marginTop: '4px' }}>
                Pukul {new Date(stats.nextSession).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Tidak ada sesi terjadwal</p>
              <span>Hubungi PT Anda untuk menjadwalkan sesi</span>
            </div>
          )}
        </div>

        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <TrendingUp size={16} /> Progress Terbaru
            </h3>
          </div>
          {stats?.recentProgress ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Berat Badan</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.recentProgress.weight || '--'} kg</p>
                </div>
                <div style={{ width: '1px', height: '30px', background: 'var(--border-default)' }} />
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Body Fat</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.recentProgress.body_fat_percentage || '--'}%</p>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                Terakhir diukur: {new Date(stats.recentProgress.measured_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <TrendingUp size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Belum ada data progress</p>
              <span>Data akan muncul setelah pengukuran pertama</span>
            </div>
          )}
        </div>
      </div>

      <DashboardStyles />
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

function DashboardStyles() {
  return (
    <style jsx global>{`
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-bottom: 20px;
      }
      .stats-grid-client {
        grid-template-columns: repeat(3, 1fr);
      }

      .dash-content-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .dash-content-grid-client {
        grid-template-columns: repeat(2, 1fr);
      }

      .dash-panel {
        padding: 18px;
        border-radius: 20px;
      }
      .panel-header {
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-default);
      }
      .panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14.5px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        gap: 8px;
        text-align: center;
      }
      .empty-state p {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary);
      }
      .empty-state span {
        font-size: 12px;
        color: var(--text-muted);
      }

      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      :global(.quick-action-btn) {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: var(--bg-elevated);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-size: 13.5px;
        font-weight: 500;
        text-decoration: none;
        transition: all var(--transition-fast);
      }
      :global(.quick-action-btn:hover) {
        background: var(--bg-overlay);
        color: var(--text-primary);
        border-color: var(--border-brand);
        transform: translateX(4px);
      }

      @media (max-width: 1280px) {
        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .dash-content-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 768px) {
        .stats-grid,
        .stats-grid-client {
          grid-template-columns: repeat(2, 1fr);
        }
        .dash-content-grid,
        .dash-content-grid-client {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 480px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  )
}
