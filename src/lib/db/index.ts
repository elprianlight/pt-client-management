import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Prevent multiple DB connections in development with lazy initialization
const globalForDb = globalThis as unknown as {
  connection: postgres.Sql | undefined
  dbInstance: ReturnType<typeof drizzle<typeof schema>> | undefined
}

function getDbInstance() {
  if (!globalForDb.dbInstance) {
    const connectionString = process.env.DATABASE_URL || ''
    const connection =
      globalForDb.connection ??
      postgres(connectionString, {
        prepare: false, // Required for Supabase Transaction Pooler
        ssl: 'require', // Critical: Prevents 8+ second plaintext fallback and CONNECT_TIMEOUT on Supabase Pooler
        max: 10,
        idle_timeout: 20,
        connect_timeout: 15,
      })

    if (process.env.NODE_ENV !== 'production') {
      globalForDb.connection = connection
    }

    globalForDb.dbInstance = drizzle(connection, { schema })
  }
  return globalForDb.dbInstance
}

// Proxy export so db is created lazily on first query execution
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop: string | symbol) {
    const instance = getDbInstance()
    const value = (instance as any)[prop]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

export type DB = typeof db
