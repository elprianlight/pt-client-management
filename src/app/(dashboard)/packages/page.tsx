import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Package, Plus } from 'lucide-react'
import Link from 'next/link'
import { PackageList } from '@/components/packages/package-list'

export const metadata: Metadata = { title: 'Manajemen Paket' }

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')

  // Hanya Super Admin & PT yang bisa tambah paket
  const canAddPackage = profile.role === 'super_admin' || profile.role === 'personal_trainer'

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <div className="page-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(249,115,22,0.2))', borderColor: 'rgba(234,179,8,0.25)', color: '#eab308' }}>
            <Package size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="page-title">Manajemen Paket</h1>
            <p className="page-desc">Kelola dan pantau penjualan paket sesi latihan.</p>
          </div>
        </div>
        {canAddPackage && (
          <Link href="/packages/new" className="btn-primary">
            <Plus size={16} /> Jual Paket Baru
          </Link>
        )}
      </div>

      <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <PackageList />
      </div>

    </div>
  )
}
