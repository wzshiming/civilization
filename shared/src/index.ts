/**
 * Shared type definitions for the backend simulation system
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

/** Represents a resource attribute (e.g., food, energy) */
export interface ResourceAttribute {
  name: string;
  efficiency: number;
}

/** Represents a single resource with its attributes */
export interface Resource {
  type: ResourceType;
  current: number;
  maximum: number;
  changeRate: number; // positive for regeneration, negative for depletion
  attributes: ResourceAttribute[];
}

/** 2D Point coordinate */
export interface Point {
  x: number;
  y: number;
}

/** A single map parcel (polygon region) */
export interface Parcel {
  id: string;
  vertices: Point[];
  center: Point;
  terrain: TerrainType;
  resources: Resource[];
  neighbors: string[];
  elevation: number;
  moisture: number;
  temperature: number;
}

/** Complete world map structure */
export interface WorldMap {
  parcels: Map<string, Parcel>;
  width: number;
  height: number;
}

export interface SerializableWorldMap {
  parcels: Parcel[];
  width: number;
  height: number;
}

/** Simulation settings */
export interface SimulationSettings {
  id: string;
  name: string;
  speed: number; // Multiplier for simulation speed (1.0 = normal)
  mapFile: string;
  active: boolean;
}

/** Delta update for parcels */
export interface ParcelDelta {
  id: string;
  resources?: Resource[];
}

/** State delta message */
export interface StateDelta {
  parcels: ParcelDelta[];
}
