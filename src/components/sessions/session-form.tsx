'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { scheduleSession, updateSessionData } from '@/lib/actions/session'
import Link from 'next/link'
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
  ArrowLeft,
  ListFilter,
} from 'lucide-react'

const formSchema = z.object({
  packageId: z.string().min(1, 'Pilih paket client'),
  scheduledAt: z.string().min(1, 'Tanggal & jam wajib diisi'),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
  programType: z.string().min(1, 'Pilih program latihan'),
  rpe: z.coerce.number().min(1).max(10).optional().or(z.literal('')),
  sessionNotes: z.string().optional(),
  location: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const PROGRAM_OPTIONS = [
  { label: 'Total Body', icon: '🔥' },
  { label: 'Upper Body', icon: '💪' },
  { label: 'Lower Body', icon: '🦵' },
  { label: 'Hybrid Training', icon: '⚡' },
  { label: 'Muaythai', icon: '🥊' },
  { label: 'Circuit Training', icon: '🔄' },
  { label: 'Cardio Training', icon: '🏃' },
]

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
      return !PROGRAM_OPTIONS.some(c => c.label === initialData.programType)
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
      status: initialData?.status || 'completed',
      programType: initialData?.programType || 'Total Body',
      rpe: initialData?.rpe || 8,
      sessionNotes: initialData?.sessionNotes || '',
      location: initialData?.location || 'Gym Hang Lekir',
    },
  })

  const selectedPackageId = watch('packageId')
  const selectedProgramType = watch('programType')
  const selectedRpe = Number(watch('rpe')) || 0
  const currentLocation = watch('location') || ''

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

  return (
    <div className="smart-checkin-wrapper animate-fade-in">
      {/* 2. REVISI BACK BUTTON: TEXT HANYA 'BACK' */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/session" className="back-link">
          <ArrowLeft size={16} />
          BACK
        </Link>
      </div>

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

            {/* 1. REVISI FITUR STATUS SESI / BOOKING */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Status Sesi / Booking</label>
              <select
                className="sc-input-select"
                {...register('status')}
                id="select-session-status"
              >
                <option value="completed">✓ Completed (Selesai)</option>
                <option value="scheduled">📅 Scheduled (Terjadwal)</option>
                <option value="cancelled">❌ Cancelled (Dibatalkan)</option>
                <option value="no_show">🚫 No Show (Tidak Hadir)</option>
              </select>
              {errors.status && <span className="form-error">{errors.status.message}</span>}
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

        {/* 3. REVISI CARD: WAKTU & PROGRAM LATIHAN */}
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
            {/* Waktu Input Saja (Tanpa tombol preset sekarang/+15m/besok) */}
            <div className="form-group">
              <label className="form-label">Tanggal & Jam Sesi</label>
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

            {/* Program Latihan Dropdown */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Program Latihan</label>
              <select
                className="sc-input-select"
                value={isManualProgram ? 'MANUAL' : selectedProgramType}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'MANUAL') {
                    setIsManualProgram(true)
                    setValue('programType', '')
                  } else {
                    setIsManualProgram(false)
                    setValue('programType', val)
                  }
                }}
                id="select-program-type"
              >
                <option value="Total Body">🔥 Total Body</option>
                <option value="Upper Body">💪 Upper Body</option>
                <option value="Lower Body">🦵 Lower Body</option>
                <option value="Hybrid Training">⚡ Hybrid Training</option>
                <option value="Muaythai">🥊 Muaythai</option>
                <option value="Circuit Training">🔄 Circuit Training</option>
                <option value="Cardio Training">🏃 Cardio Training</option>
                <option value="MANUAL">✏️ Tulis Manual...</option>
              </select>

              {isManualProgram && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Ketik program manual..."
                    className="sc-input-field"
                    autoFocus
                    {...register('programType')}
                  />
                </div>
              )}
              {errors.programType && <span className="form-error">{errors.programType.message}</span>}
            </div>
          </div>
        </div>

        {/* 4. REVISI CARD: INTENSITAS (RPE) & LOKASI MANUAL WITH SMART AUTO-SUGGESTION */}
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

            {/* Lokasi Input Manual + Smart Auto-Suggestion "Hang Lekir" */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Lokasi Latihan</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder="Ketik lokasi (misal: Hang Lekir)..."
                  className="sc-input-field"
                  {...register('location')}
                  id="input-session-location"
                />
                <MapPin size={16} className="sc-input-icon" />
              </div>

              {/* Smart Auto-Suggestion Badge saat ketik 'hang' */}
              {currentLocation && currentLocation.toLowerCase().includes('hang') && currentLocation.toLowerCase() !== 'hang lekir' && (
                <button
                  type="button"
                  onClick={() => setValue('location', 'Hang Lekir')}
                  className="sc-hang-suggest-btn animate-fade-in"
                >
                  💡 Pengingat Smart: Auto-fill <strong>Hang Lekir</strong>
                </button>
              )}
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

        {/* SMART CHECK-IN BUTTON */}
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
            font-size: 13.5px;
            font-weight: 600;
          }
          .sc-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-default);
            border-radius: 20px;
            padding: 18px 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
          .sc-card-header {
            padding-bottom: 12px;
            margin-bottom: 14px;
            border-bottom: 1px solid var(--border-default);
          }
          .sc-card-title-group {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .sc-card-icon {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .sc-card-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1.2;
          }
          .sc-card-desc {
            font-size: 12.5px;
            color: var(--text-muted);
            margin-top: 2px;
          }
          .sc-card-body {
            display: flex;
            flex-direction: column;
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
          }
          .form-label {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-primary);
          }
          .sc-input-select {
            width: 100%;
            height: 48px;
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            border-radius: 14px;
            color: var(--text-primary);
            font-size: 14px;
            font-weight: 600;
            padding: 0 14px;
            outline: none;
            transition: all var(--transition-fast);
          }
          .sc-input-select:focus {
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          }
          .sc-quota-summary {
            margin-top: 14px;
            padding: 12px 14px;
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            border-radius: 14px;
          }
          .sc-quota-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .sc-quota-client {
            font-size: 14px;
            font-weight: 700;
            color: var(--text-primary);
          }
          .sc-quota-badge {
            font-size: 12px;
            font-weight: 800;
            color: var(--brand-primary);
            background: rgba(99, 102, 241, 0.12);
            padding: 3px 10px;
            border-radius: 100px;
          }
          .sc-quota-progress {
            width: 100%;
            height: 8px;
            background: var(--bg-surface);
            border-radius: 100px;
            overflow: hidden;
          }
          .sc-quota-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
            border-radius: 100px;
            transition: width 0.4s ease;
          }
          .sc-quota-note {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 8px;
          }
          .input-with-icon {
            position: relative;
            display: flex;
            align-items: center;
          }
          .sc-input-field {
            width: 100%;
            height: 48px;
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            border-radius: 14px;
            color: var(--text-primary);
            font-size: 14px;
            font-weight: 500;
            padding: 0 42px 0 14px;
            outline: none;
            transition: all var(--transition-fast);
          }
          .sc-input-field:focus {
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          }
          :global(.sc-input-icon) {
            position: absolute;
            right: 14px;
            color: var(--text-muted);
            pointer-events: none;
          }
          .sc-rpe-grid {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            gap: 4px;
          }
          .sc-rpe-chip {
            height: 38px;
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            border-radius: 8px;
            color: var(--text-secondary);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all var(--transition-fast);
          }
          .sc-rpe-chip.active {
            transform: scale(1.04);
          }
          .sc-rpe-badge {
            font-size: 11.5px;
            font-weight: 700;
          }
          .sc-hang-suggest-btn {
            margin-top: 6px;
            padding: 8px 12px;
            background: rgba(99, 102, 241, 0.15);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 10px;
            color: var(--brand-primary);
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all var(--transition-fast);
          }
          .sc-hang-suggest-btn:hover {
            background: rgba(99, 102, 241, 0.25);
            transform: translateY(-1px);
          }
          .sc-textarea-field {
            width: 100%;
            height: 80px;
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            border-radius: 14px;
            color: var(--text-primary);
            font-size: 13.5px;
            padding: 10px 42px 10px 14px;
            outline: none;
            resize: none;
            transition: all var(--transition-fast);
          }
          .sc-textarea-field:focus {
            border-color: var(--brand-primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          }
          :global(.sc-textarea-icon) {
            position: absolute;
            right: 14px;
            top: 14px;
            color: var(--text-muted);
            pointer-events: none;
          }
          .sc-action-wrap {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 4px;
          }
          :global(.sc-smart-btn) {
            width: 100%;
            height: 56px;
            border-radius: 999px;
            border: none;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
            color: white;
            font-size: 16px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            box-shadow: 0 12px 28px rgba(99, 102, 241, 0.45);
            transition: all var(--transition-fast);
          }
          :global(.sc-smart-btn:hover:not(:disabled)) {
            transform: translateY(-2px);
            box-shadow: 0 16px 36px rgba(99, 102, 241, 0.6);
          }
          :global(.sc-smart-btn:active:not(:disabled)) {
            transform: scale(0.98);
          }
          :global(.sc-smart-btn:disabled) {
            opacity: 0.5;
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
    </div>
  )
}
