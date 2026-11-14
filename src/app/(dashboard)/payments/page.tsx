import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHero } from '@/components/ui/page-hero'
import { PaymentsView } from '@/components/payments/payments-view'
import { getPaymentsOverview } from '@/lib/actions/payment'

export const metadata: Metadata = { title: 'Pembayaran' }

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const overview = await getPaymentsOverview(month)
  if (!overview) redirect('/login')

  const subtitle =
    overview.role === 'client'
      ? 'Tagihan, riwayat pembayaran, dan rekening tujuan transfer.'
      : overview.role === 'personal_trainer'
      ? 'Laporkan pembayaran yang Anda terima dan pantau status tagihan klien.'
      : 'Catat pembayaran, konfirmasi laporan PT, dan rekonsiliasi sesi dengan uang.'

  return (
    <>
      <PageHero
        eyebrow="Keuangan sesi"
        title="Pembayaran"
        subtitle={subtitle}
        chips={[overview.monthLabel]}
        variant="donut"
      />
      <PaymentsView overview={overview} />
    </>
  )
}
