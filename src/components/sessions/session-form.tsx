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
  X,
  Sliders,
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
  const [isRpeModalOpen, setIsRpeModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
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
  const currentNotes = watch('sessionNotes') || ''

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

  const handleSaveModal = () => {
    setModalLoading(true)
    setTimeout(() => {
      setModalLoading(false)
      setIsRpeModalOpen(false)
    }, 250)
  }

  return (
    <div className="smart-checkin-wrapper animate-fade-in">
      {/* Back link */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/session" className="back-link">
          <ArrowLeft size={16} />
          BACK
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="smart-checkin-form">
        {/* Hidden inputs to keep form values registered */}
        <input type="hidden" {...register('rpe')} />
        <input type="hidden" {...register('location')} />
        <input type="hidden" {...register('sessionNotes')} />

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

            {/* STATUS SESI / BOOKING */}
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

        {/* 3. REVISI TOTAL CARD 3: CUSTOM IN-APP MODAL DIALOG TRIGGER FOR RPE & LOKASI 🚀 */}
        <div className="sc-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="sc-card-header">
            <div className="sc-card-title-group">
              <div className="sc-card-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                <Activity size={18} />
              </div>
              <div>
                <h3 className="sc-card-title">Intensitas (RPE) & Lokasi</h3>
                <p className="sc-card-desc">Atur beban usaha, tempat & catatan sesi</p>
              </div>
            </div>
          </div>

          <div className="sc-card-body">
            {/* Live Summary Preview Badges */}
            <div className="sc-summary-box">
              <div className="sc-summary-row">
                <div className="sc-summary-item">
                  <span className="sc-summary-label">Tingkat Intensitas (RPE)</span>
                  <div className="sc-summary-val-badge">
                    {selectedRpe > 0 && RPE_DESCRIPTIONS[selectedRpe] ? (
                      <span style={{ color: RPE_DESCRIPTIONS[selectedRpe].color, fontWeight: 800 }}>
                        🔥 RPE {selectedRpe} — {RPE_DESCRIPTIONS[selectedRpe].text.split('(')[0]}
                      </span>
                    ) : (
                      <span>Belum diatur</span>
                    )}
                  </div>
                </div>

                <div className="sc-summary-item">
                  <span className="sc-summary-label">Lokasi Latihan</span>
                  <div className="sc-summary-val-badge">
                    <MapPin size={13} style={{ color: 'var(--brand-primary)' }} />
                    <span>{currentLocation || 'Belum diatur'}</span>
                  </div>
                </div>
              </div>

              {currentNotes && (
                <div className="sc-summary-notes-row">
                  <span className="sc-summary-label">Notes:</span>
                  <p className="sc-summary-notes-text">"{currentNotes}"</p>
                </div>
              )}

              {/* Trigger Button to Open Custom In-App Modal Dialog */}
              <button
                type="button"
                onClick={() => setIsRpeModalOpen(true)}
                className="sc-trigger-modal-btn"
                id="btn-open-rpe-modal"
              >
                <Sliders size={16} />
                <span>Atur Intensitas RPE & Lokasi Latihan</span>
              </button>
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
          .sc-summary-box {
            background: var(--bg-elevated);
            border: 1px solid var(--border-default);
            border-radius: 16px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .sc-summary-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .sc-summary-item {
            flex: 1;
            min-width: 200px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .sc-summary-label {
            font-size: 11.5px;
            font-weight: 600;
            color: var(--text-muted);
          }
          .sc-summary-val-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            background: var(--bg-surface);
            border: 1px solid var(--border-default);
            padding: 6px 10px;
            border-radius: 10px;
            font-size: 12.5px;
            font-weight: 700;
            color: var(--text-primary);
          }
          .sc-summary-notes-row {
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding-top: 6px;
            border-top: 1px dashed var(--border-default);
          }
          .sc-summary-notes-text {
            font-size: 12px;
            font-style: italic;
            color: var(--text-secondary);
          }
          .sc-trigger-modal-btn {
            width: 100%;
            height: 44px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 12px;
            color: var(--brand-primary);
            font-size: 13.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            transition: all var(--transition-fast);
          }
          .sc-trigger-modal-btn:hover {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%);
            border-color: var(--brand-primary);
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.2);
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
            :global(.sc-smart-btn) {
              height: 52px;
              font-size: 15px;
            }
          }
        `}</style>
      </form>

      {/* 🚀 100% CUSTOM IN-APP MODAL DIALOG INTENSITAS (RPE) & LOKASI LATIHAN */}
      {isRpeModalOpen && (
        <div className="rpe-modal-backdrop animate-fade-in" onClick={() => setIsRpeModalOpen(false)}>
          <div className="rpe-modal-card animate-bounce-in" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="rpe-modal-header">
              <div className="rpe-modal-title-wrap">
                <div className="rpe-modal-icon">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="rpe-modal-title">⚡ Atur Intensitas (RPE) & Lokasi</h3>
                  <p className="rpe-modal-desc">Sesuaikan tingkat beban usaha, tempat & catatan sesi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRpeModalOpen(false)}
                className="rpe-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="rpe-modal-body">
              {/* RPE Rating Grid */}
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

              {/* Lokasi Latihan Input + Smart Auto-fill */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Lokasi Latihan</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    placeholder="Ketik lokasi (misal: Hang Lekir)..."
                    className="sc-input-field"
                    value={currentLocation}
                    onChange={(e) => setValue('location', e.target.value)}
                    id="modal-input-session-location"
                  />
                  <MapPin size={16} className="sc-input-icon" />
                </div>

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

              {/* Catatan Sesi */}
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Catatan / Notes Sesi (Opsional)</label>
                <div className="input-with-icon">
                  <textarea
                    placeholder="Catat detail latihan, fokus gerakan, atau catatan kondisi client..."
                    className="sc-textarea-field"
                    value={currentNotes}
                    onChange={(e) => setValue('sessionNotes', e.target.value)}
                  />
                  <PenLine size={16} className="sc-textarea-icon" />
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="rpe-modal-footer">
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={modalLoading}
                className="rpe-modal-save-btn"
                id="btn-save-rpe-modal"
              >
                {modalLoading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>✓ Simpan & Terapkan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsRpeModalOpen(false)}
                className="rpe-modal-cancel-btn"
              >
                Tutup
              </button>
            </div>
          </div>

          <style jsx>{`
            .rpe-modal-backdrop {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.78);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
              padding: 16px;
            }
            .rpe-modal-card {
              background: var(--bg-elevated);
              border: 1px solid var(--border-default);
              border-radius: 24px;
              width: 100%;
              max-width: 520px;
              overflow: hidden;
              box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
              display: flex;
              flex-direction: column;
            }
            .rpe-modal-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              border-bottom: 1px solid var(--border-default);
              background: var(--bg-surface);
            }
            .rpe-modal-title-wrap {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .rpe-modal-icon {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              background: rgba(249, 115, 22, 0.15);
              color: #f97316;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .rpe-modal-title {
              font-size: 15.5px;
              font-weight: 800;
              color: var(--text-primary);
              line-height: 1.2;
            }
            .rpe-modal-desc {
              font-size: 12px;
              color: var(--text-muted);
            }
            .rpe-modal-close-btn {
              background: transparent;
              border: none;
              color: var(--text-muted);
              cursor: pointer;
              display: flex;
              align-items: center;
              padding: 4px;
            }
            .rpe-modal-body {
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 12px;
              max-height: 70vh;
              overflow-y: auto;
            }
            .rpe-modal-footer {
              padding: 16px 20px;
              border-top: 1px solid var(--border-default);
              background: var(--bg-surface);
              display: flex;
              gap: 10px;
            }
            .rpe-modal-save-btn {
              flex: 1;
              height: 46px;
              border-radius: 14px;
              border: none;
              background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
              color: white;
              font-size: 14px;
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              cursor: pointer;
              box-shadow: 0 6px 18px rgba(99, 102, 241, 0.4);
              transition: all var(--transition-fast);
            }
            .rpe-modal-save-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 10px 24px rgba(99, 102, 241, 0.55);
            }
            .rpe-modal-cancel-btn {
              padding: 0 16px;
              height: 46px;
              border-radius: 14px;
              background: var(--bg-elevated);
              border: 1px solid var(--border-default);
              color: var(--text-secondary);
              font-size: 13.5px;
              font-weight: 600;
              cursor: pointer;
              transition: all var(--transition-fast);
            }
            .sc-rpe-grid {
              display: grid;
              grid-template-columns: repeat(10, 1fr);
              gap: 4px;
            }
            .sc-rpe-chip {
              height: 38px;
              background: var(--bg-surface);
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
            @media (max-width: 640px) {
              .sc-rpe-grid {
                gap: 3px;
              }
              .sc-rpe-chip {
                height: 32px;
                font-size: 11px;
                border-radius: 6px;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
