import { db } from './src/lib/db'
import { users, personalTrainers, clients, ptPackages, workoutSessions } from './src/lib/db/schema'
import { eq, ilike } from 'drizzle-orm'

async function main() {
  console.log('Starting seed script for Karjadi Pranoto Otty...')

  // 1. Get the first Personal Trainer
  const ptList = await db.select().from(personalTrainers).limit(1)
  if (ptList.length === 0) {
    console.error('No personal trainer found. Please create one first.')
    return
  }
  const trainer = ptList[0]
  console.log(`Using trainer ID: ${trainer.id}`)

  // 2. Find or Create Client "Karjadi Pranoto Otty"
  let clientId
  let userId

  const existingUsers = await db.select().from(users).where(ilike(users.fullName, '%Karjadi Pranoto%')).limit(1)
  
  if (existingUsers.length > 0) {
    userId = existingUsers[0].id
    const existingClient = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1)
    if (existingClient.length > 0) {
      clientId = existingClient[0].id
      console.log(`Found existing client Karjadi Pranoto Otty: ${clientId}`)
    }
  }

  if (!clientId) {
    console.log('Creating new user and client for Karjadi Pranoto Otty...')
    const crypto = require('crypto')
    userId = crypto.randomUUID()
    await db.insert(users).values({
      id: userId,
      email: 'karjadi.pranoto@example.com',
      fullName: 'Karjadi Pranoto Otty',
      phone: '081290009690',
      role: 'client',
    })

    const newClient = await db.insert(clients).values({
      userId,
      trainerId: trainer.id,
      medicalNotes: 'Body Recomposition',
    }).returning()
    clientId = newClient[0].id
    console.log(`Created new client ID: ${clientId}`)
  }

  // 3. Create Package "Body Recomposition - Imported"
  console.log('Creating package...')
  const newPackage = await db.insert(ptPackages).values({
    trainerId: trainer.id,
    clientId: clientId,
    packageName: 'Body Recomposition - Imported',
    totalSessions: 10,
    usedSessions: 10,
    pricePerSession: '0',
    totalPrice: '0',
    startDate: '2026-04-20',
    expiresAt: '2026-12-31',
    createdAt: new Date('2026-04-20'),
  }).returning()
  const packageId = newPackage[0].id
  console.log(`Created package ID: ${packageId}`)

  // 4. Insert 10 Sessions
  console.log('Inserting sessions...')
  const sessions = [
    { scheduledAt: '2026-06-29T06:00:00+07:00', programType: 'Total Body', rpe: 8, notes: 'fokus ke penguatan lutut, jadi fokus ke lower body dan juga upper body sebagai penunjang.' },
    { scheduledAt: '2026-06-23T05:45:00+07:00', programType: 'Lower Body', rpe: 8, notes: 'penguatan lower Body + bonus circuit training full body.' },
    { scheduledAt: '2026-06-15T06:00:00+07:00', programType: 'Total Body', rpe: 7, notes: 'Setelah libur minggu lalu, kembali latihan Penguatan lagi untuk seluruh tubuhnya. next akan lanjut ke pembentukan masa otot seluruh badan.' },
    { scheduledAt: '2026-06-02T06:00:00+07:00', programType: 'Cardio', rpe: 8, notes: 'Sudah masuk ke fase cardio untuk muscle endurance nya, target menigkatkan heart rate dan juga endurance nya dengan Circuit Training.' },
    { scheduledAt: '2026-05-28T07:00:00+07:00', programType: 'Hypertrophy', rpe: 7, notes: 'Sudah sangat baik untuk form gerakan dan juga beban latihan sudah bisa di progress lagi untuk endurance muscle nya.' },
    { scheduledAt: '2026-05-18T06:00:00+07:00', programType: 'Hypertrophy', rpe: 7, notes: 'Sudah ada peningkatan dari minggu sebelumnya untuk latihan beban lebih berat. sudah mulai bisa ningkatin speed dan cardiovascularnya.' },
    { scheduledAt: '2026-05-11T06:00:00+07:00', programType: 'Hypertrophy', rpe: 7, notes: 'Sudah mulai latihan untuk meningkatkan masa otot, tetapi dengan berat yang sedang dulu untuk membiasakan otot nya diberikan beban external.' },
    { scheduledAt: '2026-05-04T06:00:00+07:00', programType: 'Strength', rpe: 6, notes: 'Latihan ke 3 sudah mulai kuat dan sudah lebih baik form gerakannya. sudah bisa di lakukan peningkatan untuk sesi berikutnya.' },
    { scheduledAt: '2026-04-27T06:00:00+07:00', programType: 'Strength', rpe: 6, notes: 'Latihan kedua karena latihan cuma 1 kali seminggu fokusnya ke melatih kekuatan seluruh bagian tubuh.' },
    { scheduledAt: '2026-04-20T06:00:00+07:00', programType: 'Strength', rpe: 5, notes: 'Latihan pertama, penyesuaian seluruh badan untuk melakukan latihan beban' }
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

  console.log('Successfully inserted 10 sessions!')
}

main().catch(console.error).then(() => process.exit(0))
