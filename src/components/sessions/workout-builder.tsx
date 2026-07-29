'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Dumbbell,
  Trash2,
  CheckCircle2,
  Loader2,
  GripVertical,
  Clock,
  Repeat,
  Eye,
  ClipboardList,
} from 'lucide-react'
import { CustomModal } from '@/components/ui/custom-modal'
import { saveSessionExercises, getSessionExercises } from '@/lib/actions/workout'
import { useAuthStore } from '@/store/auth-store'

export interface ExerciseItem {
  id: string
  name: string
  sets: number
  targetType: 'reps' | 'seconds'
  targetValue: string
  weight: number
}

export function WorkoutBuilder({ sessionId }: { sessionId?: string }) {
  const { role } = useAuthStore()
  const isClient = role === 'client'

  const [exercises, setExercises] = useState<ExerciseItem[]>([])
  const [isLoadingDB, setIsLoadingDB] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false)

  const storageKey = sessionId ? `workout_plan_${sessionId}` : 'workout_plan_default'

  // Load saved exercises from Supabase DB, fallback to localStorage
  useEffect(() => {
    let isMounted = true
    async function loadPlan() {
      setIsLoadingDB(true)
      if (sessionId) {
        try {
          const dbExercises = await getSessionExercises(sessionId)
          if (isMounted && dbExercises && dbExercises.length > 0) {
            setExercises(dbExercises)
            setIsLoadingDB(false)
            return
          }
        } catch (err) {
          console.error('Error fetching DB session exercises:', err)
        }
      }

      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (isMounted && Array.isArray(parsed) && parsed.length > 0) {
              setExercises(parsed)
              setIsLoadingDB(false)
              return
            }
          } catch (e) {
            // fallback
          }
        }
      }

      if (isMounted) setExercises([])
      setIsLoadingDB(false)
    }

    loadPlan()
    return () => {
      isMounted = false
    }
  }, [sessionId, storageKey])

  // Form states
  const [newName, setNewName] = useState('')
  const [newSets, setNewSets] = useState('3')
  const [targetType, setTargetType] = useState<'reps' | 'seconds'>('reps')
  const [targetValue, setTargetValue] = useState('10')
  const [newWeight, setNewWeight] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || isClient) return
    setIsSubmitting(true)

    const updated = [
      ...exercises,
      {
        id: Date.now().toString(),
        name: newName,
        sets: parseInt(newSets) || 3,
        targetType,
        targetValue: targetValue || (targetType === 'reps' ? '10' : '30'),
        weight: parseFloat(newWeight) || 0,
      },
    ]

    setExercises(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }

    if (sessionId) {
      await saveSessionExercises(sessionId, updated)
    }

    setNewName('')
    setNewSets('3')
    setTargetValue(targetType === 'reps' ? '10' : '30')
    setNewWeight('')
    setIsSubmitting(false)
    setIsAdding(false)
  }

  const handleRemove = async (id: string) => {
    if (isClient) return
    const updated = exercises.filter((ex) => ex.id !== id)
    setExercises(updated)

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    }

    if (sessionId) {
      await saveSessionExercises(sessionId, updated)
    }
  }

  const handleSaveProgram = async () => {
    if (isClient) return
    setIsSaving(true)

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(exercises))
    }

    if (sessionId) {
      await saveSessionExercises(sessionId, exercises)
    }

    setIsSaving(false)
    setIsSavedModalOpen(true)
  }

  // 1. Loading State
  if (isLoadingDB) {
    return (
      <div className="wb-loading-card animate-fade-in">
        <Loader2 size={20} className="spin text-brand" />
        <span>Memuat program latihan...</span>
        <style jsx>{`
          .wb-loading-card {
            background: var(--bg-surface, rgba(255, 255, 255, 0.04));
            border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
            border-radius: 20px;
            padding: 24px;
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 13px;
            color: var(--text-muted, #94a3b8);
          }
          .text-brand { color: #6366f1; }
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // 2. Condition 2: Empty State (No exercises & Not adding)
  if (exercises.length === 0 && !isAdding) {
    return (
      <div className="wb-empty-state-card animate-fade-in">
        <div className="wb-empty-icon-badge">
          <ClipboardList size={32} className="wb-empty-icon" />
        </div>

        <h4 className="wb-empty-title">📋 Belum Ada Program Latihan</h4>

        <p className="wb-empty-desc">
          {isClient
            ? 'PT belum membuat program latihan untuk sesi ini. Silakan hubungi Personal Trainer Anda atau tunggu hingga program latihan tersedia.'
            : 'Belum ada gerakan latihan yang dirancang untuk sesi ini. Klik tombol di bawah untuk membuat program latihan baru.'}
        </p>

        {!isClient && (
          <button
            type="button"
            className="btn-create-program-empty"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={16} />
            <span>Buat Program Latihan</span>
          </button>
        )}

        <style jsx>{`
          .wb-empty-state-card {
            background: var(--bg-surface, rgba(255, 255, 255, 0.03));
            border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
            border-radius: 20px;
            padding: 32px 24px;
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }

          .wb-empty-icon-badge {
            width: 64px;
            height: 64px;
            border-radius: 18px;
            background: rgba(99, 102, 241, 0.12);
            border: 1px solid rgba(99, 102, 241, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
          }

          :global(.wb-empty-icon) {
            color: #6366f1;
          }

          .wb-empty-title {
            font-size: 16px;
            font-weight: 800;
            color: var(--text-primary, #ffffff);
            margin-bottom: 8px;
          }

          .wb-empty-desc {
            font-size: 13px;
            line-height: 1.5;
            color: var(--text-muted, #94a3b8);
            max-width: 380px;
            margin-bottom: 20px;
          }

          .btn-create-program-empty {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
            transition: all 0.2s;
          }
          .btn-create-program-empty:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(99, 102, 241, 0.5);
          }

          .animate-fade-in {
            animation: fadeIn 0.25s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  // 3. Condition 1: Program Latihan Available (Or PT is currently adding exercises)
  return (
    <div className="workout-builder-container animate-fade-in">
      <div className="wb-header">
        <div className="wb-title-group">
          <Dumbbell size={18} className="text-brand" />
          <h4 className="wb-title">
            {isClient ? 'Program Latihan (Dari PT Anda)' : 'Program Latihan (Sesi Ini)'}
          </h4>
        </div>
        {!isClient ? (
          <button
            type="button"
            className="btn-add-exercise"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? <CheckCircle2 size={14} /> : <Plus size={14} />}
            {isAdding ? 'Selesai' : 'Tambah Gerakan'}
          </button>
        ) : (
          <div className="client-read-badge">
            <Eye size={13} />
            <span>Mode Lihat Client</span>
          </div>
        )}
      </div>

      {!isClient && isAdding && (
        <form onSubmit={handleAdd} className="wb-add-form animate-slide-down">
          {/* Row 1: Nama Gerakan */}
          <div className="wb-form-group">
            <label className="wb-label">Nama Gerakan / Latihan</label>
            <input
              type="text"
              placeholder="Cth: Bench Press, Plank, Squat..."
              className="wb-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>

          {/* Row 2: Target Type Switcher */}
          <div className="wb-form-group">
            <label className="wb-label">Jenis Target Latihan</label>
            <div className="wb-target-toggle">
              <button
                type="button"
                className={`wb-toggle-btn ${targetType === 'reps' ? 'active' : ''}`}
                onClick={() => {
                  setTargetType('reps')
                  setTargetValue('10')
                }}
              >
                <Repeat size={13} />
                <span>Repetisi (Reps)</span>
              </button>
              <button
                type="button"
                className={`wb-toggle-btn ${targetType === 'seconds' ? 'active' : ''}`}
                onClick={() => {
                  setTargetType('seconds')
                  setTargetValue('30')
                }}
              >
                <Clock size={13} />
                <span>Waktu (Detik)</span>
              </button>
            </div>
          </div>

          {/* Row 3: Grid Inputs (Sets, Target, Weight) */}
          <div className="wb-inputs-grid">
            <div className="wb-field">
              <label className="wb-field-lbl">Set</label>
              <input
                type="number"
                placeholder="3"
                className="wb-input no-spinner"
                value={newSets}
                onChange={(e) => setNewSets(e.target.value)}
                min="1"
              />
            </div>

            <div className="wb-field">
              <label className="wb-field-lbl">
                {targetType === 'reps' ? 'Repetisi' : 'Durasi (detik)'}
              </label>
              <div className="wb-unit-input-wrap">
                <input
                  type="text"
                  placeholder={targetType === 'reps' ? '10-12' : '45'}
                  className="wb-input pr-unit"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
                <span className="wb-unit-tag">
                  {targetType === 'reps' ? 'reps' : 'detik'}
                </span>
              </div>
            </div>

            <div className="wb-field">
              <label className="wb-field-lbl">Beban (Kg)</label>
              <div className="wb-unit-input-wrap">
                <input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  className="wb-input pr-unit no-spinner"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
                <span className="wb-unit-tag">kg</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-submit-exercise">
            {isSubmitting ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <>
                <Plus size={16} />
                <span>Tambahkan ke Sesi</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Exercise List */}
      <div className="wb-list">
        {exercises.map((ex, idx) => (
          <div
            key={ex.id}
            className="wb-list-item animate-fade-in"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="wb-item-left">
              <GripVertical size={16} className="text-muted cursor-move" />
              <div className="wb-item-info">
                <span className="wb-item-name">{ex.name}</span>
                <span className="wb-item-meta">
                  {ex.sets} Sets × {ex.targetValue}{' '}
                  {ex.targetType === 'seconds' ? 'Detik' : 'Reps'}
                </span>
              </div>
            </div>
            <div className="wb-item-right">
              <span className="wb-badge">
                {ex.weight > 0 ? `${ex.weight} kg` : 'Bodyweight'}
              </span>
              {!isClient && (
                <button
                  type="button"
                  className="btn-icon-danger"
                  onClick={() => handleRemove(ex.id)}
                  title="Hapus Gerakan"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isClient && exercises.length > 0 && (
        <button
          type="button"
          className="btn-save-program"
          disabled={isSaving}
          onClick={handleSaveProgram}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="spin" /> Menyimpan...
            </>
          ) : (
            'Simpan'
          )}
        </button>
      )}

      <CustomModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        type="success"
        title="Program Berhasil Disimpan!"
        message="Daftar gerakan latihan untuk sesi ini telah berhasil diperbarui dan tersimpan."
      />

      <style jsx>{`
        .workout-builder-container {
          background: var(--bg-overlay, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
          border-radius: 20px;
          padding: 18px;
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .wb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .wb-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .text-brand {
          color: #6366f1;
        }
        .wb-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary, #ffffff);
        }

        .btn-add-exercise {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(99, 102, 241, 0.12);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-add-exercise:hover {
          background: #6366f1;
          color: white;
        }

        .client-read-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 10px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .wb-add-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg-surface, #1e1e2d);
          padding: 14px;
          border-radius: 14px;
          border: 1px dashed rgba(99, 102, 241, 0.35);
        }

        .wb-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wb-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary, #cbd5e1);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .wb-target-toggle {
          display: flex;
          background: var(--bg-elevated, rgba(255, 255, 255, 0.05));
          padding: 3px;
          border-radius: 10px;
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
          gap: 4px;
        }
        .wb-toggle-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted, #94a3b8);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .wb-toggle-btn.active {
          background: #6366f1;
          color: white;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .wb-inputs-grid {
          display: grid;
          grid-template-columns: 80px 1fr 1fr;
          gap: 10px;
        }
        .wb-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .wb-field-lbl {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-muted, #94a3b8);
        }

        .wb-input {
          width: 100%;
          background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.12));
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-primary, #ffffff);
          outline: none;
          box-sizing: border-box;
        }
        .wb-input:focus {
          border-color: #6366f1;
        }

        .wb-unit-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .pr-unit {
          padding-right: 42px !important;
        }
        .wb-unit-tag {
          position: absolute;
          right: 10px;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted, #94a3b8);
          pointer-events: none;
        }

        :global(.no-spinner::-webkit-outer-spin-button),
        :global(.no-spinner::-webkit-inner-spin-button) {
          -webkit-appearance: none;
          margin: 0;
        }
        :global(.no-spinner[type='number']) {
          -moz-appearance: textfield;
        }

        .btn-submit-exercise {
          margin-top: 4px;
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-submit-exercise:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .wb-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .wb-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-surface, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
          border-radius: 12px;
          padding: 10px 12px;
        }
        .wb-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .text-muted {
          color: var(--text-muted, #94a3b8);
        }
        .cursor-move {
          cursor: grab;
        }
        .wb-item-info {
          display: flex;
          flex-direction: column;
        }
        .wb-item-name {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary, #ffffff);
        }
        .wb-item-meta {
          font-size: 11.5px;
          color: var(--text-secondary, #cbd5e1);
        }
        .wb-item-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .wb-badge {
          font-size: 11px;
          font-weight: 800;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .btn-icon-danger {
          background: transparent;
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        .btn-icon-danger:hover {
          color: #ef4444;
        }

        .btn-save-program {
          width: 100%;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-save-program:hover:not(:disabled) {
          background: #4f46e5;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.2s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .wb-inputs-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  )
}
