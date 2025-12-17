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

/** Represents a single resource instance with its current state and attributes */
export interface Resource {
  /** Resource type identifier (can be extended beyond the default types) */
  type: string;
  /** Current amount of this resource */
  current: number;
  /** Maximum amount of this resource */
  maximum: number;
  /** Rate of change per time unit (positive for regeneration, negative for depletion) */
  changeRate: number;
  /** Whether this resource can be consumed */
  consumable?: boolean;
  /** Whether this resource can be eaten (food) */
  edible?: boolean;
  /** Satiety value when eaten (if edible) */
  satiety?: number;
  /** Energy efficiency ratio (if consumable for energy) */
  energyEfficiency?: number;
  /** Additional custom attributes */
  attributes?: Record<string, unknown>;
}

/** 2D Point coordinate */
export interface Point {
  x: number;
  y: number;
}

/** A single map parcel (polygon region) */
export interface Parcel {
  id: number;
  /** Vertices defining the polygon boundary */
  vertices: Point[];
  /** Center point of the parcel */
  center: Point;
  /** Terrain type of this parcel */
  terrain: TerrainType;
  /** Multiple resources that can exist in this parcel */
  resources: Resource[];
  /** IDs of neighboring parcels */
  neighbors: number[];
  /** Elevation value (used for terrain generation) */
  elevation: number;
  /** Moisture value (used for terrain generation) */
  moisture: number;
  /** Temperature value (used for terrain generation) */
  temperature: number;
}

/** Represents a boundary between two parcels */
export interface Boundary {
  parcel1: number;
  parcel2: number;
  /** Shared edge points */
  edge: Point[];
  /** Resources that exist on this boundary */
  resources: Resource[];
}

/** Complete world map structure */
export interface WorldMap {
  /** All parcels in the world */
  parcels: Map<number, Parcel>;
  /** Boundaries between parcels */
  boundaries: Boundary[];
  /** World dimensions */
  width: number;
  height: number;
  /** Timestamp of last simulation update */
  lastUpdate: number;
}

/** Configuration for map generation */
export interface MapConfig {
  width: number;
  height: number;
  /** Number of parcels to generate */
  numParcels: number;
  /** Random seed for reproducible generation */
  seed?: number;
  /** Water level threshold (0-1) */
  waterLevel?: number;
  /** Number of continental landmasses */
  numContinents?: number;
}
