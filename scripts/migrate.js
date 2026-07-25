require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running migration to add program_type and rpe to workout_sessions...');
    await sql`
      ALTER TABLE workout_sessions 
      ALTER COLUMN duration SET DEFAULT 60,
      ADD COLUMN IF NOT EXISTS program_type varchar(255),
      ADD COLUMN IF NOT EXISTS rpe integer;
    `;
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
