require('./server/config/environment')
const { EventEmitter } = require('events')
const Wreck = require('@hapi/wreck')

// Wreck wraps upstream connection failures as a generic "Client request error", so log the real cause here
Wreck.events = new EventEmitter()

// TEMPORARY: count client cancels so they can be compared with the cancelled requests seen in the browser
let clientAbortCount = 0
const LOG_EVERY = 500
Wreck.events.on('response', (err, { req, uri }) => {
  if (err && req.clientAborted && ++clientAbortCount % LOG_EVERY === 0) {
    console.log('client aborted requests so far', clientAbortCount)
  }
  // A browser cancelling a request (e.g. panning the map) surfaces as ECONNRESET, which is just noise
  if (err && !req.clientAborted) {
    const { code, errors, message, syscall } = err.data || err
    console.log('upstream request error', {
      host: uri.host,
      path: uri.pathname,
      code,
      syscall,
      message,
      errors: errors?.map(({ code: errorCode, address }) => ({ code: errorCode, address }))
    })
  }
})

const start = async () => {
  const createServer = require('./server/createServer')
  return createServer()
}

start()
  .then((server) => server.start())
  .catch((err) => {
    console.log('error', err)
    process.exit(1)
  })
