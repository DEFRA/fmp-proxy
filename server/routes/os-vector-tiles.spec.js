const {
  setupOsRouteTests,
  createMockServer,
  HTTP_STATUS_CODES
} = require('./__test-helper__/os-routes-test-setup')

describe('os-vector-tiles route', () => {
  setupOsRouteTests()

  let server
  let wreckRequestMock

  beforeEach(async () => {
    ({ server, wreckRequestMock } = await createMockServer(require('./os-vector-tiles')))
  })

  afterEach(async () => {
    await server.stop()
  })

  const proxy = async (url, method = 'GET') => {
    const response = await server.inject({ method, url: `http://localhost:3005${url}` })
    expect(response.statusCode).toBe(HTTP_STATUS_CODES.OK)
    expect(wreckRequestMock).toHaveBeenCalledTimes(1)
    const [upstreamMethod, uri, options] = wreckRequestMock.mock.calls[0]
    return { upstreamMethod, upstream: new URL(uri), options }
  }

  it('rewrites the path to the OS api root', async () => {
    const { upstream, options } = await proxy('/os-vector-tiles/road.json')

    expect(upstream.origin + upstream.pathname).toBe('https://api.os.uk/maps/vector/v1/vts/road.json')
    expect(options.headers.authorization).toMatch(/token$/)
  })

  it('forwards all query params', async () => {
    const { upstream } = await proxy('/os-vector-tiles/road.json?type=vector&target=/maps/vector/v1/vts&epsg=27700&slds=true')

    expect(upstream.searchParams.get('type')).toBe('vector')
    expect(upstream.searchParams.get('target')).toBe('/maps/vector/v1/vts')
    expect(upstream.searchParams.get('epsg')).toBe('27700')
    expect(upstream.searchParams.get('slds')).toBe('true')
  })

  it('does not accept POST', async () => {
    const response = await server.inject({ method: 'POST', url: 'http://localhost:3005/os-vector-tiles/road.json' })
    expect(response.statusCode).toBe(404)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })

  it.each([
    '/os-vector-tiles/%2f%2fwww.arcgis.com/sharing',
    '/os-vector-tiles/https:%2f%2fevil.example/x',
    '/os-vector-tiles/..%09/..%09/x',
    '/os-vector-tiles/a/..%2f..%2fx',
    '/os-vector-tiles/road.json?f=html'
  ])('rejects %s', async (url) => {
    const response = await server.inject({ method: 'GET', url: `http://localhost:3005${url}` })
    expect(response.statusCode).toBe(400)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })
})
