'use server'

import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

type LogActionParams = {
  action: string
  tableName: string
  recordId?: string
  oldValues?: any
  newValues?: any
}

export async function logAudit(params: LogActionParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Attempt to get IP and User Agent safely from headers
    let ipAddress = 'unknown'
    let userAgent = 'unknown'
    try {
      const headersList = await headers()
      ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
      userAgent = headersList.get('user-agent') || 'unknown'
    } catch (e) {
      // Ignore header errors if called outside of request context somehow
    }

    await db.insert(auditLogs).values({
      userId: user?.id || null,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId || null,
      oldValues: params.oldValues || null,
      newValues: params.newValues || null,
      ipAddress: ipAddress.substring(0, 45), // Limit to schema length
      userAgent,
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
