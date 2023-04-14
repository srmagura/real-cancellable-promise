const path = require('path');

module.exports = {
  fakeTimers: {
    enableGlobally: true,
  },
  resetMocks: true,

  rootDir: path.resolve(__dirname, '..'),
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],

  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
};
