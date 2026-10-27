const { getOsToken } = require('../services/getOsToken')
const { logDebug } = require('../services/proxyDebug')

const OS_API_BASE = 'https://api.os.uk/maps/vector/v1/vts/'

const buildVectorTilesUri = async (request) => {
  const targetUrl = new URL(request.params.path, OS_API_BASE)

  Object.entries(request.query).forEach(([key, value]) => {
    targetUrl.searchParams.set(key, value)
  })

  logDebug('os-vector-tiles', 'rewritten', {
    method: request.method,
    requestUrl: request.url,
    upstreamUrl: targetUrl.toString()
  })

  return {
    uri: targetUrl.toString(),
    headers: { authorization: `Bearer ${(await getOsToken()).access_token}` }
  }
}

module.exports = {
  method: ['GET', 'POST'],
  path: '/os-vector-tiles/{path*}',
  options: {
    description: 'Proxy OS vector tile requests while keeping the provider path hidden behind the app proxy',
    auth: false,
    handler: {
      proxy: {
        passThrough: true,
        mapUri: buildVectorTilesUri
      }
    }
  }
}
