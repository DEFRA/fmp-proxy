const hapi = require('@hapi/hapi')
const { config } = require('./config')
const createServer = async () => {
  const server = hapi.server({
    port: config.port,
    routes: {
      cors: true,
      validate: {
        options: {
          abortEarly: false
        }
      }
    },
    router: {
      stripTrailingSlash: true
    }
  })

  await server.register(require('@hapi/h2o2'))
  await server.register(require('./plugins/fmp-cookie-check'))
  await server.register(require('./plugins/router'))
  await server.register(require('blipp'))

  server.ext('onPreResponse', (request, h) => {
    const response = request.response

    // Nothing the proxy returns is ever meant to be rendered as a page, so stop browsers sniffing or running it
    const setHeader = response?.isBoom
      ? (name, value) => { response.output.headers[name] = value }
      : (name, value) => response.header(name, value)
    setHeader('x-content-type-options', 'nosniff')
    setHeader('content-security-policy', "default-src 'none'; sandbox")

    if (response?.isBoom) {
      console.log('proxy request failed', {
        method: request.method,
        path: request.path,
        statusCode: response.output?.statusCode,
        message: response.message
      })
    }
    return h.continue
  })

  console.log('proxy server configured on port', config.port)
  return server
}

module.exports = createServer
