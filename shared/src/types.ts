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
  id: number;
  vertices: Point[];
  center: Point;
  terrain: TerrainType;
  resources: Resource[];
  neighbors: number[];
  elevation: number;
  moisture: number;
  temperature: number;
}

/** Represents a boundary between two parcels */
export interface Boundary {
  parcel1: number;
  parcel2: number;
  edge: Point[];
  resources: Resource[];
}

/** Complete world map structure */
export interface WorldMap {
  parcels: Map<number, Parcel>;
  boundaries: Boundary[];
  width: number;
  height: number;
  lastUpdate: number;
}

/** Serializable version of WorldMap for storage/transmission */
export interface SerializableWorldMap {
  parcels: Parcel[];
  boundaries: Boundary[];
  width: number;
  height: number;
  lastUpdate: number;
}

/** Configuration for map generation */
export interface MapConfig {
  width: number;
  height: number;
  numParcels: number;
  seed?: number;
  waterLevel?: number;
  numContinents?: number;
  // Mercator projection - cells near poles are larger
  mercatorProjection?: boolean;
  // Polar ice caps - cover poles with ice and snow
  polarIceCaps?: boolean;
  // Ocean proportion - percentage of map that should be ocean (0-1)
  oceanProportion?: number;
  // Resource richness - abundance of resources (0-1, default 0.5)
  resourceRichness?: number;
}

/** Simulation settings */
export interface SimulationSettings {
  id: string;
  name: string;
  speed: number; // Multiplier for simulation speed (1.0 = normal)
  mapFile: string;
  active: boolean;
}

/** SSE event types */
export type SSEEventType = 'full-state' | 'delta' | 'simulation-started' | 'simulation-paused' | 'settings-updated';

/** SSE message structure */
export interface SSEMessage {
  type: SSEEventType;
  timestamp: number;
  data: SerializableWorldMap | StateDelta | Record<string, unknown>;
}

/** Delta update for parcels */
export interface ParcelDelta {
  id: number;
  resources?: Resource[];
}

/** State delta message */
export interface StateDelta {
  parcels: ParcelDelta[];
  lastUpdate: number;
}
