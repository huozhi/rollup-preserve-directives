// @ts-check
/** @type {import('jest').Config} */
const config = {
  moduleDirectories: [
    'node_modules'
  ],
  moduleNameMapper: {
    'bunchee': '<rootDir>/src/index.ts'
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {}]
  }
};

module.exports = config;
