const { restrictEsriOperations, isAllowedEsriPath, FEATURE_SERVICE_PATHS, VECTOR_TILE_PATHS } = require('./restrictEsriOperations')

describe('isAllowedEsriPath', () => {
  it.each([
    '', 'FeatureServer', 'FeatureServer/0', 'FeatureServer/0/query', 'FeatureServer/12/queryRelatedRecords'
  ])('feature service allows %j', (path) => {
    expect(isAllowedEsriPath(FEATURE_SERVICE_PATHS, path)).toBe(true)
  })

  it.each([
    'FeatureServer/uploads/register', 'FeatureServer/uploads/abc/delete', 'FeatureServer/0/calculate',
    'FeatureServer/0/applyEdits', 'FeatureServer/0/addAttachment', 'FeatureServer/0/updateDefinition',
    'FeatureServer/0/12/attachments', 'exportTiles', 'admin/services', 'x', 'FeatureServer/0/query/extra'
  ])('feature service refuses %s', (path) => {
    expect(isAllowedEsriPath(FEATURE_SERVICE_PATHS, path)).toBe(false)
  })

  it.each(['', 'tile/5/10/12.pbf', 'resources/styles/root.json', 'styles/root.json', 'tilemap/7/0/64/32/32'])('vector tiles allow %j', (path) => {
    expect(isAllowedEsriPath(VECTOR_TILE_PATHS, path)).toBe(true)
  })

  it.each(['exportTiles', 'exportTiles/jobs/1', 'jobs/1', 'uploads/register', 'x/tile/1/2/3', 'tilemap/a/b/c', 'tilemap/1/2', 'tilemap/1/2/3/4/5/6'])('vector tiles refuse %s', (path) => {
    expect(isAllowedEsriPath(VECTOR_TILE_PATHS, path)).toBe(false)
  })
})

describe('restrictEsriOperations', () => {
  const h = { continue: Symbol('continue') }
  const run = (allowedPaths, params, query = {}) => {
    const request = { params, query }
    const result = restrictEsriOperations(allowedPaths)(request, h)
    return { request, result }
  }

  it('continues and defaults f to json when no format is supplied', () => {
    const { request, result } = run(FEATURE_SERVICE_PATHS, { path: 'FeatureServer/0/query' })

    expect(result).toBe(h.continue)
    expect(request.query.f).toBe('json')
  })

  it('treats a missing path as the service root and defaults f to json', () => {
    const { request, result } = run(FEATURE_SERVICE_PATHS, {})

    expect(result).toBe(h.continue)
    expect(request.query.f).toBe('json')
  })

  it('keeps a supplied format', () => {
    const { request } = run(FEATURE_SERVICE_PATHS, { path: 'FeatureServer/0/query' }, { f: 'pjson' })

    expect(request.query.f).toBe('pjson')
  })

  it('does not add a format to tile requests', () => {
    const { request, result } = run(VECTOR_TILE_PATHS, { path: 'tile/5/10/12.pbf' })

    expect(result).toBe(h.continue)
    expect(request.query.f).toBeUndefined()
  })

  it('throws not found for an unsupported operation', () => {
    expect(() => run(FEATURE_SERVICE_PATHS, { path: 'FeatureServer/uploads/register' })).toThrow('Unsupported operation')
  })
})
