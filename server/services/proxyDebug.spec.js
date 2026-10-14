describe('proxyDebug', () => {
  const originalEnv = process.env
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

  beforeEach(() => {
    process.env = { ...originalEnv }
    jest.resetModules()
    consoleSpy.mockClear()
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
    expect(consoleSpy).toHaveBeenNthCalledWith(1, '[proxy-debug] hello world {"status":"ok"}')
    expect(consoleSpy).toHaveBeenNthCalledWith(2, '[proxy-debug] plain message')
  })

  it('Wont log messages when debug is disabled', async () => {
    process.env.PROXY_DEBUG = 'false'
    const { logDebug } = require('./proxyDebug')

    logDebug('hello world', { status: 'ok' })
    logDebug('plain message')
    expect(consoleSpy).not.toHaveBeenCalled()
  })
})
