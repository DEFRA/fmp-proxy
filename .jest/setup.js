const { PassThrough } = require('stream')

// Global mocks apply to the route specs only
if (expect.getState().testPath.includes('/server/routes/')) {
  const mockWreckRequest = jest.fn()

  jest.doMock('../server/services/proxyDebug', () => ({
    logDebug: jest.fn()
  }))

  jest.doMock('../server/services/getOsToken', () => ({
    getOsToken: jest.fn().mockResolvedValue({ access_token: 'token' })
  }))

  jest.doMock('../server/services/getEsriToken', () => ({
    getEsriToken: jest.fn().mockResolvedValue({ token: 'server-esri-token' })
  }))

  jest.doMock('@hapi/wreck', () => ({
    request: mockWreckRequest,
    parseCacheControl: jest.fn()
  }))

  const upstreamOk = async () => {
    const upstreamResponse = new PassThrough()
    upstreamResponse.statusCode = 200
    upstreamResponse.headers = { 'content-type': 'application/json' }
    upstreamResponse.end('{}')
    return upstreamResponse
  }

  beforeEach(() => {
    mockWreckRequest.mockReset().mockImplementation(upstreamOk)
  })

  // Creates a hapi server with the given route(s); upstream calls go to the mocked wreck
  global.createMockServer = async (...routes) => {
    const server = require('@hapi/hapi').server()
    await server.register(require('@hapi/h2o2'))
    routes.forEach(route => server.route(route))
    return { server, wreckRequestMock: mockWreckRequest }
  }
}
