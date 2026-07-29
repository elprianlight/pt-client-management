'use server'

import { db } from '@/lib/db'
import { workoutSessions, ptPackages, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
export interface ParsedExercise {
  id: string
  name: string
  sets: number
  targetType: 'reps' | 'seconds'
  targetValue: string
  weight: number
}

export interface PDFParseResult {
  success: boolean
  error?: string
  text?: string
  suggestedProgram?: string
  suggestedDate?: string
  suggestedLocation?: string
  exercises?: ParsedExercise[]
}

/**
 * Helper function to extract readable text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Attempt CommonJS require for pdf-parse
    const pdfParse = require('pdf-parse')
    const parseFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || pdfParse
    if (typeof parseFn === 'function') {
      const data = await parseFn(buffer)
      if (data && data.text) return data.text
    }
  } catch (e) {
    console.warn('pdf-parse library fallback engaged:', e)
  }

  // Fallback text extractor from PDF raw stream buffer
  try {
    const str = buffer.toString('utf-8')
    // Extract text blocks between BT ... ET in PDF specs
    const matches = str.match(/BT[\s\S]*?ET/g) || []
    const extractedLines: string[] = []
    matches.forEach(block => {
      const textMatches = block.match(/\((.*?)\)\s*Tj/g) || block.match(/\[(.*?)\]\s*TJ/g) || []
      textMatches.forEach(tm => {
        const clean = tm.replace(/^[\(\[]/, '').replace(/[\)\]]\s*TJ?$/, '').trim()
        if (clean) extractedLines.push(clean)
      })
    })
    return extractedLines.join('\n')
  } catch (err) {
    return ''
  }
}

/**
 * Server Action: Parse PDF Buffer & Extract Session Data
 */
export async function parsePDFSessionFile(formData: FormData): Promise<PDFParseResult> {
  try {
    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, error: 'File PDF tidak ditemukan' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Parse PDF text content
    const rawText = await extractTextFromPDF(buffer)

    if (!rawText.trim()) {
      return {
        success: true,
        text: '',
        suggestedProgram: 'Total Body',
        exercises: [],
      }
    }

    // Smart heuristic parser for exercise lines
    // Lines like: "1. Bench Press - 3 set x 10 reps @ 60kg"
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean)
    const exercises: ParsedExercise[] = []

    let programType = 'Total Body'
    let location = 'Hang Lekir'

    lines.forEach((line: string, idx: number) => {
      // Program type detection
      if (line.toLowerCase().includes('upper body')) programType = 'Upper Body'
      if (line.toLowerCase().includes('lower body')) programType = 'Lower Body'
      if (line.toLowerCase().includes('muaythai')) programType = 'Muaythai'
      if (line.toLowerCase().includes('hybrid')) programType = 'Hybrid Training'

      // Location detection
      if (line.toLowerCase().includes('essence')) location = 'Essence'
      if (line.toLowerCase().includes('1 park')) location = '1 Park'
      if (line.toLowerCase().includes('hang lekir')) location = 'Hang Lekir'

      // Exercise pattern matching: "Squat 3x10 50kg" or "Bench Press 3 sets 12 reps"
      const setRepMatch = line.match(/(.+?)\s+(\d+)\s*(?:set|sets|x)\s*(\d+(?:-\d+)?)\s*(?:reps|rep|detik|s)?(?:\s*@?\s*(\d+(?:\.\d+)?)\s*kg)?/i)

      if (setRepMatch) {
        const name = setRepMatch[1].replace(/^[0-9\.\-\*•\s]+/, '').trim()
        const sets = parseInt(setRepMatch[2]) || 3
        const repsVal = setRepMatch[3] || '10'
        const isSeconds = line.toLowerCase().includes('detik') || line.toLowerCase().includes('sec')
        const weight = parseFloat(setRepMatch[4]) || 0

        if (name && name.length > 2) {
          exercises.push({
            id: `pdf_ex_${Date.now()}_${idx}`,
            name,
            sets,
            targetType: isSeconds ? 'seconds' : 'reps',
            targetValue: repsVal,
            weight,
          })
        }
      }
    })

    return {
      success: true,
      text: rawText,
      suggestedProgram: programType,
      suggestedLocation: location,
      exercises,
    }
  } catch (err: any) {
    console.error('Error parsing PDF:', err)
    return { success: false, error: err.message || 'Gagal membaca isi file PDF' }
  }
}

/**
 * Server Action: Save Legacy Session with PDF Attachment
 */
export async function saveLegacyPDFSession(input: {
  packageId: string
  scheduledAt: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  programType: string
  location?: string
  sessionNotes?: string
  exercises: ParsedExercise[]
  pdfAttachmentUrl?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Unauthorized' }

    const [currentUser] = await db.select().from(users).where(eq(users.id, authUser.id))
    if (!currentUser || currentUser.role === 'client') {
      return { success: false, error: 'Unauthorized' }
    }

    const [selectedPackage] = await db.select().from(ptPackages).where(eq(ptPackages.id, input.packageId))
    if (!selectedPackage) return { success: false, error: 'Paket tidak ditemukan' }

    // Serialize exercises into sessionNotes JSON string
    const exercisesJson = JSON.stringify(input.exercises || [])

    const [newSession] = await db.insert(workoutSessions).values({
      packageId: input.packageId,
      trainerId: selectedPackage.trainerId,
      clientId: selectedPackage.clientId,
      scheduledAt: new Date(input.scheduledAt),
      completedAt: input.status === 'completed' ? new Date(input.scheduledAt) : null,
      status: input.status,
      programType: input.programType,
      location: input.location || 'Hang Lekir',
      duration: 60,
      sessionNotes: exercisesJson,
      pdfAttachmentUrl: input.pdfAttachmentUrl || null,
    }).returning()

    return { success: true, sessionId: newSession.id }
  } catch (err: any) {
    console.error('Error saving legacy PDF session:', err)
    return { success: false, error: err.message || 'Gagal menyimpan sesi dari PDF' }
  }
}
