module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  preset: 'ts-jest',
  "collectCoverageFrom": [
    "src/**/*.ts"
  ],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node",
  ],
};