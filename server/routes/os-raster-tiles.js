const { getOsToken } = require('../services/getOsToken')
const { logDebug } = require('../services/proxyDebug')
const { config } = require('../config')

const OS_RASTER_WMTS_URL = 'https://api.os.uk/maps/raster/v1/wmts'

const ROUTE_PATH = '/os-raster-tiles'

const buildUpstreamUri = async (request, upstreamPath) => {
  const wmtsUrl = new URL(`${OS_RASTER_WMTS_URL}${upstreamPath}`)
  wmtsUrl.search = request.url.search

  // The key is always supplied server-side
  wmtsUrl.searchParams.set('key', config.ordnanceSurvey.osSearchKey)

  logDebug('os raster tiles request received', {
    method: request.method,
    requestUrl: `${request.url.pathname}${request.url.search}`,
    upstreamUrl: wmtsUrl.toString()
  })

  return {
    uri: wmtsUrl.toString(),
    headers: { authorization: `Bearer ${(await getOsToken()).access_token}` }
  }
}

const buildRasterTilesUri = (request) => buildUpstreamUri(request, '')

// Keeps the raw (still encoded) path below the route
const buildRasterTilesPathUri = (request) =>
  buildUpstreamUri(request, request.url.pathname.slice(ROUTE_PATH.length).replace(/\/+$/, ''))

const createRoute = (path, mapUri, description) => ({
  method: ['GET', 'POST'],
  path,
  options: {
    description,
    auth: false,
    handler: {
      proxy: {
        passThrough: true,
        mapUri
      }
    }
  }
})

module.exports = [
  createRoute(
    ROUTE_PATH,
    buildRasterTilesUri,
    'Proxy OS raster tile (WMTS) requests while keeping the provider path hidden behind the app proxy'
  ),
  createRoute(
    `${ROUTE_PATH}/{path*}`,
    buildRasterTilesPathUri,
    'Proxy OS raster tile (WMTS) requests, forwarding the path below the route, while keeping the provider path hidden behind the app proxy'
  )
]
