import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Package, Plus } from 'lucide-react'
import Link from 'next/link'
import { PackageList } from '@/components/packages/package-list'
import { PageHero } from '@/components/ui/page-hero'

export const metadata: Metadata = { title: 'Manajemen Paket' }

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) redirect('/login')

  return (
    <div className="page-container">
      <PageHero
        eyebrow="Paket Sesi"
        title="Paket Saya"
        subtitle="Daftar paket sesi latihan Anda beserta sisa sesinya."
        variant="capsule"
      />

      <div className="glass-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <PackageList />
      </div>

    </div>
  )
}
