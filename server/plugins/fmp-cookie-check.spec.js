const { generateKeyPairSync } = require('node:crypto')
const { signToken } = require('@defra/fmp-utilities/secureUtils')

const b64 = (s) => Buffer.from(s).toString('base64')
const generateKeys = () => {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  return {
    publicKey: b64(publicKey.export({ type: 'spki', format: 'pem' })),
    privateKey: b64(privateKey.export({ type: 'pkcs8', format: 'pem' }))
  }
}

describe('fmp-cookie-check', () => {
  const originalEnv = process.env
  let keys
  let server

  beforeEach(async () => {
    jest.resetModules()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    keys = generateKeys()
    process.env = {
      ...originalEnv,
      ENV: 'test',
      FMPPROXYPORT: '8060',
      agolClientId: 'agol-client-id',
      agolClientSecret: 'agol-client-secret',
      agolServiceId: 'test-service-id',
      ordnanceSurveyOsGetCapabilitiesUrl: '',
      ordnanceSurveyOsMapsUrl: 'https://api.os.uk/maps/vector/v1/vts',
      ordnanceSurveyOsNamesUrl: 'https://api.os.uk/search/names/v1/find',
      ordnanceSurveyOsSearchKey: '',
      ordnanceSurveyOsClientId: 'os-client-id',
      ordnanceSurveyOsClientSecret: 'os-client-secret',
      proxyPublicKey: keys.publicKey
    }
    server = await require('../createServer')()
    server.route({ method: 'GET', path: '/test-route', handler: () => 'ok' })
  })

  afterEach(async () => {
    await server.stop()
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  const inject = (cookie, url = '/test-route') =>
    server.inject({ method: 'GET', url, headers: cookie ? { cookie: `fmp=${cookie}` } : {} })

  it('rejects requests without a cookie', async () => {
    expect((await inject()).statusCode).toBe(401)
  })

  it('rejects a cookie with an invalid signature', async () => {
    const other = generateKeys()
    const token = signToken({ created: Date.now() }, other.privateKey)
    expect((await inject(token)).statusCode).toBe(401)
  })

  it('rejects a cookie older than 2 hours', async () => {
    const token = signToken({ created: Date.now() - (2 * 60 * 60 * 1000 + 1000) }, keys.privateKey)
    expect((await inject(token)).statusCode).toBe(401)
  })

  it('accepts a recent cookie', async () => {
    const token = signToken({ created: Date.now() - 60 * 1000 }, keys.privateKey)
    expect((await inject(token)).statusCode).toBe(200)
  })

  it('does not require a cookie for the health check', async () => {
    expect((await inject(null, '/health-check')).statusCode).toBe(200)
  })
})
