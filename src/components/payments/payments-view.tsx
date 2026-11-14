'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Receipt, ShieldCheck, Wallet, AlertCircle, Landmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth-store'
import {
  confirmPaymentReport,
  recordPayment,
  rejectPaymentReport,
  saveBankAccount,
  submitPaymentReport,
  voidTransaction,
  type PaymentsOverview,
} from '@/lib/actions/payment'

type Tab = 'recon' | 'reports' | 'record' | 'transactions' | 'banks'

const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID')
const dateId = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }) : '-'

const STATUS_LABEL: Record<string, string> = { pending: 'Menunggu konfirmasi', confirmed: 'Dikonfirmasi', rejected: 'Ditolak' }

export function PaymentsView({ overview }: { overview: PaymentsOverview }) {
  const router = useRouter()
  const userId = useAuthStore((s) => s.user?.id)
  const { role } = overview
  const isAdmin = role === 'super_admin'
  const isPT = role === 'personal_trainer'

  const tabs: { id: Tab; label: string; show: boolean; badge?: number }[] = [
    { id: 'recon', label: role === 'client' ? 'Tagihan' : 'Rekonsiliasi', show: true },
    { id: 'reports', label: isAdmin ? 'Laporan PT' : 'Lapor bayar', show: isAdmin || isPT, badge: isAdmin ? overview.summary.pendingReports : 0 },
    { id: 'record', label: 'Catat bayar', show: isAdmin },
    { id: 'transactions', label: 'Transaksi', show: true },
    { id: 'banks', label: 'Rekening', show: true },
  ]
  const [tab, setTab] = useState<Tab>('recon')
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string; receiptId?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const monthDate = new Date(`${overview.month}-01T00:00:00+07:00`)
  const prev = format(subMonths(monthDate, 1), 'yyyy-MM')
  const next = format(addMonths(monthDate, 1), 'yyyy-MM')

  const done = (text: string, receiptId?: string) => {
    setMessage({ type: 'ok', text, receiptId })
    router.refresh()
  }
  const fail = (text: string) => setMessage({ type: 'err', text })

  // ---------- Catat pembayaran (Admin) dan Lapor bayar (PT) ----------
  const [pkgId, setPkgId] = useState('')
  const [amount, setAmount] = useState('')
  const [periodMonth, setPeriodMonth] = useState(overview.month)
  const [notes, setNotes] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const selectedPkg = useMemo(() => overview.packages.find((p) => p.packageId === pkgId), [overview.packages, pkgId])

  const pickPackage = (id: string) => {
    setPkgId(id)
    const p = overview.packages.find((x) => x.packageId === id)
    if (p && p.billingType === 'prepaid' && p.outstanding > 0) setAmount(String(p.outstanding))
  }

  const submitRecord = async () => {
    setBusy(true)
    const res = await recordPayment({
      packageId: pkgId,
      amount: Number(amount),
      notes,
      monthStr: selectedPkg?.billingType === 'postpaid' ? periodMonth : undefined,
    })
    setBusy(false)
    if (res.success) {
      done(`Pembayaran tercatat, kuitansi ${res.receiptNumber}`, res.transactionId)
      setAmount('')
      setNotes('')
    } else fail(res.error)
  }

  const submitReport = async () => {
    if (!proof) return fail('Foto bukti transfer wajib diunggah')
    if (!userId) return fail('Sesi login tidak ditemukan, muat ulang halaman')
    setBusy(true)
    try {
      const ext = (proof.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${userId}/${crypto.randomUUID()}.${ext}`
      const supabase = createClient()
      const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, proof, { contentType: proof.type })
      if (upErr) throw new Error('Gagal mengunggah bukti: ' + upErr.message)

      const res = await submitPaymentReport({
        packageId: pkgId,
        amount: Number(amount),
        proofPath: path,
        notes,
        periodMonth: selectedPkg?.billingType === 'postpaid' ? periodMonth : undefined,
      })
      if (!res.success) throw new Error(res.error)
      done('Laporan terkirim, menunggu konfirmasi Admin')
      setAmount('')
      setNotes('')
      setProof(null)
    } catch (e: any) {
      fail(e.message || 'Gagal mengirim laporan')
    } finally {
      setBusy(false)
    }
  }

  // ---------- Konfirmasi / tolak laporan, void transaksi ----------
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [voidId, setVoidId] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState('')

  const confirmReport = async (id: string) => {
    setBusy(true)
    const res = await confirmPaymentReport(id)
    setBusy(false)
    res.success ? done(`Laporan dikonfirmasi, kuitansi ${res.receiptNumber}`, res.transactionId) : fail(res.error)
  }
  const rejectReport = async () => {
    if (!rejectId) return
    setBusy(true)
    const res = await rejectPaymentReport(rejectId, rejectReason)
    setBusy(false)
    if (res.success) {
      setRejectId(null)
      setRejectReason('')
      done('Laporan ditolak')
    } else fail(res.error)
  }
  const doVoid = async () => {
    if (!voidId) return
    setBusy(true)
    const res = await voidTransaction(voidId, voidReason)
    setBusy(false)
    if (res.success) {
      setVoidId(null)
      setVoidReason('')
      done('Transaksi di-void')
    } else fail(res.error)
  }

  // ---------- Rekening (Admin) ----------
  const [bankId, setBankId] = useState<string | undefined>()
  const [bankTrainer, setBankTrainer] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankNumber, setBankNumber] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [bankActive, setBankActive] = useState(true)

  const editBank = (b: PaymentsOverview['bankAccounts'][number]) => {
    setBankId(b.id)
    setBankTrainer(b.trainerId)
    setBankName(b.bankName)
    setBankNumber(b.accountNumber)
    setBankHolder(b.accountHolder)
    setBankActive(b.isActive)
  }
  const resetBank = () => {
    setBankId(undefined)
    setBankTrainer('')
    setBankName('')
    setBankNumber('')
    setBankHolder('')
    setBankActive(true)
  }
  const submitBank = async () => {
    setBusy(true)
    const res = await saveBankAccount({
      id: bankId,
      trainerId: bankTrainer,
      bankName,
      accountNumber: bankNumber,
      accountHolder: bankHolder,
      isActive: bankActive,
    })
    setBusy(false)
    if (res.success) {
      resetBank()
      done('Rekening tersimpan')
    } else fail(res.error)
  }

  const s = overview.summary
  const cards = [
    { icon: ShieldCheck, label: 'Sesi dihitung bulan ini', value: String(s.sessionsCounted) },
    { icon: Receipt, label: 'Nilai sesi bulan ini', value: rupiah(s.sessionValue) },
    { icon: Wallet, label: 'Uang diterima bulan ini', value: rupiah(s.received) },
    { icon: AlertCircle, label: 'Piutang (semua paket)', value: rupiah(s.outstandingTotal) },
  ]

  return (
    <div className="pay">
      <div className="pay-month">
        <Link className="pay-month-btn" href={`/payments?month=${prev}`} aria-label="Bulan sebelumnya">
          <ChevronLeft size={18} />
        </Link>
        <strong>{overview.monthLabel}</strong>
        <Link className="pay-month-btn" href={`/payments?month=${next}`} aria-label="Bulan berikutnya">
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="pay-cards">
        {cards.map((c) => (
          <div className="pay-card tilt-card" key={c.label}>
            <c.icon size={18} />
            <span className="pay-card-label">{c.label}</span>
            <span className="pay-card-value">{c.value}</span>
          </div>
        ))}
      </div>

      <div className="pay-tabs" role="tablist">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`pay-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.badge ? <span className="pay-badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {message && (
        <div className={`pay-msg ${message.type === 'ok' ? 'is-ok' : 'is-err'}`} role="status">
          <span>{message.text}</span>
          {message.receiptId && (
            <Link href={`/payments/receipt/${message.receiptId}`} className="pay-link">
              Lihat kuitansi
            </Link>
          )}
        </div>
      )}

      {/* ===== Rekonsiliasi / Tagihan ===== */}
      {tab === 'recon' && (
        <section className="pay-panel">
          {overview.recon.length === 0 && <p className="pay-empty">Belum ada paket.</p>}
          {overview.recon.map((r) => (
            <div className="pay-row" key={r.packageId}>
              <div className="pay-row-main">
                <strong>{r.clientName}</strong>
                <span className="pay-sub">
                  {r.packageName} · {r.billingType === 'postpaid' ? 'Pascabayar' : 'Prabayar'}
                  {role !== 'client' ? ` · PT ${r.trainerName}` : ''}
                </span>
              </div>
              <div className="pay-row-nums">
                <span>Sisa sesi <b>{r.remainingSessions}</b>/{r.totalSessions}</span>
                <span>Dibayar <b>{rupiah(r.paid)}</b> dari {rupiah(r.owed)}</span>
                <span className={r.outstanding > 0 ? 'pay-due' : 'pay-ok'}>
                  {r.outstanding > 0 ? `Piutang ${rupiah(r.outstanding)}` : 'Lunas'}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ===== Catat pembayaran (Admin) ===== */}
      {tab === 'record' && isAdmin && (
        <section className="pay-panel">
          <PaymentForm
            packages={overview.packages}
            pkgId={pkgId}
            pickPackage={pickPackage}
            selectedPkg={selectedPkg}
            amount={amount}
            setAmount={setAmount}
            periodMonth={periodMonth}
            setPeriodMonth={setPeriodMonth}
            notes={notes}
            setNotes={setNotes}
          />
          <button className="btn-primary pay-submit" disabled={busy || !pkgId || !Number(amount)} onClick={submitRecord}>
            {busy ? 'Menyimpan…' : 'Catat pembayaran'}
          </button>
        </section>
      )}

      {/* ===== Laporan PT ===== */}
      {tab === 'reports' && (isAdmin || isPT) && (
        <section className="pay-panel">
          {isPT && (
            <div className="pay-form-box">
              <h3 className="pay-h">Lapor pembayaran yang Anda terima</h3>
              <PaymentForm
                packages={overview.packages}
                pkgId={pkgId}
                pickPackage={pickPackage}
                selectedPkg={selectedPkg}
                amount={amount}
                setAmount={setAmount}
                periodMonth={periodMonth}
                setPeriodMonth={setPeriodMonth}
                notes={notes}
                setNotes={setNotes}
              />
              <label className="pay-label">Foto bukti transfer (wajib)</label>
              <input
                className="input-field"
                type="file"
                accept="image/*"
                onChange={(e) => setProof(e.target.files?.[0] ?? null)}
              />
              <button className="btn-primary pay-submit" disabled={busy || !pkgId || !Number(amount) || !proof} onClick={submitReport}>
                {busy ? 'Mengirim…' : 'Kirim laporan ke Admin'}
              </button>
            </div>
          )}

          {overview.reports.length === 0 && <p className="pay-empty">Belum ada laporan pembayaran.</p>}
          {overview.reports.map((r) => (
            <div className="pay-row" key={r.id}>
              <div className="pay-row-main">
                <strong>{r.clientName} · {rupiah(r.amount)}</strong>
                <span className="pay-sub">
                  {r.packageName} · PT {r.trainerName} · {dateId(r.createdAt)}
                  {r.periodMonth ? ` · tagihan ${r.periodMonth}` : ''}
                </span>
                {r.notes && <span className="pay-sub">{r.notes}</span>}
                {r.rejectReason && <span className="pay-due">Ditolak: {r.rejectReason}</span>}
                {r.proofUrl && (
                  <a className="pay-link" href={r.proofUrl} target="_blank" rel="noreferrer">
                    Lihat bukti transfer
                  </a>
                )}
              </div>
              <div className="pay-row-nums">
                <span className={`pay-chip pay-chip-${r.status}`}>{STATUS_LABEL[r.status] ?? r.status}</span>
                {isAdmin && r.status === 'pending' && (
                  <div className="pay-actions">
                    <button className="btn-primary pay-small" disabled={busy} onClick={() => confirmReport(r.id)}>
                      Konfirmasi
                    </button>
                    <button className="pay-small pay-ghost" disabled={busy} onClick={() => setRejectId(r.id)}>
                      Tolak
                    </button>
                  </div>
                )}
                {isAdmin && rejectId === r.id && (
                  <div className="pay-inline">
                    <input
                      className="input-field"
                      placeholder="Alasan penolakan"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <button className="pay-small pay-ghost" disabled={busy || !rejectReason.trim()} onClick={rejectReport}>
                      Kirim
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ===== Transaksi ===== */}
      {tab === 'transactions' && (
        <section className="pay-panel">
          {overview.transactions.length === 0 && <p className="pay-empty">Belum ada transaksi.</p>}
          {overview.transactions.map((t) => (
            <div className={`pay-row ${t.voidedAt ? 'is-void' : ''}`} key={t.id}>
              <div className="pay-row-main">
                <strong>
                  {t.receiptNumber ?? 'Tanpa nomor'} · {rupiah(t.amount)}
                </strong>
                <span className="pay-sub">
                  {t.clientName} · {t.packageName} · {dateId(t.paymentDate)}
                  {role !== 'client' ? ` · PT ${t.trainerName}` : ''}
                </span>
                {t.notes && <span className="pay-sub">{t.notes}</span>}
                {t.voidedAt && <span className="pay-due">Di-void: {t.voidReason}</span>}
              </div>
              <div className="pay-row-nums">
                {!t.voidedAt && (
                  <Link className="pay-link" href={`/payments/receipt/${t.id}`}>
                    Kuitansi
                  </Link>
                )}
                {isAdmin && !t.voidedAt && (
                  <button className="pay-small pay-ghost" onClick={() => setVoidId(t.id)}>
                    Void
                  </button>
                )}
                {isAdmin && voidId === t.id && (
                  <div className="pay-inline">
                    <input
                      className="input-field"
                      placeholder="Alasan void"
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                    />
                    <button className="pay-small pay-ghost" disabled={busy || !voidReason.trim()} onClick={doVoid}>
                      Void
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ===== Rekening ===== */}
      {tab === 'banks' && (
        <section className="pay-panel">
          {overview.bankAccounts.length === 0 && <p className="pay-empty">Belum ada rekening tujuan transfer.</p>}
          {overview.bankAccounts.map((b) => (
            <div className="pay-row" key={b.id}>
              <div className="pay-row-main">
                <strong>
                  <Landmark size={15} style={{ display: 'inline', marginRight: 6 }} />
                  {b.bankName} · {b.accountNumber}
                </strong>
                <span className="pay-sub">a.n. {b.accountHolder} · PT {b.trainerName}{b.isActive ? '' : ' · nonaktif'}</span>
              </div>
              {isAdmin && (
                <div className="pay-row-nums">
                  <button className="pay-small pay-ghost" onClick={() => editBank(b)}>
                    Ubah
                  </button>
                </div>
              )}
            </div>
          ))}

          {isAdmin && (
            <div className="pay-form-box">
              <h3 className="pay-h">{bankId ? 'Ubah rekening' : 'Tambah rekening PT'}</h3>
              <label className="pay-label">PT</label>
              <select className="input-field" value={bankTrainer} onChange={(e) => setBankTrainer(e.target.value)}>
                <option value="">Pilih PT</option>
                {overview.trainers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <label className="pay-label">Nama bank</label>
              <input className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <label className="pay-label">Nomor rekening</label>
              <input className="input-field" inputMode="numeric" value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} />
              <label className="pay-label">Atas nama</label>
              <input className="input-field" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} />
              <label className="pay-check">
                <input type="checkbox" checked={bankActive} onChange={(e) => setBankActive(e.target.checked)} /> Aktif
              </label>
              <div className="pay-actions">
                <button className="btn-primary pay-submit" disabled={busy || !bankTrainer || !bankName || !bankNumber || !bankHolder} onClick={submitBank}>
                  {busy ? 'Menyimpan…' : 'Simpan rekening'}
                </button>
                {bankId && (
                  <button className="pay-small pay-ghost" onClick={resetBank}>
                    Batal ubah
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <style jsx>{`
        .pay { display: flex; flex-direction: column; gap: 14px; }
        .pay-month { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .pay-month-btn { display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid var(--border-default); color: var(--text-primary); background: var(--bg-surface); }
        .pay-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 900px) { .pay-cards { grid-template-columns: repeat(4, 1fr); } }
        .pay-card { display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 22px; background: var(--bg-surface); border: 1px solid var(--border-default); color: var(--brand-primary); }
        .pay-card-label { font-size: 12px; color: var(--text-secondary); }
        .pay-card-value { font-family: var(--font-heading), 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
        .pay-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
        .pay-tab { min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-secondary); font-weight: 600; white-space: nowrap; cursor: pointer; }
        .pay-tab.is-active { background: var(--brand-primary); border-color: transparent; color: #fff; }
        .pay-badge { margin-left: 8px; padding: 1px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.25); font-size: 12px; }
        .pay-msg { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 16px; font-size: 14px; }
        .pay-msg.is-ok { background: rgba(61, 220, 151, 0.14); border: 1px solid rgba(61, 220, 151, 0.4); color: var(--text-primary); }
        .pay-msg.is-err { background: rgba(255, 90, 90, 0.14); border: 1px solid rgba(255, 90, 90, 0.4); color: var(--text-primary); }
        .pay-panel { display: flex; flex-direction: column; gap: 10px; }
        .pay-row { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; padding: 14px 16px; border-radius: 20px; background: var(--bg-surface); border: 1px solid var(--border-default); }
        .pay-row.is-void { opacity: 0.6; }
        .pay-row-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1 1 240px; }
        .pay-row-nums { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
        .pay-row-nums b { color: var(--text-primary); }
        .pay-sub { font-size: 12.5px; color: var(--text-secondary); }
        .pay-due { color: #ff7a7a; font-weight: 600; font-size: 13px; }
        .pay-ok { color: #3ddc97; font-weight: 600; }
        .pay-empty { padding: 24px; text-align: center; color: var(--text-secondary); }
        .pay-link { color: var(--brand-primary); font-weight: 600; font-size: 13px; }
        .pay-chip { padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid var(--border-default); }
        .pay-chip-pending { color: #ffc857; }
        .pay-chip-confirmed { color: #3ddc97; }
        .pay-chip-rejected { color: #ff7a7a; }
        .pay-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .pay-inline { display: flex; gap: 8px; align-items: center; }
        .pay-small { min-height: 40px; padding: 0 14px; border-radius: 999px; font-weight: 600; font-size: 13px; cursor: pointer; }
        .pay-ghost { background: transparent; border: 1px solid var(--border-default); color: var(--text-primary); }
        .pay-submit { min-height: 48px; padding: 0 22px; border-radius: 999px; }
        .pay-form-box { display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: 22px; background: var(--bg-surface); border: 1px solid var(--border-default); }
        .pay-h { font-family: var(--font-heading), 'Sora', sans-serif; font-size: 16px; font-weight: 700; }
        .pay-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .pay-check { display: flex; gap: 8px; align-items: center; font-size: 14px; }
      `}</style>
    </div>
  )
}

interface FormProps {
  packages: PaymentsOverview['packages']
  pkgId: string
  pickPackage: (id: string) => void
  selectedPkg?: PaymentsOverview['packages'][number]
  amount: string
  setAmount: (v: string) => void
  periodMonth: string
  setPeriodMonth: (v: string) => void
  notes: string
  setNotes: (v: string) => void
}

function PaymentForm({ packages, pkgId, pickPackage, selectedPkg, amount, setAmount, periodMonth, setPeriodMonth, notes, setNotes }: FormProps) {
  return (
    <div className="pf">
      <label className="pf-label">Klien dan paket</label>
      <select className="input-field" value={pkgId} onChange={(e) => pickPackage(e.target.value)}>
        <option value="">Pilih paket</option>
        {packages.map((p) => (
          <option key={p.packageId} value={p.packageId}>
            {p.clientName} — {p.packageName} ({p.billingType === 'postpaid' ? 'pascabayar' : `sisa ${rupiah(p.outstanding)}`})
          </option>
        ))}
      </select>

      {selectedPkg?.billingType === 'postpaid' && (
        <>
          <label className="pf-label">Bulan tagihan</label>
          <input className="input-field" type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
        </>
      )}

      <label className="pf-label">Jumlah (Rp)</label>
      <input className="input-field" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} />

      <label className="pf-label">Catatan (opsional)</label>
      <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <style jsx>{`
        .pf { display: flex; flex-direction: column; gap: 8px; }
        .pf-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
      `}</style>
    </div>
  )
}
