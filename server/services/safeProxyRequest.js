const Boom = require('@hapi/boom')

const ALLOWED_FORMATS = ['json', 'pjson', 'pbf']
const CREDENTIAL_HEADERS = ['authorization', 'x-esri-authorization', 'x-forwarded-host']

// hapi has already percent-decoded params.path, so anything dangerous is visible here
// eslint-disable-next-line no-control-regex
const UNSAFE_PATH = /(^|[\\/])\.\.?([\\/]|$)|[\u0000-\u001f\u007f\\:?#@]|\/\/|^\//

const isSafePath = (path) => !path || !UNSAFE_PATH.test(path)

// Rejects traversal, absolute/scheme-relative destinations and control characters in the path
// Rejects html (or any unexpected) response formats, as upstream html pages embed the token in links
// Removes caller supplied credentials so only the server-side ones are ever sent upstream
const safeProxyRequest = (request, h) => {
  if (!isSafePath(request.params.path)) {
    throw Boom.badRequest('Invalid path')
  }

  const format = request.query.f
  if (format !== undefined && !ALLOWED_FORMATS.includes(format)) {
    throw Boom.badRequest('Unsupported format')
  }

  CREDENTIAL_HEADERS.forEach(header => delete request.headers[header])
  delete request.query.token

  return h.continue
}

module.exports = { safeProxyRequest, isSafePath }
