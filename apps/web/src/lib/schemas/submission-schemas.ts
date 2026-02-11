import { z } from 'zod';

/**
 * Task Submission Schema
 * Used for submitting individual task answers
 */
export const taskSubmissionSchema = z.object({
  taskId: z.string().uuid('Invalid task ID').optional(),
  sheetId: z.string().uuid('Invalid sheet ID').optional(),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  timeSpent: z.number().int().min(0),
  userAnswer: z.string().optional(),
  userSolution: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  topic: z.string().optional(),
  questionType: z.string().optional(),
}).refine(
  (data) => data.taskId || data.sheetId,
  {
    message: 'Either taskId or sheetId must be provided',
  }
);

export type TaskSubmissionInput = z.infer<typeof taskSubmissionSchema>;

/**
 * Sheet Submission Schema
 * Used for submitting completed sheets with aggregate stats
 */
export const sheetSubmissionSchema = z.object({
  sheetId: z.string().uuid('Invalid sheet ID'),
  totalTasks: z.number().int().min(1),
  correctTasks: z.number().int().min(0),
  totalTimeSpent: z.number().int().min(0),
  averageTimePerTask: z.number().min(0).optional(),
}).refine(
  (data) => data.correctTasks <= data.totalTasks,
  {
    message: 'correctTasks cannot exceed totalTasks',
  }
);

export type SheetSubmissionInput = z.infer<typeof sheetSubmissionSchema>;
