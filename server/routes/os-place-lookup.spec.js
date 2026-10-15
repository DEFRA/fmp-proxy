const {
  setupOsRouteTests,
  createMockServer,
  HTTP_STATUS_CODES
} = require('./__test-helper__/os-routes-test-setup')

const osNamesParameters = 'fq=local_type:postcode%20local_type:hamlet%20local_type:village%20local_type:town%20local_type:city%20local_type:suburban_area%20local_type:other_settlement&maxresults=100'

describe('os-place-lookup route', () => {
  setupOsRouteTests()

  let server
  let wreckRequestMock

  beforeEach(async () => {
    ({ server, wreckRequestMock } = await createMockServer(require('./os-place-lookup')))
  })

  afterEach(async () => {
    await server.stop()
  })

  const expectProxiedTo = (query) => {
    expect(wreckRequestMock).toHaveBeenCalledTimes(1)
    const [method, uri, options] = wreckRequestMock.mock.calls[0]
    expect(method).toBe('get')
    expect(uri).toEqual(`https://api.os.uk/search/names/v1/find?query=${query}&${osNamesParameters}`)
    expect(options.headers.authorization).toMatch(/token$/)
  }

  it.each([
    ['London', 'London'],
    ['Brighton%20and%20Hove', 'Brighton and Hove'],
    ['Man', 'Man'],
    ["St%20John's", "St John's"],
    ['a'.repeat(500), 'a'.repeat(500)]
  ])('rewrites /place-lookup/%s to the OS names api', async (placeName, expectedQuery) => {
    const response = await server.inject({
      method: 'GET',
      url: `http://localhost:3005/place-lookup/${placeName}`
    })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.OK)
    expectProxiedTo(expectedQuery)
  })

  it('does not proxy an empty place name', async () => {
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/place-lookup/'
    })

    expect(response.statusCode).toBe(HTTP_STATUS_CODES.NOT_FOUND)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })
})
