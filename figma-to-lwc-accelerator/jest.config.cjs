/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['packages/**/*.ts', 'apps/**/*.ts', '!**/__tests__/**']
};
