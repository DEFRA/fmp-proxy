const routes = [].concat(
  require('../routes/health-check'),
  require('../routes/esri-proxy'),
  require('../routes/esri-tiles-proxy'),
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
