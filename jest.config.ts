import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  globalSetup: './tests/globalSetup.cjs',
  globalTeardown: './tests/globalTeardown.cjs',
  setupFiles: ['./tests/setEnv.cjs'],
  globals: {
    'ts-jest': {
      tsconfig: {
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        types: ['jest', 'node'],
      },
    },
  },
};

export default config;
