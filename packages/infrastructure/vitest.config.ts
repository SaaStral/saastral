import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    poolOptions: {
      threads: {
        singleThread: true, // Database tests need sequential execution
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/index.ts',
        'src/database/client.ts',
        'src/database/prisma/seed.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@saastral/core': path.resolve(__dirname, '../core/src'),
      '@saastral/infrastructure': path.resolve(__dirname, './src'),
    },
  },
})
