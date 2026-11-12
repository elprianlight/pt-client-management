import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Apple, Plus } from 'lucide-react'
import { getNutritionLogs } from '@/lib/actions/nutrition'
import { DataTable } from '@/components/ui/data-table'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { PageHero } from '@/components/ui/page-hero'

export const metadata: Metadata = { title: 'Nutrition & Diet' }

export default async function NutritionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')
  if (profile.role === 'super_admin' || profile.role === 'personal_trainer') redirect('/clients')

  const logs = await getNutritionLogs()

  // For MVP, we render a simple list
  const columns = [
    {
      key: 'logDate',
      label: 'Tanggal',
      render: (row: any) => format(new Date(row.logDate), 'dd MMM yyyy', { locale: id })
    },
    { key: 'clientName', label: 'Client' },
    {
      key: 'calories',
      label: 'Kalori (Kkal)',
      render: (row: any) => `${row.consumedCalories || 0} / ${row.targetCalories || '—'}`
    },
    {
      key: 'protein',
      label: 'Protein (g)',
      render: (row: any) => `${row.consumedProtein || 0} / ${row.targetProtein || '—'}`
    },
    {
      key: 'waterMl',
      label: 'Air (ml)',
      render: (row: any) => `${row.waterMl || 0}`
    }
  ]

  return (
    <div className="page-container">
      <PageHero
        eyebrow="Nutrition & Diet"
        title="Nutrisi & Pola Makan"
        subtitle="Pantau target nutrisi, asupan kalori, dan catatan diet."
        variant="apple"
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          <Plus size={16} /> Catat Makanan (Segera Hadir)
        </button>
      </div>

      <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <DataTable data={logs} columns={columns} searchPlaceholder="Cari riwayat nutrisi..." />
      </div>
    </div>
  )
}
