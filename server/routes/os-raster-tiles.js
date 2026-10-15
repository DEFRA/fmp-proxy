const { getOsToken } = require('../services/getOsToken')
const { logDebug } = require('../services/proxyDebug')
const { config } = require('../config')

const OS_RASTER_WMTS_URL = 'https://api.os.uk/maps/raster/v1/wmts'

const buildRasterTilesUri = async (request) => {
  const wmtsUrl = new URL(OS_RASTER_WMTS_URL)
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

module.exports = {
  method: ['GET', 'POST'],
  path: '/os-raster-tiles',
  options: {
    description: 'Proxy OS raster tile (WMTS) requests while keeping the provider path hidden behind the app proxy',
    auth: false,
    handler: {
      proxy: {
        passThrough: true,
        mapUri: buildRasterTilesUri
      }
    }
  }
}
