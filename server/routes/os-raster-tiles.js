const Boom = require('@hapi/boom')
const { getOsToken } = require('../services/getOsToken')
const { logDebug } = require('../services/logDebug')
const { config } = require('../config')

const OS_RASTER_WMTS_URL = 'https://api.os.uk/maps/raster/v1/wmts'

// Only the layer the map uses is allowed, as other layers are premium and billed at a higher rate
const ALLOWED_LAYERS = new Set(['Outdoor_27700'])
const ALLOWED_REQUESTS = new Set(['gettile', 'getcapabilities'])
const SINGLE_VALUE_PARAMS = ['service', 'request', 'layer', 'key']
const REDACTED = 'REDACTED'

// WMTS parameter names are case insensitive, so compare them in lower case
const getParams = (searchParams) => {
  const params = new Map()
  for (const [name, value] of searchParams) {
    const lowerName = name.toLowerCase()
    if (SINGLE_VALUE_PARAMS.includes(lowerName) && params.has(lowerName)) {
      throw Boom.badRequest(`Duplicate ${lowerName} parameter`)
    }
    params.set(lowerName, value)
  }
  return params
}

const getWmtsRequestType = (request) => getParams(request.url.searchParams).get('request')?.toLowerCase()

const validateRasterRequest = (request, h) => {
  const params = getParams(request.url.searchParams)
  const requestType = params.get('request')?.toLowerCase()

  if (!ALLOWED_REQUESTS.has(requestType)) {
    throw Boom.badRequest('Unsupported request')
  }
  if (requestType === 'gettile' && !ALLOWED_LAYERS.has(params.get('layer'))) {
    throw Boom.badRequest('Unsupported layer')
  }
  return h.continue
}

const buildRasterTilesUri = async (request) => {
  const wmtsUrl = new URL(OS_RASTER_WMTS_URL)
  wmtsUrl.search = request.url.search

  // The key is always supplied server-side
  wmtsUrl.searchParams.set('key', config.ordnanceSurvey.osClientId)

  logDebug('os-raster-tiles', 'rewritten', {
    method: request.method,
    requestUrl: `${request.url.pathname}${request.url.search}`,
    upstreamUrl: wmtsUrl.toString()
  })

  return {
    uri: wmtsUrl.toString(),
    headers: { authorization: `Bearer ${(await getOsToken()).access_token}` }
  }
}

const readBody = async (stream) => {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf8')
}

// The capabilities document echoes the server-side key in its URLs, so it must never reach the caller
const redactKey = (body) => {
  const key = config.ordnanceSurvey.osClientId
  return [key, encodeURIComponent(key)].reduce((text, value) => text.split(value).join(REDACTED), body)
}

const handleResponse = async (err, res, request, h) => {
  if (err) {
    throw err
  }
  if (getWmtsRequestType(request) !== 'getcapabilities') {
    return h.response(res).code(res.statusCode).passThrough(true)
  }

  const body = redactKey(await readBody(res))
  const response = h.response(body).code(res.statusCode).passThrough(true)
  response.headers['content-type'] = res.headers['content-type']
  return response
}

module.exports = {
  method: 'GET',
  path: '/os-raster-tiles',
  options: {
    description: 'Proxy OS raster tile (WMTS) requests while keeping the provider path hidden behind the app proxy',
    auth: false,
    pre: [{ method: validateRasterRequest, assign: 'validateRasterRequest' }],
    handler: {
      proxy: {
        passThrough: true,
        mapUri: buildRasterTilesUri,
        onResponse: handleResponse
      }
    }
  }
}
