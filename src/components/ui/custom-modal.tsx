'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, Info, AlertCircle, X, Loader2 } from 'lucide-react'

export type ModalType = 'success' | 'error' | 'info' | 'confirm' | 'loading'

export interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  isSubmitting?: boolean
}

export function CustomModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isSubmitting = false,
}: CustomModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={32} className="modal-icon text-success" />
      case 'error':
        return <AlertTriangle size={32} className="modal-icon text-danger" />
      case 'confirm':
        return <AlertCircle size={32} className="modal-icon text-warning" />
      case 'loading':
        return <Loader2 size={32} className="modal-icon text-brand spin" />
      case 'info':
      default:
        return <Info size={32} className="modal-icon text-info" />
    }
  }

  const getDefaultTitle = () => {
    if (title) return title
    switch (type) {
      case 'success':
        return 'Berhasil!'
      case 'error':
        return 'Terjadi Kesalahan'
      case 'confirm':
        return 'Konfirmasi Tindakan'
      case 'loading':
        return 'Memproses...'
      case 'info':
      default:
        return 'Informasi'
    }
  }

  return createPortal(
    <div className="custom-modal-backdrop animate-fade-in" onClick={type === 'loading' ? undefined : onClose}>
      <div className="custom-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="custom-modal-close-btn"
          disabled={type === 'loading' || isSubmitting}
        >
          <X size={16} />
        </button>

        <div className="custom-modal-body">
          <div className={`icon-badge-wrap ${type}`}>{renderIcon()}</div>

          <h3 className="custom-modal-title">{getDefaultTitle()}</h3>
          <p className="custom-modal-message">{message}</p>

          <div className="custom-modal-actions">
            {type === 'confirm' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn-modal-cancel"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onConfirm) onConfirm()
                  }}
                  disabled={isSubmitting}
                  className="btn-modal-confirm"
                >
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : confirmText}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={type === 'loading'}
                className="btn-modal-ok"
              >
                Mengerti
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .custom-modal-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-surface, #1e1e2d);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15);
          border-radius: 24px;
          padding: 28px 24px;
          position: relative;
          text-align: center;
        }

        .custom-modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: var(--bg-elevated, rgba(255, 255, 255, 0.05));
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-muted, #94a3b8);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: var(--text-primary, #ffffff);
        }

        .custom-modal-body {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .icon-badge-wrap {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .icon-badge-wrap.success {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .icon-badge-wrap.error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .icon-badge-wrap.confirm {
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .icon-badge-wrap.info,
        .icon-badge-wrap.loading {
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        :global(.text-success) { color: #10b981; }
        :global(.text-danger) { color: #ef4444; }
        :global(.text-warning) { color: #f59e0b; }
        :global(.text-info) { color: #3b82f6; }
        :global(.text-brand) { color: #6366f1; }

        .custom-modal-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary, #ffffff);
          margin-bottom: 8px;
        }

        .custom-modal-message {
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-secondary, #cbd5e1);
          margin-bottom: 24px;
        }

        .custom-modal-actions {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .btn-modal-ok,
        .btn-modal-confirm {
          flex: 1;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-modal-ok:hover,
        .btn-modal-confirm:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
        }

        .btn-modal-cancel {
          flex: 1;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all 0.2s ease-in-out;
        }
        .btn-modal-cancel:hover {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
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
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  )
}
