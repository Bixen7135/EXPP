import { z } from 'zod';

// Preferences schema for nested settings
export const preferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  taskReminders: z.boolean().optional(),
  showProfileToPublic: z.boolean().optional(),
}).passthrough(); // Allow additional fields

// User settings schema (matches database table)
export const userSettingsSchema = z.object({
  userId: z.string().uuid(),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  language: z.string().min(2).max(10).default('en'),
  notificationsEnabled: z.boolean().default(true),
  preferences: preferencesSchema.default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Update settings schema (all fields optional)
export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(10).optional(),
  notificationsEnabled: z.boolean().optional(),
  preferences: preferencesSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
