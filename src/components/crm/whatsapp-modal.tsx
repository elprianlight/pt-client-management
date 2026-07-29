'use client'

import { useState } from 'react'
import {
  X,
  Send,
  Calendar,
  Package,
  UserCheck,
  Cake,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { CustomModal } from '@/components/ui/custom-modal'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import {
  getScheduleReminderMessage,
  getRenewalReminderMessage,
  getInactiveFollowUpMessage,
  getBirthdayMessage,
  buildWhatsAppUrl,
  WATemplateData,
} from '@/lib/utils/whatsapp-helper'

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  clientData: {
    id: string
    fullName: string
    phone?: string | null
    fitnessGoal?: string | null
    remainingSessions?: number
    packageName?: string
    sessionDate?: string
    sessionTime?: string
    daysInactive?: number
  }
  defaultTemplate?: 'schedule' | 'renewal' | 'inactive' | 'birthday'
}

export function WhatsAppModal({
  isOpen,
  onClose,
  clientData,
  defaultTemplate = 'schedule',
}: WhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<'schedule' | 'renewal' | 'inactive' | 'birthday'>(defaultTemplate)

  const templateInputData: WATemplateData = {
    clientName: clientData.fullName,
    packageName: clientData.packageName || 'Paket PT',
    remainingSessions: clientData.remainingSessions ?? 1,
    sessionDate: clientData.sessionDate || 'Besok',
    sessionTime: clientData.sessionTime || '09:00',
    daysInactive: clientData.daysInactive || 7,
  }

  const getMessageText = (type: 'schedule' | 'renewal' | 'inactive' | 'birthday') => {
    switch (type) {
      case 'schedule': return getScheduleReminderMessage(templateInputData)
      case 'renewal': return getRenewalReminderMessage(templateInputData)
      case 'inactive': return getInactiveFollowUpMessage(templateInputData)
      case 'birthday': return getBirthdayMessage(templateInputData)
    }
  }

  const [message, setMessage] = useState<string>(getMessageText(defaultTemplate))
  const [isCopied, setIsCopied] = useState(false)

  if (!isOpen) return null

  const handleSelectTemplate = (type: 'schedule' | 'renewal' | 'inactive' | 'birthday') => {
    setSelectedTemplate(type)
    setMessage(getMessageText(type))
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(message)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const waUrl = buildWhatsAppUrl(clientData.phone, message)

  const [showAlert, setShowAlert] = useState(false)

  const handleSendWA = () => {
    if (!waUrl) {
      setShowAlert(true)
      return
    }
    window.open(waUrl, '_blank')
    onClose()
  }

  return (
    <div className="wa-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="wa-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wa-modal-header">
          <div className="wa-modal-title-row">
            <div className="wa-icon-badge">
              <WhatsAppIcon size={22} />
            </div>
            <div>
              <h3 className="wa-modal-title">WhatsApp Quick Center</h3>
              <p className="wa-modal-sub">Kirim pesan otomatis ke <strong>{clientData.fullName}</strong></p>
            </div>
          </div>
          <button type="button" className="wa-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="wa-modal-body">
          {/* Template Selector Pills */}
          <div className="wa-template-selector">
            <button
              type="button"
              className={`wa-tpl-pill ${selectedTemplate === 'schedule' ? 'active' : ''}`}
              onClick={() => handleSelectTemplate('schedule')}
            >
              <Calendar size={14} />
              <span>Jadwal Sesi</span>
            </button>

            <button
              type="button"
              className={`wa-tpl-pill ${selectedTemplate === 'renewal' ? 'active' : ''}`}
              onClick={() => handleSelectTemplate('renewal')}
            >
              <Package size={14} />
              <span>Renewal Paket</span>
            </button>

            <button
              type="button"
              className={`wa-tpl-pill ${selectedTemplate === 'inactive' ? 'active' : ''}`}
              onClick={() => handleSelectTemplate('inactive')}
            >
              <UserCheck size={14} />
              <span>Sapa Klien Pasif</span>
            </button>

            <button
              type="button"
              className={`wa-tpl-pill ${selectedTemplate === 'birthday' ? 'active' : ''}`}
              onClick={() => handleSelectTemplate('birthday')}
            >
              <Cake size={14} />
              <span>Ulang Tahun</span>
            </button>
          </div>

          {/* Editable Text Preview */}
          <div className="wa-message-wrap">
            <div className="wa-message-label-row">
              <span className="wa-label">Pratinjau & Edit Pesan:</span>
              <button type="button" className="wa-copy-btn" onClick={handleCopyText}>
                {isCopied ? <Check size={13} /> : <Copy size={13} />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>

            <textarea
              className="wa-message-textarea"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {!clientData.phone && (
            <div className="wa-warning-alert">
              ⚠️ Nomor HP client belum tersimpan. Harap lengkapi nomor HP client terlebih dahulu.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="wa-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn-wa-send"
            onClick={handleSendWA}
            disabled={!clientData.phone}
          >
            <Send size={16} />
            <span>Kirim via WhatsApp</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .wa-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 16px;
        }
        .wa-modal-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
        }

        .wa-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-surface);
        }
        .wa-modal-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .wa-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.2) 0%, rgba(18, 140, 126, 0.2) 100%);
          border: 1px solid rgba(37, 211, 102, 0.4);
          color: #25D366;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.15);
        }
        .wa-modal-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .wa-modal-sub {
          font-size: 12.5px;
          color: var(--text-muted);
        }
        :global(.wa-modal-close) {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color var(--transition-fast);
        }
        :global(.wa-modal-close:hover) {
          color: var(--text-primary);
        }

        .wa-modal-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .wa-template-selector {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        :global(.wa-tpl-pill) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 50px;
          font-size: 12.5px;
          font-weight: 600;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        :global(.wa-tpl-pill:hover) {
          background: var(--bg-elevated);
          border-color: rgba(16, 185, 129, 0.4);
          color: var(--text-primary);
        }
        :global(.wa-tpl-pill.active) {
          background: rgba(16, 185, 129, 0.15);
          border-color: #10b981;
          color: #10b981;
        }

        .wa-message-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .wa-message-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .wa-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
        }
        :global(.wa-copy-btn) {
          background: none;
          border: none;
          color: var(--brand-primary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .wa-message-textarea {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          font-size: 13.5px;
          line-height: 1.5;
          padding: 12px 14px;
          outline: none;
          resize: vertical;
          font-family: inherit;
        }
        .wa-message-textarea:focus {
          border-color: #10b981;
        }

        .wa-warning-alert {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
          font-size: 12.5px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
        }

        .wa-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 14px 20px;
          border-top: 1px solid var(--border-default);
          background: var(--bg-surface);
        }
        :global(.btn-wa-send) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 700;
          background: #10b981;
          border: 1px solid #10b981;
          color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }
        :global(.btn-wa-send:hover:not(:disabled)) {
          background: #059669;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
        }
        :global(.btn-wa-send:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <CustomModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        type="error"
        title="Nomor HP Tidak Valid"
        message="Nomor HP client belum diisi atau tidak valid. Silakan lengkapi nomor telepon pada data profil client."
      />
    </div>
  )
}
