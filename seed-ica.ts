import { db } from './src/lib/db'
import { users, personalTrainers, clients, ptPackages, workoutSessions } from './src/lib/db/schema'
import { eq, ilike } from 'drizzle-orm'

async function main() {
  console.log('Starting seed script for Marysa Iskandar ica...')

  // 1. Get the first Personal Trainer
  const ptList = await db.select().from(personalTrainers).limit(1)
  if (ptList.length === 0) {
    console.error('No personal trainer found. Please create one first.')
    return
  }
  const trainer = ptList[0]
  console.log(`Using trainer ID: ${trainer.id}`)

  // 2. Find or Create Client "Marysa Iskandar ica"
  let clientId
  let userId

  const existingUsers = await db.select().from(users).where(ilike(users.fullName, '%Marysa Iskandar%')).limit(1)
  
  if (existingUsers.length > 0) {
    userId = existingUsers[0].id
    const existingClient = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1)
    if (existingClient.length > 0) {
      clientId = existingClient[0].id
      console.log(`Found existing client Marysa Iskandar: ${clientId}`)
    }
  }

  if (!clientId) {
    console.log('Creating new user and client for Marysa Iskandar ica...')
    const crypto = require('crypto')
    userId = crypto.randomUUID()
    await db.insert(users).values({
      id: userId,
      email: 'marysa.iskandar@example.com',
      fullName: 'Marysa Iskandar ica',
      phone: '08111344016',
      role: 'client',
    })

    const newClient = await db.insert(clients).values({
      userId,
      trainerId: trainer.id,
      medicalNotes: 'General Fitness',
    }).returning()
    clientId = newClient[0].id
    console.log(`Created new client ID: ${clientId}`)
  }

  // 3. Create Package "General Fitness - Imported"
  console.log('Creating package...')
  const newPackage = await db.insert(ptPackages).values({
    trainerId: trainer.id,
    clientId: clientId,
    packageName: 'General Fitness - Imported',
    totalSessions: 20,
    usedSessions: 13,
    pricePerSession: '0',
    totalPrice: '0',
    startDate: '2026-06-13',
    expiresAt: '2026-12-31',
    createdAt: new Date('2026-06-13'),
  }).returning()
  const packageId = newPackage[0].id
  console.log(`Created package ID: ${packageId}`)

  // 4. Insert 13 Sessions
  console.log('Inserting sessions...')
  const sessions = [
    { scheduledAt: '2026-07-25T09:15:00+07:00', programType: 'Total Body', rpe: 8, notes: 'hari ini latihan bareng mas dana, latihan penguatan dan juga latihan Strength Endurance menggunakan TABATA.' },
    { scheduledAt: '2026-07-23T07:15:00+07:00', programType: 'Lower Body', rpe: 7, notes: 'Kak ica kesiangan tapi harus latihan, fokus ke latihan lower body dan juga Core.' },
    { scheduledAt: '2026-07-18T09:30:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Fokus ke latihan seluruh badan dan juga di gabung dengan Circuit Training Tabata.' },
    { scheduledAt: '2026-07-14T07:00:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Latihan seluruh badan target nya hari kamis nanti latihan bokong.' },
    { scheduledAt: '2026-07-11T08:00:00+07:00', programType: 'Lower Body', rpe: 8, notes: 'Latihan yang terfokus pada gerakan squat untuk melatih glutes dan quadriceps.' },
    { scheduledAt: '2026-07-08T07:00:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Latihan yang melatih seluruh badan khusus nya pada core, dan gerakan yang melatih mobility upper dan juga lower body.' },
    { scheduledAt: '2026-07-02T07:00:00+07:00', programType: 'Lower Body', rpe: 8, notes: 'Latihan kaki dengan Dumblle set baru. Lumayan berat untuk kak ica saat sudah lama tidak latihan menggunakan beban yang cukup berat untuk latihan lower body.' },
    { scheduledAt: '2026-06-30T07:00:00+07:00', programType: 'Upper Body', rpe: 8, notes: 'Nyobain dumble set baru. fokus ke penguatan upper body Push and Pull serta perut.' },
    { scheduledAt: '2026-06-27T09:30:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Hari ini fokus ke Hypertropy untuk meningkatkan masa otot upper dan lower body.' },
    { scheduledAt: '2026-06-25T07:15:00+07:00', programType: 'Lower Body', rpe: 8, notes: 'Latihan hari ini fokus ke isometric movement jadi banyak gerakan menahan sesudah mengaktifkan ototnya.' },
    { scheduledAt: '2026-06-23T07:00:00+07:00', programType: 'Upper Body', rpe: 7, notes: 'Latihan Upper body yang berfokus pada back dan lengan belakang.' },
    { scheduledAt: '2026-06-20T09:49:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Fokus lagi untuk bentuk seluruh badan terutama di punggung atau back nya.' },
    { scheduledAt: '2026-06-13T09:00:00+07:00', programType: 'Total Body', rpe: 6, notes: 'Masih ada sore di beberapa bagian tubuh dari latihan sebelumnya. masih butuh waktu untuk kembali ke performance sebelumnya.' }
  ]

  for (const s of sessions) {
    await db.insert(workoutSessions).values({
      packageId,
      trainerId: trainer.id,
      clientId: clientId,
      scheduledAt: new Date(s.scheduledAt),
      completedAt: new Date(s.scheduledAt),
      status: 'completed',
      location: 'Studio',
      duration: 60,
      programType: s.programType,
      rpe: s.rpe,
      ptNotes: s.notes
    })
  }

  console.log('Successfully inserted 13 sessions!')
}

main().catch(console.error).then(() => process.exit(0))
