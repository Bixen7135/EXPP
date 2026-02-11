import { z } from 'zod';

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').nullable().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
}).strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema for profile response
 */
export const profileResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
  preferences: z.record(z.string(), z.unknown()),
  isAdmin: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
