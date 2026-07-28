'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { scheduleSession, updateSessionData } from '@/lib/actions/session'
import {
  Loader2,
  Calendar,
  MapPin,
  Activity,
  PenLine,
  User,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react'

const formSchema = z.object({
  packageId: z.string().min(1, 'Pilih paket client'),
  scheduledAt: z.string().min(1, 'Tanggal & jam wajib diisi'),
  programType: z.string().min(1, 'Pilih program latihan'),
  rpe: z.coerce.number().min(1).max(10).optional().or(z.literal('')),
  sessionNotes: z.string().optional(),
  location: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const PROGRAM_CHIPS = [
  { label: 'Total Body', icon: '🔥' },
  { label: 'Upper Body', icon: '💪' },
  { label: 'Lower Body', icon: '🦵' },
  { label: 'Hybrid Training', icon: '⚡' },
  { label: 'Muaythai', icon: '🥊' },
  { label: 'Circuit Training', icon: '🔄' },
  { label: 'Cardio Training', icon: '🏃' },
]

const LOCATION_PRESETS = ['Gym Utama', 'Area Functional', 'Private Studio', 'Outdoor']

const RPE_DESCRIPTIONS: Record<number, { text: string; color: string }> = {
  1: { text: 'Sangat Ringan (Bisa ngobrol santai)', color: '#10b981' },
  2: { text: 'Ringan (Ngobrol mudah)', color: '#10b981' },
  3: { text: 'Lumayan Ringan', color: '#10b981' },
  4: { text: 'Sedikit Keras', color: '#3b82f6' },
  5: { text: 'Sedang (Mulai berkeringat)', color: '#3b82f6' },
  6: { text: 'Lumayan Keras (Napas agak berat)', color: '#8b5cf6' },
  7: { text: 'Keras (Susah bicara panjang)', color: '#f59e0b' },
  8: { text: 'Sangat Keras (Bicara terputus)', color: '#f97316' },
  9: { text: 'Hampir Maksimal (Hanya 1-2 kata)', color: '#ef4444' },
  10: { text: 'Maksimal Usaha (Tidak bisa bicara)', color: '#dc2626' },
}

function getNowForInput() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export interface PackageOption {
  id: string
  clientId?: string
  name: string
  clientName: string
  totalSessions?: number
  usedSessions?: number
  remaining: number
}

export function SessionForm({
  packages,
  initialData,
  defaultPackageId,
  defaultClientId,
}: {
  packages: PackageOption[]
  initialData?: any
  defaultPackageId?: string
  defaultClientId?: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<'normal' | 'loading' | 'success'>('normal')
  const isEdit = !!initialData

  // Initial package matching
  const preSelectedPkgId = useMemo(() => {
    if (initialData?.packageId) return initialData.packageId
    if (defaultPackageId) return defaultPackageId
    if (defaultClientId) {
      const match = packages.find(p => p.clientId === defaultClientId)
      if (match) return match.id
    }
    return packages[0]?.id || ''
  }, [initialData, defaultPackageId, defaultClientId, packages])

  const [isManualProgram, setIsManualProgram] = useState(() => {
    if (initialData?.programType) {
      return !PROGRAM_CHIPS.some(c => c.label === initialData.programType)
    }
    return false
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      packageId: preSelectedPkgId,
      scheduledAt: initialData?.scheduledAt || getNowForInput(),
      programType: initialData?.programType || 'Total Body',
      rpe: initialData?.rpe || 8,
      sessionNotes: initialData?.sessionNotes || '',
      location: initialData?.location || 'Gym Utama',
    },
  })

  const selectedPackageId = watch('packageId')
  const selectedProgramType = watch('programType')
  const selectedRpe = Number(watch('rpe')) || 0

  const selectedPackageInfo = useMemo(() => {
    return packages.find(p => p.id === selectedPackageId)
  }, [packages, selectedPackageId])

  const onSubmit = async (data: FormData) => {
    setError(null)
    setSubmitState('loading')

    const payload = {
      ...data,
      rpe: data.rpe ? Number(data.rpe) : null,
    }

    try {
      let res
      if (isEdit) {
        res = await updateSessionData(initialData.id, payload)
      } else {
        res = await scheduleSession(payload)
      }

      if (res.success) {
        setSubmitState('success')
        setTimeout(() => {
          router.push('/session')
        }, 600)
      } else {
        setSubmitState('normal')
        setError(res.error || 'Terjadi kesalahan saat menyimpan sesi.')
      }
    } catch {
      setSubmitState('normal')
      setError('Terjadi kesalahan koneksi server.')
    }
  }

  // Quick preset time actions
  const setPresetTime = (mode: 'now' | 'plus15' | 'tomorrow') => {
    const d = new Date()
    if (mode === 'plus15') d.setMinutes(d.getMinutes() + 15)
    if (mode === 'tomorrow') d.setDate(d.getDate() + 1)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    setValue('scheduledAt', d.toISOString().slice(0, 16))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="smart-checkin-form">
      {error && (
        <div className="sc-error-banner animate-fade-in">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* 1. CARD: CLIENT & PAKET LATIHAN */}
      <div className="sc-card animate-slide-up">
        <div className="sc-card-header">
          <div className="sc-card-title-group">
            <div className="sc-card-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <User size={18} />
            </div>
            <div>
              <h3 className="sc-card-title">Client & Paket Latihan</h3>
              <p className="sc-card-desc">Pilih paket client yang akan melakukan sesi</p>
            </div>
          </div>
        </div>

        <div className="sc-card-body">
          <div className="form-group">
            <label className="form-label">Paket & Client Aktif</label>
            <select
              className="sc-input-select"
              disabled={isEdit}
              {...register('packageId')}
              id="select-smart-package"
            >
              <option value="">-- Pilih Paket Client (Sisa Kuota) --</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.clientName} — {p.name} {isEdit ? '' : `(Sisa ${p.remaining} sesi)`}
                </option>
              ))}
            </select>
            {errors.packageId && <span className="form-error">{errors.packageId.message}</span>}
          </div>

          {/* Live Quota Bar Summary */}
          {selectedPackageInfo && (
            <div className="sc-quota-summary animate-fade-in">
              <div className="sc-quota-row">
                <span className="sc-quota-client">{selectedPackageInfo.clientName}</span>
                <span className="sc-quota-badge">
                  ⚡ Sisa {selectedPackageInfo.remaining} Sesi
                </span>
              </div>
              <div className="sc-quota-progress">
                <div
                  className="sc-quota-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      (((selectedPackageInfo.totalSessions || selectedPackageInfo.remaining) -
                        (selectedPackageInfo.usedSessions || 0)) /
                        (selectedPackageInfo.totalSessions || 10)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <p className="sc-quota-note">
                Paket: <strong>{selectedPackageInfo.name}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. CARD: WAKTU & PROGRAM LATIHAN */}
      <div className="sc-card animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="sc-card-header">
          <div className="sc-card-title-group">
            <div className="sc-card-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Clock size={18} />
            </div>
            <div>
              <h3 className="sc-card-title">Waktu & Program Latihan</h3>
              <p className="sc-card-desc">Atur jadwal & jenis menu latihan</p>
            </div>
          </div>
        </div>

        <div className="sc-card-body">
          {/* Waktu Input + Presets */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Tanggal & Jam Sesi</label>
              <div className="sc-time-presets">
                <button type="button" onClick={() => setPresetTime('now')} className="sc-preset-btn">
                  ⚡ Sekarang
                </button>
                <button type="button" onClick={() => setPresetTime('plus15')} className="sc-preset-btn">
                  +15m
                </button>
                <button type="button" onClick={() => setPresetTime('tomorrow')} className="sc-preset-btn">
                  Besok
                </button>
              </div>
            </div>
            <div className="input-with-icon">
              <input
                type="datetime-local"
                className="sc-input-field"
                {...register('scheduledAt')}
                id="input-scheduled-at"
              />
              <Calendar size={16} className="sc-input-icon" />
            </div>
            {errors.scheduledAt && <span className="form-error">{errors.scheduledAt.message}</span>}
          </div>

          {/* Program Latihan Chips */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Program Latihan</label>
            {!isManualProgram ? (
              <div className="sc-program-chips">
                {PROGRAM_CHIPS.map(chip => {
                  const isSelected = selectedProgramType === chip.label
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setValue('programType', chip.label)}
                      className={`sc-chip-btn ${isSelected ? 'selected' : ''}`}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => {
                    setIsManualProgram(true)
                    setValue('programType', '')
                  }}
                  className="sc-chip-btn manual"
                >
                  <span>✏️</span>
                  <span>Tulis Manual...</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ketik program manual..."
                  className="sc-input-field"
                  autoFocus
                  {...register('programType')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsManualProgram(false)
                    setValue('programType', 'Total Body')
                  }}
                  className="sc-preset-btn"
                  style={{ height: 42, padding: '0 14px' }}
                >
                  Batal
                </button>
              </div>
            )}
            {errors.programType && <span className="form-error">{errors.programType.message}</span>}
          </div>
        </div>
      </div>

      {/* 3. CARD: INTENSITAS (RPE) & LOKASI */}
      <div className="sc-card animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="sc-card-header">
          <div className="sc-card-title-group">
            <div className="sc-card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              <Activity size={18} />
            </div>
            <div>
              <h3 className="sc-card-title">Intensitas (RPE) & Lokasi</h3>
              <p className="sc-card-desc">Estimasi beban usaha & tempat pelaksanaan</p>
            </div>
          </div>
        </div>

        <div className="sc-card-body">
          {/* RPE Segmented Rating Chips (1-10) */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Tingkat RPE (Usaha 1-10)</label>
              {selectedRpe > 0 && RPE_DESCRIPTIONS[selectedRpe] && (
                <span className="sc-rpe-badge" style={{ color: RPE_DESCRIPTIONS[selectedRpe].color }}>
                  RPE {selectedRpe} — {RPE_DESCRIPTIONS[selectedRpe].text}
                </span>
              )}
            </div>
            <div className="sc-rpe-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => {
                const isSelected = selectedRpe === val
                const colorInfo = RPE_DESCRIPTIONS[val]
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setValue('rpe', val)}
                    className={`sc-rpe-chip ${isSelected ? 'active' : ''}`}
                    style={
                      isSelected
                        ? {
                            background: colorInfo.color,
                            borderColor: colorInfo.color,
                            color: '#ffffff',
                            boxShadow: `0 4px 12px ${colorInfo.color}66`,
                          }
                        : {}
                    }
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Lokasi Input + Pills */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Lokasi Latihan</label>
            <div className="sc-location-pills">
              {LOCATION_PRESETS.map(loc => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setValue('location', loc)}
                  className={`sc-loc-pill ${watch('location') === loc ? 'active' : ''}`}
                >
                  {loc}
                </button>
              ))}
            </div>
            <div className="input-with-icon" style={{ marginTop: 6 }}>
              <input
                type="text"
                placeholder="Lokasi spesifik..."
                className="sc-input-field"
                {...register('location')}
              />
              <MapPin size={16} className="sc-input-icon" />
            </div>
          </div>

          {/* Catatan / Notes */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Catatan / Notes Sesi (Opsional)</label>
            <div className="input-with-icon">
              <textarea
                placeholder="Catat detail latihan, fokus gerakan, atau catatan kondisi client..."
                className="sc-textarea-field"
                {...register('sessionNotes')}
              />
              <PenLine size={16} className="sc-textarea-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 SMART CHECK-IN BUTTON BARU (FULL WIDTH ROUNDED PILL) */}
      <div className="sc-action-wrap animate-slide-up" style={{ animationDelay: '150ms' }}>
        <button
          type="submit"
          disabled={submitState !== 'normal' || !selectedPackageId}
          className={`sc-smart-btn state-${submitState}`}
          id="btn-smart-checkin-submit"
        >
          {submitState === 'loading' && (
            <>
              <Loader2 size={22} className="spin" />
              <span>Memproses Smart Check-In...</span>
            </>
          )}

          {submitState === 'success' && (
            <>
              <CheckCircle2 size={24} className="sc-check-bounce" />
              <span>✓ Check-In Berhasil!</span>
            </>
          )}

          {submitState === 'normal' && (
            <>
              <CheckCircle2 size={22} strokeWidth={2.4} />
              <span>✓ Smart Check-In Sesi</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="sc-cancel-btn"
        >
          Batal
        </button>
      </div>

      <style jsx>{`
        .smart-checkin-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sc-error-banner {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 600;
        }
        .sc-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 18px 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all var(--transition-fast);
        }
        .sc-card:hover {
          border-color: var(--border-brand);
        }
        .sc-card-header {
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-default);
        }
        .sc-card-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sc-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sc-card-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .sc-card-desc {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .sc-card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .form-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .form-error {
          font-size: 11.5px;
          color: #ef4444;
          font-weight: 600;
        }

        /* Inputs & Selects */
        .sc-input-select,
        .sc-input-field {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 13.5px;
          font-weight: 500;
          outline: none;
          transition: all var(--transition-fast);
        }
        .sc-input-select:focus,
        .sc-input-field:focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .input-with-icon {
          position: relative;
          width: 100%;
        }
        .input-with-icon .sc-input-field {
          padding-left: 38px;
        }
        :global(.sc-input-icon) {
          position: absolute;
          left: 12px;
          top: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .sc-textarea-field {
          width: 100%;
          min-height: 80px;
          padding: 10px 14px 10px 38px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          resize: vertical;
          transition: all var(--transition-fast);
        }
        .sc-textarea-field:focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        :global(.sc-textarea-icon) {
          position: absolute;
          left: 12px;
          top: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        /* Quota Bar Summary */
        .sc-quota-summary {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 4px;
        }
        .sc-quota-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sc-quota-client {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .sc-quota-badge {
          font-size: 11px;
          font-weight: 800;
          color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.12);
          padding: 2px 8px;
          border-radius: 100px;
        }
        .sc-quota-progress {
          height: 6px;
          background: var(--bg-subtle);
          border-radius: 100px;
          overflow: hidden;
        }
        .sc-quota-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
          border-radius: 100px;
        }
        .sc-quota-note {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Time Presets */
        .sc-time-presets {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .sc-preset-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          padding: 3px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sc-preset-btn:hover {
          background: rgba(99, 102, 241, 0.12);
          color: var(--brand-primary);
          border-color: rgba(99, 102, 241, 0.3);
        }

        /* Program Chips */
        .sc-program-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .sc-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 100px;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sc-chip-btn:hover {
          border-color: var(--border-brand);
          color: var(--text-primary);
        }
        .sc-chip-btn.selected {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.18));
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        /* RPE Segmented Chips */
        .sc-rpe-badge {
          font-size: 11px;
          font-weight: 700;
        }
        .sc-rpe-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
          width: 100%;
        }
        .sc-rpe-chip {
          height: 36px;
          border-radius: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .sc-rpe-chip:hover {
          border-color: var(--brand-primary);
          color: var(--text-primary);
        }

        /* Location Pills */
        .sc-location-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .sc-loc-pill {
          padding: 4px 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sc-loc-pill:hover,
        .sc-loc-pill.active {
          background: rgba(249, 115, 22, 0.12);
          border-color: rgba(249, 115, 22, 0.3);
          color: #f97316;
        }

        /* 🚀 SMART CHECK-IN BUTTON BARU (FULL WIDTH ROUNDED PILL) */
        .sc-action-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        :global(.sc-smart-btn) {
          width: 100%;
          height: 56px;
          border-radius: 999px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          color: #ffffff;
          border: none;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(99, 102, 241, 0.45);
          transition: all var(--transition-normal);
        }
        :global(.sc-smart-btn:hover:not(:disabled)) {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(99, 102, 241, 0.6);
        }
        :global(.sc-smart-btn:active:not(:disabled)) {
          transform: scale(0.98);
        }
        :global(.sc-smart-btn:disabled) {
          opacity: 0.55;
          cursor: not-allowed;
          box-shadow: none;
        }
        :global(.sc-smart-btn.state-success) {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
        }
        .sc-cancel-btn {
          width: 100%;
          height: 40px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: color var(--transition-fast);
        }
        .sc-cancel-btn:hover {
          color: var(--text-primary);
        }

        @media (max-width: 640px) {
          .sc-card {
            padding: 14px 14px;
            border-radius: 16px;
          }
          .sc-rpe-grid {
            gap: 3px;
          }
          .sc-rpe-chip {
            height: 32px;
            font-size: 11px;
            border-radius: 6px;
          }
          :global(.sc-smart-btn) {
            height: 52px;
            font-size: 15px;
          }
        }
      `}</style>
    </form>
  )
}
