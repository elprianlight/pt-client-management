import postgres from 'postgres'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in env')
    process.exit(1)
  }

  const sql = postgres(dbUrl, { prepare: false })

  try {
    console.log('Adding fitness_goal column to clients table...')
    await sql`ALTER TABLE clients ADD COLUMN IF NOT EXISTS fitness_goal varchar(255);`
    console.log('Successfully added fitness_goal column!')
  } catch (err) {
    console.error('Error altering table:', err)
  } finally {
    await sql.end()
  }
}

main()
