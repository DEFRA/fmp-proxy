const { config } = require('../config')
const { createEsriProxyRoute } = require('../services/createEsriProxyRoute')

module.exports = createEsriProxyRoute({
  path: '/esri/{path*}',
  baseUrl: new URL(config.agol.serviceUrl),
  description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
  logLabel: 'esri'
})
