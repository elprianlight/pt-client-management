'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Scale, Plus, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'

// Dummy data for Phase 1 presentation
const initialData = [
  { date: '1 Jul', weight: 85 },
  { date: '8 Jul', weight: 83.5 },
  { date: '15 Jul', weight: 82.2 },
  { date: '22 Jul', weight: 81.0 },
]

export function ProgressChart() {
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState(initialData)
  const [newWeight, setNewWeight] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWeight) return
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      setData([...data, { date: today, weight: parseFloat(newWeight) }])
      setNewWeight('')
      setIsSubmitting(false)
    }, 600)
  }

  if (!isClient) return null

  const currentWeight = data[data.length - 1].weight
  const initialWeight = data[0].weight
  const diff = currentWeight - initialWeight
  const isLoss = diff <= 0

  return (
    <div className="progress-container">
      <div className="progress-header">
        <div className="title-group">
          <Scale className="icon-title" size={20} />
          <h2>Progres Berat Badan</h2>
        </div>
        <div className="progress-stats">
          <div className="stat-pill">
            <span className="stat-label">Saat ini</span>
            <span className="stat-value">{currentWeight} kg</span>
          </div>
          <div className={`stat-pill ${isLoss ? 'pill-success' : 'pill-danger'}`}>
            {isLoss ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
            <span className="stat-value">{Math.abs(diff).toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              domain={['dataMin - 2', 'dataMax + 2']} 
              stroke="var(--text-muted)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '12px' }}
              formatter={(value: any) => [`${value} kg`, 'Berat']}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="#06b6d4" 
              strokeWidth={3} 
              dot={{ r: 5, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 7 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="input-section">
        <p className="input-label">Catat Berat Badan Baru</p>
        <form onSubmit={handleSubmit} className="weight-form">
          <div className="input-wrapper">
            <input 
              type="number" 
              step="0.1" 
              placeholder="Misal: 79.5" 
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              required
              className="weight-input"
            />
            <span className="unit">kg</span>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-submit">
            {isSubmitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            Simpan
          </button>
        </form>
      </div>

      <style jsx>{`
        .progress-container {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-title { color: #06b6d4; }
        .title-group h2 {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .progress-stats {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 100px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
        }
        .pill-success {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .pill-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }
        .stat-label {
          font-size: 11px;
          color: var(--text-muted);
        }
        .stat-value {
          font-size: 13px;
          font-weight: 800;
        }
        
        .chart-wrapper {
          width: 100%;
        }

        .input-section {
          background: rgba(6, 182, 212, 0.05);
          border: 1px dashed rgba(6, 182, 212, 0.3);
          border-radius: 14px;
          padding: 16px;
        }
        .input-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }
        .weight-form {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .input-wrapper {
          position: relative;
          flex: 1;
        }
        .weight-input {
          width: 100%;
          height: 42px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 0 40px 0 16px;
          color: var(--text-primary);
          font-weight: 700;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .weight-input:focus {
          border-color: #06b6d4;
        }
        .unit {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .btn-submit {
          height: 42px;
          padding: 0 20px;
          background: #06b6d4;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .btn-submit:active {
          transform: scale(0.96);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
