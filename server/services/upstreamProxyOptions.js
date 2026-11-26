const https = require('https')
const Wreck = require('@hapi/wreck')

// Upstreams (ArcGIS, OS) close idle keep-alive connections, so reusing one gives "socket hang up" (ECONNRESET) and a 502.
// Free sockets are destroyed after a short idle period, well before the upstream drops them.
const agent = new https.Agent({ keepAlive: true, timeout: 4000 })

// h2o2 destroys the upstream request when the browser cancels it (e.g. map tiles dropped while panning), which
// then surfaces as ECONNRESET. Wreck also destroys the request after a real failure, but only once it has errored,
// so a destroy that happens before any error means a client cancel.
const httpClient = {
  request: (...args) => {
    const promise = Wreck.request(...args)
    const { req } = promise
    if (req) {
      let errored = false
      req.prependListener('error', () => { errored = true })
      const destroy = req.destroy.bind(req)
      req.destroy = (...destroyArgs) => {
        req.clientAborted = req.clientAborted ?? !errored
        return destroy(...destroyArgs)
      }
    }
    return promise
  },
  parseCacheControl: Wreck.parseCacheControl.bind(Wreck)
}

const upstreamProxyOptions = { agent, httpClient }

module.exports = { upstreamProxyOptions }
