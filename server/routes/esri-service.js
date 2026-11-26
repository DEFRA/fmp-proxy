const { FEATURE_SERVICE_PATHS } = require('../services/restrictEsriOperations')
const { config } = require('../config')
const { createEsriProxyRoute } = require('../services/createEsriProxyRoute')
const { featureTileRoutes } = require('../services/getEsriTileName')

module.exports = featureTileRoutes.map(tileName => createEsriProxyRoute({
  tileName,
  path: `/esri-service/${tileName}/{path*}`,
  baseUrl: config.agol.serviceUrl,
  description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
  allowedPaths: FEATURE_SERVICE_PATHS,
  logLabel: 'esri-service'
}))
