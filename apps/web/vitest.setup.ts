import { vi } from 'vitest';

// Define mock types inline for testing
interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockTask {
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface MockSheet {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  tasks: string[];
  tags: string[];
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockSheetWithTasks extends MockSheet {
  userId: string;
  taskCount: number;
  tasks: string[];
  deletedAt: string | null;
}

// Mock API client globally
vi.mock('@/lib/api-client', () => ({
  // List methods
  listTasks: vi.fn().mockResolvedValue({ tasks: [], total: 0 }),
  getTask: vi.fn().mockResolvedValue(null),

  // Sheet methods
  listSheets: vi.fn().mockResolvedValue({ sheets: [], total: 0 }),
  getSheet: vi.fn().mockResolvedValue(null),
  createSheet: vi.fn().mockResolvedValue({ sheet: mockSheet }),
  updateSheet: vi.fn().mockResolvedValue({ sheet: mockSheet }),
  deleteSheets: vi.fn().mockResolvedValue(undefined),

  // Task methods
  createTasks: vi.fn().mockResolvedValue({ tasks: [] }),
  updateTask: vi.fn().mockResolvedValue({ task: mockTask }),
  deleteTasks: vi.fn().mockResolvedValue(undefined),

  // Profile methods
  getProfile: vi.fn().mockResolvedValue({
    user: mockUser,
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    preferences: { theme: 'light', language: 'en', notificationsEnabled: true },
  }),
  updateProfile: vi.fn().mockResolvedValue({
    user: mockUser,
    firstName: 'Updated',
    lastName: 'User',
    avatarUrl: 'https://example.com/avatar.jpg',
    preferences: { theme: 'dark', language: 'en', notificationsEnabled: false },
  }),

  // Settings methods
  getSettings: vi.fn().mockResolvedValue({
    theme: 'light',
    language: 'en',
    notificationsEnabled: true,
    preferences: {},
  }),
  updateSettings: vi.fn().mockResolvedValue({
    theme: 'dark',
    language: 'kk',
    notificationsEnabled: false,
    preferences: { fontSize: 'large' },
  }),

  // Statistics methods
  getStatistics: vi.fn().mockResolvedValue({
    tasksCreated: 10,
    tasksCompleted: 5,
    sheetsCreated: 3,
    submissionsCount: 15,
    averageScore: 75.5,
    streakDays: 7,
  }),

  // Search methods
  search: vi.fn().mockResolvedValue({
    tasks: [],
    sheets: [],
    totalCount: 0,
  }),

  // Export methods
  exportContent: vi.fn().mockResolvedValue({ url: 'https://example.com/export.pdf', filename: 'export.pdf' }),
}));

// Mock auth client
vi.mock('@/lib/auth-client', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: mockUser,
    loading: false,
  }),
}));

// Mock data
export const mockUser: MockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockTask: MockTask = {
  id: 'test-task-id',
  userId: 'test-user-id',
  text: 'What is the capital of France?',
  type: 'choice',
  topic: 'geography',
  difficulty: 'easy',
  answer: 'Paris',
  solution: 'The capital of France is Paris.',
  explanation: 'France is located in Western Europe.',
  context: 'This question tests knowledge of European geography.',
  instructions: 'Select the correct answer from the options provided.',
  learningOutcome: 'Understand European capitals and countries.',
  tags: ['geography', 'europe', 'capitals'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

export const mockSheet: MockSheet = {
  id: 'test-sheet-id',
  userId: 'test-user-id',
  title: 'Test Sheet',
  description: 'A test sheet for unit testing',
  tasks: ['test-task-id'],
  tags: ['test', 'sample'],
  isTemplate: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockSheetWithTasks: MockSheetWithTasks = {
  ...mockSheet,
  userId: 'test-user-id',
  taskCount: 1,
  tasks: [mockTask.id],
  deletedAt: null,
};
