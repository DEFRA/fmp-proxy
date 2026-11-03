const { config } = require('../config')
const { createEsriProxyRoute } = require('../services/createEsriProxyRoute')
const { featureTileRoutes } = require('../services/getEsriTileName')

module.exports = featureTileRoutes.map(tileName => createEsriProxyRoute({
  tileName,
  path: `/esri-service/${tileName}/{path*}`,
  baseUrl: config.agol.serviceUrl,
  description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
  logLabel: 'esri-service'
}))
