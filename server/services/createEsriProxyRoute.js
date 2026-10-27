const { getEsriToken } = require('./getEsriToken')
const { logDebug } = require('./logDebug')

// According to Google AI - these are the definitive list of potential vector tile query parameters:
// f:String (json, pjson) - Response formatting for service root and metadata.
// token:we can ignore this, as it gets added here
// blankTile:Boolean (false) -- Controls empty/missing tile fallback responses.
// v: cache busting version string occasionally used to force refresh of tiles.

const createEsriProxyRoute = ({
  path,
  baseUrl,
  description,
  logLabel
}) => {
  return {
    method: ['GET', 'POST'],
    path,
    options: {
      description,
      auth: false,
      handler: {
        proxy: {
          passThrough: true,
          mapUri: async (request) => {
            const requestPath = request.params.path || ''
            const targetUrl = new URL(requestPath, `${baseUrl.toString().replace(/\/$/, '')}/`)
            let token
            try {
              ({ token } = await getEsriToken())
            } catch (error) {
              logDebug(logLabel, 'token fetch failed', {
                message: error.message
              })
              throw error
            }

            Object.entries(request.query || {}).forEach(([key, value]) => {
              targetUrl.searchParams.set(key, value)
            })
            targetUrl.searchParams.delete('token')
            logDebug(logLabel, 'rewritten', {
              method: request.method,
              requestUrl: request.url,
              upstreamUrl: targetUrl.toString()
            })

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
