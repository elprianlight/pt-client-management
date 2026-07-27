import { db } from './src/lib/db'
import { users, personalTrainers, clients, ptPackages, workoutSessions } from './src/lib/db/schema'
import { eq, ilike } from 'drizzle-orm'

async function main() {
  console.log('Starting seed script for Chininta Satar Inta...')

  // 1. Get the first Personal Trainer
  const ptList = await db.select().from(personalTrainers).limit(1)
  if (ptList.length === 0) {
    console.error('No personal trainer found. Please create one first.')
    return
  }
  const trainer = ptList[0]
  console.log(`Using trainer ID: ${trainer.id}`)

  // 2. Find or Create Client "Chininta Satar Inta"
  let clientId
  let userId

  const existingUsers = await db.select().from(users).where(ilike(users.fullName, '%Chininta Satar%')).limit(1)
  
  if (existingUsers.length > 0) {
    userId = existingUsers[0].id
    const existingClient = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1)
    if (existingClient.length > 0) {
      clientId = existingClient[0].id
      console.log(`Found existing client Chininta Satar Inta: ${clientId}`)
    }
  }

  if (!clientId) {
    console.log('Creating new user and client for Chininta Satar Inta...')
    const crypto = require('crypto')
    userId = crypto.randomUUID()
    await db.insert(users).values({
      id: userId,
      email: 'chininta.satar@example.com',
      fullName: 'Chininta Satar Inta',
      phone: '081298269269',
      role: 'client',
    })

    const newClient = await db.insert(clients).values({
      userId,
      trainerId: trainer.id,
      medicalNotes: 'Weight Loss',
    }).returning()
    clientId = newClient[0].id
    console.log(`Created new client ID: ${clientId}`)
  }

  // 3. Create Package "Weight Loss - Imported"
  console.log('Creating package...')
  const newPackage = await db.insert(ptPackages).values({
    trainerId: trainer.id,
    clientId: clientId,
    packageName: 'Weight Loss - Imported',
    totalSessions: 10,
    usedSessions: 10,
    pricePerSession: '0',
    totalPrice: '0',
    startDate: '2026-06-05',
    expiresAt: '2026-12-31',
    createdAt: new Date('2026-06-05'),
  }).returning()
  const packageId = newPackage[0].id
  console.log(`Created package ID: ${packageId}`)

  // 4. Insert 10 Sessions
  console.log('Inserting sessions...')
  const sessions = [
    { scheduledAt: '2026-07-10T06:00:00+07:00', programType: 'Total Body', rpe: 9, notes: 'latihan hari ini terfokus pada jantung dan juga paru paru target heart rate di 140-150an untuk menigkatkan kinerja jantung dan paru paru.' },
    { scheduledAt: '2026-07-08T06:00:00+07:00', programType: 'Total Body', rpe: 7, notes: 'Latihan total body yang berfokus pada gerakan Superset dengan istirahat antara 2 gerakan sedikit.' },
    { scheduledAt: '2026-07-03T06:00:00+07:00', programType: 'Lower Body', rpe: 8, notes: 'fokus hari ini untuk meningkatkan Cardiorespirastory training nya khusus nya pada pergerakan.' },
    { scheduledAt: '2026-07-01T06:00:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Latihan Penguatan untuk seluruh badan lower dan upper body untuk peningkatan masa otot.' },
    { scheduledAt: '2026-06-26T06:00:00+07:00', programType: 'Total Body', rpe: 6, notes: 'kurang tidur sudah bangun dari jam 3, jadi di kurangin untuk intensitas latihannya.' },
    { scheduledAt: '2026-06-24T06:00:00+07:00', programType: 'Total Body', rpe: 6, notes: 'Pagi ini kaki kak inta sakit jadi fokusnya ke penguatan paha Dan juga Bokong agar nyeri di lutut bagian dalamnya hilang.' },
    { scheduledAt: '2026-06-17T06:00:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Latihan penguatan otot bertujuan meningkatkan masa otot seluruh bagian tubuh agar lebih kuat.' },
    { scheduledAt: '2026-06-12T06:15:00+07:00', programType: 'Total Body', rpe: 6, notes: 'Kak inta sudah lebih fokus dan sudah lebih baik dari latihan sebelumnya. memang masih agak lemah di upper body nya.' },
    { scheduledAt: '2026-06-10T06:15:00+07:00', programType: 'Total Body', rpe: 8, notes: 'Kak inta masih belum terlihat FIT dan mengalami kekuan di pundak kanan sehingga sulit untuk memutar kepala ke arah kanan.' },
    { scheduledAt: '2026-06-05T06:00:00+07:00', programType: 'Upper Body', rpe: 7, notes: 'Kak inta masih kurang FIT dan sempet kleyengan pusing serta masih kurang fokus.' }
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
