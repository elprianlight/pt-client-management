import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthProvider } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: {
    template: '%s — PT Client Management',
    default: 'Dashboard — PT Client Management',
  },
  description: 'Platform manajemen Personal Trainer terpadu',
}

import { BottomNav } from '@/components/layout/bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [profile] = await db.select().from(users).where(eq(users.id, user.id))
  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="dashboard-layout">
      <AuthProvider user={profile} role={profile.role} />
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
