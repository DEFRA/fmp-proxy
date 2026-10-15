const esriTestVariables = require('./__test-helper__/esri-test-helper')

describe('esri-tiles route', () => {
  it('rewrites to the vector tile service, replacing the browser token', async () => {
    const { server } = esriTestVariables
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/esri-tiles/style/tiles/vec/0/0/0.pbf?token=browser-token'
    })

    const { upstream } = esriTestVariables.validateEsriRoute(response)

    expect(upstream.origin).toBe('https://tiles.arcgis.com')
    expect(upstream.pathname).toBe('/tiles/test-service-id/arcgis/rest/services/style/tiles/vec/0/0/0.pbf')
    expect(upstream.searchParams.getAll('token')).toEqual(['server-esri-token'])
  })
})
