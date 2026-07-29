'use client'

import { useState } from 'react'
import { Droplets, Utensils, Plus, Check, Loader2, PieChart } from 'lucide-react'

// Dummy Data for Phase 2 UI
const initialLog = [
  { id: 1, type: 'breakfast', name: 'Oatmeal & Protein Shake', calories: 450, protein: 35 },
  { id: 2, type: 'lunch', name: 'Chicken Breast & Brown Rice', calories: 600, protein: 50 },
]

export function NutritionTracker() {
  const [logs, setLogs] = useState(initialLog)
  const [isAdding, setIsAdding] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [mealType, setMealType] = useState('breakfast')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Targets
  const targetCalories = 2200
  const targetProtein = 160
  
  // Consumed
  const consumedCalories = logs.reduce((acc, curr) => acc + curr.calories, 0)
  const consumedProtein = logs.reduce((acc, curr) => acc + curr.protein, 0)

  // Percentages
  const calPercent = Math.min(100, Math.round((consumedCalories / targetCalories) * 100))
  const proPercent = Math.min(100, Math.round((consumedProtein / targetProtein) * 100))

  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault()
    if (!foodName || !calories) return
    
    setIsSubmitting(true)
    setTimeout(() => {
      setLogs([...logs, { 
        id: Date.now(), 
        type: mealType, 
        name: foodName, 
        calories: parseInt(calories), 
        protein: parseInt(protein || '0') 
      }])
      setFoodName('')
      setCalories('')
      setProtein('')
      setIsSubmitting(false)
      setIsAdding(false)
    }, 500)
  }

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case 'breakfast': return 'Sarapan'
      case 'lunch': return 'Makan Siang'
      case 'dinner': return 'Makan Malam'
      case 'snack': return 'Cemilan'
      default: return type
    }
  }

  return (
    <div className="nutrition-container">
      <div className="nutrition-header">
        <div className="title-group">
          <PieChart className="icon-title" size={20} />
          <h2>Macro & Nutrition Log</h2>
        </div>
        <button className="btn-add-log" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <Check size={16} /> : <Plus size={16} />}
          {isAdding ? 'Selesai' : 'Catat Makanan'}
        </button>
      </div>

      <div className="macro-progress-grid">
        <div className="macro-card">
          <div className="macro-top">
            <span className="macro-label">Kalori (kcal)</span>
            <span className="macro-values"><strong>{consumedCalories}</strong> / {targetCalories}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill cal-fill" style={{ width: `${calPercent}%` }} />
          </div>
        </div>

        <div className="macro-card">
          <div className="macro-top">
            <span className="macro-label">Protein (g)</span>
            <span className="macro-values"><strong>{consumedProtein}</strong> / {targetProtein}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill pro-fill" style={{ width: `${proPercent}%` }} />
          </div>
        </div>
      </div>

      {isAdding && (
        <form className="add-food-form animate-slide-down" onSubmit={handleAddFood}>
          <div className="form-row">
            <select className="form-input" value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option value="breakfast">Sarapan</option>
              <option value="lunch">Makan Siang</option>
              <option value="dinner">Makan Malam</option>
              <option value="snack">Cemilan</option>
            </select>
            <input 
              type="text" 
              placeholder="Nama Makanan (mis: Telur Rebus 2 Butir)" 
              className="form-input flex-grow"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <input 
              type="number" 
              placeholder="Kalori (kcal)" 
              className="form-input"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
            />
            <input 
              type="number" 
              placeholder="Protein (g)" 
              className="form-input"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
            <button type="submit" className="btn-save-food" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      <div className="food-diary-list">
        <h3 className="diary-title">Jurnal Makanan Hari Ini</h3>
        {logs.length === 0 ? (
          <p className="empty-diary">Belum ada makanan yang dicatat hari ini.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="food-item">
              <div className="food-info">
                <span className={`meal-badge ${log.type}`}>{getMealTypeLabel(log.type)}</span>
                <span className="food-name">{log.name}</span>
              </div>
              <div className="food-macros">
                <span className="food-cal">{log.calories} kcal</span>
                <span className="food-pro">{log.protein}g protein</span>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .nutrition-container {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .nutrition-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-title { color: #f59e0b; }
        .title-group h2 {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .btn-add-log {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-log:hover {
          background: #f59e0b;
          color: white;
        }
        
        .macro-progress-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .macro-card {
          background: var(--bg-elevated);
          padding: 14px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .macro-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .macro-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .macro-values {
          font-size: 12px;
          color: var(--text-muted);
        }
        .macro-values strong {
          font-size: 14px;
          color: var(--text-primary);
        }
        .progress-bar-bg {
          height: 8px;
          background: var(--bg-surface);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cal-fill { background: #f59e0b; }
        .pro-fill { background: #10b981; }

        .add-food-form {
          background: rgba(245, 158, 11, 0.05);
          border: 1px dashed rgba(245, 158, 11, 0.3);
          padding: 16px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .form-row {
          display: flex;
          gap: 12px;
        }
        .form-input {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
        }
        .form-input:focus {
          border-color: #f59e0b;
        }
        .flex-grow { flex: 1; }
        .btn-save-food {
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 20px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .food-diary-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .diary-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .empty-diary {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }
        .food-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-elevated);
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid var(--border-default);
        }
        .food-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .meal-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .meal-badge.breakfast { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .meal-badge.lunch { background: rgba(16,185,129,0.15); color: #10b981; }
        .meal-badge.dinner { background: rgba(99,102,241,0.15); color: #6366f1; }
        .meal-badge.snack { background: rgba(236,72,153,0.15); color: #ec4899; }
        .food-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .food-macros {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .food-cal {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .food-pro {
          font-size: 11px;
          color: var(--text-muted);
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          .macro-progress-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            flex-direction: column;
          }
          .food-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .food-macros {
            align-items: flex-start;
            flex-direction: row;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  )
}
