describe('logDebug', () => {
  const originalEnv = process.env
  let logSpy
  let dirSpy

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      FMPPROXYPORT: '8060',
      agolClientId: 'agol-client-id',
      agolClientSecret: 'agol-client-secret',
      agolServiceId: 'test-service-id',
      ordnanceSurveyOsGetCapabilitiesUrl: 'https://api.os.uk/maps/raster/v1/wmts',
      ordnanceSurveyOsMapsUrl: 'https://api.os.uk/maps/vector/v1/vts',
      ordnanceSurveyOsNamesUrl: 'https://api.os.uk/search/names/v1/find?maxresults=1&key=test',
      ordnanceSurveyOsSearchKey: 'test-os-search-key',
      ordnanceSurveyOsClientId: 'os-client-id',
      ordnanceSurveyOsClientSecret: 'os-client-secret',
      OS_TOKEN_URL: 'https://api.os.uk/oauth2/token/v1',
      ESRI_TOKEN_DURATION_MINUTES: '120'
    }
    jest.resetModules()
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    dirSpy = jest.spyOn(console, 'dir').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('logs messages when debug is enabled and the label is in the default filter', () => {
    process.env.PROXY_DEBUG = 'true'
    process.env.PROXY_DEBUG_FILTER = ''
    const { logDebug } = jest.requireActual('./logDebug')

    logDebug('esri-token', 'hello world', { status: 'ok' })
    logDebug('esri-tiles', 'plain message')

    expect(logSpy).toHaveBeenNthCalledWith(1, 'esri-token', 'hello world')
    expect(logSpy).toHaveBeenNthCalledWith(3, 'esri-tiles', 'plain message')
    expect(dirSpy).toHaveBeenCalledTimes(1)
    expect(dirSpy).toHaveBeenCalledWith({ status: 'ok' }, { depth: null })
  })

  it('only logs labels included in PROXY_DEBUG_FILTER', () => {
    process.env.PROXY_DEBUG = 'true'
    process.env.PROXY_DEBUG_FILTER = JSON.stringify(['os-place'])
    const { logDebug } = jest.requireActual('./logDebug')

    logDebug('esri-token', 'filtered out')
    logDebug('esri-service', 'filtered out', { a: 1 })
    logDebug('os-place', 'allowed')

    expect(logSpy).toHaveBeenCalledTimes(2)
    expect(logSpy).toHaveBeenNthCalledWith(1, 'os-place', 'allowed')
    expect(dirSpy).not.toHaveBeenCalled()
  })

  it('logs nothing when PROXY_DEBUG_FILTER is an empty array', () => {
    process.env.PROXY_DEBUG = 'true'
    process.env.PROXY_DEBUG_FILTER = '[]'
    const { logDebug } = jest.requireActual('./logDebug')

    logDebug('esri-token', 'message')

    expect(logSpy).not.toHaveBeenCalled()
  })

  it('rejects PROXY_DEBUG_FILTER values that are not allowed labels', () => {
    process.env.PROXY_DEBUG = 'true'
    process.env.PROXY_DEBUG_FILTER = JSON.stringify(['esri-token', 'not-a-label'])

    expect(() => jest.requireActual('./logDebug')).toThrow('debugFilter[1]')
  })

  it('does not log messages when debug is disabled', () => {
    process.env.PROXY_DEBUG = 'false'
    const { logDebug } = jest.requireActual('./logDebug')

    logDebug('esri-token', 'hello world', { status: 'ok' })

    expect(logSpy).not.toHaveBeenCalled()
  })
})
