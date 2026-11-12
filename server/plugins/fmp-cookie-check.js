const Boom = require('@hapi/boom')
const { extractTokenValue } = require('@defra/fmp-utilities/secureUtils')
const { config } = require('../config')

const COOKIE_NAME = 'fmp'
const MAX_AGE_MS = 1200000 // 20 minute lifespan for the cookie
const EXEMPT_PATHS = new Set(['/health-check'])

exports.plugin = {
  name: 'fmp-cookie-check',
  register: (server) => {
    // The cookie is a signed token issued by fmp-app, so no additional encoding is applied
    server.state(COOKIE_NAME, { encoding: 'none', strictHeader: false, ignoreErrors: true })

    server.ext('onPreAuth', (request, h) => {
      if (EXEMPT_PATHS.has(request.path) || request.method === 'options') {
        return h.continue
      }
      const token = request.state[COOKIE_NAME]
      if (!token) {
        throw Boom.unauthorized('Missing fmp cookie')
      }
      const value = typeof token === 'string' ? extractTokenValue(token, config.proxyPublicKey) : null
      const created = Number(value?.created)
      if (!Number.isFinite(created)) {
        throw Boom.unauthorized('Invalid fmp cookie')
      }
      if (Date.now() - created > MAX_AGE_MS) {
        throw Boom.unauthorized('Expired fmp cookie')
      }
      return h.continue
    })
  }
}
