import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{mjs,js}'],
    globals: false,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.mjs'],
      exclude: ['src/launcher.mjs', 'src/quota-service.mjs']
    }
  }
});
