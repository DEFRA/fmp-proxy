describe('proxyDebug', () => {
  const originalEnv = process.env
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  const dirSpy = jest.spyOn(console, 'dir').mockImplementation(() => {})

  beforeEach(() => {
    process.env = { ...originalEnv }
    jest.resetModules()
    logSpy.mockClear()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  it('logs messages when debug is enabled', async () => {
    process.env.PROXY_DEBUG = 'true'
    const { logDebug } = require('./proxyDebug')

    logDebug('hello world', { status: 'ok' })
    logDebug('plain message')
    expect(logSpy).toHaveBeenNthCalledWith(1, 'hello world')
    expect(logSpy).toHaveBeenNthCalledWith(3, 'plain message')
    expect(dirSpy).toHaveBeenNthCalledWith(1, { status: 'ok' }, { depth: null })
  })

  it('Wont log messages when debug is disabled', async () => {
    process.env.PROXY_DEBUG = 'false'
    const { logDebug } = require('./proxyDebug')

    logDebug('hello world', { status: 'ok' })
    logDebug('plain message')
    expect(logSpy).not.toHaveBeenCalled()
  })
})
