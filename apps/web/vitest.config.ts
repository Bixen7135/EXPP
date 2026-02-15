import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/vitest.setup.ts',
        '**/types/**',  // Don't test type definitions
        'apps/web/src/app/**',  // Don't test Next.js server components
      ],
    },
  },
  include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
});
