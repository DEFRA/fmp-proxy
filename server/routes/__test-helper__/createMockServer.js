const attach = (mockWreckRequest) => {
  mockServer.createMockServer = async (...routes) => {
    const server = require('@hapi/hapi').server()
    await server.register(require('@hapi/h2o2'))
    routes.forEach(route => server.route(route))
    return { server, wreckRequestMock: mockWreckRequest }
  }
}

const mockServer = {
  createMockServer: async () => {},
  attach
}

module.exports = mockServer
