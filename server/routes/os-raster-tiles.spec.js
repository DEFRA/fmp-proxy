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
    expect(uri).toBe(`https://api.os.uk/maps/raster/v1/wmts?${tileQuery}&key=test-os-search-key`)
    expect(options.headers.authorization).toMatch(/token$/)
  })

  it('replaces a client supplied key with the server key', async () => {
    await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/os-raster-tiles?REQUEST=GetTile&key=client-key'
    })

    const [, uri] = wreckRequestMock.mock.calls[0]
    expect(uri).toBe('https://api.os.uk/maps/raster/v1/wmts?REQUEST=GetTile&key=test-os-search-key')
  })

  it('does not proxy paths below the route', async () => {
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/os-raster-tiles/wmts'
    })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })
})
