module.exports = {
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '__test-helper__'
  ],
  setupFiles: ['<rootDir>/.jest/env.js'],
  setupFilesAfterEnv: ['<rootDir>/.jest/setup.js']
}
