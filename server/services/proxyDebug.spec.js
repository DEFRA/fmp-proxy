describe('proxyDebug', () => {
  const originalEnv = process.env
  let logSpy
  let dirSpy

  beforeEach(() => {
    process.env = { ...originalEnv }
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
    const { logDebug } = require('./proxyDebug')

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
    const { logDebug } = require('./proxyDebug')

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
    const { logDebug } = require('./proxyDebug')

    logDebug('esri-token', 'message')

    expect(logSpy).not.toHaveBeenCalled()
  })

  it('rejects PROXY_DEBUG_FILTER values that are not allowed labels', () => {
    process.env.PROXY_DEBUG = 'true'
    process.env.PROXY_DEBUG_FILTER = JSON.stringify(['esri-token', 'not-a-label'])

    expect(() => require('./proxyDebug')).toThrow('debugFilter[1]')
  })

  it('does not log messages when debug is disabled', () => {
    process.env.PROXY_DEBUG = 'false'
    const { logDebug } = require('./proxyDebug')

    logDebug('esri-token', 'hello world', { status: 'ok' })

    expect(logSpy).not.toHaveBeenCalled()
  })
})
