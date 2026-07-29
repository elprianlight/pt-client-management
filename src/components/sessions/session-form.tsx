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
  ArrowLeft,
  X,
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
      location: initialData?.location || '',
    },
  })

  const selectedPackageId = watch('packageId')
  const selectedProgramType = watch('programType')
  const selectedRpe = Number(watch('rpe')) || 8
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
      {/* Back link */}
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

        {/* 3. CARD 3: INTENSITAS (RPE) DROPDOWN & LOKASI MANUAL SMART REMINDER 🚀 */}
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
            {/* REVISI 1: Tingkat Intensitas (RPE) Dropdown Klik & Pilih */}
            <div className="form-group">
              <label className="form-label">Tingkat Intensitas (RPE)</label>
              <select
                className="sc-input-select"
                value={selectedRpe}
                onChange={(e) => setValue('rpe', Number(e.target.value))}
                id="select-rpe-level"
              >
                <option value="1">🟢 RPE 1 — Sangat Ringan (Bisa ngobrol santai)</option>
                <option value="2">🟢 RPE 2 — Ringan (Ngobrol mudah)</option>
                <option value="3">🟢 RPE 3 — Lumayan Ringan</option>
                <option value="4">🔵 RPE 4 — Sedikit Keras</option>
                <option value="5">🔵 RPE 5 — Sedang (Mulai berkeringat)</option>
                <option value="6">🟣 RPE 6 — Lumayan Keras (Napas agak berat)</option>
                <option value="7">🟡 RPE 7 — Keras (Susah bicara panjang)</option>
                <option value="8">🔥 RPE 8 — Sangat Keras (Bicara terputus)</option>
                <option value="9">🔴 RPE 9 — Hampir Maksimal (Hanya 1-2 kata)</option>
                <option value="10">🔴 RPE 10 — Maksimal Usaha (Tidak bisa bicara)</option>
              </select>
            </div>

            {/* REVISI 2: Lokasi Latihan Field Input Manual + Smart Reminder */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Lokasi Latihan</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder="Ketik lokasi (misal: Hang Lekir, Essence)..."
                  className="sc-input-field"
                  {...register('location')}
                  id="input-session-location"
                />
                <MapPin size={16} className="sc-input-icon" />
              </div>

              {/* Smart Reminder suggestion badge if typing 'han' or 'hang' */}
              {currentLocation && (currentLocation.toLowerCase().includes('han') || currentLocation.toLowerCase().includes('hang')) && currentLocation.toLowerCase() !== 'hang lekir' && (
                <button
                  type="button"
                  onClick={() => setValue('location', 'Hang Lekir')}
                  className="sc-hang-suggest-btn animate-fade-in"
                >
                  💡 Smart Reminder: Set <strong>Hang Lekir</strong>
                </button>
              )}
            </div>

            {/* Catatan / Notes Sesi */}
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

        {/* 🚀 ACTION BUTTONS: SIMPAN (PRIMARY) & BATAL (MERAH SEJAJAR) */}
        <div className="sc-action-row animate-slide-up" style={{ animationDelay: '150ms' }}>
          <button
            type="submit"
            disabled={submitState !== 'normal' || !selectedPackageId}
            className={`sc-save-btn state-${submitState}`}
            id="btn-save-session-submit"
          >
            {submitState === 'loading' && (
              <>
                <Loader2 size={20} className="spin" />
                <span>Memproses...</span>
              </>
            )}

            {submitState === 'success' && (
              <>
                <CheckCircle2 size={22} className="sc-check-bounce" />
                <span>✓ Tersimpan!</span>
              </>
            )}

            {submitState === 'normal' && (
              <>
                <CheckCircle2 size={20} strokeWidth={2.4} />
                <span>✓ Simpan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="sc-cancel-red-btn"
            id="btn-cancel-session"
          >
            <X size={18} />
            <span>Batal</span>
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
          
          /* SEJAJAR ACTION BUTTONS (SIMPAN & BATAL MERAH) */
          .sc-action-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 4px;
          }
          :global(.sc-save-btn) {
            flex: 2;
            height: 52px;
            border-radius: 999px;
            border: none;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
            color: white;
            font-size: 15.5px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
            box-shadow: 0 10px 24px rgba(99, 102, 241, 0.4);
            transition: all var(--transition-fast);
          }
          :global(.sc-save-btn:hover:not(:disabled)) {
            transform: translateY(-2px);
            box-shadow: 0 14px 32px rgba(99, 102, 241, 0.55);
          }
          :global(.sc-save-btn:active:not(:disabled)) {
            transform: scale(0.98);
          }
          :global(.sc-save-btn:disabled) {
            opacity: 0.5;
            cursor: not-allowed;
            box-shadow: none;
          }
          :global(.sc-save-btn.state-success) {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 10px 24px rgba(16, 185, 129, 0.4);
          }
          :global(.sc-cancel-red-btn) {
            flex: 1;
            height: 52px;
            border-radius: 999px;
            border: 1px solid rgba(239, 68, 68, 0.4);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.2) 100%);
            color: #ef4444;
            font-size: 15px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            transition: all var(--transition-fast);
          }
          :global(.sc-cancel-red-btn:hover) {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.35) 100%);
            border-color: #ef4444;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(239, 68, 68, 0.35);
            transform: translateY(-1px);
          }
          :global(.sc-cancel-red-btn:active) {
            transform: scale(0.98);
          }

          @media (max-width: 640px) {
            .sc-card {
              padding: 14px 14px;
              border-radius: 16px;
            }
            :global(.sc-save-btn), :global(.sc-cancel-red-btn) {
              height: 48px;
              font-size: 14.5px;
            }
          }
        `}</style>
      </form>
    </div>
  )
}
