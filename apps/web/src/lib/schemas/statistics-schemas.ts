import { z } from 'zod';

// Schema for GET /api/statistics/progress query params
export const progressQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type ProgressQueryParams = z.infer<typeof progressQuerySchema>;

// Schema for UserStatistics response
export const userStatisticsSchema = z.object({
  userId: z.string().uuid(),
  solvedTasks: z.number().int().nonnegative(),
  totalTaskAttempts: z.number().int().nonnegative(),
  solvedSheets: z.number().int().nonnegative(),
  totalSheetAttempts: z.number().int().nonnegative(),
  successRate: z.string(), // decimal as string from database
  averageScore: z.string(), // decimal as string from database
  totalTimeSpent: z.number().int().nonnegative(),
  tasksByDifficulty: z.object({
    easy: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    hard: z.number().int().nonnegative(),
  }),
  tasksByTopic: z.record(z.string(), z.object({
    correct: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  })),
  tasksByType: z.record(z.string(), z.object({
    correct: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  })),
  recentActivity: z.number().int().nonnegative(),
  lastActivityAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserStatistics = z.infer<typeof userStatisticsSchema>;

// Schema for ProgressData response
export const progressDataSchema = z.object({
  date: z.string(), // ISO date string (YYYY-MM-DD)
  tasksCompleted: z.number().int().nonnegative(),
  sheetsCompleted: z.number().int().nonnegative(),
  timeSpent: z.number().int().nonnegative(),
  accuracy: z.string(), // decimal as string from database
});

export type ProgressData = z.infer<typeof progressDataSchema>;
