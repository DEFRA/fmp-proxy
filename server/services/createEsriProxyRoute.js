const { upstreamAgent } = require('./upstreamAgent')
const { getEsriToken } = require('./getEsriToken')
const { logDebug } = require('./logDebug')
const { getEsriTileName } = require('./getEsriTileName')
const { safeProxyRequest } = require('./safeProxyRequest')
const { restrictEsriOperations } = require('./restrictEsriOperations')

// According to Google AI - these are the definitive list of potential vector tile query parameters:
// f:String (json, pjson) - Response formatting for service root and metadata.
// token:we can ignore this, as it gets added here
// blankTile:Boolean (false) -- Controls empty/missing tile fallback responses.
// v: cache busting version string occasionally used to force refresh of tiles.
const createEsriProxyRoute = ({
  tileName,
  path,
  baseUrl,
  description,
  logLabel,
  allowedPaths
}) => {
  return {
    method: 'GET',
    path,
    options: {
      description,
      auth: false,
      pre: [
        { method: safeProxyRequest, assign: 'safeProxyRequest' },
        { method: restrictEsriOperations(allowedPaths), assign: 'restrictEsriOperations' }
      ],
      handler: {
        proxy: {
          passThrough: true,
          agent: upstreamAgent,
          mapUri: async (request) => {
            const requestPath = request.params.path ? `/${request.params.path}` : ''
            const esriTileName = getEsriTileName(tileName)
            const targetUrl = new URL(`${baseUrl}/${esriTileName}${requestPath}`)

            Object.entries(request.query || {}).forEach(([key, value]) => {
              targetUrl.searchParams.set(key, value)
            })
            targetUrl.searchParams.delete('token')
            logDebug(logLabel, 'rewritten', {
              method: request.method,
              requestUrl: request.url,
              upstreamUrl: targetUrl.toString()
            })

            const { token } = await getEsriToken()
            targetUrl.searchParams.set('token', token)
            return { uri: targetUrl.toString() }
          }
        }
      }
    }
  }
}

module.exports = {
  createEsriProxyRoute
}
