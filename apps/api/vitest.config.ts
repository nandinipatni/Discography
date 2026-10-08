import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // setup.ts loads .env.test before any module (including config.ts) is imported
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/index.ts'],
    },
    // Real DB queries need headroom
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
