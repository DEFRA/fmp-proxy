const { setupOsRouteTests } = require('./os-routes-test-setup')

describe('esri-tiles-proxy route', () => {
  setupOsRouteTests()

  let server
  let wreckRequestMock

  beforeEach(async () => {
    ({ server, wreckRequestMock } = await createMockServer(require('./esri-tiles-proxy')))
  })

  afterEach(async () => {
    await server.stop()
  })

  it('rewrites to the vector tile service, replacing the browser token', async () => {
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/esri-tiles/style/tiles/vec/0/0/0.pbf?token=browser-token'
    })

    expect(response.statusCode).toBe(200)
    expect(wreckRequestMock).toHaveBeenCalledTimes(1)
    const [method, uri] = wreckRequestMock.mock.calls[0]
    const upstream = new URL(uri)

    expect(method).toBe('get')
    expect(upstream.origin).toBe('https://tiles.arcgis.com')
    expect(upstream.pathname).toBe('/tiles/test-service-id/arcgis/rest/services/style/tiles/vec/0/0/0.pbf')
    expect(upstream.searchParams.getAll('token')).toEqual(['server-esri-token'])
  })
})
