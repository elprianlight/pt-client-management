// =============================================================================
// PT CLIENT MANAGEMENT — TypeScript Type Definitions
// =============================================================================

// ─── User Roles ───────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'personal_trainer' | 'client'

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  username?: string
  role: UserRole
  fullName: string
  phone?: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ─── Personal Trainer ─────────────────────────────────────────────────────────
export interface PersonalTrainer {
  id: string
  userId: string
  specialization?: string
  certifications?: string[]
  bio?: string
  totalClients: number
  totalSessions: number
  isActive: boolean
  user?: User
  createdAt: string
}

// ─── Client ───────────────────────────────────────────────────────────────────
export interface Client {
  id: string
  userId: string
  trainerId: string
  dateOfBirth?: string
  gender?: string
  height?: number
  initialWeight?: number
  currentWeight?: number
  fitnessGoal?: string
  activityLevel?: string
  medicalNotes?: string
  emergencyContact?: string
  isActive: boolean
  user?: User
  trainer?: PersonalTrainer
  activePackage?: PTPackage
  createdAt: string
}

// ─── Package ──────────────────────────────────────────────────────────────────
export interface PTPackage {
  id: string
  trainerId: string
  clientId: string
  packageName: string
  packageType: string
  totalSessions: number
  usedSessions: number
  remainingSessions: number
  pricePerSession: number
  totalPrice: number
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'partial'
  startDate: string
  expiresAt: string
  isActive: boolean
  notes?: string
  trainer?: PersonalTrainer
  client?: Client
  createdAt: string
}

// ─── Session ──────────────────────────────────────────────────────────────────
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'

export interface WorkoutSession {
  id: string
  packageId: string
  trainerId: string
  clientId: string
  scheduledAt: string
  completedAt?: string
  status: SessionStatus
  location?: string
  notes?: string
  duration?: number // in minutes
  package?: PTPackage
  trainer?: PersonalTrainer
  client?: Client
  exercises?: SessionExercise[]
  createdAt: string
}

// ─── Exercise & Workout ───────────────────────────────────────────────────────
export interface Exercise {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment: string[]
  description?: string
  videoUrl?: string
  imageUrl?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  isActive: boolean
}

export interface SessionExercise {
  id: string
  sessionId: string
  exerciseId: string
  sets: number
  reps?: number
  weight?: number
  duration?: number // seconds for timed exercises
  restTime?: number // seconds
  notes?: string
  exercise?: Exercise
}

export interface WorkoutProgram {
  id: string
  trainerId: string
  clientId?: string
  name: string
  description?: string
  goal: string
  durationWeeks: number
  isTemplate: boolean
  isActive: boolean
  trainer?: PersonalTrainer
  createdAt: string
}

// ─── Measurements & Progress ──────────────────────────────────────────────────
export interface Measurement {
  id: string
  clientId: string
  measuredAt: string
  weight?: number
  height?: number
  bmi?: number
  bodyFatPercentage?: number
  muscleMass?: number
  chest?: number
  waist?: number
  hips?: number
  thighs?: number
  arms?: number
  notes?: string
  createdAt: string
}

// ─── Nutrition ────────────────────────────────────────────────────────────────
export interface NutritionLog {
  id: string
  clientId: string
  date: string
  targetCalories?: number
  consumedCalories: number
  protein?: number
  carbs?: number
  fat?: number
  water?: number // ml
  notes?: string
  createdAt: string
}

export interface FoodItem {
  id: string
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g?: number
  carbsPer100g?: number
  fatPer100g?: number
}

export interface FoodDiaryEntry {
  id: string
  nutritionLogId: string
  foodId: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  quantity: number // grams
  calories: number
  food?: FoodItem
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface SuperAdminStats {
  totalPTs: number
  activePTs: number
  totalClients: number
  activeClients: number
  totalSessions: number
  completedSessions: number
  totalRevenue: number
  monthlyRevenue: number
}

export interface PTStats {
  totalClients: number
  activeClients: number
  todaySessions: number
  weekSessions: number
  monthSessions: number
  totalRevenue: number
  monthRevenue: number
  pendingPayments: number
}

export interface ClientStats {
  activePackage?: PTPackage
  remainingSessions: number
  completedSessions: number
  nextSession?: WorkoutSession
  currentWeight?: number
  weightChange?: number
  streakDays: number
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavItem {
  title: string
  href: string
  icon: string
  roles: UserRole[]
  badge?: number
  children?: NavItem[]
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string
  userId: string
  action: string
  tableName: string
  recordId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: User
}
