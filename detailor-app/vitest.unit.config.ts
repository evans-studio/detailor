import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'unit',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/__tests__/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/coverage/**',
        '**/.next/**',
        'src/stories/**',
        'src/instrumentation.ts', // Sentry instrumentation
      ],
    },
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});