import { z } from 'zod';

// ============================================================================
// SHEET SCHEMAS
// ============================================================================

export const createSheetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  tasks: z.array(z.string().uuid('Invalid task ID')).min(1, 'At least one task is required'),
  tags: z.array(z.string()).default([]),
  isTemplate: z.boolean().default(false),
});

export const updateSheetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional().nullable(),
  tasks: z.array(z.string().uuid('Invalid task ID')).min(1, 'At least one task is required').optional(),
  tags: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
});

export const deleteSheetSchema = z.object({
  sheetIds: z.array(z.string().uuid('Invalid sheet ID')).min(1, 'At least one sheet ID is required'),
});

export const copySheetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
});

export const shareSheetSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
});

export const createVersionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  tasks: z.array(z.string().uuid('Invalid task ID')).min(1, 'At least one task is required'),
});

// Query parameter schemas
export const listSheetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isTemplate: z.enum(['true', 'false']).optional(),
  tags: z.string().optional(), // Comma-separated tags
});

export const listVersionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Type exports
export type CreateSheetInput = z.infer<typeof createSheetSchema>;
export type UpdateSheetInput = z.infer<typeof updateSheetSchema>;
export type DeleteSheetInput = z.infer<typeof deleteSheetSchema>;
export type CopySheetInput = z.infer<typeof copySheetSchema>;
export type ShareSheetInput = z.infer<typeof shareSheetSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type ListSheetsQuery = z.infer<typeof listSheetsQuerySchema>;
export type ListVersionsQuery = z.infer<typeof listVersionsQuerySchema>;
