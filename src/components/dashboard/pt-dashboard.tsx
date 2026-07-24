'use client'

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
} from 'lucide-react'

export function SuperAdminDashboard({ stats }: { stats?: { totalClients: number; totalPTs: number; monthSessions: number; monthRevenue: number; recentActivity: any[] } }) {
  return (
    <div className="sa-dashboard stagger-children">
      {/* Page Header */}
      <div className="dash-header animate-fade-in-up">
        <div>
          <h2 className="dash-title">Overview Sistem</h2>
          <p className="dash-desc">Monitor seluruh aktivitas Personal Trainer dan Client</p>
        </div>
        <div className="dash-date">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

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
          value={stats?.monthSessions?.toString() ?? "0"}
          icon={Calendar}
          iconColor="#06b6d4"
          trend={{ value: 0, label: 'vs bulan lalu', direction: 'neutral' }}
        />
        <StatsCard
          title="Total Revenue"
          value={stats?.monthRevenue ? `Rp ${stats.monthRevenue.toLocaleString('id-ID')}` : "Rp 0"}
          icon={DollarSign}
          iconColor="#10b981"
          trend={{ value: 0, label: 'bulan ini', direction: 'neutral' }}
        />
      </div>

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
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
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
            <a href="/pt" className="quick-action-btn">
              <UserCheck size={18} />
              <span>Tambah PT</span>
            </a>
            <a href="/clients" className="quick-action-btn">
              <Users size={18} />
              <span>Lihat Semua Client</span>
            </a>
            <a href="/reports" className="quick-action-btn">
              <TrendingUp size={18} />
              <span>Lihat Laporan</span>
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <AlertCircle size={16} />
              Status Sistem
            </h3>
          </div>
          <div className="status-list">
            <div className="status-item">
              <div className="status-dot status-ok" />
              <span className="status-label">Database Supabase</span>
              <span className="badge badge-success">Online</span>
            </div>
            <div className="status-item">
              <div className="status-dot status-ok" />
              <span className="status-label">Authentication</span>
              <span className="badge badge-success">Aktif</span>
            </div>
            <div className="status-item">
              <div className="status-dot status-ok" />
              <span className="status-label">Storage</span>
              <span className="badge badge-success">Online</span>
            </div>
          </div>
        </div>
      </div>

      <DashboardStyles />
    </div>
  )
}

export function PTDashboard({ stats }: { stats?: { totalClients: number; todaySessions: number; monthSessions: number; monthRevenue: number; todaySessionsList: any[]; recentClientsList: any[]; recentRevenueList: any[] } }) {
  return (
    <div className="pt-dashboard stagger-children">
      <div className="dash-header animate-fade-in-up">
        <div>
          <h2 className="dash-title">Dashboard PT</h2>
          <p className="dash-desc">Kelola client dan sesi latihan Anda</p>
        </div>
        <div className="dash-date">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </div>
      </div>

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
          value={stats?.todaySessions?.toString() ?? "0"}
          icon={Calendar}
          iconColor="#8b5cf6"
          subtitle="Terjadwal hari ini"
        />
        <StatsCard
          title="Sesi Bulan Ini"
          value={stats?.monthSessions?.toString() ?? "0"}
          icon={Activity}
          iconColor="#06b6d4"
          trend={{ value: 0, label: 'vs bulan lalu', direction: 'neutral' }}
        />
        <StatsCard
          title="Revenue Bulan Ini"
          value={stats?.monthRevenue ? `Rp ${stats.monthRevenue.toLocaleString('id-ID')}` : "Rp 0"}
          icon={DollarSign}
          iconColor="#10b981"
          trend={{ value: 0, label: 'vs bulan lalu', direction: 'neutral' }}
        />
      </div>

      <div className="dash-content-grid">
        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title"><Calendar size={16} /> Sesi Hari Ini</h3>
          </div>
          {stats?.todaySessionsList && stats.todaySessionsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.todaySessionsList.map((session, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(99,102,241,0.1)', padding: '10px', borderRadius: '50%', color: '#6366f1' }}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{session.clients?.users?.full_name || 'Client'}</p>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(session.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
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

        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title"><Users size={16} /> Client Terbaru</h3>
          </div>
          {stats?.recentClientsList && stats.recentClientsList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentClientsList.map((client, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {client.users?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{client.users?.full_name || 'Client Baru'}</p>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bergabung {new Date(client.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Belum ada client</p>
              <a href="/clients" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px', marginTop: 8, borderRadius: 'var(--radius-md)' }}>
                Tambah Client Pertama
              </a>
            </div>
          )}
        </div>

        <div className="glass-card dash-panel">
          <div className="panel-header">
            <h3 className="panel-title"><TrendingUp size={16} /> Revenue Overview</h3>
          </div>
          {stats?.recentRevenueList && stats.recentRevenueList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentRevenueList.map((pkg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{pkg.package_name}</p>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pkg.clients?.users?.full_name} • {new Date(pkg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>
                    Rp {Number(pkg.total_price).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <TrendingUp size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Data revenue belum tersedia</p>
              <span>Mulai jual paket untuk melihat revenue</span>
            </div>
          )}
        </div>
      </div>

      <DashboardStyles />
    </div>
  )
}

export function ClientDashboard({ stats }: { stats?: { remainingSessions: number; completedSessions: number; streakDays: number; nextSession: string | null; recentProgress: any } }) {
  return (
    <div className="client-dashboard stagger-children">
      {/* Header dihapus sesuai permintaan */}

      <div className="stats-grid stats-grid-client stagger-children">
        <StatsCard
          title="Sesi Tersisa"
          value={stats?.remainingSessions?.toString() || "0"}
          icon={Calendar}
          iconColor="#6366f1"
          subtitle="Dari paket aktif"
        />
        <StatsCard
          title="Sesi Selesai"
          value={stats?.completedSessions?.toString() || "0"}
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
            <h3 className="panel-title"><Calendar size={16} /> Sesi Berikutnya</h3>
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
            <h3 className="panel-title"><TrendingUp size={16} /> Progress Terbaru</h3>
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

function DashboardStyles() {
  return (
    <style jsx global>{`
      .dash-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 28px;
        flex-wrap: wrap;
        gap: 12px;
      }
      .dash-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .dash-desc {
        font-size: 13px;
        color: var(--text-muted);
        margin-top: 4px;
      }
      .dash-date {
        font-size: 13px;
        color: var(--text-secondary);
        background: var(--bg-elevated);
        border: 1px solid var(--border-default);
        padding: 8px 14px;
        border-radius: var(--radius-md);
        white-space: nowrap;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      .stats-grid-client {
        grid-template-columns: repeat(3, 1fr);
      }

      .dash-content-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
      }
      .dash-content-grid-client {
        grid-template-columns: 1fr 1fr;
      }

      .dash-panel {
        padding: 20px;
      }
      .panel-header {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-default);
      }
      .panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
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
      .quick-action-btn {
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
      .quick-action-btn:hover {
        background: var(--bg-overlay);
        color: var(--text-primary);
        border-color: var(--border-brand);
        transform: translateX(4px);
      }

      .status-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .status-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .status-ok { background: var(--success); box-shadow: 0 0 6px var(--success); }
      .status-warn { background: var(--warning); box-shadow: 0 0 6px var(--warning); }
      .status-error { background: var(--error); box-shadow: 0 0 6px var(--error); }
      .status-label {
        flex: 1;
        font-size: 13px;
        color: var(--text-secondary);
      }

      @media (max-width: 1280px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .dash-content-grid { grid-template-columns: 1fr 1fr; }
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
