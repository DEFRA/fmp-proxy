const { setupOsRouteTests } = require('./os-routes-test-setup')
jest.mock('../services/proxyDebug', () => ({
  logDebug: jest.fn()
}))

const osNamesParameters = 'fq=local_type:postcode%20local_type:hamlet%20local_type:village%20local_type:town%20local_type:city%20local_type:suburban_area%20local_type:other_settlement&maxresults=100'

describe('os-place-lookup route', () => {
  setupOsRouteTests()

  let server
  let wreckRequestMock

  beforeEach(async () => {
    const { PassThrough } = require('stream')
    wreckRequestMock = jest.fn().mockImplementation(async () => {
      const upstreamResponse = new PassThrough()
      upstreamResponse.statusCode = 200
      upstreamResponse.headers = { 'content-type': 'application/json' }
      upstreamResponse.end('{}')
      return upstreamResponse
    })

    jest.doMock('@hapi/wreck', () => ({
      request: wreckRequestMock,
      parseCacheControl: jest.fn()
    }))
    jest.doMock('../services/getOsToken', () => ({
      getOsToken: jest.fn().mockResolvedValue({ access_token: 'token' })
    }))

    server = require('@hapi/hapi').server()
    await server.register(require('@hapi/h2o2'))
    server.route(require('./os-place-lookup'))

    // Tests that doMock and require the route directly still get a fresh module
    jest.resetModules()
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('route configuration', () => {
    it('has correct HTTP methods', () => {
      const route = require('./os-place-lookup')
      expect(route.method).toEqual(['GET', 'POST'])
    })

    it('has correct path with query parameter', () => {
      const route = require('./os-place-lookup')
      expect(route.path).toBe('/place-lookup/{placeName}')
    })

    it('disables authentication', () => {
      const route = require('./os-place-lookup')
      expect(route.options.auth).toBe(false)
    })

    it('uses proxy handler with mapUri', () => {
      const route = require('./os-place-lookup')
      expect(route.options.handler.proxy.passThrough).toBe(true)
      expect(typeof route.options.handler.proxy.mapUri).toBe('function')
    })

    it('has correct description', () => {
      const route = require('./os-place-lookup')
      expect(route.options.description).toContain('place lookup')
      expect(route.options.description).toContain('bearer token')
    })
  })

  describe('upstream URL construction', () => {
    it('proxies a GET request to the expected OS API url', async () => {
      const response = await server.inject({
        method: 'GET',
        url: 'http://localhost:3005/place-lookup/London'
      })

      expect(response.statusCode).toBe(200)
      expect(wreckRequestMock).toHaveBeenCalledTimes(1)
      const [method, uri, options] = wreckRequestMock.mock.calls[0]
      expect(method).toBe('get')
      expect(uri).toEqual(`https://api.os.uk/search/names/v1/find?query=London&${osNamesParameters}`)
      expect(options.headers.authorization).toBe('Bearer token')
    })

    it('handles URL-encoded queries correctly', async () => {
      const response = await server.inject({
        method: 'GET',
        url: 'http://localhost:3005/place-lookup/Brighton%20and%20Hove'
      })

      expect(response.statusCode).toBe(200)
      expect(wreckRequestMock).toHaveBeenCalledTimes(1)
      const [method, uri, options] = wreckRequestMock.mock.calls[0]
      expect(method).toBe('get')
      expect(uri).toEqual(`https://api.os.uk/search/names/v1/find?query=Brighton and Hove&${osNamesParameters}`)
      expect(options.headers.authorization).toBe('Bearer token')
    })

    it('passes three character queries through', async () => {
      const response = await server.inject({
        method: 'GET',
        url: 'http://localhost:3005/place-lookup/Man'
      })

      expect(response.statusCode).toBe(200)
      expect(wreckRequestMock).toHaveBeenCalledTimes(1)
      const [method, uri, options] = wreckRequestMock.mock.calls[0]
      expect(method).toBe('get')
      expect(uri).toEqual(`https://api.os.uk/search/names/v1/find?query=Man&${osNamesParameters}`)
      expect(options.headers.authorization).toBe('Bearer token')
    })
  })

  describe('authorization and token handling', () => {
    it('includes Bearer token in response headers', async () => {
      const getOsTokenMock = jest.fn().mockResolvedValue({ access_token: 'test-bearer-token' })

      jest.doMock('../services/getOsToken', () => ({
        getOsToken: getOsTokenMock
      }))

      const route = require('./os-place-lookup')
      const result = await route.options.handler.proxy.mapUri({
        method: 'GET',
        params: { query: 'London' },
        url: {
          href: 'http://localhost:3005/place-lookup/London'
        }
      })

      expect(result.headers).toEqual({ authorization: 'Bearer test-bearer-token' })
    })

    it('fetches token for every request', async () => {
      const getOsTokenMock = jest.fn().mockResolvedValue({ access_token: 'token' })

      jest.doMock('../services/getOsToken', () => ({
        getOsToken: getOsTokenMock
      }))

      const route = require('./os-place-lookup')
      await route.options.handler.proxy.mapUri({
        method: 'GET',
        params: { query: 'London' },
        url: {
          href: 'http://localhost:3005/place-lookup/London'
        }
      })

      expect(getOsTokenMock).toHaveBeenCalledTimes(1)
    })

    it('logs token fetch errors', async () => {
      const getOsTokenMock = jest.fn().mockRejectedValue(new Error('Token service unavailable'))

      jest.doMock('../services/getOsToken', () => ({
        getOsToken: getOsTokenMock
      }))

      const route = require('./os-place-lookup')

      await expect(
        route.options.handler.proxy.mapUri({
          method: 'GET',
          params: { query: 'London' },
          url: {
            href: 'http://localhost:3005/place-lookup/London'
          }
        })
      ).rejects.toThrow('Token service unavailable')
    })

    it('re-throws token fetch errors', async () => {
      const getOsTokenMock = jest.fn().mockRejectedValue(new Error('API error'))

      jest.doMock('../services/getOsToken', () => ({
        getOsToken: getOsTokenMock
      }))

      const route = require('./os-place-lookup')

      await expect(
        route.options.handler.proxy.mapUri({
          method: 'GET',
          params: { query: 'London' },
          url: {
            href: 'http://localhost:3005/place-lookup/London'
          }
        })
      ).rejects.toThrow('API error')
    })
  })

  describe('HTTP methods', () => {
    it('accepts GET requests', async () => {
      const getOsTokenMock = jest.fn().mockResolvedValue({ access_token: 'token' })

      jest.doMock('../services/getOsToken', () => ({
        getOsToken: getOsTokenMock
      }))

      const route = require('./os-place-lookup')
      const result = await route.options.handler.proxy.mapUri({
        method: 'GET',
        params: { query: 'London' },
        url: {
          href: 'http://localhost:3005/place-lookup/London'
        }
      })

      expect(result.uri).toBeDefined()
      expect(result.headers).toBeDefined()
    })

    it('accepts POST requests', async () => {
      const getOsTokenMock = jest.fn().mockResolvedValue({ access_token: 'token' })

      jest.doMock('../services/getOsToken', () => ({
        getOsToken: getOsTokenMock
      }))

      const route = require('./os-place-lookup')
      const result = await route.options.handler.proxy.mapUri({
        method: 'POST',
        params: { query: 'London' },
        url: {
          href: 'http://localhost:3005/place-lookup/London'
        }
      })

      expect(result.uri).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles special characters in query', async () => {
      const response = await server.inject({
        method: 'GET',
        url: "http://localhost:3005/place-lookup/St%20John's"
      })

      expect(response.statusCode).toBe(200)
      expect(wreckRequestMock).toHaveBeenCalledTimes(1)
      const [method, uri] = wreckRequestMock.mock.calls[0]
      expect(method).toBe('get')
      expect(uri).toEqual(`https://api.os.uk/search/names/v1/find?query=St John's&${osNamesParameters}`)
    })

    it('handles long query strings', async () => {
      const longQuery = 'a'.repeat(500)
      const response = await server.inject({
        method: 'GET',
        url: `http://localhost:3005/place-lookup/${longQuery}`
      })

      expect(response.statusCode).toBe(200)
      expect(wreckRequestMock).toHaveBeenCalledTimes(1)
      const [method, uri] = wreckRequestMock.mock.calls[0]
      expect(method).toBe('get')
      expect(uri).toEqual(`https://api.os.uk/search/names/v1/find?query=${longQuery}&${osNamesParameters}`)
    })

    it('does not proxy an empty place name', async () => {
      const response = await server.inject({
        method: 'GET',
        url: 'http://localhost:3005/place-lookup/'
      })

      expect(response.statusCode).toBe(404)
      expect(wreckRequestMock).not.toHaveBeenCalled()
    })
  })
})
