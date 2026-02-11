import { pgTable, uuid, text, boolean, timestamp, integer, decimal, jsonb, date, uniqueIndex, index, primaryKey } from 'drizzle-orm/pg-core';

// ============================================================================
// AUTH.JS TABLES (for Auth.js Drizzle adapter)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  password: text('password'), // For Credentials provider (hashed with bcrypt)
});

export const accounts = pgTable('accounts', {
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// ============================================================================
// APPLICATION TABLES
// ============================================================================

// Profiles table - linked to Auth.js users table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name').notNull().default(''),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').default({}).notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  isAdminIdx: index('profiles_is_admin_idx').on(table.isAdmin),
}));

// User settings table
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('light'),
  language: text('language').notNull().default('en'),
  notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Tasks table (with soft delete)
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  type: text('type').notNull(),
  topic: text('topic').notNull(),
  difficulty: text('difficulty').notNull().default('medium'),
  answer: text('answer'), // Using TEXT instead of JSONB to match service layer usage
  solution: text('solution'),
  explanation: text('explanation'),
  context: text('context'),
  instructions: text('instructions'),
  learningOutcome: text('learning_outcome'),
  tags: text('tags').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('tasks_user_id_idx').on(table.userId),
  typeIdx: index('tasks_type_idx').on(table.type),
  topicIdx: index('tasks_topic_idx').on(table.topic),
  difficultyIdx: index('tasks_difficulty_idx').on(table.difficulty),
  createdAtIdx: index('tasks_created_at_idx').on(table.createdAt),
  tagsIdx: index('tasks_tags_idx').on(table.tags),
}));

// Task sheets table
export const taskSheets = pgTable('task_sheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  tasks: uuid('tasks').array().notNull().default([]),
  tags: text('tags').array().default([]),
  isTemplate: boolean('is_template').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('task_sheets_user_id_idx').on(table.userId),
  tasksGinIdx: index('task_sheets_tasks_gin_idx').on(table.tasks),
  tagsIdx: index('task_sheets_tags_idx').on(table.tags),
  createdAtIdx: index('task_sheets_created_at_idx').on(table.createdAt),
}));

// Sheet versions table
export const sheetVersions = pgTable('sheet_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sheetId: uuid('sheet_id').notNull().references(() => taskSheets.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  tasks: uuid('tasks').array().notNull().default([]),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Shared sheets table
export const sharedSheets = pgTable('shared_sheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  sheetId: uuid('sheet_id').notNull().references(() => taskSheets.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  sharedAt: timestamp('shared_at', { withTimezone: true }).notNull().defaultNow(),
});

// Task submissions table
export const taskSubmissions = pgTable('task_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  sheetId: uuid('sheet_id').references(() => taskSheets.id, { onDelete: 'set null' }),
  isCorrect: boolean('is_correct').notNull(),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(),
  timeSpent: integer('time_spent').notNull(),
  userAnswer: text('user_answer'),
  userSolution: text('user_solution'),
  difficulty: text('difficulty'),
  topic: text('topic'),
  questionType: text('question_type'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('task_submissions_user_id_idx').on(table.userId),
  taskIdIdx: index('task_submissions_task_id_idx').on(table.taskId),
  sheetIdIdx: index('task_submissions_sheet_id_idx').on(table.sheetId),
  submittedAtIdx: index('task_submissions_submitted_at_idx').on(table.submittedAt),
  topicIdx: index('task_submissions_topic_idx').on(table.topic),
  difficultyIdx: index('task_submissions_difficulty_idx').on(table.difficulty),
}));

// Sheet submissions table
export const sheetSubmissions = pgTable('sheet_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  sheetId: uuid('sheet_id').references(() => taskSheets.id, { onDelete: 'set null' }),
  totalTasks: integer('total_tasks').notNull(),
  correctTasks: integer('correct_tasks').notNull(),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }).notNull(),
  totalTimeSpent: integer('total_time_spent').notNull(),
  averageTimePerTask: decimal('average_time_per_task', { precision: 10, scale: 2 }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('sheet_submissions_user_id_idx').on(table.userId),
  sheetIdIdx: index('sheet_submissions_sheet_id_idx').on(table.sheetId),
  submittedAtIdx: index('sheet_submissions_submitted_at_idx').on(table.submittedAt),
}));

// User statistics table
export const userStatistics = pgTable('user_statistics', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  solvedTasks: integer('solved_tasks').notNull().default(0),
  totalTaskAttempts: integer('total_task_attempts').notNull().default(0),
  solvedSheets: integer('solved_sheets').notNull().default(0),
  totalSheetAttempts: integer('total_sheet_attempts').notNull().default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).notNull().default('0'),
  totalTimeSpent: integer('total_time_spent').notNull().default(0),
  tasksByDifficulty: jsonb('tasks_by_difficulty').notNull().default({ easy: 0, medium: 0, hard: 0 }),
  tasksByTopic: jsonb('tasks_by_topic').notNull().default({}),
  tasksByType: jsonb('tasks_by_type').notNull().default({}),
  recentActivity: integer('recent_activity').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// User progress table
export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  sheetsCompleted: integer('sheets_completed').notNull().default(0),
  timeSpent: integer('time_spent').notNull().default(0),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('user_progress_user_id_idx').on(table.userId),
  dateIdx: index('user_progress_date_idx').on(table.date),
  userDateIdx: uniqueIndex('user_progress_user_date_idx').on(table.userId, table.date),
}));

// Spaced repetition table
export const spacedRepetition = pgTable('spaced_repetition', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  difficulty: text('difficulty').notNull(),
  lastReviewed: timestamp('last_reviewed', { withTimezone: true }).notNull().defaultNow(),
  nextReview: timestamp('next_review', { withTimezone: true }).notNull(),
  reviewCount: integer('review_count').notNull().default(0),
  easeFactor: decimal('ease_factor', { precision: 4, scale: 2 }).notNull().default('2.5'),
  interval: integer('interval').notNull().default(1),
  correctCount: integer('correct_count').notNull().default(0),
  incorrectCount: integer('incorrect_count').notNull().default(0),
  streak: integer('streak').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('spaced_repetition_user_id_idx').on(table.userId),
  questionIdIdx: index('spaced_repetition_question_id_idx').on(table.questionId),
  nextReviewIdx: index('spaced_repetition_next_review_idx').on(table.nextReview),
  userNextReviewIdx: index('spaced_repetition_user_next_review_idx').on(table.userId, table.nextReview),
  userQuestionUnique: uniqueIndex('spaced_repetition_user_question_idx').on(table.userId, table.questionId),
}));

// Adaptive metrics table
export const adaptiveMetrics = pgTable('adaptive_metrics', {
  userId: uuid('user_id').primaryKey().references(() => profiles.id, { onDelete: 'cascade' }),
  questionHistory: jsonb('question_history').notNull().default([]),
  topicMastery: jsonb('topic_mastery').notNull().default({}),
  learningStyle: jsonb('learning_style').notNull().default({
    preferred_difficulty: 'medium',
    optimal_time_per_question: 300,
    topic_engagement: {},
  }),
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }).notNull().default('0'),
  improvementRate: decimal('improvement_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  weakAreas: text('weak_areas').array().notNull().default([]),
  strongAreas: text('strong_areas').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Study groups table
export const studyGroups = pgTable('study_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  subject: text('subject').notNull(),
  topics: text('topics').array().default([]),
  members: jsonb('members').notNull().default([]),
  settings: jsonb('settings').notNull().default({}),
  stats: jsonb('stats').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Group activities table
export const groupActivities = pgTable('group_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => studyGroups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  activityType: text('activity_type').notNull(),
  username: text('username'),
  details: jsonb('details').default({}),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
});
