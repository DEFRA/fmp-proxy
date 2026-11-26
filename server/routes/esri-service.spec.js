const esriTestVariables = require('./__test-helper__/esri-test-helper')

describe('esri-service route', () => {
  it('rewrites to the ESRI service, preserving query params and replacing the browser token', async () => {
    const { server } = esriTestVariables
    const response = await server.inject({
      method: 'GET',
      url: 'http://localhost:3005/esri-service/main-rivers/FeatureServer/0/query?f=json&token=browser-token&outFields=OBJECTID'
    })

    const { upstream } = esriTestVariables.validateEsriRoute(response)

    expect(upstream.origin).toBe('https://services1.arcgis.com')
    expect(upstream.pathname).toBe('/test-service-id/arcgis/rest/services/Statutory_Main_River_Map/FeatureServer/0/query')
    expect(upstream.searchParams.get('f')).toBe('json')
    expect(upstream.searchParams.get('outFields')).toBe('OBJECTID')
    expect(upstream.searchParams.getAll('token')).toEqual(['server-esri-token'])
  })

  it('forces json when no format is given so the upstream html page cannot leak the token', async () => {
    const { server } = esriTestVariables
    const response = await server.inject({ method: 'GET', url: 'http://localhost:3005/esri-service/main-rivers/FeatureServer' })

    const { upstream } = esriTestVariables.validateEsriRoute(response)
    expect(upstream.searchParams.get('f')).toBe('json')
  })

  it.each([
    '/esri-service/main-rivers/FeatureServer?f=html',
    '/esri-service/main-rivers/FeatureServer/..%09/..%09/x?f=json',
    '/esri-service/main-rivers/FeatureServer/uploads/register?f=json',
    '/esri-service/main-rivers/FeatureServer/0/calculate?f=json'
  ])('refuses %s', async (url) => {
    const { server, wreckRequestMock } = esriTestVariables
    const response = await server.inject({ method: 'GET', url: `http://localhost:3005${url}` })

    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(wreckRequestMock).not.toHaveBeenCalled()
  })
})
