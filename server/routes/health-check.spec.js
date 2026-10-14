const { setupOsRouteTests } = require('./os-routes-test-setup')

describe('GET /health-check', () => {
  setupOsRouteTests()

  it('returns 200 and service payload', async () => {
    const { server } = await createMockServer(require('./health-check'))

    const response = await server.inject({ method: 'GET', url: '/health-check' })

    expect(response.statusCode).toEqual(200)
    expect(response.result).toEqual({ ok: true, service: 'fmp-proxy' })

    await server.stop()
  })
})
