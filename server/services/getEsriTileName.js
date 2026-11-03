const { config } = require('../config')

// ON PROD - _Tile_Layer suffix is used for vector tile layers
// NO SUFFIX IS USED for FeatureServer layers
const prodTileNameMap = {
  'flood-zones-cc': 'Flood_Zones_2_and_3_Rivers_and_Sea_CCP1_Tile_Layer/VectorTileServer',
  'flood-zones': 'Flood_Zones_2_and_3_Rivers_and_Sea_Tile_Layer/VectorTileServer',
  'sw-low': 'Surface_Water_Spatial_Planning_1_in_1000_Depths_Tile_Layer/VectorTileServer',
  'sw-medium': 'Surface_Water_Spatial_Planning_1_in_100_Depths_Tile_Layer/VectorTileServer',
  'sw-high': 'Surface_Water_Spatial_Planning_1_in_30_Depths_Tile_Layer/VectorTileServer',
  'sw-cc-low': 'Surface_Water_Spatial_Planning_1_in_1000_CCP1_Depths_Tile_Layer/VectorTileServer',
  'sw-cc-medium': 'Surface_Water_Spatial_Planning_1_in_100_CCP1_Depths_Tile_Layer/VectorTileServer',
  'sw-cc-high': 'Surface_Water_Spatial_Planning_1_in_30_CCP1_Depths_Tile_Layer/VectorTileServer',
  'main-rivers': 'Statutory_Main_River_Map',
  'flood-storage': 'Flood_Storage_Areas',
  'flood-defences': 'Defences',
}

// ON NON PROD - _NON_PRODUCTION suffix is used for vector tile layers
// _NON_PRODUCTION IS USED for FeatureServer layers (except main-rivers - where prod and non prod use the same value)
const nonProdTileNameMap = {
  'flood-zones-cc': 'Flood_Zones_2_and_3_Rivers_and_Sea_CCP1_NON_PRODUCTION/VectorTileServer',
  'flood-zones': 'Flood_Zones_2_and_3_Rivers_and_Sea_NON_PRODUCTION/VectorTileServer',
  'sw-low': 'Surface_Water_Spatial_Planning_1_in_1000_Depths_NON_PRODUCTION/VectorTileServer',
  'sw-medium': 'Surface_Water_Spatial_Planning_1_in_100_Depths_NON_PRODUCTION/VectorTileServer',
  'sw-high': 'Surface_Water_Spatial_Planning_1_in_30_Depths_NON_PRODUCTION/VectorTileServer',
  'sw-cc-low': 'Surface_Water_Spatial_Planning_1_in_1000_CCP1_Depths_NON_PRODUCTION/VectorTileServer',
  'sw-cc-medium': 'Surface_Water_Spatial_Planning_1_in_100_CCP1_Depths_NON_PRODUCTION/VectorTileServer',
  'sw-cc-high': 'Surface_Water_Spatial_Planning_1_in_30_CCP1_Depths_NON_PRODUCTION/VectorTileServer',
  'main-rivers': 'Statutory_Main_River_Map',
  'flood-storage': 'Flood_Storage_Areas_NON_PRODUCTION',
  'flood-defences': 'Defences_NON_PRODUCTION',
}

const vectorTileRoutes = [
  'flood-zones-cc',
  'flood-zones',
  'sw-low',
  'sw-medium',
  'sw-high',
  'sw-cc-low',
  'sw-cc-medium',
  'sw-cc-high',
]

const featureTileRoutes = [
  'main-rivers',
  'flood-storage',
  'flood-defences',
]
const getEsriTileNameProd = (key) => prodTileNameMap[key]
const getEsriTileNameNonProd = (key) => nonProdTileNameMap[key]
const getEsriTileName = config.env === 'prod' ? getEsriTileNameProd : getEsriTileNameNonProd

module.exports = {
  vectorTileRoutes,
  featureTileRoutes,
  getEsriTileName
}
