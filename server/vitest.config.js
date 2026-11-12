import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/services/**/*.js'],
      exclude: ['src/db/**'],
      thresholds: {
        lines: 70,
        statements: 70
      }
    }
  }
});
