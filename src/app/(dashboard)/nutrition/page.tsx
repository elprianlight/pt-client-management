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

export const metadata: Metadata = { title: 'Nutrition & Diet' }

export default async function NutritionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')

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
      <div className="page-header animate-fade-in-up">
        <div className="page-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(20,184,166,0.2))', borderColor: 'rgba(34,197,94,0.25)', color: '#22c55e' }}>
            <Apple size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="page-title">Nutrition & Diet</h1>
            <p className="page-desc">Pantau target nutrisi, asupan kalori, dan catatan diet.</p>
          </div>
        </div>
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
