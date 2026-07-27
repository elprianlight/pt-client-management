'use client'

import {
  TrendingUp,
  Package,
  Calendar,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import type { CRMAnalyticsData } from '@/lib/actions/crm'

interface CRMAnalyticsChartsProps {
  data: CRMAnalyticsData
}

export function CRMAnalyticsCharts({ data }: CRMAnalyticsChartsProps) {
  const maxRevenue = Math.max(...data.monthlyRevenueTrend.map(m => m.amount), 1)
  const maxSession = Math.max(...data.weeklySessions.map(w => w.count), 1)

  const formattedRevenue = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(data.totalRevenueThisMonth)

  return (
    <div className="crm-analytics-grid">
      {/* 1. Revenue Analytics Card */}
      <div className="glass-card analytics-card">
        <div className="analytics-card-header">
          <div className="ac-title-wrap">
            <div className="ac-icon ac-icon-success">
              <TrendingUp size={18} />
            </div>
            <div>
              <h4 className="ac-title">Pendapatan Penjualan Paket</h4>
              <p className="ac-sub">Omset dari penjualan & perpanjangan paket PT</p>
            </div>
          </div>
          <span className="ac-badge ac-badge-success">
            <ArrowUpRight size={13} /> Live Analytics
          </span>
        </div>

        <div className="revenue-hero-val">
          <span className="rh-number">{formattedRevenue}</span>
          <span className="rh-label">Bulan Ini</span>
        </div>

        {/* Bar Chart */}
        <div className="chart-bar-list">
          {data.monthlyRevenueTrend.map((item, i) => {
            const heightPercent = Math.max(15, Math.round((item.amount / maxRevenue) * 100))
            const formattedItem = new Intl.NumberFormat('id-ID', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(item.amount)

            return (
              <div key={i} className="chart-bar-col">
                <span className="bar-val-text">Rp {formattedItem}</span>
                <div className="bar-track">
                  <div className="bar-fill-gradient" style={{ height: `${heightPercent}%` }} />
                </div>
                <span className="bar-month-text">{item.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Package Breakdown & Session Activity Card */}
      <div className="glass-card analytics-card">
        <div className="analytics-card-header">
          <div className="ac-title-wrap">
            <div className="ac-icon ac-icon-brand">
              <Package size={18} />
            </div>
            <div>
              <h4 className="ac-title">Kesehatan Retensi & Stok Paket</h4>
              <p className="ac-sub">Status sisa sesi & aktivitas latihan mingguan</p>
            </div>
          </div>
        </div>

        {/* Package Distribution Progress Bars */}
        <div className="pkg-dist-wrap">
          <div className="pkg-dist-item">
            <div className="dist-label-row">
              <span>Paket Aktif (&gt;2 Sesi)</span>
              <strong>{data.packageDistribution.active} Paket</strong>
            </div>
            <div className="dist-track">
              <div className="dist-fill bg-success" style={{ width: `${Math.min(100, (data.packageDistribution.active / Math.max(1, data.totalActiveClients)) * 100)}%` }} />
            </div>
          </div>

          <div className="pkg-dist-item">
            <div className="dist-label-row">
              <span>Paket Mau Habis (≤2 Sesi)</span>
              <strong className="color-warning">{data.packageDistribution.low} Paket</strong>
            </div>
            <div className="dist-track">
              <div className="dist-fill bg-warning" style={{ width: `${Math.min(100, (data.packageDistribution.low / Math.max(1, data.totalActiveClients)) * 100)}%` }} />
            </div>
          </div>

          <div className="pkg-dist-item">
            <div className="dist-label-row">
              <span>Paket Expired / Habis</span>
              <strong className="color-danger">{data.packageDistribution.expired} Paket</strong>
            </div>
            <div className="dist-track">
              <div className="dist-fill bg-danger" style={{ width: `${Math.min(100, (data.packageDistribution.expired / Math.max(1, data.totalActiveClients)) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Weekly Sessions Chart */}
        <div style={{ marginTop: 16 }}>
          <h5 className="sub-section-title">Aktivitas Sesi Latihan Klien</h5>
          <div className="weekly-sessions-grid">
            {data.weeklySessions.map((w, i) => (
              <div key={i} className="ws-item">
                <div className="ws-header">
                  <span>{w.week}</span>
                  <strong>{w.count} Sesi</strong>
                </div>
                <div className="ws-track">
                  <div className="ws-fill" style={{ width: `${Math.min(100, (w.count / maxSession) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .crm-analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .analytics-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .analytics-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ac-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ac-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ac-icon-success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        .ac-icon-brand {
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: var(--brand-primary);
        }
        .ac-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .ac-sub {
          font-size: 12px;
          color: var(--text-muted);
        }
        .ac-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 50px;
        }
        .ac-badge-success {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .revenue-hero-val {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .rh-number {
          font-size: 26px;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .rh-label {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Bar Chart */
        .chart-bar-list {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 140px;
          padding-top: 20px;
          gap: 12px;
          border-bottom: 1px solid var(--border-default);
        }
        .chart-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          flex: 1;
          gap: 6px;
        }
        .bar-val-text {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
        }
        .bar-track {
          flex: 1;
          width: 24px;
          background: var(--bg-surface);
          border-radius: 6px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .bar-fill-gradient {
          width: 100%;
          background: linear-gradient(180deg, #10b981 0%, #06b6d4 100%);
          border-radius: 6px;
          transition: height 0.4s ease;
        }
        .bar-month-text {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* Package Distribution Progress */
        .pkg-dist-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pkg-dist-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dist-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          color: var(--text-secondary);
        }
        .dist-track {
          height: 8px;
          background: var(--bg-surface);
          border-radius: 100px;
          overflow: hidden;
        }
        .dist-fill {
          height: 100%;
          border-radius: 100px;
          transition: width 0.4s ease;
        }
        .bg-success { background: #10b981; }
        .bg-warning { background: #f59e0b; }
        .bg-danger { background: #ef4444; }
        .color-warning { color: #f59e0b; }
        .color-danger { color: #ef4444; }

        .sub-section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .weekly-sessions-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ws-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .ws-header {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .ws-track {
          height: 6px;
          background: var(--bg-surface);
          border-radius: 100px;
          overflow: hidden;
        }
        .ws-fill {
          height: 100%;
          background: var(--gradient-brand);
          border-radius: 100px;
        }

        @media (max-width: 768px) {
          .crm-analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
