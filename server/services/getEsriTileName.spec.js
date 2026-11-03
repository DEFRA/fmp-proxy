const loadWithEnv = (env) => {
  jest.resetModules()
  jest.doMock('../config', () => ({ config: { env } }))
  return require('./getEsriTileName')
}

describe('getEsriTileName', () => {
  afterEach(() => {
    jest.dontMock('../config')
  })

  it('uses production names when env is prod', () => {
    const { getEsriTileName } = loadWithEnv('prod')

    expect(getEsriTileName('flood-zones')).toBe('Flood_Zones_2_and_3_Rivers_and_Sea_Tile_Layer/VectorTileServer')
    expect(getEsriTileName('flood-defences')).toBe('Defences')
  })

  it('uses non production names for other environments', () => {
    const { getEsriTileName } = loadWithEnv('test')

    expect(getEsriTileName('flood-zones')).toBe('Flood_Zones_2_and_3_Rivers_and_Sea_NON_PRODUCTION/VectorTileServer')
    expect(getEsriTileName('flood-defences')).toBe('Defences_NON_PRODUCTION')
  })

  it('returns undefined for an unknown key', () => {
    const { getEsriTileName } = loadWithEnv('test')

    expect(getEsriTileName('unknown')).toBeUndefined()
  })

  it('lists the vector tile and feature routes', () => {
    const { vectorTileRoutes, featureTileRoutes } = loadWithEnv('test')

    expect(vectorTileRoutes).toHaveLength(8)
    expect(featureTileRoutes).toEqual(['main-rivers', 'flood-storage', 'flood-defences'])
  })
})
