'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type CancelDecisionStatus = 'cancelled' | 'no_show'

interface CancelDecisionModalProps {
  isOpen: boolean
  status: CancelDecisionStatus
  clientName?: string
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (decision: { countsTowardBalance: boolean; reason: string }) => void
}

/**
 * Keputusan PT untuk sesi batal / no-show (PRD v2, aturan A5):
 * dihitung atau tidak dihitung terhadap saldo paket, dengan alasan singkat wajib.
 */
export function CancelDecisionModal({
  isOpen,
  status,
  clientName,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CancelDecisionModalProps) {
  const [mounted, setMounted] = useState(false)
  const [counts, setCounts] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (isOpen) {
      setCounts(null)
      setReason('')
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const label = status === 'no_show' ? 'No-show' : 'Batal'
  const canSubmit = counts !== null && reason.trim().length > 0 && !isSubmitting

  return createPortal(
    <div className="cd-backdrop" onClick={onClose}>
      <div className="cd-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="cd-title">Sesi {label}{clientName ? ` — ${clientName}` : ''}</h3>
        <p className="cd-sub">Apakah sesi ini dihitung terhadap saldo paket klien?</p>

        <div className="cd-options">
          <button
            type="button"
            className={`cd-option ${counts === true ? 'is-active' : ''}`}
            onClick={() => setCounts(true)}
          >
            <strong>Dihitung</strong>
            <span>Saldo sesi berkurang 1</span>
          </button>
          <button
            type="button"
            className={`cd-option ${counts === false ? 'is-active' : ''}`}
            onClick={() => setCounts(false)}
          >
            <strong>Tidak dihitung</strong>
            <span>Saldo sesi tetap</span>
          </button>
        </div>

        <label className="cd-label" htmlFor="cd-reason">Alasan (wajib)</label>
        <textarea
          id="cd-reason"
          className="cd-textarea"
          rows={3}
          placeholder="Contoh: klien membatalkan 2 jam sebelumnya"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="cd-actions">
          <button type="button" className="cd-btn" onClick={onClose} disabled={isSubmitting}>
            Kembali
          </button>
          <button
            type="button"
            className="cd-btn cd-btn-primary"
            disabled={!canSubmit}
            onClick={() => onSubmit({ countsTowardBalance: counts === true, reason: reason.trim() })}
          >
            {isSubmitting ? 'Menyimpan…' : 'Simpan keputusan'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .cd-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
          background: rgba(8, 6, 5, 0.65);
          backdrop-filter: blur(6px);
        }
        @media (min-width: 640px) {
          .cd-backdrop {
            align-items: center;
          }
        }
        .cd-card {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 22px;
          border-radius: 24px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          color: var(--text-primary);
        }
        .cd-title {
          font-family: var(--font-heading), 'Sora', sans-serif;
          font-size: 17px;
          font-weight: 700;
        }
        .cd-sub {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .cd-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .cd-option {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-height: 56px;
          padding: 12px;
          text-align: left;
          border-radius: 16px;
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
          color: var(--text-primary);
          cursor: pointer;
        }
        .cd-option span {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .cd-option.is-active {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px var(--brand-primary) inset;
        }
        .cd-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .cd-textarea {
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-size: 14px;
          resize: vertical;
        }
        .cd-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }
        .cd-btn {
          min-height: 44px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
        }
        .cd-btn-primary {
          border-color: transparent;
          background: var(--brand-primary);
          color: #fff;
        }
        .cd-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>,
    document.body
  )
}
