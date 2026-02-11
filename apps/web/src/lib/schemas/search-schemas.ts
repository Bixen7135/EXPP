import { z } from 'zod';

/**
 * Schema for search query parameters
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500, 'Search query too long'),
  type: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  topic: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
