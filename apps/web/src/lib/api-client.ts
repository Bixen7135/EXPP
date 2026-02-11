/**
 * Unified API Client for EXPP
 *
 * Provides type-safe methods for all API endpoints with:
 * - Consistent error handling
 * - Automatic authentication header injection
 * - Type-safe request/response handling
 * - Support for both client and server components
 */

// ============================================================================
// Types
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
// Schema Types (re-exported from schemas)
// ============================================================================

// Task types
export interface TaskInput {
  id?: string;
  text: string;
  type: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer?: string | null;
  solution?: string | null;
  explanation?: string | null;
  context?: string | null;
  instructions?: string | null;
  learningOutcome?: string | null;
  tags?: string[];
}

export interface BulkTasksInput {
  tasks: TaskInput[];
}

export interface DeleteTasksInput {
  taskIds: string[];
}

export interface ListTasksQuery {
  page?: number;
  limit?: number;
  type?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  includeDeleted?: boolean;
  [key: string]: unknown;
}

export interface UpdateTaskInput extends Partial<Omit<TaskInput, 'id'>> {}

// Sheet types
export interface CreateSheetInput {
  title: string;
  description?: string | null;
  tasks: string[];
  tags?: string[];
  isTemplate?: boolean;
}

export interface UpdateSheetInput {
  title?: string;
  description?: string | null;
  tasks?: string[];
  tags?: string[];
  isTemplate?: boolean;
}

export interface DeleteSheetInput {
  sheetIds: string[];
}

export interface ListSheetsQuery {
  page?: number;
  limit?: number;
  isTemplate?: boolean;
  tags?: string;
  [key: string]: unknown;
}

export interface ShareSheetInput {
  sharedWith: string[];
}

// OpenAI types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatRequest {
  messages: OpenAIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Profile types
export interface ProfileData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  preferences: Record<string, unknown> | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
}

export interface UserStatistics {
  userId: string;
  solvedTasks: number;
  totalTaskAttempts: number;
  solvedSheets: number;
  totalSheetAttempts: number;
  successRate: number;
  averageScore: number;
  totalTimeSpent: number;
  tasksByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  tasksByTopic: Record<string, { correct: number; total: number }>;
  tasksByType: Record<string, { correct: number; total: number }>;
  recentActivity: unknown[];
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  preferences: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string | null;
}

// Settings types
export interface UpdateSettingsInput {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notificationsEnabled?: boolean;
  preferences?: Record<string, unknown>;
}

// Submission types
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

// Export types
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

// Search types
export interface SearchQuery {
  q: string;
  type?: 'tasks' | 'sheets' | 'all';
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

// Auth types
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
// Core API Client
// ============================================================================

/**
 * Configuration for the API client
 */
interface ApiClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

/**
 * Internal fetch wrapper with auth handling
 */
async function apiFetch(
  url: string,
  options: RequestInit = {},
  customFetch?: typeof fetch
): Promise<Response> {
  const fetchFn = customFetch || fetch;

  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add credentials for cookies (NextAuth session)
  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  return fetchFn(url, config);
}

/**
 * Parse API response and handle errors
 */
async function parseApiResponse<T>(
  response: Response
): Promise<{ data: T; rateLimit?: RateLimitInfo }> {
  const rateLimit: RateLimitInfo | undefined = {
    limit: response.headers.get('X-RateLimit-Limit') || '',
    remaining: response.headers.get('X-RateLimit-Remaining') || '',
    reset: response.headers.get('X-RateLimit-Reset') || '',
    retryAfter: response.headers.get('Retry-After') || undefined,
  };

  const contentType = response.headers.get('content-type');

  // Handle non-JSON responses (e.g., blob for file downloads)
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(
        response.statusText || 'Request failed',
        response.status
      );
    }
    return { data: (await response.blob()) as T, rateLimit };
  }

  // Parse JSON response
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error || response.statusText || 'Request failed',
      response.status,
      json.details
    );
  }

  return { data: json.data as T, rateLimit };
}

/**
 * Build query string from params
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '';
    this.fetchFn = config.fetchFn || fetch;
  }

  // ========================================================================
  // Tasks API
  // ========================================================================

  /**
   * List tasks with optional filtering
   * GET /api/tasks
   */
  async listTasks(query?: ListTasksQuery): Promise<{
    tasks: unknown[];
    pagination: PaginationMeta;
  }> {
    const queryString = query ? buildQueryString(query) : '';
    const response = await apiFetch(
      `${this.baseUrl}/api/tasks${queryString}`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { tasks: unknown[]; pagination: PaginationMeta };
  }

  /**
   * Get a single task by ID
   * GET /api/tasks/[id]
   */
  async getTask(id: string): Promise<unknown> {
    const response = await apiFetch(
      `${this.baseUrl}/api/tasks/${id}`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data;
  }

  /**
   * Create or bulk upsert tasks
   * POST /api/tasks
   */
  async createTasks(input: BulkTasksInput): Promise<{ taskIds: string[]; count: number }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { taskIds: string[]; count: number };
  }

  /**
   * Update a single task
   * PUT /api/tasks/[id]
   */
  async updateTask(id: string, input: UpdateTaskInput): Promise<unknown> {
    const response = await apiFetch(
      `${this.baseUrl}/api/tasks/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data;
  }

  /**
   * Soft delete tasks
   * DELETE /api/tasks
   */
  async deleteTasks(input: DeleteTasksInput): Promise<{ deletedCount: number }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/tasks`,
      {
        method: 'DELETE',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { deletedCount: number };
  }

  // ========================================================================
  // Sheets API
  // ========================================================================

  /**
   * List sheets with optional filtering
   * GET /api/sheets
   */
  async listSheets(query?: ListSheetsQuery): Promise<{
    sheets: unknown[];
    pagination: PaginationMeta;
  }> {
    const queryString = query ? buildQueryString(query) : '';
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets${queryString}`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { sheets: unknown[]; pagination: PaginationMeta };
  }

  /**
   * Get a single sheet by ID
   * GET /api/sheets/[id]
   */
  async getSheet(id: string): Promise<{ sheet: unknown }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets/${id}`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { sheet: unknown };
  }

  /**
   * Create a new sheet
   * POST /api/sheets
   */
  async createSheet(input: CreateSheetInput): Promise<{ sheet: unknown }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { sheet: unknown };
  }

  /**
   * Update a sheet
   * PUT /api/sheets/[id]
   */
  async updateSheet(id: string, input: UpdateSheetInput): Promise<{ sheet: unknown }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { sheet: unknown };
  }

  /**
   * Delete sheets
   * DELETE /api/sheets
   */
  async deleteSheets(input: DeleteSheetInput): Promise<{ deletedCount: number }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets`,
      {
        method: 'DELETE',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { deletedCount: number };
  }

  /**
   * Copy a sheet
   * POST /api/sheets/[id]/copy
   */
  async copySheet(id: string): Promise<{ sheet: unknown }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets/${id}/copy`,
      { method: 'POST' },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { sheet: unknown };
  }

  /**
   * Share a sheet with other users
   * POST /api/sheets/[id]/share
   */
  async shareSheet(id: string, input: ShareSheetInput): Promise<{ sheet: unknown }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets/${id}/share`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { sheet: unknown };
  }

  /**
   * List versions of a sheet
   * GET /api/sheets/[id]/versions
   */
  async listSheetVersions(id: string): Promise<{ versions: unknown[] }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets/${id}/versions`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { versions: unknown[] };
  }

  /**
   * Create a new version of a sheet
   * POST /api/sheets/[id]/versions
   */
  async createSheetVersion(id: string): Promise<{ version: unknown }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/sheets/${id}/versions`,
      { method: 'POST' },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { version: unknown };
  }

  // ========================================================================
  // OpenAI API
  // ========================================================================

  /**
   * Send chat completion request to OpenAI (proxied)
   * POST /api/openai/chat
   */
  async chatCompletion(input: OpenAIChatRequest): Promise<{
    data: unknown;
    rateLimit?: RateLimitInfo;
  }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/openai/chat`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );

    const { data, rateLimit } = await parseApiResponse<unknown>(response);
    return { data, rateLimit };
  }

  // ========================================================================
  // Export API
  // ========================================================================

  /**
   * Export tasks or sheets to various formats
   * POST /api/export
   */
  async export(input: ExportRequest): Promise<Blob> {
    const response = await apiFetch(
      `${this.baseUrl}/api/export`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as Blob;
  }

  // ========================================================================
  // Profile API
  // ========================================================================

  /**
   * Get current user's profile
   * GET /api/profile
   */
  async getProfile(): Promise<ProfileData> {
    const response = await apiFetch(
      `${this.baseUrl}/api/profile`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as ProfileData;
  }

  /**
   * Update current user's profile
   * PUT /api/profile
   */
  async updateProfile(input: UpdateProfileInput): Promise<ProfileData> {
    const response = await apiFetch(
      `${this.baseUrl}/api/profile`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as ProfileData;
  }

  /**
   * Upload avatar image
   * POST /api/profile/avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch(
      `${this.baseUrl}/api/profile/avatar`,
      {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { avatarUrl: string };
  }

  // ========================================================================
  // Settings API
  // ========================================================================

  /**
   * Get user settings
   * GET /api/settings
   */
  async getSettings(): Promise<UserSettings> {
    const response = await apiFetch(
      `${this.baseUrl}/api/settings`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as UserSettings;
  }

  /**
   * Update user settings
   * PUT /api/settings
   */
  async updateSettings(input: UpdateSettingsInput): Promise<UserSettings> {
    const response = await apiFetch(
      `${this.baseUrl}/api/settings`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as UserSettings;
  }

  // ========================================================================
  // Statistics API
  // ========================================================================

  /**
   * Get user statistics
   * GET /api/statistics
   */
  async getStatistics(): Promise<UserStatistics> {
    const response = await apiFetch(
      `${this.baseUrl}/api/statistics`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as UserStatistics;
  }

  /**
   * Get user progress data
   * GET /api/statistics/progress
   */
  async getProgress(): Promise<unknown> {
    const response = await apiFetch(
      `${this.baseUrl}/api/statistics/progress`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data;
  }

  // ========================================================================
  // Submissions API
  // ========================================================================

  /**
   * List task submissions
   * GET /api/submissions/task
   */
  async listTaskSubmissions(query?: ListSubmissionsQuery): Promise<{
    submissions: unknown[];
    pagination: PaginationMeta;
  }> {
    const queryString = query ? buildQueryString(query) : '';
    const response = await apiFetch(
      `${this.baseUrl}/api/submissions/task${queryString}`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { submissions: unknown[]; pagination: PaginationMeta };
  }

  /**
   * Submit a task answer
   * POST /api/submissions/task
   */
  async submitTask(input: SubmitTaskInput): Promise<unknown> {
    const response = await apiFetch(
      `${this.baseUrl}/api/submissions/task`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data;
  }

  /**
   * List sheet submissions
   * GET /api/submissions/sheet
   */
  async listSheetSubmissions(query?: ListSubmissionsQuery): Promise<{
    submissions: unknown[];
    pagination: PaginationMeta;
  }> {
    const queryString = query ? buildQueryString(query) : '';
    const response = await apiFetch(
      `${this.baseUrl}/api/submissions/sheet${queryString}`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { submissions: unknown[]; pagination: PaginationMeta };
  }

  /**
   * Submit a sheet (multiple tasks)
   * POST /api/submissions/sheet
   */
  async submitSheet(input: SubmitSheetInput): Promise<unknown> {
    const response = await apiFetch(
      `${this.baseUrl}/api/submissions/sheet`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data;
  }

  // ========================================================================
  // Search API
  // ========================================================================

  /**
   * Search tasks and sheets
   * GET /api/search
   */
  async search(query: SearchQuery): Promise<{
    results: {
      tasks?: unknown[];
      sheets?: unknown[];
    };
    pagination: PaginationMeta;
  }> {
    const queryString = buildQueryString(query);
    const response = await apiFetch(
      `${this.baseUrl}/api/search${queryString}`,
      {},
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { results: { tasks?: unknown[]; sheets?: unknown[] }; pagination: PaginationMeta };
  }

  // ========================================================================
  // Auth API
  // ========================================================================

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(input: RegisterInput): Promise<{ user: unknown }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/auth/register`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { user: unknown };
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(input: ChangePasswordInput): Promise<{ success: boolean }> {
    const response = await apiFetch(
      `${this.baseUrl}/api/auth/change-password`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      this.fetchFn
    );
    const { data } = await parseApiResponse(response);
    return data as { success: boolean };
  }

  /**
   * Sign in (redirects to NextAuth signIn)
   * Use NextAuth signIn() directly for better control
   */
  async signIn(): Promise<void> {
    // This is a placeholder - actual sign in should use NextAuth
    // import { signIn } from "next-auth/react";
    // await signIn();
    throw new Error('Use NextAuth signIn() directly');
  }

  /**
   * Sign out (redirects to NextAuth signOut)
   * Use NextAuth signOut() directly for better control
   */
  async signOut(): Promise<void> {
    // This is a placeholder - actual sign out should use NextAuth
    // import { signOut } from "next-auth/react";
    // await signOut();
    throw new Error('Use NextAuth signOut() directly');
  }
}

// ============================================================================
// Default client instance
// ============================================================================

/**
 * Default API client instance for client-side use
 */
export const api = new ApiClient();

// ============================================================================
// Server-side helper
// ============================================================================

/**
 * Create API client for server-side use (with custom fetch if needed)
 *
 * Usage in Server Components or Route Handlers:
 * ```ts
 * import { createServerClient } from '@/lib/api-client';
 *
 * const api = createServerClient();
 * const tasks = await api.listTasks({ page: 1, limit: 20 });
 * ```
 */
export function createServerClient(config?: ApiClientConfig): ApiClient {
  return new ApiClient({
    baseUrl: config?.baseUrl || (typeof window === 'undefined' ? '' : ''),
    fetchFn: config?.fetchFn,
  });
}

// ============================================================================
// React Hook (for client components)
// ============================================================================

/**
 * React hook for accessing API client
 * Uses a stable instance across re-renders
 */
export function useApiClient(): ApiClient {
  return api;
}
