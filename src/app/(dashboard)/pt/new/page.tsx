import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { PTForm } from '@/components/pt/pt-form'

export const metadata: Metadata = { title: 'Tambah Personal Trainer' }

export default async function NewPTPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="page-container">
      <div className="new-pt-header animate-fade-in-up">
        <Link href="/pt" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Daftar PT
        </Link>
        <div className="new-pt-title-row">
          <div className="page-header-icon">
            <UserPlus size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-pt-title">Tambah Personal Trainer</h2>
            <p className="new-pt-desc">Daftarkan Personal Trainer baru ke dalam sistem</p>
          </div>
        </div>
      </div>

      <div className="glass-card new-pt-card animate-fade-in-up">
        <PTForm mode="create" />
      </div>
    </div>
  )
}
