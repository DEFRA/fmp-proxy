const routes = [].concat(
  require('../routes/health-check'),
  require('../routes/esri-service'),
  require('../routes/esri-tiles'),
  require('../routes/os-place-lookup'),
  require('../routes/os-raster-tiles'),
  require('../routes/os-vector-tiles')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server) => {
      server.route(routes)
    }
  }
}
