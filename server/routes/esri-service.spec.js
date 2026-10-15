const { setupOsRouteTests } = require('./os-routes-test-setup')

describe('esri-proxy route', () => {
  setupOsRouteTests()

  let server
  let wreckRequestMock

  beforeEach(async () => {
    ({ server, wreckRequestMock } = await createMockServer(require('./esri-service')))
  })

  afterEach(async () => {
    await server.stop()
  })

  it('rewrites to the ESRI service, preserving query params and replacing the browser token', async () => {
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/esri/FeatureServer/0/query?f=json&token=browser-token&outFields=OBJECTID'
    })

    expect(response.statusCode).toBe(200)
    expect(wreckRequestMock).toHaveBeenCalledTimes(1)
    const [method, uri] = wreckRequestMock.mock.calls[0]
    const upstream = new URL(uri)

    expect(method).toBe('get')
    expect(upstream.origin).toBe('https://services1.arcgis.com')
    expect(upstream.pathname).toBe('/test-service-id/arcgis/rest/services/FeatureServer/0/query')
    expect(upstream.searchParams.get('f')).toBe('json')
    expect(upstream.searchParams.get('outFields')).toBe('OBJECTID')
    expect(upstream.searchParams.getAll('token')).toEqual(['server-esri-token'])
  })
})
