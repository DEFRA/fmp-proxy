const {
  setupOsRouteTests,
  createMockServer,
  HTTP_STATUS_CODES
} = require('./os-routes-test-setup')

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

  it('proxies POST requests', async () => {
    const { upstreamMethod, upstream } = await proxy('/os-vector-tiles/road.json?epsg=27700', 'POST')

    expect(upstreamMethod).toBe('post')
    expect(upstream.searchParams.get('epsg')).toBe('27700')
  })
})
