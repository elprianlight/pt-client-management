import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { PackageForm } from '@/components/packages/package-form'
import { listClients } from '@/lib/actions/client'
import { getPackageById } from '@/lib/actions/package'

export const metadata: Metadata = { title: 'Edit Paket PT' }

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const packageData = await getPackageById(resolvedParams.id)
  if (!packageData) return notFound()

  // Ambil daftar client untuk dropdown (hanya untuk tampilan, karena dikunci saat edit)
  const clientsData = await listClients()
  const clientOptions = clientsData.map(c => ({
    id: c.id,
    name: c.user?.fullName || c.user?.username || 'Unknown',
  }))

  return (
    <div className="page-container">
      <div className="new-package-header animate-fade-in-up">
        <Link href="/packages" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Daftar Paket
        </Link>
        <div className="new-package-title-row">
          <div className="page-header-icon">
            <Edit size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-package-title">Edit Paket PT</h2>
            <p className="new-package-desc">
              Ubah data paket seperti nama, jumlah sesi, harga, atau catatan khusus.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card new-package-card animate-fade-in-up">
        <PackageForm clients={clientOptions} initialData={packageData} />
      </div>
    </div>
  )
}
