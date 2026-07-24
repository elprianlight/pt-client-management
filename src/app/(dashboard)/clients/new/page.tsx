import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { ClientForm } from '@/components/clients/client-form'

export const metadata: Metadata = { title: 'Tambah Client' }

export default async function NewClientPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile || profile.role === 'client') redirect('/dashboard')

  return (
    <div className="page-container">
      <div className="new-client-header animate-fade-in-up">
        <Link href="/clients" className="back-link">
          <ArrowLeft size={16} />
          Kembali ke Daftar Client
        </Link>
        <div className="new-client-title-row">
          <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))', borderColor: 'rgba(139,92,246,0.25)', color: '#8b5cf6' }}>
            <UserPlus size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="new-client-title">Tambah Client</h2>
            <p className="new-client-desc">Daftarkan Client baru ke dalam sistem</p>
          </div>
        </div>
      </div>

      <div className="glass-card new-client-card animate-fade-in-up">
        <ClientForm mode="create" />
      </div>
    </div>
  )
}
