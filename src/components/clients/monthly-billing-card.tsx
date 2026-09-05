'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Receipt,
  Calendar,
  CreditCard,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Loader2,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import { format, subMonths, addMonths } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  getMonthlyBillingSummary,
  recordMonthlyBillingPayment,
  deleteMonthlyBillingPayment,
  updatePostpaidRate,
  MonthlyBillingSummary,
} from '@/lib/actions/billing'
import { createPostpaidPackage } from '@/lib/actions/package'
import { buildWhatsAppUrl, getMonthlyInvoiceMessage } from '@/lib/utils/whatsapp-helper'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { CustomModal } from '@/components/ui/custom-modal'
import './monthly-billing.css'

interface MonthlyBillingCardProps {
  clientId: string
  clientName: string
  clientPhone?: string | null
  onRefreshParent?: () => void
}

export function MonthlyBillingCard({
  clientId,
  clientName,
  clientPhone,
  onRefreshParent,
}: MonthlyBillingCardProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [summary, setSummary] = useState<MonthlyBillingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActivating, setIsActivating] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isConfirmPayOpen, setIsConfirmPayOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [customRate, setCustomRate] = useState('350000')
  const [isEditingRate, setIsEditingRate] = useState(false)
  const [editingRateValue, setEditingRateValue] = useState('')
  const [isSavingRate, setIsSavingRate] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: 'info' | 'success' | 'error' | 'confirm'
    title?: string
    message: string
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  })

  // Generate 5 months options: current month, 3 past months, 1 next month
  const monthOptions = useMemo(() => {
    const today = new Date()
    const list = []
    for (let i = -3; i <= 1; i++) {
      const d = addMonths(today, i)
      list.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy', { locale: idLocale }),
      })
    }
    return list
  }, [])

  // Load billing summary for selected month
  const loadSummary = async () => {
    setIsLoading(true)
    try {
      const res = await getMonthlyBillingSummary(clientId, selectedMonth)
      setSummary(res)
    } catch (err) {
      console.error('Failed to load billing summary:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [clientId, selectedMonth])

  // Activate Postpaid Package for client
  const handleActivatePostpaid = async () => {
    setIsActivating(true)
    try {
      const rateNum = Number(customRate) || 350000
      const res = await createPostpaidPackage(clientId, rateNum)
      if (res.success) {
        await loadSummary()
        if (onRefreshParent) onRefreshParent()
      } else {
        alert(res.error || 'Gagal mengaktifkan sistem pascabayar.')
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.')
    } finally {
      setIsActivating(false)
    }
  }

  // Handle saving updated rate per session
  const handleSaveRate = async () => {
    const num = Number(editingRateValue.replace(/\D/g, ''))
    if (!num || num <= 0) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Tarif Tidak Valid',
        message: 'Mohon masukkan tarif per sesi yang valid.',
      })
      return
    }

    if (!summary?.postpaidPackageId) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: 'Paket pascabayar tidak ditemukan.',
      })
      return
    }

    setIsSavingRate(true)
    try {
      const res = await updatePostpaidRate(summary.postpaidPackageId, num, clientId)
      if (res.success) {
        setIsEditingRate(false)
        await loadSummary()
        onRefreshParent?.()
        setModalConfig({
          isOpen: true,
          type: 'success',
          title: 'Tarif Diperbarui',
          message: `Tarif per sesi berhasil diubah menjadi Rp ${num.toLocaleString('id-ID')}. Total tagihan otomatis disesuaikan.`,
        })
      } else {
        setModalConfig({
          isOpen: true,
          type: 'error',
          title: 'Gagal Mengubah Tarif',
          message: res.error || 'Terjadi kesalahan saat menyimpan tarif.',
        })
      }
    } catch {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan sistem.',
      })
    } finally {
      setIsSavingRate(false)
    }
  }

  // Handle Mark as Paid
  const handleConfirmPayment = async () => {
    if (!summary || !summary.postpaidPackageId) return
    setIsProcessingPayment(true)
    try {
      const res = await recordMonthlyBillingPayment({
        clientId,
        packageId: summary.postpaidPackageId,
        monthStr: summary.monthLabel,
        amount: summary.totalAmount,
        notes: `Pelunasan sesi ${summary.monthLabel}`,
      })

      if (res.success) {
        setIsConfirmPayOpen(false)
        await loadSummary()
        if (onRefreshParent) onRefreshParent()
      } else {
        alert(res.error || 'Gagal mencatat pembayaran.')
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memproses pembayaran.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle Revert Payment
  const handleRevertPayment = async () => {
    if (!summary?.transactionId) return
    if (!confirm('Apakah Anda yakin ingin membatalkan status Lunas untuk bulan ini?')) return

    setIsProcessingPayment(true)
    try {
      const res = await deleteMonthlyBillingPayment(summary.transactionId, clientId)
      if (res.success) {
        await loadSummary()
        if (onRefreshParent) onRefreshParent()
      } else {
        alert(res.error || 'Gagal membatalkan status pembayaran.')
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Compose WhatsApp Invoice Message
  const waInvoiceText = useMemo(() => {
    if (!summary) return ''

    const completed = summary.sessions.filter((s) => s.status === 'completed')
    const sessionsList = completed.map((s) => {
      const d = new Date(s.scheduledAt)
      const dayName = format(d, 'EEEE, d MMM yyyy', { locale: idLocale })
      const timeStr = format(d, 'HH:mm')
      return `${dayName} (${timeStr}) - ${s.programType || 'Latihan PT'}${s.location ? ` @ ${s.location}` : ''}`
    })

    return getMonthlyInvoiceMessage({
      clientName: summary.clientName || clientName,
      monthLabel: summary.monthLabel,
      totalSessions: summary.totalCompletedSessions,
      pricePerSession: summary.ratePerSession,
      totalAmount: summary.totalAmount,
      sessionsList,
      bankInfo: 'BCA: 1234567890 a/n Elprian',
    })
  }, [summary, clientName])

  const waUrl = useMemo(() => {
    return buildWhatsAppUrl(clientPhone, waInvoiceText)
  }, [clientPhone, waInvoiceText])

  const handleCopyMessage = () => {
    if (!waInvoiceText) return
    navigator.clipboard.writeText(waInvoiceText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="glass-card mb-billing-container">
      {/* ─── CARD HEADER ─── */}
      <div className="mb-header">
        <div className="mb-title-group">
          <div className="mb-icon-badge">
            <Receipt size={22} />
          </div>
          <div>
            <div className="mb-badge-row">
              <span className="mb-type-pill font-mono">⚡ PASCABAYAR</span>
              <span className="mb-sub-badge">BILLING BULANAN</span>
            </div>
            <h3 className="mb-title">Billing & Penagihan Bulanan</h3>
            <p className="mb-desc">
              Sesi latihan dihitung otomatis di akhir bulan, tagihan dikirimkan via WhatsApp.
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mb-month-selector">
          <Calendar size={15} className="mb-calendar-icon" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="mb-select-month font-mono"
            aria-label="Pilih Periode Bulan"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="mb-loading-box">
          <Loader2 size={24} className="spin" />
          <span>Memuat data billing bulan {selectedMonth}...</span>
        </div>
      ) : !summary?.hasPostpaidPackage ? (
        /* ─── STATE: CLIENT DOES NOT HAVE POSTPAID PACKAGE YET ─── */
        <div className="mb-activate-box">
          <div className="mb-act-icon">⚡</div>
          <div className="mb-act-info">
            <h4>Aktifkan Sistem Pascabayar untuk {clientName}</h4>
            <p>
              Dengan sistem ini, Anda dapat menjadwalkan dan mencatat sesi latihan Samantha tanpa batasan
              kuota di depan. Di akhir bulan, sistem otomatis menghitung total sesi yang selesai dan membuatkan
              tagihan.
            </p>
            <div className="mb-rate-input-row">
              <label className="font-mono">Tarif Per Sesi (Rp):</label>
              <input
                type="number"
                className="mb-clean-input font-mono"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="350000"
              />
              <button
                type="button"
                className="btn-primary mb-activate-btn"
                onClick={handleActivatePostpaid}
                disabled={isActivating}
              >
                {isActivating ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                <span>Aktifkan Paket Pascabayar</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── STATE: POSTPAID ACTIVE ─── */
        <div className="mb-content-body">
          {/* 1. FINANCIAL METRICS GRID */}
          <div className="mb-metrics-grid">
            {/* Box 1: Sesi Selesai */}
            <div className="mb-metric-card">
              <span className="mb-metric-label font-mono">SESI SELESAI ({summary.monthLabel})</span>
              <div className="mb-metric-val font-mono">
                {summary.totalCompletedSessions} <span className="mb-unit">Sesi</span>
              </div>
              <span className="mb-metric-sub">
                {summary.sessions.length} sesi terjadwal bulan ini
              </span>
            </div>

            {/* Box 2: Tarif Per Sesi */}
            <div className="mb-metric-card">
              <div className="mb-metric-header-row">
                <span className="mb-metric-label font-mono">TARIF PER SESI</span>
                {!isEditingRate && (
                  <button
                    type="button"
                    className="mb-edit-rate-btn"
                    onClick={() => {
                      setEditingRateValue(String(summary.ratePerSession))
                      setIsEditingRate(true)
                    }}
                    title="Ubah tarif per sesi"
                    id="btn-edit-postpaid-rate"
                  >
                    <Pencil size={11} />
                    <span>Ubah</span>
                  </button>
                )}
              </div>

              {isEditingRate ? (
                <div className="mb-rate-edit-box">
                  <div className="mb-rate-edit-input-wrap">
                    <span className="mb-rate-prefix font-mono">Rp</span>
                    <input
                      type="number"
                      className="mb-rate-edit-input font-mono"
                      value={editingRateValue}
                      onChange={(e) => setEditingRateValue(e.target.value)}
                      placeholder="Contoh: 350000"
                      autoFocus
                    />
                  </div>
                  <div className="mb-rate-edit-actions">
                    <button
                      type="button"
                      className="btn-primary mb-rate-save-btn"
                      disabled={isSavingRate}
                      onClick={handleSaveRate}
                      id="btn-save-postpaid-rate"
                    >
                      {isSavingRate ? <Loader2 size={11} className="spin" /> : <Check size={11} />}
                      <span>Simpan</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary mb-rate-cancel-btn"
                      disabled={isSavingRate}
                      onClick={() => setIsEditingRate(false)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-metric-val font-mono">
                    Rp {summary.ratePerSession.toLocaleString('id-ID')}
                  </div>
                  <span className="mb-metric-sub">Sesuai kesepakatan pascabayar</span>
                </>
              )}
            </div>

            {/* Box 3: Total Tagihan */}
            <div className="mb-metric-card mb-metric-total">
              <span className="mb-metric-label font-mono">TOTAL TAGIHAN</span>
              <div className="mb-metric-val val-total font-mono">
                Rp {summary.totalAmount.toLocaleString('id-ID')}
              </div>
              <span className="mb-metric-sub font-mono">
                {summary.totalCompletedSessions} Sesi × Rp {summary.ratePerSession.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Box 4: Status Pembayaran */}
            <div className="mb-metric-card">
              <span className="mb-metric-label font-mono">STATUS BILLING</span>
              <div style={{ marginTop: 4 }}>
                {summary.isPaid ? (
                  <span className="mb-status-pill status-paid font-mono">
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    LUNAS
                  </span>
                ) : summary.totalCompletedSessions > 0 ? (
                  <span className="mb-status-pill status-pending font-mono">
                    <Clock size={13} strokeWidth={2.5} />
                    MENUNGGU PENAGIHAN
                  </span>
                ) : (
                  <span className="mb-status-pill status-zero font-mono">
                    BELUM ADA SESI
                  </span>
                )}
              </div>
              <span className="mb-metric-sub">
                {summary.isPaid && summary.paymentDate
                  ? `Dibayar ${format(new Date(summary.paymentDate), 'd MMM yyyy', { locale: idLocale })}`
                  : summary.totalCompletedSessions > 0
                  ? 'Siap ditagihkan ke klien'
                  : 'Sesi belum di-check in'}
              </span>
            </div>
          </div>

          {/* 2. RINCIAN SESI BULAN INI */}
          <div className="mb-sessions-section">
            <div className="mb-sec-header">
              <h4 className="mb-sec-title">
                Rincian Sesi Latihan — {summary.monthLabel} ({summary.sessions.length})
              </h4>
              <span className="mb-sec-tag font-mono">
                {summary.totalCompletedSessions} Completed • {summary.sessions.length - summary.totalCompletedSessions} Lainnya
              </span>
            </div>

            {summary.sessions.length === 0 ? (
              <div className="mb-empty-sessions">
                <Calendar size={28} className="mb-empty-icon" />
                <p>Belum ada sesi latihan yang dijadwalkan pada {summary.monthLabel}.</p>
                <a
                  href={`/jadwal?new=true&clientId=${clientId}`}
                  className="btn-secondary"
                  style={{ marginTop: 8, fontSize: 12 }}
                >
                  + Jadwalkan Sesi Sekarang
                </a>
              </div>
            ) : (
              <div className="mb-sessions-table-wrap">
                <table className="mb-sessions-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Tanggal & Waktu</th>
                      <th>Program</th>
                      <th>Lokasi</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Tarif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.sessions.map((sess, idx) => {
                      const d = new Date(sess.scheduledAt)
                      const isCompleted = sess.status === 'completed'
                      return (
                        <tr key={sess.id} className={isCompleted ? 'row-completed' : 'row-other'}>
                          <td className="font-mono">{idx + 1}</td>
                          <td>
                            <strong>{format(d, 'EEEE, d MMM yyyy', { locale: idLocale })}</strong>
                            <div className="font-mono" style={{ fontSize: 11, color: '#94a3b8' }}>
                              {format(d, 'HH:mm')} WIB
                            </div>
                          </td>
                          <td>{sess.programType || 'Total Body'}</td>
                          <td>{sess.location || 'Essence'}</td>
                          <td>
                            <span
                              className={`mb-badge-status ${
                                isCompleted
                                  ? 'badge-comp'
                                  : sess.status === 'cancelled'
                                  ? 'badge-canc'
                                  : 'badge-sched'
                              }`}
                            >
                              {isCompleted
                                ? '✓ Completed'
                                : sess.status === 'cancelled'
                                ? '✕ Cancelled'
                                : '○ Scheduled'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }} className="font-mono">
                            {isCompleted ? `Rp ${summary.ratePerSession.toLocaleString('id-ID')}` : '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. ACTION BUTTONS: WHATSAPP INVOICE & MARK AS PAID */}
          <div className="mb-actions-bar">
            {/* WhatsApp Invoice Button */}
            <div className="mb-wa-group">
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-btn-wa"
                  title="Kirim rincian invoice langsung ke WhatsApp Samantha"
                >
                  <WhatsAppIcon size={16} />
                  <span>Kirim Tagihan via WhatsApp</span>
                </a>
              ) : (
                <button
                  type="button"
                  className="mb-btn-wa"
                  onClick={() => alert('Nomor telepon klien belum terisi atau tidak valid.')}
                >
                  <WhatsAppIcon size={16} />
                  <span>Kirim Tagihan via WhatsApp</span>
                </button>
              )}

              <button
                type="button"
                className="mb-btn-copy"
                onClick={handleCopyMessage}
                title="Salin Pesan Tagihan ke Clipboard"
              >
                {isCopied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
            </div>

            {/* Mark as Paid Action */}
            <div className="mb-pay-group">
              {!summary.isPaid ? (
                <button
                  type="button"
                  className="mb-btn-pay"
                  onClick={() => setIsConfirmPayOpen(true)}
                  disabled={summary.totalCompletedSessions === 0}
                >
                  <CheckCircle2 size={16} />
                  <span>Tandai Sudah Dibayar (Lunas)</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mb-paid-notice font-mono">
                    ✓ Lunas tercatat di transaksi
                  </span>
                  <button
                    type="button"
                    className="mb-btn-revert"
                    onClick={handleRevertPayment}
                    disabled={isProcessingPayment}
                    title="Batalkan status lunas jika ada kesalahan"
                  >
                    Batal Lunas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRM PAYMENT MODAL ─── */}
      <CustomModal
        isOpen={isConfirmPayOpen}
        onClose={() => setIsConfirmPayOpen(false)}
        onConfirm={handleConfirmPayment}
        type="confirm"
        title={`Konfirmasi Pembayaran: ${summary?.monthLabel || 'Bulan Ini'}`}
        message={`Tandai tagihan sebesar Rp ${(summary?.totalAmount || 0).toLocaleString('id-ID')} (${summary?.totalCompletedSessions || 0} Sesi Selesai) sebagai LUNAS untuk ${clientName}? Transaksi akan otomatis dicatat.`}
        confirmText="Ya, Tandai Lunas"
        cancelText="Batal"
        isSubmitting={isProcessingPayment}
      />

      {/* ─── ALERT / NOTIFICATION MODAL ─── */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  )
}
