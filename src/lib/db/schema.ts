// =============================================================================
// PT CLIENT MANAGEMENT — Drizzle ORM Database Schema
// Database: Supabase PostgreSQL
// =============================================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  pgEnum,
  jsonb,
  real,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// =============================================================================
// ENUMS
// =============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'personal_trainer',
  'client',
])

export const sessionStatusEnum = pgEnum('session_status', [
  'scheduled',
  'completed',
  'cancelled',
  'rescheduled',
  'no_show',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'partial',
  'refunded',
])

export const genderEnum = pgEnum('gender', ['male', 'female', 'other'])

export const difficultyEnum = pgEnum('difficulty', [
  'beginner',
  'intermediate',
  'advanced',
])

export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
])

export const workoutStatusEnum = pgEnum('workout_status', [
  'planned',
  'in_progress',
  'completed',
  'skipped',
])

// =============================================================================
// MASTER DATA TABLES
// =============================================================================

export const exerciseCategories = pgTable('exercise_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const muscleGroups = pgTable('muscle_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  bodyPart: varchar('body_part', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const fitnessGoals = pgTable('fitness_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const activityLevels = pgTable('activity_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  multiplier: real('multiplier').notNull().default(1.0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const packageTypes = pgTable('package_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  defaultSessions: integer('default_sessions'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const foodCategories = pgTable('food_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const measurementTypes = pgTable('measurement_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  unit: varchar('unit', { length: 20 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const notificationTypes = pgTable('notification_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  template: text('template'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// =============================================================================
// CORE USER TABLES
// =============================================================================

// Users — extends Supabase auth.users
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // matches auth.users.id
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('client'),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Personal Trainers
export const personalTrainers = pgTable('personal_trainers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  specialization: text('specialization'),
  certifications: text('certifications').array(),
  bio: text('bio'),
  yearsExperience: integer('years_experience').default(0),
  pricePerSession: decimal('price_per_session', { precision: 12, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Clients
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  trainerId: uuid('trainer_id').notNull().references(() => personalTrainers.id),
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender'),
  height: real('height'), // cm
  initialWeight: real('initial_weight'), // kg
  currentWeight: real('current_weight'), // kg
  fitnessGoalId: uuid('fitness_goal_id').references(() => fitnessGoals.id),
  activityLevelId: uuid('activity_level_id').references(() => activityLevels.id),
  medicalNotes: text('medical_notes'),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// =============================================================================
// PACKAGES & TRANSACTIONS
// =============================================================================

// PT Packages (paket sesi yang dijual PT ke client)
export const ptPackages = pgTable('pt_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: uuid('trainer_id').notNull().references(() => personalTrainers.id),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  packageTypeId: uuid('package_type_id').references(() => packageTypes.id),
  packageName: varchar('package_name', { length: 255 }).notNull(),
  totalSessions: integer('total_sessions').notNull(),
  usedSessions: integer('used_sessions').default(0).notNull(),
  pricePerSession: decimal('price_per_session', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  startDate: date('start_date').notNull(),
  expiresAt: date('expires_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// PT Transactions (payment records)
export const ptTransactions = pgTable('pt_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull().references(() => ptPackages.id),
  trainerId: uuid('trainer_id').notNull().references(() => personalTrainers.id),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// =============================================================================
// WORKOUT SYSTEM
// =============================================================================

// Exercises (library)
export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: uuid('category_id').references(() => exerciseCategories.id),
  muscleGroupIds: uuid('muscle_group_ids').array(),
  equipmentIds: uuid('equipment_ids').array(),
  description: text('description'),
  instructions: text('instructions'),
  videoUrl: text('video_url'),
  imageUrl: text('image_url'),
  difficulty: difficultyEnum('difficulty').default('beginner').notNull(),
  caloriesPerMinute: real('calories_per_minute'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Workout Programs
export const workoutPrograms = pgTable('workout_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: uuid('trainer_id').notNull().references(() => personalTrainers.id),
  clientId: uuid('client_id').references(() => clients.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  goalId: uuid('goal_id').references(() => fitnessGoals.id),
  durationWeeks: integer('duration_weeks').default(4),
  isTemplate: boolean('is_template').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Workout Sessions (sesi latihan)
export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  packageId: uuid('package_id').notNull().references(() => ptPackages.id),
  trainerId: uuid('trainer_id').notNull().references(() => personalTrainers.id),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  programId: uuid('program_id').references(() => workoutPrograms.id),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  status: sessionStatusEnum('status').default('scheduled').notNull(),
  location: varchar('location', { length: 255 }),
  duration: integer('duration').default(60), // minutes (default 60)
  programType: varchar('program_type', { length: 255 }),
  rpe: integer('rpe'), // 1-10
  sessionNotes: text('session_notes'),
  ptNotes: text('pt_notes'), // private PT notes
  rating: integer('rating'), // 1-5 client rating
  feedback: text('feedback'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Session Exercises (detail latihan per sesi)
export const sessionExercises = pgTable('session_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id),
  orderIndex: integer('order_index').default(0).notNull(),
  sets: integer('sets').default(1).notNull(),
  reps: integer('reps'),
  weight: real('weight'), // kg
  duration: integer('duration'), // seconds
  restTime: integer('rest_time'), // seconds
  actualSets: integer('actual_sets'),
  actualReps: integer('actual_reps'),
  actualWeight: real('actual_weight'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// =============================================================================
// PROGRESS & MEASUREMENTS
// =============================================================================

// Body Measurements
export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  measuredAt: timestamp('measured_at', { withTimezone: true }).notNull(),
  weight: real('weight'),
  height: real('height'),
  bmi: real('bmi'),
  bodyFatPercentage: real('body_fat_percentage'),
  muscleMass: real('muscle_mass'),
  visceralFat: real('visceral_fat'),
  chest: real('chest'), // cm
  waist: real('waist'),
  hips: real('hips'),
  thighs: real('thighs'),
  calves: real('calves'),
  arms: real('arms'),
  shoulders: real('shoulders'),
  notes: text('notes'),
  photoBeforeUrl: text('photo_before_url'),
  photoAfterUrl: text('photo_after_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// =============================================================================
// NUTRITION SYSTEM
// =============================================================================

// Food Database
export const foods = pgTable('foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: uuid('category_id').references(() => foodCategories.id),
  caloriesPer100g: real('calories_per_100g').notNull(),
  proteinPer100g: real('protein_per_100g').default(0),
  carbsPer100g: real('carbs_per_100g').default(0),
  fatPer100g: real('fat_per_100g').default(0),
  fiberPer100g: real('fiber_per_100g').default(0),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Daily Nutrition Log
export const nutritionLogs = pgTable('nutrition_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  logDate: date('log_date').notNull(),
  targetCalories: real('target_calories'),
  consumedCalories: real('consumed_calories').default(0),
  targetProtein: real('target_protein'),
  consumedProtein: real('consumed_protein').default(0),
  targetCarbs: real('target_carbs'),
  consumedCarbs: real('consumed_carbs').default(0),
  targetFat: real('target_fat'),
  consumedFat: real('consumed_fat').default(0),
  waterMl: real('water_ml').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Food Diary (meals logged)
export const foodDiary = pgTable('food_diary', {
  id: uuid('id').primaryKey().defaultRandom(),
  nutritionLogId: uuid('nutrition_log_id').notNull().references(() => nutritionLogs.id, { onDelete: 'cascade' }),
  foodId: uuid('food_id').notNull().references(() => foods.id),
  mealType: mealTypeEnum('meal_type').notNull(),
  quantityGrams: real('quantity_grams').notNull(),
  calories: real('calories').notNull(),
  protein: real('protein').default(0),
  carbs: real('carbs').default(0),
  fat: real('fat').default(0),
  notes: text('notes'),
  loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow().notNull(),
})

// Meal Plans
export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: uuid('trainer_id').notNull().references(() => personalTrainers.id),
  clientId: uuid('client_id').references(() => clients.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetCalories: real('target_calories'),
  targetProtein: real('target_protein'),
  targetCarbs: real('target_carbs'),
  targetFat: real('target_fat'),
  durationDays: integer('duration_days').default(7),
  isTemplate: boolean('is_template').default(false),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// =============================================================================
// NOTIFICATIONS & AUDIT
// =============================================================================

// Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  typeId: uuid('type_id').references(() => notificationTypes.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  actionUrl: text('action_url'),
  metadata: jsonb('metadata'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Audit Logs — Rule 11: semua perubahan penting disimpan
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, etc
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// =============================================================================
// RELATIONS
// =============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  personalTrainer: one(personalTrainers, {
    fields: [users.id],
    references: [personalTrainers.userId],
  }),
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}))

export const personalTrainersRelations = relations(personalTrainers, ({ one, many }) => ({
  user: one(users, {
    fields: [personalTrainers.userId],
    references: [users.id],
  }),
  clients: many(clients),
  packages: many(ptPackages),
  workoutSessions: many(workoutSessions),
  workoutPrograms: many(workoutPrograms),
  mealPlans: many(mealPlans),
}))

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  trainer: one(personalTrainers, {
    fields: [clients.trainerId],
    references: [personalTrainers.id],
  }),
  fitnessGoal: one(fitnessGoals, {
    fields: [clients.fitnessGoalId],
    references: [fitnessGoals.id],
  }),
  activityLevel: one(activityLevels, {
    fields: [clients.activityLevelId],
    references: [activityLevels.id],
  }),
  packages: many(ptPackages),
  workoutSessions: many(workoutSessions),
  measurements: many(measurements),
  nutritionLogs: many(nutritionLogs),
}))

export const ptPackagesRelations = relations(ptPackages, ({ one, many }) => ({
  trainer: one(personalTrainers, {
    fields: [ptPackages.trainerId],
    references: [personalTrainers.id],
  }),
  client: one(clients, {
    fields: [ptPackages.clientId],
    references: [clients.id],
  }),
  packageType: one(packageTypes, {
    fields: [ptPackages.packageTypeId],
    references: [packageTypes.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [ptPackages.paymentMethodId],
    references: [paymentMethods.id],
  }),
  workoutSessions: many(workoutSessions),
  transactions: many(ptTransactions),
}))

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  package: one(ptPackages, {
    fields: [workoutSessions.packageId],
    references: [ptPackages.id],
  }),
  trainer: one(personalTrainers, {
    fields: [workoutSessions.trainerId],
    references: [personalTrainers.id],
  }),
  client: one(clients, {
    fields: [workoutSessions.clientId],
    references: [clients.id],
  }),
  program: one(workoutPrograms, {
    fields: [workoutSessions.programId],
    references: [workoutPrograms.id],
  }),
  exercises: many(sessionExercises),
}))

export const sessionExercisesRelations = relations(sessionExercises, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [sessionExercises.sessionId],
    references: [workoutSessions.id],
  }),
  exercise: one(exercises, {
    fields: [sessionExercises.exerciseId],
    references: [exercises.id],
  }),
}))

export const measurementsRelations = relations(measurements, ({ one }) => ({
  client: one(clients, {
    fields: [measurements.clientId],
    references: [clients.id],
  }),
}))

export const nutritionLogsRelations = relations(nutritionLogs, ({ one, many }) => ({
  client: one(clients, {
    fields: [nutritionLogs.clientId],
    references: [clients.id],
  }),
  foodDiary: many(foodDiary),
}))

export const foodDiaryRelations = relations(foodDiary, ({ one }) => ({
  nutritionLog: one(nutritionLogs, {
    fields: [foodDiary.nutritionLogId],
    references: [nutritionLogs.id],
  }),
  food: one(foods, {
    fields: [foodDiary.foodId],
    references: [foods.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  type: one(notificationTypes, {
    fields: [notifications.typeId],
    references: [notificationTypes.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))
