const { setupOsRouteTests } = require('../os-routes-test-setup')

setupOsRouteTests()

const validateEsriRoute = (response) => {
  const { wreckRequestMock } = esriTestVariables

  expect(response.statusCode).toBe(200)
  expect(wreckRequestMock).toHaveBeenCalledTimes(1)
  const [method, uri] = wreckRequestMock.mock.calls[0]
  const upstream = new URL(uri)

  expect(method).toBe('get')
  return { method, upstream }
}

const esriTestVariables = {
  server: null,
  wreckRequestMock: null,
  validateEsriRoute
}

beforeEach(async () => {
  const { server, wreckRequestMock } = await createMockServer(
    require('../esri-service'),
    require('../esri-tiles')
  )
  esriTestVariables.server = server
  esriTestVariables.wreckRequestMock = wreckRequestMock
})

afterEach(async () => {
  await esriTestVariables.server.stop()
})

module.exports = esriTestVariables
