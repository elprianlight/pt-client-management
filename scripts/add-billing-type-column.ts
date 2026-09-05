import postgres from 'postgres'
import { config } from 'dotenv'
config({ path: '.env.local' })

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in env')
    process.exit(1)
  }

  const sql = postgres(dbUrl, { prepare: false, ssl: 'require' })

  try {
    console.log('Adding billing_type column to pt_packages table...')
    await sql`ALTER TABLE pt_packages ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) DEFAULT 'prepaid';`
    console.log('Successfully added billing_type column!')
  } catch (err) {
    console.error('Error altering table:', err)
  } finally {
    await sql.end()
  }
}

main()
