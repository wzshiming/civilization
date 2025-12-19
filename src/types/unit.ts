import type { UnitTypeID, UnitID, ClusterID, SpeciesID, TerrainTypeID } from './ids.js';
import type { ProcessType } from './process.js';
import type { StorageType } from './storage.js';
import type { Skill } from './skills.js';

/**
 * Unit category enum
 */
export enum UnitCategory {
  BUILDING = 'BUILDING',
  MOVABLE = 'MOVABLE'
}

/**
 * Worker requirement for a unit
 */
export interface WorkerRequirement {
  clusterIDs: ClusterID[];
  skills: Skill[];
  size: number;
}

/**
 * Unit type definition
 */
export interface UnitType {
  unitTypeID: UnitTypeID;
  name: string;
  description: string;
  category: UnitCategory;
  processes: ProcessType[];
  storages: StorageType[];
  workerRequirement: WorkerRequirement[];
  terrainCompatibility: TerrainTypeID[];
}

/**
 * Unit instance
 */
export interface Unit {
  unitID: UnitID;
  unitTypeID: UnitTypeID;
  ownerClusterID?: ClusterID;
  workerClusterIDs: ClusterID[];
}
