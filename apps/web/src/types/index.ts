/**
 * Centralized Type Definitions for EXPP
 *
 * This file re-exports all types from schema files and provides
 * additional shared types used across the application.
 *
 * Types are organized by feature:
 * - API types (response formats, pagination, etc.)
 * - Task types
 * - Sheet types
 * - Profile types
 * - Settings types
 * - Statistics types
 * - Submission types
 * - Search types
 * - OpenAI types
 * - Export types
 * - Auth types
 */

// Import types for extending
import type { ProfileResponse as _ProfileResponse } from '@/lib/schemas/profile-schemas';
import type { UserStatistics as _UserStatisticsResponse } from '@/lib/schemas/statistics-schemas';
import type { UserSettings as _UserSettingsResponse } from '@/lib/schemas/settings-schemas';

// ============================================================================
// API Types
// ============================================================================

/**
 * Standard API response format from all endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T;
  pagination: PaginationMeta;
}

/**
 * Rate limit headers from API responses
 */
export interface RateLimitInfo {
  limit: string;
  remaining: string;
  reset: string;
  retryAfter?: string;
}

/**
 * API error class for client-side error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// Task Types (re-exported from task-schemas.ts)
// ============================================================================

export type {
  TaskInput,
  BulkTasksInput,
  DeleteTasksInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '@/lib/schemas/task-schemas';

// ============================================================================
// Sheet Types (re-exported from sheet-schemas.ts)
// ============================================================================

export type {
  CreateSheetInput,
  UpdateSheetInput,
  DeleteSheetInput,
  CopySheetInput,
  ShareSheetInput,
  CreateVersionInput,
  ListSheetsQuery,
  ListVersionsQuery,
} from '@/lib/schemas/sheet-schemas';

// ============================================================================
// Profile Types (re-exported from profile-schemas.ts)
// ============================================================================

export type {
  UpdateProfileInput,
  ProfileResponse,
} from '@/lib/schemas/profile-schemas';

export interface ProfileData extends _ProfileResponse {}

// ============================================================================
// Settings Types (re-exported from settings-schemas.ts)
// ============================================================================

export type {
  UpdateSettings,
  Preferences,
  UserSettings,
} from '@/lib/schemas/settings-schemas';

// Type aliases for API use
export type { UpdateSettings as UpdateSettingsInput } from '@/lib/schemas/settings-schemas';
export type { UserSettings as UserSettingsResponse } from '@/lib/schemas/settings-schemas';

// Extended UserSettings with nullable preferences
export interface UserSettingsExtended extends Omit<_UserSettingsResponse, 'preferences'> {
  preferences: Record<string, unknown> | null;
}

// ============================================================================
// Statistics Types (re-exported from statistics-schemas.ts)
// ============================================================================

export type {
  ProgressData,
} from '@/lib/schemas/statistics-schemas';

export type { UserStatistics as UserStatisticsResponse } from '@/lib/schemas/statistics-schemas';

// Extended UserStatistics with adjusted types
export interface UserStatistics extends Omit<_UserStatisticsResponse, 'recentActivity'> {
  recentActivity: unknown[];
}

// Type alias for progress query params
export type ProgressQueryParams = { days?: number };

// ============================================================================
// Submission Types (re-exported from submission-schemas.ts)
// ============================================================================

export type {
  TaskSubmissionInput,
  SheetSubmissionInput,
} from '@/lib/schemas/submission-schemas';

// Additional submission types for API use
export interface SubmitTaskInput {
  taskId: string;
  answer: string;
  timeSpent?: number;
}

export interface SubmitSheetInput {
  sheetId: string;
  submissions: Array<{ taskId: string; answer: string }>;
  timeSpent?: number;
}

export interface ListSubmissionsQuery {
  page?: number;
  limit?: number;
  taskId?: string;
  sheetId?: string;
  [key: string]: unknown;
}

// ============================================================================
// Search Types (re-exported from search-schemas.ts)
// ============================================================================

export type {
  SearchQuery,
} from '@/lib/schemas/search-schemas';

// ============================================================================
// OpenAI Types (re-exported from openai-schemas.ts)
// ============================================================================

export type {
  OpenAIMessage,
  OpenAIChatRequest,
} from '@/lib/schemas/openai-schemas';

// ============================================================================
// Export Types (re-exported from export-schemas.ts)
// ============================================================================

export type {
  ExportRequest as ExportRequestSchema,
  ExportFormat,
} from '@/lib/schemas/export-schemas';

// Extended export request for API use
export interface ExportRequest {
  type: 'pdf' | 'docx' | 'latex';
  sheetId?: string;
  taskId?: string;
  options?: {
    includeSolutions?: boolean;
    includeExplanations?: boolean;
    template?: string;
  };
}

// ============================================================================
// Auth Types
// ============================================================================

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// Entity Types (for frontend use)
// ============================================================================

/**
 * Task entity as returned from the API
 */
export interface Task {
  id: string;
  userId: string;
  text: string;
  type: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer: string | null;
  solution: string | null;
  explanation: string | null;
  context: string | null;
  instructions: string | null;
  learningOutcome: string | null;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

/**
 * Sheet entity as returned from the API
 */
export interface Sheet {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  tasks: string[]; // Array of task IDs
  tags: string[];
  isTemplate: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

/**
 * Sheet with populated tasks
 */
export interface SheetWithTasks extends Omit<Sheet, 'tasks'> {
  tasks: Task[];
  taskCount: number;
}

/**
 * Task submission entity
 */
export interface TaskSubmission {
  id: string;
  userId: string;
  taskId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: Date | string;
}

/**
 * Sheet submission entity
 */
export interface SheetSubmission {
  id: string;
  userId: string;
  sheetId: string;
  answers: Array<{ taskId: string; answer: string }>;
  score: number;
  timeSpent: number;
  createdAt: Date | string;
}

// ============================================================================
// UI/Component Types
// ============================================================================

/**
 * View mode for list/grid displays
 */
export type ViewMode = 'grid' | 'list';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort option for lists
 */
export interface SortOption {
  value: string;
  label: string;
  direction?: SortDirection;
}

/**
 * Filter option
 */
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// ============================================================================
// Toast Types
// ============================================================================

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';
