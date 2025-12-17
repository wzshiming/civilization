/**
 * Core type definitions for the map generation system
 */

/** Terrain types available in the world */
export const TerrainType = {
  OCEAN: 'ocean',
  SHALLOW_WATER: 'shallow_water',
  BEACH: 'beach',
  GRASSLAND: 'grassland',
  FOREST: 'forest',
  JUNGLE: 'jungle',
  DESERT: 'desert',
  TUNDRA: 'tundra',
  MOUNTAIN: 'mountain',
  SNOW: 'snow',
} as const;

export type TerrainType = typeof TerrainType[keyof typeof TerrainType];

/** Resource types that can exist in parcels */
export const ResourceType = {
  WATER: 'water',
  WOOD: 'wood',
  STONE: 'stone',
  IRON: 'iron',
  GOLD: 'gold',
  OIL: 'oil',
  COAL: 'coal',
  FERTILE_SOIL: 'fertile_soil',
  FISH: 'fish',
  GAME: 'game',
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];
