'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ProgressChart } from './progress-chart'
import { NutritionTracker } from './nutrition-tracker'
import { CustomModal } from '@/components/ui/custom-modal'
import {
  Calendar,
  CheckCircle,
  Activity,
  TrendingUp,
  Clock,
  Sparkles,
  Flame,
  Award,
  Dumbbell,
  MapPin,
  User,
  MessageCircle,
  PhoneCall,
  X,
  Zap,
  Target,
  Scale,
  HeartPulse,
  ChevronRight,
  Droplets,
  Moon,
  Footprints,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

function getGreetingInfo() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: '🌅' }
  if (hour >= 12 && hour < 18) return { text: 'Good Afternoon', icon: '☀️' }
  return { text: 'Good Evening', icon: '🌙' }
}

export function ClientDashboard({
  stats,
  userName = 'Client',
}: {
  stats?: {
    remainingSessions: number
    completedSessions: number
    streakDays: number
    nextSession: string | null
    recentProgress: any
  }
  userName?: string
}) {
  const greeting = useMemo(() => getGreetingInfo(), [])

  // Live Clock
  const [timeStr, setTimeStr] = useState<string>('')
  const [dayStr, setDayStr] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>('')

  // Contact PT Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)

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
      setDayStr(now.toLocaleDateString('id-ID', { weekday: 'long' }))
      setDateStr(
        now.toLocaleDateString('id-ID', {
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

  const remaining = stats?.remainingSessions ?? 5
  const completed = stats?.completedSessions ?? 15
  const streak = stats?.streakDays ?? 12
  const targetPercent = Math.min(100, Math.round((completed / (completed + remaining || 1)) * 100))

  return (
    <div className="client-dashboard-wrapper animate-fade-in">
      {/* ==================== 1. PREMIUM HERO DASHBOARD (180–220px) ==================== */}
      <div className="client-hero-card animate-slide-down">
        <div className="c-hero-orb c-hero-orb-1" />
        <div className="c-hero-orb c-hero-orb-2" />
        <div className="c-hero-pattern" />

        <div className="c-hero-content">
          <div className="c-hero-left">
            <div className="c-greeting-pill">
              <span>{greeting.icon}</span>
              <span>{greeting.text} 👋</span>
            </div>

            <div className="c-welcome-typography">
              <span className="c-welcome-sub">Welcome Back,</span>
              <h1 className="c-welcome-name">
                {userName} <span className="c-sparkle">✨</span>
              </h1>
            </div>

            <div className="c-ai-motivation">
              <Flame size={14} className="c-mot-icon" />
              <span>🔥 Hari ini adalah waktu terbaik untuk menjadi lebih kuat.</span>
            </div>
          </div>

          <div className="c-hero-right">
            <div className="c-live-clock-card">
              <div className="c-clock-top">
                <Clock size={15} className="c-clock-icon" />
                <span className="c-time-val">{timeStr || '00:00:00'}</span>
              </div>
              <div className="c-clock-bottom">
                <span>{dayStr || 'Hari ini'}</span>
                <span>•</span>
                <span>{dateStr || '...'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 2. QUICK OVERVIEW (4 COMPACT ANALYTICS CARDS 2x2, MAX 110px) ==================== */}
      <div className="client-analytics-grid">
        {/* Card 1: Sisa Sesi */}
        <div className="compact-analytics-card">
          <div className="cac-top">
            <span className="cac-title">Sisa Sesi</span>
            <div className="cac-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="cac-value">{remaining}</div>
          <span className="cac-sub">Dari paket aktif</span>
        </div>

        {/* Card 2: Sesi Selesai */}
        <div className="compact-analytics-card">
          <div className="cac-top">
            <span className="cac-title">Sesi Selesai</span>
            <div className="cac-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="cac-value">{completed}</div>
          <span className="cac-sub">Total completed</span>
        </div>

        {/* Card 3: Training Streak */}
        <div className="compact-analytics-card">
          <div className="cac-top">
            <span className="cac-title">Training Streak</span>
            <div className="cac-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Flame size={18} />
            </div>
          </div>
          <div className="cac-value">{streak} <span className="cac-unit">Hari</span></div>
          <span className="cac-sub">Hari berturut-turut</span>
        </div>

        {/* Card 4: Target Bulan */}
        <div className="compact-analytics-card">
          <div className="cac-top">
            <span className="cac-title">Target Bulan</span>
            <div className="cac-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Target size={18} />
            </div>
          </div>
          <div className="cac-value-row">
            <span className="cac-value">{targetPercent}%</span>
            {/* SVG Circular Progress Ring */}
            <div className="cac-ring-wrap">
              <svg width="28" height="28" viewBox="0 0 36 36" className="circular-ring">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="3.8"
                />
                <path
                  className="circle-fill"
                  strokeDasharray={`${targetPercent}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3.8"
                />
              </svg>
            </div>
          </div>
          <span className="cac-sub">Pencapaian kuota</span>
        </div>
      </div>

      {/* ==================== 3. NEXT TRAINING CARD ==================== */}
      <div className="client-panel-card">
        <div className="cp-header">
          <div className="cp-title-wrap">
            <Calendar size={18} className="cp-title-icon" />
            <h3 className="cp-title">Sesi Latihan Berikutnya</h3>
          </div>
          <span className="cp-badge-pill">📌 Terjadwal</span>
        </div>

        {stats?.nextSession ? (
          <div className="next-session-box">
            <div className="ns-main-info">
              <div className="ns-program-row">
                <Dumbbell size={20} className="ns-prog-icon" />
                <div>
                  <h4 className="ns-program-name">Total Body Training</h4>
                  <span className="ns-date-text">
                    📅 {new Date(stats.nextSession).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Pukul {new Date(stats.nextSession).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="ns-meta-grid">
                <div className="ns-meta-item">
                  <MapPin size={13} style={{ color: 'var(--brand-primary)' }} />
                  <span>📍 Gym Hang Lekir</span>
                </div>
                <div className="ns-meta-item">
                  <User size={13} style={{ color: '#a855f7' }} />
                  <span>Coach Personal Trainer</span>
                </div>
              </div>
            </div>

            <Link href="/session" className="ns-action-btn">
              <span>👁 Lihat Detail Sesi</span>
            </Link>
          </div>
        ) : (
          <div className="next-session-empty">
            <div className="nse-icon-circle">
              <Calendar size={32} />
            </div>
            <h4 className="nse-title">Belum Ada Jadwal Sesi</h4>
            <p className="nse-desc">Hubungi Personal Trainer Anda untuk menjadwalkan sesi latihan berikutnya.</p>
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="nse-contact-btn"
            >
              <MessageCircle size={15} />
              <span>📱 Hubungi PT</span>
            </button>
          </div>
        )}
      </div>

      {/* ==================== 4. AI PROGRESS SUMMARY (AI INSIGHT) ==================== */}
      <div className="ai-insight-card">
        <div className="ai-header">
          <Sparkles size={18} className="ai-icon" />
          <h4 className="ai-title">AI Performance Insight</h4>
        </div>
        <p className="ai-text">
          ✨ Anda telah menyelesaikan <strong>{completed} sesi</strong> dengan konsisten. Progress kekuatan fisik meningkat <strong>+18%</strong>, dan latihan Upper Body berkembang signifikan selama 3 minggu terakhir! 🔥
        </p>
      </div>

      {/* ==================== 5. BODY PROGRESS CARD ==================== */}
      <div className="client-panel-card">
        <div className="cp-header">
          <div className="cp-title-wrap">
            <Scale size={18} className="cp-title-icon" style={{ color: '#10b981' }} />
            <h3 className="cp-title">Komposisi Tubuh (Body Composition)</h3>
          </div>
          <Link href="/progress" className="cp-link-btn">
            <span>Detail</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="body-stats-grid">
          <div className="body-stat-box">
            <span className="bsb-label">Berat Badan</span>
            <span className="bsb-val">{stats?.recentProgress?.weight || '68.5'} <small>kg</small></span>
          </div>

          <div className="body-stat-box">
            <span className="bsb-label">Body Fat</span>
            <span className="bsb-val">{stats?.recentProgress?.body_fat_percentage || '18.2'} <small>%</small></span>
          </div>

          <div className="body-stat-box">
            <span className="bsb-label">Muscle Mass</span>
            <span className="bsb-val">34.1 <small>kg</small></span>
          </div>

          <div className="body-stat-box">
            <span className="bsb-label">BMI</span>
            <span className="bsb-val">22.4</span>
          </div>

          <div className="body-stat-box">
            <span className="bsb-label">Visceral Fat</span>
            <span className="bsb-val">Level 4</span>
          </div>
        </div>

        <div className="body-last-measured">
          <span>Terakhir diukur: {stats?.recentProgress?.measured_at ? format(new Date(stats.recentProgress.measured_at), 'dd MMMM yyyy', { locale: id }) : '20 Juli 2026'}</span>
        </div>
      </div>

      {/* ==================== 6. ACHIEVEMENT BADGES (HORIZONTAL SCROLL) ==================== */}
      <div className="client-panel-card">
        <div className="cp-header">
          <div className="cp-title-wrap">
            <Award size={18} className="cp-title-icon" style={{ color: '#f59e0b' }} />
            <h3 className="cp-title">Pencapaian & Badge (Achievements)</h3>
          </div>
        </div>

        <div className="badges-scroll-container">
          <div className="badge-item unlocked">
            <span className="badge-emoji">🏅</span>
            <span className="badge-name">First Workout</span>
          </div>

          <div className="badge-item unlocked">
            <span className="badge-emoji">🔥</span>
            <span className="badge-name">10 Sessions</span>
          </div>

          <div className="badge-item unlocked">
            <span className="badge-emoji">⚡</span>
            <span className="badge-name">30 Days Streak</span>
          </div>

          <div className="badge-item unlocked">
            <span className="badge-emoji">🎯</span>
            <span className="badge-name">Goal Achieved</span>
          </div>

          <div className="badge-item locked">
            <span className="badge-emoji">💪</span>
            <span className="badge-name">50 Sessions</span>
          </div>
        </div>
      </div>

      {/* ==================== 7. RECENT ACTIVITY TIMELINE ==================== */}
      <div className="client-panel-card">
        <div className="cp-header">
          <div className="cp-title-wrap">
            <Activity size={18} className="cp-title-icon" style={{ color: '#ec4899' }} />
            <h3 className="cp-title">Aktivitas Terbaru</h3>
          </div>
        </div>

        <div className="client-timeline">
          <div className="ct-item">
            <div className="ct-dot" />
            <div className="ct-content">
              <span className="ct-time">Kemarin • 19:30</span>
              <h4 className="ct-title">Sesi Completed — Total Body</h4>
              <p className="ct-desc">RPE 8 • Gym Hang Lekir</p>
            </div>
          </div>

          <div className="ct-item">
            <div className="ct-dot" style={{ background: '#10b981' }} />
            <div className="ct-content">
              <span className="ct-time">20 Jul 2026</span>
              <h4 className="ct-title">Pengukuran Komposisi Tubuh</h4>
              <p className="ct-desc">Berat: 68.5 kg • Body Fat: 18.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== 8. PROGRESS CHART (NEW FEATURE) ==================== */}
      <ProgressChart />

      {/* ==================== 9 & 10. RECOVERY & NUTRITION RECOMMENDATION ==================== */}
      <div className="rec-grid">
        {/* Recovery Recommendation */}
        <div className="rec-card">
          <div className="rec-header">
            <HeartPulse size={16} style={{ color: '#ec4899' }} />
            <h4>Rekomendasi Recovery Hari Ini</h4>
          </div>
          <ul className="rec-list">
            <li>🧘 <strong>Stretching & Mobility</strong> (15 menit)</li>
            <li>🚶 <strong>Walking</strong> (8,000 langkah)</li>
            <li>💧 <strong>Water Intake</strong> (2.5 Liter)</li>
            <li>🌙 <strong>Sleep Target</strong> (8 jam)</li>
          </ul>
        </div>

        {/* Nutrition Tracker */}
        <NutritionTracker />
      </div>

      {/* ==================== MODAL CONTACT PT ==================== */}
      {isContactModalOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsContactModalOpen(false)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-wrap">
                <User size={20} style={{ color: 'var(--brand-primary)' }} />
                <h3>Hubungi Personal Trainer</h3>
              </div>
              <button type="button" onClick={() => setIsContactModalOpen(false)} className="mc-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="mc-body">
              <p className="mc-text">
                Pilih opsi di bawah untuk menjadwalkan sesi latihan berikutnya langsung dengan PT Anda:
              </p>

              <div className="mc-btn-group">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Coach,%20saya%20ingin%20menjadwalkan%20sesi%20latihan%20berikutnya."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mc-wa-btn"
                >
                  <MessageCircle size={18} />
                  <span>Kirim WhatsApp ke PT</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneModalOpen(true)
                    setIsContactModalOpen(false)
                  }}
                  className="mc-call-btn"
                >
                  <PhoneCall size={18} />
                  <span>Telepon Langsung</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STYLES ==================== */}
      <style jsx>{`
        .client-dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 24px;
        }

        /* 1. HERO CARD (HEIGHT 180-220px) */
        .client-hero-card {
          position: relative;
          min-height: 190px;
          border-radius: 24px;
          padding: 22px 24px;
          background: linear-gradient(135deg, rgba(30, 27, 75, 0.55) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(49, 46, 129, 0.5) 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25), 0 0 30px rgba(99, 102, 241, 0.15);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .c-hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .c-hero-orb-1 {
          top: -60px;
          right: -40px;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0) 70%);
          filter: blur(30px);
        }
        .c-hero-orb-2 {
          bottom: -50px;
          left: -30px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(99, 102, 241, 0) 70%);
          filter: blur(25px);
        }
        .c-hero-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.3;
          pointer-events: none;
        }

        .c-hero-content {
          position: relative;
          z-index: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .c-hero-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .c-greeting-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(99, 102, 241, 0.28);
          border: 1px solid rgba(165, 180, 252, 0.4);
          padding: 4px 12px;
          border-radius: 100px;
          width: fit-content;
          font-size: 12px;
          font-weight: 800;
          color: #e0e7ff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .c-welcome-typography {
          display: flex;
          flex-direction: column;
        }
        .c-welcome-sub {
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
        }
        .c-welcome-name {
          font-size: 24px;
          font-weight: 900;
          line-height: 1.15;
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .c-sparkle {
          -webkit-text-fill-color: initial;
        }
        .c-ai-motivation {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #e0e7ff;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        }
        .c-mot-icon {
          color: #f97316;
        }

        .c-hero-right {
          flex-shrink: 0;
        }
        .c-live-clock-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 12px 16px;
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
        }
        .c-clock-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        :global(.c-clock-icon) {
          color: #a855f7;
        }
        .c-time-val {
          font-family: monospace;
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.04em;
          text-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
        }
        .c-clock-bottom {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
        }

        /* 2. QUICK OVERVIEW (2x2 GRID, MAX 110px HEIGHT) */
        .client-analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .compact-analytics-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 18px;
          padding: 12px 14px;
          max-height: 110px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .cac-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cac-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .cac-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cac-value {
          font-size: 22px;
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1;
        }
        .cac-value-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cac-ring-wrap {
          display: flex;
          align-items: center;
        }
        .cac-unit {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
        }
        .cac-sub {
          font-size: 10.5px;
          color: var(--text-muted);
        }

        /* 3. CLIENT PANEL CARD */
        .client-panel-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cp-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        :global(.cp-title-icon) {
          color: var(--brand-primary);
        }
        .cp-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .cp-badge-pill {
          background: rgba(99, 102, 241, 0.14);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #6366f1;
          padding: 3px 9px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
        }
        :global(.cp-link-btn) {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 700;
          color: var(--brand-primary);
          text-decoration: none;
        }

        .next-session-box {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ns-program-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        :global(.ns-prog-icon) {
          color: #a855f7;
          margin-top: 2px;
        }
        .ns-program-name {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .ns-date-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .ns-meta-grid {
          display: flex;
          gap: 14px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .ns-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        :global(.ns-action-btn) {
          width: 100%;
          height: 38px;
          background: rgba(99, 102, 241, 0.14);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          color: var(--brand-primary);
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .next-session-empty {
          text-align: center;
          padding: 20px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .nse-icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.12);
          color: var(--brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nse-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .nse-desc {
          font-size: 12px;
          color: var(--text-muted);
          max-width: 320px;
        }
        .nse-contact-btn {
          margin-top: 4px;
          padding: 8px 18px;
          background: var(--brand-primary);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 12.5px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        /* 4. AI INSIGHT */
        .ai-insight-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 18px;
          padding: 14px 16px;
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ai-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        :global(.ai-icon) {
          color: #a855f7;
        }
        .ai-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #a855f7;
        }
        .ai-text {
          font-size: 12.5px;
          line-height: 1.45;
          color: var(--text-secondary);
        }

        /* 5. BODY PROGRESS */
        .body-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
          gap: 8px;
        }
        .body-stat-box {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .bsb-label {
          font-size: 10.5px;
          color: var(--text-muted);
        }
        .bsb-val {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .bsb-val small {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
        }
        .body-last-measured {
          font-size: 11px;
          color: var(--text-muted);
          text-align: right;
        }

        /* 6. ACHIEVEMENT BADGES */
        .badges-scroll-container {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .badge-item {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
        }
        .badge-item.unlocked {
          border-color: rgba(245, 158, 11, 0.35);
          background: rgba(245, 158, 11, 0.12);
          color: var(--text-primary);
        }
        .badge-item.locked {
          opacity: 0.5;
        }

        /* 7. TIMELINE */
        .client-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ct-item {
          display: flex;
          gap: 10px;
        }
        .ct-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--brand-primary);
          margin-top: 4px;
          flex-shrink: 0;
        }
        .ct-content {
          display: flex;
          flex-direction: column;
        }
        .ct-time {
          font-size: 10.5px;
          color: var(--text-muted);
        }
        .ct-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .ct-desc {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        /* 8 & 9. RECOMMENDATIONS & NUTRITION */
        .rec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }
        .rec-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 18px;
          padding: 14px 16px;
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rec-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .rec-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .nut-metrics {
          display: flex;
          gap: 8px;
        }
        .nut-box {
          flex: 1;
          background: var(--bg-elevated);
          padding: 8px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          font-size: 11px;
          color: var(--text-muted);
        }
        .nut-box strong {
          font-size: 13px;
          color: var(--text-primary);
        }

        /* MODAL CONTACT */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(16px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-card {
          width: 100%;
          max-width: 440px;
          background: var(--bg-elevated);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 20px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .mc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mc-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .mc-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .mc-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .mc-btn-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .mc-wa-btn {
          height: 42px;
          background: #10b981;
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
        }
        .mc-call-btn {
          height: 42px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .client-hero-card {
            padding: 16px;
            min-height: 180px;
          }
          .c-welcome-name {
            font-size: 20px;
          }
          .c-hero-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .c-hero-right {
            width: 100%;
          }
          .c-live-clock-card {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
          }
          .c-time-val {
            font-size: 15px;
          }
      `}</style>

      <CustomModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        type="info"
        title="Kontak Telepon PT"
        message="Nomor telepon resmi Personal Trainer Anda: +62 812-3456-7890"
      />
    </div>
  )
}
