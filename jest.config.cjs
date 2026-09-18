module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/storage/repository.ts'],
};
