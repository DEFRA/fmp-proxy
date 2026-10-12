/**
 * Shared test setup for OS (Ordnance Survey) route tests
 * Configures environment variables and mocks required for testing OS API proxy routes
 */

const setupOsRouteTests = () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()

    // Mock dotenv to prevent loading from .env file
    jest.doMock('dotenv', () => ({
      config: jest.fn()
    }))

    process.env = {
      FMPPROXYPORT: '8060',
      agolServiceId: 'test-service-id',
      agolClientId: 'test-agol-client-id',
      agolClientSecret: 'test-agol-client-secret',
      ordnanceSurveyOsGetCapabilitiesUrl: 'https://api.os.uk/maps/raster/v1/wmts',
      ordnanceSurveyOsMapsUrl: 'https://api.os.uk/maps/vector/v1/vts',
      ordnanceSurveyOsNamesUrl: 'https://api.os.uk/search/names/v1',
      ordnanceSurveyOsSearchKey: 'test-os-search-key',
      ordnanceSurveyOsClientId: 'os-client-id',
      ordnanceSurveyOsClientSecret: 'os-client-secret',
      OS_TOKEN_URL: 'https://api.os.uk/oauth2/token/v1'
    }
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  return originalEnv
}

module.exports = { setupOsRouteTests }
