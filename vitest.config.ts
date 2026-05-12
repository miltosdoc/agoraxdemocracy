import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'build', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/**/*.ts'],
      exclude: [
        'server/**/*.d.ts',
        'server/storage/legacy.ts', // Facade - not tested directly
        'server/index.ts', // Entry point
      ],
    },
  },
});
