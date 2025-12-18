import type { BuildingTypeID, BuildingID, PlayerID, SpeciesTypeID, SpeciesID } from './ids.js';
import type { ProcessType } from './species.js';
import type { StorageType } from './storage.js';
import type { Skill } from './skills.js';

/**
 * Worker requirement for a building
 */
export interface WorkerRequirement {
  speciesTypeID: SpeciesTypeID;
  skills: Skill[];
  size: number;
}

/**
 * Building type definition
 */
export interface BuildingType {
  buildingTypeID: BuildingTypeID;
  name: string;
  description: string;
  processes: ProcessType[];
  storages: StorageType[];
  workerRequirement: WorkerRequirement[];
}

/**
 * Building instance
 */
export interface Building {
  buildingID: BuildingID;
  buildingTypeID: BuildingTypeID;
  ownerPlayerID?: PlayerID;
  workers: SpeciesID[];
}
