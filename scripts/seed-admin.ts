/**
 * Seed Script: Buat akun Super Admin pertama
 * Run: npm run db:seed
 *
 * Script ini akan membuat:
 * 1. User baru di Supabase Auth (dengan email dummy `admin@pt.local`)
 * 2. Record di tabel `users` dengan role `super_admin`
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { users } from '../src/lib/db/schema'

// =============================================================================
// CONFIG: Ganti data di bawah ini sesuai keinginan Anda
// =============================================================================
const ADMIN_USERNAME = 'superadmin'
const ADMIN_PASSWORD = 'Admin@123'
const ADMIN_FULLNAME = 'Super Administrator'
const ADMIN_PHONE = ''
// =============================================================================

async function seedAdmin() {
  console.log('🚀 Memulai seed Super Admin...\n')

  // Validate env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.DATABASE_URL) {
    console.error('❌ Error: Pastikan .env.local sudah berisi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan DATABASE_URL')
    process.exit(1)
  }

  // Init Supabase Admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Init Drizzle
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
  const db = drizzle(sql)

  const dummyEmail = `${ADMIN_USERNAME}@pt.local`

  try {
    // 1. Cek apakah user sudah ada di Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existing = existingUsers?.users.find(u => u.email === dummyEmail)

    let authUserId: string

    if (existing) {
      console.log(`⚠️  User Auth dengan username "${ADMIN_USERNAME}" sudah ada. Menggunakan ID yang ada.`)
      authUserId = existing.id
    } else {
      // 2. Buat user baru di Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password: ADMIN_PASSWORD,
        email_confirm: true, // bypass email verification
        user_metadata: {
          full_name: ADMIN_FULLNAME,
          username: ADMIN_USERNAME,
          role: 'super_admin',
        }
      })

      if (authError || !authData.user) {
        console.error('❌ Gagal membuat user Auth:', authError?.message)
        process.exit(1)
      }

      authUserId = authData.user.id
      console.log(`✅ User Auth berhasil dibuat. ID: ${authUserId}`)
    }

    // 3. Upsert record ke tabel `users`
    await db
      .insert(users)
      .values({
        id: authUserId,
        email: dummyEmail,
        username: ADMIN_USERNAME,
        fullName: ADMIN_FULLNAME,
        phone: ADMIN_PHONE || null,
        role: 'super_admin',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: ADMIN_USERNAME,
          fullName: ADMIN_FULLNAME,
          role: 'super_admin',
          isActive: true,
        }
      })

    console.log(`✅ Record tabel 'users' berhasil dibuat/diupdate.`)
    console.log('\n' + '='.repeat(50))
    console.log('🎉 Super Admin berhasil dibuat!')
    console.log('='.repeat(50))
    console.log(`   Username : ${ADMIN_USERNAME}`)
    console.log(`   Password : ${ADMIN_PASSWORD}`)
    console.log(`   Role     : Super Admin`)
    console.log('='.repeat(50))
    console.log('\nSilakan login di: http://localhost:3000/login\n')

  } catch (error) {
    console.error('❌ Error tidak terduga:', error)
    process.exit(1)
  } finally {
    await sql.end()
    process.exit(0)
  }
}

seedAdmin()
