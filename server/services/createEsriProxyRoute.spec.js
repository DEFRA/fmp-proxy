const mockGetEsriToken = jest.fn().mockResolvedValue({ token: 'server-token' })
jest.mock('./getEsriToken', () => ({
  getEsriToken: mockGetEsriToken
}))

describe('createEsriProxyRoute', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    mockGetEsriToken.mockReset().mockResolvedValue({ token: 'server-token' })
    process.env = {
      ...originalEnv,
      FMPPROXYPORT: '8060',
      agolClientId: 'agol-client-id',
      agolClientSecret: 'agol-client-secret',
      agolServiceId: 'test-service-id',
      ordnanceSurveyOsGetCapabilitiesUrl: 'https://api.os.uk/maps/raster/v1/wmts',
      ordnanceSurveyOsMapsUrl: 'https://api.os.uk/maps/vector/v1/vts',
      ordnanceSurveyOsNamesUrl: 'https://api.os.uk/search/names/v1/find?maxresults=1&key=test',
      ordnanceSurveyOsSearchKey: 'test-os-search-key',
      ordnanceSurveyOsClientId: 'os-client-id',
      ordnanceSurveyOsClientSecret: 'os-client-secret',
      OS_TOKEN_URL: 'https://api.os.uk/oauth2/token/v1',
      ESRI_TOKEN_DURATION_MINUTES: '120'
    }
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('creates a proxy route with metadata and disables auth', async () => {
    const { createEsriProxyRoute } = require('./createEsriProxyRoute')
    const route = createEsriProxyRoute({
      path: '/proxy/esri/{path*}',
      baseUrl: new URL('https://services1.arcgis.com/test-service-id/arcgis/rest/services'),
      description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
      logLabel: 'esri'
    })

    expect(route.method).toEqual(['GET', 'POST'])
    expect(route.path).toBe('/proxy/esri/{path*}')
    expect(route.options.description).toBe('Proxy ESRI requests while injecting short-lived AGOL token server-side')
    expect(route.options.auth).toBe(false)
    expect(typeof route.options.handler.proxy.mapUri).toBe('function')
    expect(mockGetEsriToken).not.toHaveBeenCalled()
  })

  it('injects the server token and preserves valid query params', async () => {
    const requestUrl = 'http://localhost:3005/esri-service/Defences_NON_PRODUCTION/FeatureServer/0?f=json&token=browser-token&outFields=OBJECTID'

    const { createEsriProxyRoute } = require('./createEsriProxyRoute')
    const route = createEsriProxyRoute({
      path: '/proxy/esri/{path*}',
      baseUrl: new URL('https://services1.arcgis.com/test-service-id/arcgis/rest/services/'),
      description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
      logLabel: 'esri'
    })

    const result = await route.options.handler.proxy.mapUri({
      method: 'GET',
      params: {
        path: 'FeatureServer/0/query'
      },
      query: {
        f: 'json',
        token: 'browser-token',
        outFields: 'OBJECTID'
      },
      url: requestUrl
    })
    expect(mockGetEsriToken).toHaveBeenCalledTimes(1)
    expect(result.uri).toEqual('https://services1.arcgis.com/test-service-id/arcgis/rest/services/FeatureServer/0/query?f=json&outFields=OBJECTID&token=server-token')
  })

  it('handles requests without query or URL data', async () => {
    const { createEsriProxyRoute } = require('./createEsriProxyRoute')
    const route = createEsriProxyRoute({
      path: '/proxy/esri/{path*}',
      baseUrl: new URL('https://services1.arcgis.com/test-service-id/arcgis/rest/services/'),
      description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
      logLabel: 'esri'
    })

    const result = await route.options.handler.proxy.mapUri({
      method: 'GET',
      params: {},
      query: undefined,
      url: undefined
    })

    expect(mockGetEsriToken).toHaveBeenCalledTimes(1)
    expect(result.uri).toEqual('https://services1.arcgis.com/test-service-id/arcgis/rest/services/?token=server-token')
  })

  it('throws when the ArcGIS token fetch fails', async () => {
    mockGetEsriToken.mockRejectedValue(new Error('token failed'))

    const { createEsriProxyRoute } = require('./createEsriProxyRoute')
    const route = createEsriProxyRoute({
      path: '/proxy/esri/{path*}',
      baseUrl: new URL('https://services1.arcgis.com/test-service-id/arcgis/rest/services/'),
      description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
      logLabel: 'esri'
    })

    await expect(route.options.handler.proxy.mapUri({
      method: 'POST',
      params: {
        path: 'FeatureServer/0/query'
      },
      query: { f: 'json' },
      url: {
        pathname: '/proxy/esri/FeatureServer/0/query',
        search: '?f=json'
      }
    })).rejects.toThrow('token failed')
  })
})
