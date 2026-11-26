const {
  setupOsRouteTests,
  createMockServer,
  HTTP_STATUS_CODES
} = require('./__test-helper__/os-routes-test-setup')

const tileQuery = 'SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=Outdoor_27700&STYLE=default&FORMAT=image%2Fpng&TILEMATRIXSET=EPSG%3A27700&TILEMATRIX=EPSG%3A27700%3A10&TILEROW=5739&TILECOL=2832'

describe('os-raster-tiles route', () => {
  setupOsRouteTests()

  let server
  let wreckRequestMock

  beforeEach(async () => {
    ({ server, wreckRequestMock } = await createMockServer(require('./os-raster-tiles')))
  })

  afterEach(async () => {
    await server.stop()
  })

  it('rewrites the route and forwards the query string, adding the server key', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `http://localhost:3005/os-raster-tiles?${tileQuery}`
    })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.OK)
    expect(wreckRequestMock).toHaveBeenCalledTimes(1)
    const [method, uri, options] = wreckRequestMock.mock.calls[0]
    expect(method).toBe('get')
    expect(uri).toBe(`https://api.os.uk/maps/raster/v1/wmts?${tileQuery}&key=os-client-id`)
    expect(options.headers.authorization).toMatch(/token$/)
  })

  it('replaces a client supplied key with the server key', async () => {
    await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/os-raster-tiles?REQUEST=GetTile&LAYER=Outdoor_27700&key=client-key'
    })

    const [, uri] = wreckRequestMock.mock.calls[0]
    expect(uri).toBe('https://api.os.uk/maps/raster/v1/wmts?REQUEST=GetTile&LAYER=Outdoor_27700&key=os-client-id')
  })

  it('does not proxy paths below the route', async () => {
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/os-raster-tiles/wmts'
    })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })

  it.each([
    ['an unpermitted layer', 'REQUEST=GetTile&LAYER=Leisure_27700'],
    ['an unpermitted layer in lower case', 'request=gettile&layer=Leisure_27700'],
    ['a duplicated layer', 'REQUEST=GetTile&LAYER=Outdoor_27700&LAYER=Leisure_27700'],
    ['a missing request type', 'LAYER=Outdoor_27700'],
    ['an unsupported request type', 'REQUEST=GetFeatureInfo&LAYER=Outdoor_27700']
  ])('rejects %s', async (_description, query) => {
    const response = await server.inject({ method: 'GET', url: `http://localhost:3005/os-raster-tiles?${query}` })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.BAD_REQUEST)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })

  it('does not accept POST', async () => {
    const response = await server.inject({ method: 'POST', url: 'http://localhost:3005/os-raster-tiles?REQUEST=GetTile&LAYER=Outdoor_27700' })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND)
  })

  it('redacts the server key from the capabilities document', async () => {
    const { PassThrough } = require('stream')
    wreckRequestMock.mockImplementation(async () => {
      const upstream = new PassThrough()
      upstream.statusCode = 200
      upstream.headers = { 'content-type': 'text/xml' }
      upstream.end('<a href="https://api.os.uk/maps/raster/v1/wmts?key=os-client-id&amp;x=1"/>')
      return upstream
    })

    const response = await server.inject({ method: 'GET', url: 'http://localhost:3005/os-raster-tiles?SERVICE=WMTS&REQUEST=GetCapabilities' })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.OK)
    expect(response.payload).not.toContain('os-client-id')
    expect(response.payload).toContain('key=REDACTED')
    expect(response.headers['content-type']).toMatch(/text\/xml/)
  })

  it('returns an error when the upstream request fails', async () => {
    wreckRequestMock.mockRejectedValue(new Error('upstream down'))

    const response = await server.inject({ method: 'GET', url: `http://localhost:3005/os-raster-tiles?${tileQuery}` })

    expect(response.statusCode).toBeGreaterThanOrEqual(500)
  })
})
