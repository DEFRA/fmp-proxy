const esriTestVariables = require('./__test-helper__/esri-test-helper')

describe('esri-service route', () => {
  it('rewrites to the ESRI service, preserving query params and replacing the browser token', async () => {
    const { server } = esriTestVariables
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/esri-service/FeatureServer/0/query?f=json&token=browser-token&outFields=OBJECTID'
    })

    const { upstream } = esriTestVariables.validateEsriRoute(response)

    expect(upstream.origin).toBe('https://services1.arcgis.com')
    expect(upstream.pathname).toBe('/test-service-id/arcgis/rest/services/FeatureServer/0/query')
    expect(upstream.searchParams.get('f')).toBe('json')
    expect(upstream.searchParams.get('outFields')).toBe('OBJECTID')
    expect(upstream.searchParams.getAll('token')).toEqual(['server-esri-token'])
  })
})
