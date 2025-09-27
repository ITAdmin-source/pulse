import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'tests/e2e/**', // Exclude Playwright E2E tests
      '**/*.spec.ts', // Exclude Playwright spec files
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        '.next/',
        '**/*.d.ts',
        '**/migrations/**',
        'components/ui/**', // Third-party UI components
        'components/test/**', // Temporary test components
        'app/**', // Next.js app router files (mostly routing)
        'middleware.ts', // Clerk middleware
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Stricter thresholds for critical paths
        'lib/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'lib/validations/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        },
        'lib/utils/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'db/queries/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'actions/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/db': path.resolve(__dirname, './db'),
      '@/actions': path.resolve(__dirname, './actions'),
      '@/components': path.resolve(__dirname, './components'),
    },
  },
})