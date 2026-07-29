'use client'

import React, { useState } from 'react'
import { FileText, Upload, CheckCircle2, Loader2, X, Plus, Dumbbell, Trash2 } from 'lucide-react'
import { parsePDFSessionFile, saveLegacyPDFSession, ParsedExercise } from '@/lib/actions/pdf-import'

interface PDFUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  activePackages: any[]
}

export function PDFUploadModal({
  isOpen,
  onClose,
  onSuccess,
  activePackages,
}: PDFUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form states
  const [packageId, setPackageId] = useState('')
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'cancelled' | 'no_show'>('completed')
  const [programType, setProgramType] = useState('Total Body')
  const [location, setLocation] = useState('Hang Lekir')
  const [exercises, setExercises] = useState<ParsedExercise[]>([])
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('')

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('Harap unggah file dalam format PDF (.pdf)')
      return
    }

    setErrorMessage(null)
    setFile(selectedFile)
    setIsParsing(true)

    // Convert file to Base64 Data URL for persistent preview & storage link
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setPdfDataUrl(event.target.result as string)
      }
    }
    reader.readAsDataURL(selectedFile)

    // Parse text using Server Action
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await parsePDFSessionFile(formData)
      if (res.success) {
        if (res.suggestedProgram) setProgramType(res.suggestedProgram)
        if (res.suggestedLocation) setLocation(res.suggestedLocation)
        if (res.exercises && res.exercises.length > 0) {
          setExercises(res.exercises)
        } else {
          // If no auto-structured exercises found, provide clean default template
          setExercises([
            { id: '1', name: 'Latihan dari PDF', sets: 3, targetType: 'reps', targetValue: '10', weight: 0 }
          ])
        }
      } else {
        setErrorMessage(res.error || 'Gagal membaca isi PDF')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses file')
    } finally {
      setIsParsing(false)
    }
  }

  const handleRemoveExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id))
  }

  const handleAddManualExercise = () => {
    setExercises(prev => [
      ...prev,
      { id: Date.now().toString(), name: 'Gerakan Baru', sets: 3, targetType: 'reps', targetValue: '10', weight: 0 }
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!packageId) {
      setErrorMessage('Harap pilih Paket / Client terlebih dahulu')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const scheduledAtStr = `${scheduledDate}T${scheduledTime}:00`
      const res = await saveLegacyPDFSession({
        packageId,
        scheduledAt: scheduledAtStr,
        status,
        programType,
        location,
        exercises,
        pdfAttachmentUrl: pdfDataUrl,
      })

      if (res.success) {
        onSuccess()
        onClose()
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan sesi dari PDF')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pdf-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="pdf-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <div className="pdf-header-title">
            <div className="pdf-icon-wrap">
              <FileText size={20} className="text-brand" />
            </div>
            <div>
              <h3 className="pdf-modal-heading">Import Sesi Lama (PDF)</h3>
              <p className="pdf-modal-sub">Unggah dokumen rekap PDF & ekstrak program secara otomatis</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pdf-close-btn">
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="pdf-error-banner animate-fade-in">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pdf-modal-form">
          {/* File Upload Zone */}
          <div className="pdf-drop-zone">
            <input
              type="file"
              accept=".pdf"
              id="pdf-file-input"
              onChange={handleFileChange}
              className="pdf-file-input"
            />
            <label htmlFor="pdf-file-input" className="pdf-drop-label">
              <Upload size={28} className="text-brand mb-2" />
              {file ? (
                <div className="pdf-file-info">
                  <FileText size={18} className="text-success" />
                  <span className="pdf-filename">{file.name}</span>
                  <span className="pdf-filesize">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="pdf-drop-text">
                  <span className="pdf-drop-title">Klik atau Drag & Drop file PDF di sini</span>
                  <span className="pdf-drop-hint">Format yang didukung: Dokumen Rekap Latihan (.pdf)</span>
                </div>
              )}
            </label>
          </div>

          {isParsing && (
            <div className="pdf-parsing-card animate-fade-in">
              <Loader2 size={18} className="spin text-brand" />
              <span>Memproses & mengekstrak data dari file PDF...</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="pdf-field-grid">
            <div className="pdf-field">
              <label className="pdf-label">Pilih Paket / Client (Aktif)</label>
              <select
                required
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="pdf-select"
              >
                <option value="">-- Pilih Paket Client --</option>
                {activePackages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.clientName} • {pkg.packageName} (Sisa {pkg.totalSessions - pkg.usedSessions} Sesi)
                  </option>
                ))}
              </select>
            </div>

            <div className="pdf-field">
              <label className="pdf-label">Status Sesi Rekap</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="pdf-select"
              >
                <option value="completed">✅ Completed (Selesai)</option>
                <option value="scheduled">🔵 Scheduled (Terjadwal)</option>
                <option value="cancelled">🔴 Cancelled (Batal)</option>
                <option value="no_show">⚠️ No Show</option>
              </select>
            </div>
          </div>

          <div className="pdf-field-grid">
            <div className="pdf-field">
              <label className="pdf-label">Tanggal Sesi Lama</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="pdf-input"
              />
            </div>

            <div className="pdf-field">
              <label className="pdf-label">Jam Latihan</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="pdf-input"
              />
            </div>
          </div>

          <div className="pdf-field-grid">
            <div className="pdf-field">
              <label className="pdf-label">Program Latihan</label>
              <input
                type="text"
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
                className="pdf-input"
                placeholder="cth: Total Body, Upper Body..."
              />
            </div>

            <div className="pdf-field">
              <label className="pdf-label">Lokasi Latihan</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pdf-input"
                placeholder="cth: Hang Lekir, Essence..."
              />
            </div>
          </div>

          {/* Extracted Exercises List */}
          <div className="pdf-exercises-section">
            <div className="pdf-ex-header">
              <div className="flex-center gap-2">
                <Dumbbell size={16} className="text-brand" />
                <span className="pdf-ex-title">Program Gerakan (Hasil Ekstraksi PDF)</span>
              </div>
              <button
                type="button"
                className="pdf-btn-add-ex"
                onClick={handleAddManualExercise}
              >
                <Plus size={13} />
                <span>Tambah Gerakan</span>
              </button>
            </div>

            {exercises.length === 0 ? (
              <p className="pdf-empty-ex">Belum ada gerakan. Unggah PDF atau klik &quot;Tambah Gerakan&quot;.</p>
            ) : (
              <div className="pdf-ex-list">
                {exercises.map((ex, idx) => (
                  <div key={ex.id || idx} className="pdf-ex-row">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => {
                        const val = e.target.value
                        setExercises(prev => prev.map(item => item.id === ex.id ? { ...item, name: val } : item))
                      }}
                      className="pdf-ex-input-name"
                      placeholder="Nama gerakan"
                    />

                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        setExercises(prev => prev.map(item => item.id === ex.id ? { ...item, sets: val } : item))
                      }}
                      className="pdf-ex-input-num"
                      placeholder="Sets"
                      title="Jumlah Set"
                    />

                    <input
                      type="text"
                      value={ex.targetValue}
                      onChange={(e) => {
                        const val = e.target.value
                        setExercises(prev => prev.map(item => item.id === ex.id ? { ...item, targetValue: val } : item))
                      }}
                      className="pdf-ex-input-num"
                      placeholder="Reps"
                      title="Repetisi / Waktu"
                    />

                    <input
                      type="number"
                      value={ex.weight || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        setExercises(prev => prev.map(item => item.id === ex.id ? { ...item, weight: val } : item))
                      }}
                      className="pdf-ex-input-num"
                      placeholder="Kg"
                      title="Beban Kg"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="pdf-ex-remove-btn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pdf-modal-actions">
            <button type="button" onClick={onClose} className="pdf-btn-cancel">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting || !file} className="pdf-btn-submit">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Menyimpan Sesi & PDF...
                </>
              ) : (
                'Simpan Sesi & Lampiran PDF'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .pdf-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(16px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .pdf-modal-card {
          width: 100%;
          max-width: 540px;
          background: var(--bg-elevated, #1e1e2d);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 88vh;
          overflow-y: auto;
        }

        .pdf-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pdf-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pdf-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pdf-modal-heading {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary, #ffffff);
        }

        .pdf-modal-sub {
          font-size: 11.5px;
          color: var(--text-muted, #94a3b8);
        }

        .pdf-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          padding: 4px;
        }

        .pdf-error-banner {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 8px 12px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
        }

        .pdf-modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pdf-drop-zone {
          position: relative;
          border: 2px dashed rgba(99, 102, 241, 0.35);
          border-radius: 16px;
          background: rgba(99, 102, 241, 0.04);
          padding: 20px;
          text-align: center;
          transition: all 0.2s;
        }
        .pdf-drop-zone:hover {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
        }

        .pdf-file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }

        .pdf-drop-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .pdf-file-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #ffffff);
        }
        .pdf-filesize {
          font-size: 11.5px;
          color: var(--text-muted, #94a3b8);
          font-weight: 400;
        }

        .pdf-drop-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #ffffff);
          display: block;
        }
        .pdf-drop-hint {
          font-size: 11.5px;
          color: var(--text-muted, #94a3b8);
          display: block;
          margin-top: 2px;
        }

        .pdf-parsing-card {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: #a5b4fc;
        }

        .pdf-field-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .pdf-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pdf-label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary, #cbd5e1);
        }

        .pdf-input, .pdf-select {
          width: 100%;
          background: var(--bg-surface, rgba(255, 255, 255, 0.05));
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.12));
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-primary, #ffffff);
          outline: none;
          box-sizing: border-box;
        }

        .pdf-exercises-section {
          background: var(--bg-surface, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pdf-ex-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pdf-ex-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary, #cbd5e1);
        }

        .pdf-btn-add-ex {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .pdf-empty-ex {
          font-size: 11.5px;
          color: var(--text-muted, #94a3b8);
          font-style: italic;
          text-align: center;
          padding: 8px;
        }

        .pdf-ex-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pdf-ex-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pdf-ex-input-name {
          flex: 2;
          background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 12px;
          color: var(--text-primary, #ffffff);
        }

        .pdf-ex-input-num {
          flex: 1;
          width: 50px;
          background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
          border: 1px solid var(--border-default, rgba(255, 255, 255, 0.1));
          border-radius: 8px;
          padding: 6px 6px;
          font-size: 12px;
          color: var(--text-primary, #ffffff);
          text-align: center;
        }

        .pdf-ex-remove-btn {
          background: transparent;
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          padding: 4px;
        }
        .pdf-ex-remove-btn:hover {
          color: #ef4444;
        }

        .pdf-modal-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 6px;
        }

        .pdf-btn-cancel {
          flex: 1;
          height: 42px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all 0.2s;
        }
        .pdf-btn-cancel:hover {
          background: #ef4444;
          color: #ffffff;
        }

        .pdf-btn-submit {
          flex: 1.5;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          color: white;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all 0.2s;
        }
        .pdf-btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pdf-btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.5);
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.25s ease-out forwards; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .pdf-field-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
