import { z } from 'zod';

/**
 * Schema for creating or updating a single task
 */
export const taskSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(1, 'Task text is required'),
  type: z.string().min(1, 'Task type is required'),
  topic: z.string().min(1, 'Task topic is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  answer: z.string().nullable().optional(),
  solution: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  context: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  learningOutcome: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export type TaskInput = z.infer<typeof taskSchema>;

/**
 * Schema for bulk task operations (upsert multiple tasks)
 */
export const bulkTasksSchema = z.object({
  tasks: z.array(taskSchema).min(1, 'At least one task is required'),
});

export type BulkTasksInput = z.infer<typeof bulkTasksSchema>;

/**
 * Schema for deleting tasks (soft delete)
 */
export const deleteTasksSchema = z.object({
  taskIds: z
    .array(z.string().uuid('Invalid task ID format'))
    .min(1, 'At least one task ID is required'),
});

export type DeleteTasksInput = z.infer<typeof deleteTasksSchema>;

/**
 * Schema for updating a task (partial update)
 */
export const updateTaskSchema = taskSchema.partial().omit({ id: true });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/**
 * Query parameters for listing tasks
 */
export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  includeDeleted: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .optional(),
});

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
