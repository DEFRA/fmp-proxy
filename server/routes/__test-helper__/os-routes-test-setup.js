/**
 * Shared test setup for OS (Ordnance Survey) route tests
 * Configures environment variables and mocks required for testing OS API proxy routes
 */

const mockServer = require('./createMockServer')
const HTTP_STATUS_CODES = require('./HTTP_STATUS_CODES.json')

const setupOsRouteTests = () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()

    // Mock dotenv to prevent loading from .env file
    jest.doMock('dotenv', () => ({
      config: jest.fn()
    }))

    process.env = {
      ENV: 'test',
      FMPPROXYPORT: '8060',
      agolServiceId: 'test-service-id',
      agolClientId: 'test-agol-client-id',
      agolClientSecret: 'test-agol-client-secret',
      ordnanceSurveyOsClientId: 'os-client-id',
      proxyPublicKey: 'test-public-key',
      ordnanceSurveyOsClientSecret: 'os-client-secret'
    }
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  return originalEnv
}

module.exports = {
  setupOsRouteTests,
  createMockServer: mockServer.createMockServer,
  HTTP_STATUS_CODES
}
