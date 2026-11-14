'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play, CheckCircle2 } from 'lucide-react'
import { GymSceneLazy } from '@/components/three/gym-scene-lazy'
import { CancelDecisionModal, type CancelDecisionStatus } from '@/components/sessions/cancel-decision-modal'
import { checkInSession, completeLiveSession, updateSessionStatus } from '@/lib/actions/session'

interface LiveSessionProps {
  session: {
    id: string
    status: string
    clientName: string
    packageName: string
    programType: string | null
    location: string | null
    scheduledAt: string
    checkInAt: string | null
    duration: number
    remaining: number | null
    total: number | null
    postpaid: boolean
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Layar "Sesi Berjalan" (PRD v2, A2/A3): check-in, timer durasi, RPE, catatan,
 * dan tombol Selesai / Batal / No-show dalam satu layar untuk dipakai dari HP.
 */
export function LiveSession({ session }: LiveSessionProps) {
  const router = useRouter()
  const [status, setStatus] = useState(session.status)
  const [checkInAt, setCheckInAt] = useState<string | null>(session.checkInAt)
  const [now, setNow] = useState(() => Date.now())
  const [rpe, setRpe] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelStatus, setCancelStatus] = useState<CancelDecisionStatus | null>(null)

  const running = status === 'check_in'
  const finished = status === 'completed' || status === 'cancelled' || status === 'no_show'

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [running])

  const elapsedSec = useMemo(() => {
    if (!checkInAt) return 0
    return Math.max(Math.floor((now - new Date(checkInAt).getTime()) / 1000), 0)
  }, [checkInAt, now])

  const targetSec = session.duration * 60
  const fraction = Math.min(elapsedSec / targetSec, 1)
  const R = 92
  const C = 2 * Math.PI * R

  const start = async () => {
    setBusy(true)
    setError(null)
    const res = await checkInSession(session.id)
    setBusy(false)
    if (res.success) {
      setStatus('check_in')
      setCheckInAt(new Date(res.checkInAt ?? Date.now()).toISOString())
      setNow(Date.now())
    } else setError(res.error || 'Gagal memulai sesi')
  }

  const complete = async () => {
    setBusy(true)
    setError(null)
    const res = await completeLiveSession(session.id, { rpe, notes })
    setBusy(false)
    if (res.success) {
      setStatus('completed')
      router.refresh()
    } else setError(res.error || 'Gagal menyelesaikan sesi')
  }

  const decide = async (decision: { countsTowardBalance: boolean; reason: string }) => {
    if (!cancelStatus) return
    setBusy(true)
    setError(null)
    const res = await updateSessionStatus(session.id, cancelStatus, decision)
    setBusy(false)
    if (res.success) {
      setStatus(cancelStatus)
      setCancelStatus(null)
      router.refresh()
    } else {
      setCancelStatus(null)
      setError(res.error || 'Gagal menyimpan keputusan')
    }
  }

  const mm = pad(Math.floor(elapsedSec / 60))
  const ss = pad(elapsedSec % 60)
  const afterRemaining = session.remaining !== null && !session.postpaid ? Math.max(session.remaining - 1, 0) : null

  return (
    <div className="live">
      <Link href="/jadwal" className="live-back">
        <ArrowLeft size={18} /> Jadwal
      </Link>

      <section className="live-hero">
        <GymSceneLazy className="live-stage" variant="kettlebell" />
        <div className="live-ring" aria-live="polite">
          <svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label={`Timer sesi ${mm} menit ${ss} detik`}>
            <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
            <circle
              cx="110"
              cy="110"
              r={R}
              fill="none"
              stroke="var(--brand-glow, #ff4d3a)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - fraction)}
              transform="rotate(-90 110 110)"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,77,58,0.7))', transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="live-time">
            <strong>{running || finished ? `${mm}:${ss}` : '00:00'}</strong>
            <span>{finished ? 'Sesi ditutup' : running ? `dari ${session.duration} menit` : 'Belum dimulai'}</span>
          </div>
        </div>
      </section>

      <section className="live-info">
        <h1>{session.clientName}</h1>
        <p>
          {session.packageName}
          {session.programType ? ` · ${session.programType}` : ''}
          {session.location ? ` · ${session.location}` : ''}
        </p>
        {session.remaining !== null && (
          <p className="live-remaining">
            {session.postpaid
              ? 'Paket pascabayar: sesi ditagih per bulan'
              : `Sisa sesi ${session.remaining} dari ${session.total}${afterRemaining !== null && !finished ? ` · setelah selesai ${afterRemaining}` : ''}`}
          </p>
        )}
      </section>

      {error && <p className="live-error" role="alert">{error}</p>}

      {status === 'scheduled' && (
        <button className="live-primary" onClick={start} disabled={busy}>
          <Play size={20} /> {busy ? 'Memulai…' : 'Mulai sesi (check-in)'}
        </button>
      )}

      {running && (
        <section className="live-form">
          <label className="live-label">RPE (opsional): seberapa berat sesi tadi?</label>
          <div className="live-rpe" role="radiogroup" aria-label="RPE 1 sampai 10">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rpe === n}
                className={`live-rpe-btn ${rpe === n ? 'is-active' : ''}`}
                onClick={() => setRpe(rpe === n ? null : n)}
              >
                {n}
              </button>
            ))}
          </div>

          <label className="live-label" htmlFor="live-notes">Catatan singkat (opsional)</label>
          <textarea
            id="live-notes"
            className="live-textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: fokus teknik squat, beban naik 5 kg"
          />

          <button className="live-primary" onClick={complete} disabled={busy}>
            <CheckCircle2 size={20} /> {busy ? 'Menyimpan…' : 'Selesai'}
          </button>
        </section>
      )}

      {!finished && (
        <div className="live-secondary">
          <button className="live-ghost" onClick={() => setCancelStatus('cancelled')} disabled={busy}>Batal</button>
          <button className="live-ghost" onClick={() => setCancelStatus('no_show')} disabled={busy}>No-show</button>
        </div>
      )}

      {finished && (
        <p className="live-done">
          {status === 'completed' ? 'Sesi selesai dan saldo paket sudah diperbarui.' : status === 'no_show' ? 'Sesi dicatat no-show.' : 'Sesi dicatat batal.'}{' '}
          <Link href="/jadwal" className="live-link">Kembali ke jadwal</Link>
        </p>
      )}

      <CancelDecisionModal
        isOpen={cancelStatus !== null}
        status={cancelStatus ?? 'cancelled'}
        clientName={session.clientName}
        isSubmitting={busy}
        onClose={() => setCancelStatus(null)}
        onSubmit={decide}
      />

      <style jsx>{`
        .live { position: relative; display: flex; flex-direction: column; gap: 16px; max-width: 560px; margin: 0 auto; padding-bottom: 96px; }
        .live-back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--text-secondary); font-weight: 600; }
        .live-hero { position: relative; display: grid; place-items: center; min-height: 280px; border-radius: 32px; overflow: hidden; isolation: isolate; background: radial-gradient(420px 260px at 50% 40%, rgba(255, 77, 58, 0.2), transparent 70%), var(--bg-surface); border: 1px solid var(--border-default); }
        .live-hero :global(.live-stage) { position: absolute; inset: 0; z-index: 0; opacity: 0.55; pointer-events: none; }
        .live-ring { position: relative; z-index: 1; display: grid; place-items: center; }
        .live-time { position: absolute; display: flex; flex-direction: column; align-items: center; }
        .live-time strong { font-family: var(--font-heading), 'Sora', sans-serif; font-size: 44px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--text-primary); }
        .live-time span { font-size: 12px; color: var(--text-secondary); }
        .live-info h1 { font-family: var(--font-heading), 'Sora', sans-serif; font-size: 24px; font-weight: 800; }
        .live-info p { color: var(--text-secondary); font-size: 14px; }
        .live-remaining { margin-top: 4px; font-variant-numeric: tabular-nums; color: var(--text-primary) !important; font-weight: 600; }
        .live-error { padding: 12px 16px; border-radius: 16px; background: rgba(255, 90, 90, 0.14); border: 1px solid rgba(255, 90, 90, 0.4); }
        .live-form { display: flex; flex-direction: column; gap: 10px; }
        .live-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .live-rpe { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        .live-rpe-btn { min-height: 48px; border-radius: 14px; border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-primary); font-weight: 700; font-size: 16px; cursor: pointer; }
        .live-rpe-btn.is-active { background: var(--brand-primary); border-color: transparent; color: #fff; box-shadow: 0 0 16px rgba(255, 77, 58, 0.45); }
        .live-textarea { width: 100%; padding: 12px; border-radius: 16px; border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-primary); font-size: 15px; resize: vertical; }
        .live-primary { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 56px; border: none; border-radius: 999px; background: var(--gradient-brand); color: #fff; font-size: 17px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 26px rgba(255, 77, 58, 0.35); }
        .live-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .live-secondary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .live-ghost { min-height: 48px; border-radius: 999px; border: 1px solid var(--border-default); background: transparent; color: var(--text-primary); font-weight: 600; cursor: pointer; }
        .live-done { padding: 14px 16px; border-radius: 16px; background: var(--bg-surface); border: 1px solid var(--border-default); }
        .live-link { color: var(--brand-primary); font-weight: 700; }
        @media (prefers-reduced-motion: reduce) { .live-ring svg circle { transition: none !important; } }
      `}</style>
    </div>
  )
}
