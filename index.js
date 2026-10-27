require('./server/config/environment')

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
