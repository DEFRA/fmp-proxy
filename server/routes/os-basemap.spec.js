const { setupOsRouteTests } = require('./os-routes-test-setup')

describe('os-basemap route', () => {
  setupOsRouteTests()

  let server
  let wreckRequestMock

  beforeEach(async () => {
    ({ server, wreckRequestMock } = await createMockServer(require('./os-basemap')))
  })

  afterEach(async () => {
    await server.stop()
  })

  const proxy = async (url, method = 'GET') => {
    const response = await server.inject({ method, url: `http://localhost:3005${url}` })
    expect(response.statusCode).toBe(200)
    expect(wreckRequestMock).toHaveBeenCalledTimes(1)
    const [upstreamMethod, uri, options] = wreckRequestMock.mock.calls[0]
    return { upstreamMethod, upstream: new URL(uri), options }
  }

  describe('WMTS requests', () => {
    it('rewrites to the default raster endpoint and injects the search key', async () => {
      const { upstream, options } = await proxy('/basemap/wmts')

      expect(upstream.origin + upstream.pathname).toBe('https://api.os.uk/maps/raster/v1/wmts')
      expect(upstream.searchParams.get('key')).toBe('test-os-search-key')
      expect(options.headers.authorization).toMatch(/token$/)
    })

    it('uses the target query param as the upstream path and strips it', async () => {
      const { upstream } = await proxy('/basemap/wmts?target=/custom/wmts/path')

      expect(upstream.pathname).toBe('/custom/wmts/path')
      expect(upstream.searchParams.has('target')).toBe(false)
    })

    it('preserves an existing key', async () => {
      const { upstream } = await proxy('/basemap/wmts?key=custom-key')

      expect(upstream.searchParams.getAll('key')).toEqual(['custom-key'])
    })

    it('strips type and target and forwards other params', async () => {
      const { upstream } = await proxy('/basemap/wmts?type=wmts&target=/maps/raster/v1/wmts&LAYER=Outdoor_27700&REQUEST=GetTile&FORMAT=image/png')

      expect(upstream.pathname).toBe('/maps/raster/v1/wmts')
      expect(upstream.searchParams.has('type')).toBe(false)
      expect(upstream.searchParams.has('target')).toBe(false)
      expect(upstream.searchParams.get('LAYER')).toBe('Outdoor_27700')
      expect(upstream.searchParams.get('REQUEST')).toBe('GetTile')
      expect(upstream.searchParams.get('FORMAT')).toBe('image/png')
    })

    it('does not produce double slashes when the target has a trailing slash', async () => {
      const { upstream } = await proxy('/basemap/wmts?target=/maps/raster/v1/wmts/')

      expect(upstream.pathname).not.toMatch(/\/\//)
    })

    it('proxies POST requests', async () => {
      const { upstreamMethod, upstream } = await proxy('/basemap/wmts?REQUEST=GetTile', 'POST')

      expect(upstreamMethod).toBe('post')
      expect(upstream.pathname).toBe('/maps/raster/v1/wmts')
      expect(upstream.searchParams.get('REQUEST')).toBe('GetTile')
    })
  })

  describe('vector requests', () => {
    it('rewrites the path to the OS api root', async () => {
      const { upstream, options } = await proxy('/basemap/styles/road.json')

      expect(upstream.origin + upstream.pathname).toBe('https://api.os.uk/styles/road.json')
      expect(options.headers.authorization).toMatch(/token$/)
    })

    it('strips type and target and forwards other params', async () => {
      const { upstream } = await proxy('/basemap/styles/road.json?type=vector&target=/maps/vector/v1/vts&epsg=27700&slds=true')

      expect(upstream.searchParams.has('type')).toBe(false)
      expect(upstream.searchParams.has('target')).toBe(false)
      expect(upstream.searchParams.get('epsg')).toBe('27700')
      expect(upstream.searchParams.get('slds')).toBe('true')
    })
  })
})
