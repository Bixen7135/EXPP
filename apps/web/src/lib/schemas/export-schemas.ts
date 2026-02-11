import { z } from 'zod';

/**
 * Export format options
 */
export const exportFormatSchema = z.enum(['pdf', 'docx']);

/**
 * Export request schema
 */
export const exportRequestSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1_000_000, 'Content is too large (max 1MB)'),
  format: exportFormatSchema.default('pdf'),
  filename: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Filename can only contain letters, numbers, hyphens, and underscores')
    .optional()
    .default('export'),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
