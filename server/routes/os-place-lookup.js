const { getOsToken } = require('../services/getOsToken')
const { logDebug } = require('../services/proxyDebug')

const OS_API_BASE = 'https://api.os.uk/'
const PATH = 'search/names/v1/find'

const osNamesParameters = 'fq=local_type:postcode%20local_type:hamlet%20local_type:village%20local_type:town%20local_type:city%20local_type:suburban_area%20local_type:other_settlement&maxresults=100'

const buildMapUri = async (request) => {
  const placeName = request.params?.placeName
  const upstreamUri = `${OS_API_BASE}${PATH}?query=${placeName}&${osNamesParameters}`

  logDebug('/place-lookup: ', {
    method: request.method,
    requestUrl: request.url.href,
    upstreamUrl: upstreamUri,
  })

  return {
    uri: upstreamUri,
    headers: { authorization: `Bearer ${(await getOsToken()).access_token}` }
  }
}

module.exports = {
  method: ['GET', 'POST'],
  path: '/place-lookup/{placeName}',
  options: {
    description: 'Proxy a vague OS place lookup request while injecting bearer token server-side',
    auth: false,
    handler: {
      proxy: {
        passThrough: true,
        mapUri: buildMapUri
      }
    }
  }
}
