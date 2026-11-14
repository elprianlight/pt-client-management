import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getReceipt } from '@/lib/actions/payment'
import { PrintButton } from '@/components/payments/print-button'

export const metadata: Metadata = { title: 'Kuitansi' }

const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID')
const dateId = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getReceipt(id)
  if (!r) notFound()

  const remaining = Math.max(r.totalPrice - r.totalPaid, 0)

  return (
    <div className="rc-wrap">
      <article className="rc" aria-label={`Kuitansi ${r.receiptNumber ?? ''}`}>
        <header className="rc-head">
          <div>
            <p className="rc-brand">Strength Lab · Elprian Training</p>
            <h1 className="rc-title">Kuitansi Pembayaran</h1>
          </div>
          <p className="rc-no">{r.receiptNumber ?? 'Tanpa nomor'}</p>
        </header>

        {r.voidedAt && <p className="rc-void">DI-VOID: {r.voidReason}</p>}

        <dl className="rc-list">
          <div><dt>Tanggal</dt><dd>{dateId(r.paymentDate)}</dd></div>
          <div><dt>Diterima dari</dt><dd>{r.clientName}</dd></div>
          <div><dt>Personal Trainer</dt><dd>{r.trainerName}</dd></div>
          <div><dt>Paket</dt><dd>{r.packageName} ({r.billingType === 'postpaid' ? 'Pascabayar' : 'Prabayar'})</dd></div>
          {r.notes && <div><dt>Catatan</dt><dd>{r.notes}</dd></div>}
        </dl>

        <p className="rc-amount">{rupiah(r.amount)}</p>

        {r.billingType !== 'postpaid' && (
          <p className="rc-sub">
            Total paket {rupiah(r.totalPrice)} · Sudah dibayar {rupiah(r.totalPaid)} ·{' '}
            {remaining > 0 ? `Sisa ${rupiah(remaining)}` : 'Lunas'}
          </p>
        )}

        {r.bank && (
          <div className="rc-bank">
            <strong>Rekening tujuan transfer</strong>
            <span>{r.bank.bankName} · {r.bank.accountNumber}</span>
            <span>a.n. {r.bank.accountHolder}</span>
          </div>
        )}
      </article>

      <PrintButton />

      <style>{`
        .rc-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 8px 0 24px; }
        .rc { width: 100%; max-width: 560px; padding: 28px; border-radius: 24px; background: #fff; color: #1b1512; border: 1px solid #e5ddd7; display: flex; flex-direction: column; gap: 16px; }
        .rc-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .rc-brand { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #d23a2a; font-weight: 700; }
        .rc-title { font-size: 22px; font-weight: 800; margin-top: 4px; }
        .rc-no { font-family: ui-monospace, monospace; font-weight: 700; font-size: 15px; }
        .rc-void { padding: 8px 12px; border-radius: 12px; background: #fdecea; color: #b3261e; font-weight: 700; }
        .rc-list { display: flex; flex-direction: column; gap: 8px; }
        .rc-list div { display: flex; justify-content: space-between; gap: 16px; font-size: 14px; border-bottom: 1px dashed #e5ddd7; padding-bottom: 6px; }
        .rc-list dt { color: #6b605a; }
        .rc-list dd { font-weight: 600; text-align: right; }
        .rc-amount { font-size: 32px; font-weight: 800; font-variant-numeric: tabular-nums; }
        .rc-sub { font-size: 13px; color: #6b605a; }
        .rc-bank { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border-radius: 16px; background: #f6f1ed; font-size: 13px; }
        @media print {
          body * { visibility: hidden; }
          .rc, .rc * { visibility: visible; }
          .rc { position: absolute; inset: 0; border: none; border-radius: 0; }
        }
      `}</style>
    </div>
  )
}
