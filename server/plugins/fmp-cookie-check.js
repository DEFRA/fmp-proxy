const Boom = require('@hapi/boom')
const { extractTokenValue } = require('@defra/fmp-utilities/secureUtils')
const { config } = require('../config')

const COOKIE_NAME = 'fmp'
const MAX_AGE_MS = 20 * 60 * 1000 // 20 minute lifespan for the cookie
const EXEMPT_PATHS = ['/health-check']

exports.plugin = {
  name: 'fmp-cookie-check',
  register: (server) => {
    // The cookie is a signed token issued by fmp-app, so no additional encoding is applied
    server.state(COOKIE_NAME, { encoding: 'none', strictHeader: false, ignoreErrors: true })

    server.ext('onPreAuth', (request, h) => {
      if (EXEMPT_PATHS.includes(request.path) || request.method === 'options') {
        return h.continue
      }
      const token = request.state[COOKIE_NAME]
      const value = typeof token === 'string' ? extractTokenValue(token, config.proxyPublicKey) : null
      const created = Number(value?.created)
      if (!Number.isFinite(created) || Date.now() - created > MAX_AGE_MS) {
        throw Boom.unauthorized('Missing, invalid or expired fmp cookie')
      }
      return h.continue
    })
  }
}
