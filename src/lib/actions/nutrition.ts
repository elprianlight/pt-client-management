'use server'

import { db } from '@/lib/db'
import { nutritionLogs, clients, users } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function getNutritionLogs() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return []

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser) return []

    let query = db.select({
      id: nutritionLogs.id,
      logDate: nutritionLogs.logDate,
      targetCalories: nutritionLogs.targetCalories,
      consumedCalories: nutritionLogs.consumedCalories,
      targetProtein: nutritionLogs.targetProtein,
      consumedProtein: nutritionLogs.consumedProtein,
      waterMl: nutritionLogs.waterMl,
      clientName: users.fullName,
    })
    .from(nutritionLogs)
    .innerJoin(clients, eq(nutritionLogs.clientId, clients.id))
    .innerJoin(users, eq(clients.userId, users.id))

    // If client, only see their own
    if (currentUser.role === 'client') {
      const [clientData] = await db.select().from(clients).where(eq(clients.userId, currentUser.id))
      query = query.where(eq(nutritionLogs.clientId, clientData.id)) as any
    }
    
    // For MVP, we just return the most recent logs
    const data = await query.orderBy(desc(nutritionLogs.logDate)).limit(50)
    return data
  } catch (err) {
    console.error('Get nutrition logs error:', err)
    return []
  }
}
