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

/** Resource type identifier (can be any string) */
export type ResourceType = string;

/** Resource attribute flags */
export interface ResourceAttributes {
  /** Can be consumed as food */
  edible?: boolean;
  /** Can be consumed/used up */
  consumable?: boolean;
  /** Regenerates over time */
  renewable?: boolean;
  /** Can be traded */
  tradeable?: boolean;
  /** Is a luxury resource */
  luxury?: boolean;
  /** Is a strategic resource (for military/tech) */
  strategic?: boolean;
  /** Can be stored */
  storable?: boolean;
  /** Provides energy */
  energy?: boolean;
}

/** Configuration for a resource type */
export interface ResourceDefinition {
  /** Unique identifier for the resource */
  id: ResourceType;
  /** Display name key for i18n */
  nameKey: string;
  /** Resource attributes */
  attributes: ResourceAttributes;
  /** Maximum capacity */
  maximum: number;
  /** Regeneration/depletion rate (positive=regeneration, negative=depletion) */
  changeRate: number;
  /** Visual color for rendering */
  color?: string;
}

/** Represents a single resource with its attributes */
export interface Resource {
  type: ResourceType;
  current: number;
  maximum: number;
  changeRate: number; // positive for regeneration, negative for depletion
  attributes: ResourceAttributes;
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
