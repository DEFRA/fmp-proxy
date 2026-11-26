const Boom = require('@hapi/boom')

// Read-only operations only: service metadata, layer metadata, queries and tile/resource fetches.
// Anything else (uploads, exportTiles, jobs, calculate, edits, definition updates, admin) is refused.
const FEATURE_SERVICE_PATHS = [
  /^$/,
  /^FeatureServer(\/\d+)?$/,
  /^FeatureServer\/\d+\/(query|queryRelatedRecords)$/
]

const VECTOR_TILE_PATHS = [
  /^$/,
  /^(tile|resources|styles)(\/[\w.\-@]+)*$/,
  /^tilemap(\/\d+){3,5}$/
]

const TILE_PATH_PREFIX = 'tile/'

const isAllowedEsriPath = (allowedPaths, path) => allowedPaths.some(pattern => pattern.test(path))

// With no f parameter ArcGIS answers with its HTML directory page, which embeds the access token in its links
const restrictEsriOperations = (allowedPaths) => (request, h) => {
  const path = request.params.path || ''
  if (!isAllowedEsriPath(allowedPaths, path)) {
    throw Boom.notFound('Unsupported operation')
  }
  if (request.query.f === undefined && !path.startsWith(TILE_PATH_PREFIX)) {
    request.query.f = 'json'
  }
  return h.continue
}

module.exports = {
  restrictEsriOperations,
  isAllowedEsriPath,
  FEATURE_SERVICE_PATHS,
  VECTOR_TILE_PATHS
}
