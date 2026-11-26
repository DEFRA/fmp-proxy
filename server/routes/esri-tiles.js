const { VECTOR_TILE_PATHS } = require('../services/restrictEsriOperations')
const { config } = require('../config')
const { createEsriProxyRoute } = require('../services/createEsriProxyRoute')
const { vectorTileRoutes } = require('../services/getEsriTileName')

module.exports = vectorTileRoutes.map(tileName => createEsriProxyRoute({
  tileName,
  path: `/esri-tiles/${tileName}/{path*}`,
  baseUrl: config.agol.vectorTileUrl,
  description: 'Proxy ESRI requests while injecting short-lived AGOL token server-side',
  allowedPaths: VECTOR_TILE_PATHS,
  logLabel: 'esri-tiles'
}))
