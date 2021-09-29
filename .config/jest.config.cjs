const path = require('path')

module.exports = {
    timers: 'fake',
    resetMocks: true,

    rootDir: path.resolve(__dirname, '..'),
    testMatch: ['**/__tests__/**/*.test.ts?(x)'],
}
