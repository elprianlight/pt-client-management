'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { TrendingUp, Activity, DollarSign } from 'lucide-react'

// Dummy data for visual presentation of Phase 1
const mockRevenueData = [
  { name: 'Jan', revenue: 4500000, sessions: 24 },
  { name: 'Feb', revenue: 5200000, sessions: 28 },
  { name: 'Mar', revenue: 4800000, sessions: 26 },
  { name: 'Apr', revenue: 6100000, sessions: 35 },
  { name: 'Mei', revenue: 7500000, sessions: 42 },
  { name: 'Jun', revenue: 8200000, sessions: 48 },
]

export function PTAnalytics() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  return (
    <div className="pt-analytics-container">
      <div className="analytics-header">
        <div className="title-group">
          <TrendingUp className="icon-title" size={20} />
          <h2>Laporan Performa Bisnis</h2>
        </div>
        <p className="subtitle">Pantau pertumbuhan pendapatan dan jumlah sesi bulanan Anda.</p>
      </div>

      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <DollarSign size={16} className="text-emerald" />
            <h3>Pendapatan Bulanan (Rp)</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockRevenueData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px' }}
                  formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <Activity size={16} className="text-brand" />
            <h3>Pertumbuhan Sesi Latihan</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value} Sesi`, 'Total Sesi']}
                />
                <Line type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pt-analytics-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 10px;
        }
        .analytics-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-title {
          color: var(--brand-primary);
        }
        .analytics-header h2 {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .subtitle {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .chart-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 20px;
        }
        .chart-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .chart-title h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .text-emerald { color: #10b981; }
        .text-brand { color: #6366f1; }
        .chart-wrapper {
          width: 100%;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
