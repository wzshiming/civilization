import type { Feature, Polygon } from 'geojson';

/**
 * Terrain types available in the map
 */
export const TerrainType = {
  OCEAN: 'ocean',
  CONTINENT: 'continent',
  ISLAND: 'island',
  MOUNTAIN: 'mountain',
  RIVER: 'river',
  JUNGLE: 'jungle',
  DESERT: 'desert',
  GRASSLAND: 'grassland',
  FOREST: 'forest',
  TUNDRA: 'tundra',
} as const;

export type TerrainType = typeof TerrainType[keyof typeof TerrainType];

/**
 * Resource types that can be found on terrain
 */
export const ResourceType = {
  GOLD: 'gold',
  IRON: 'iron',
  COAL: 'coal',
  OIL: 'oil',
  WHEAT: 'wheat',
  CATTLE: 'cattle',
  FISH: 'fish',
  STONE: 'stone',
  GEMS: 'gems',
  SPICES: 'spices',
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

/**
 * Resource information for a terrain tile
 */
export interface Resource {
  type: ResourceType;
  reserves: number;
  currentReserves: number;
  regenerationRate: number;
  extractionRate: number;
  isDiscovered: boolean;
}

/**
 * Properties for a terrain tile
 */
export interface TerrainProperties {
  id: string;
  terrainType: TerrainType;
  elevation: number;
  temperature: number;
  humidity: number;
  resources: Resource[];
  isExplored: boolean;
  fertility: number;
}

/**
 * A terrain tile represented as a GeoJSON feature
 */
export type TerrainTile = Feature<Polygon, TerrainProperties>;

/**
 * Configuration for map generation
 */
export interface MapGeneratorConfig {
  width: number;
  height: number;
  continentCount: number;
  islandCount: number;
  mountainDensity: number;
  riverCount: number;
  resourceDensity: number;
  seed?: number;
}
