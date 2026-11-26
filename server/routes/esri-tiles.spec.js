const esriTestVariables = require('./__test-helper__/esri-test-helper')

describe('esri-tiles route', () => {
  it('rewrites to the vector tile service, replacing the browser token', async () => {
    const { server } = esriTestVariables
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/esri-tiles/flood-zones/tile/0/0/0.pbf?token=browser-token'
    })

    const { upstream } = esriTestVariables.validateEsriRoute(response)

    expect(upstream.origin).toBe('https://tiles.arcgis.com')
    expect(upstream.pathname).toBe('/tiles/test-service-id/arcgis/rest/services/Flood_Zones_2_and_3_Rivers_and_Sea_NON_PRODUCTION/VectorTileServer/tile/0/0/0.pbf')
    expect(upstream.searchParams.getAll('token')).toEqual(['server-esri-token'])
  })

  it.each(['sprite@2x.json', 'sprite@2x.png'])('proxies resources/sprites/%s', async (file) => {
    const { server } = esriTestVariables
    const response = await server.inject({
      method: 'GET',
      url: `http://localhost:3005/esri-tiles/flood-zones-cc/resources/sprites/${file}`
    })

    const { upstream } = esriTestVariables.validateEsriRoute(response)

    expect(upstream.origin).toBe('https://tiles.arcgis.com')
    expect(upstream.pathname.endsWith(`/VectorTileServer/resources/sprites/${file}`)).toBe(true)
  })

  it.each([
    '/esri-tiles/flood-zones/..%09/..%09/x?f=json',
    '/esri-tiles/flood-zones/..%0a/..%0a/x',
    '/esri-tiles/flood-zones?f=html',
    '/esri-tiles/flood-zones/exportTiles?f=json',
    '/esri-tiles/flood-zones/exportTiles/jobs/abc?f=json',
    '/esri-tiles/flood-zones/jobs/abc?f=json',
    '/esri-tiles/flood-zones/uploads/register?f=json',
    '/esri-tiles/flood-zones/tilemap/a/b/c'
  ])('refuses %s', async (url) => {
    const { server, wreckRequestMock } = esriTestVariables
    const response = await server.inject({ method: 'GET', url: `http://localhost:3005${url}` })

    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })

  it('does not accept a dataset name outside the allow-list', async () => {
    const { server, wreckRequestMock } = esriTestVariables
    const response = await server.inject({ method: 'GET', url: 'http://localhost:3005/esri-tiles/nat_fsa/tile/0/0/0.pbf' })

    expect(response.statusCode).toBe(404)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })
})
