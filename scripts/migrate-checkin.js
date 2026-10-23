require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running migration for check-in feature...');

    // 1. Add check_in value to session_status enum if not already present
    // Postgres doesn't support 'ADD VALUE IF NOT EXISTS' in some transaction blocks or older versions,
    // so we can check if it exists in pg_enum first or use safe query
    const enumCheck = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'session_status' AND pg_enum.enumlabel = 'check_in';
    `;

    if (enumCheck.length === 0) {
      console.log("Adding 'check_in' to session_status enum...");
      await sql`ALTER TYPE session_status ADD VALUE 'check_in';`;
      console.log("Added 'check_in' value successfully.");
    } else {
      console.log("'check_in' already exists in session_status enum.");
    }

    // 2. Add check_in_at column to workout_sessions
    console.log("Adding 'check_in_at' column to workout_sessions table...");
    await sql`
      ALTER TABLE workout_sessions 
      ADD COLUMN IF NOT EXISTS check_in_at timestamp with time zone;
    `;
    console.log("Added 'check_in_at' column successfully.");

    console.log('Check-in migration finished successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
