import type { UnitTypeID, UnitID, OrganizationID, SpeciesTypeID, SpeciesID } from './ids.js';
import type { ProcessType } from './species.js';
import type { StorageType } from './storage.js';
import type { Skill } from './skills.js';

/**
 * Worker requirement for a unit
 */
export interface WorkerRequirement {
  speciesTypeID: SpeciesTypeID;
  skills: Skill[];
  size: number;
}

/**
 * Unit type definition
 * Units represent various types of active entities including buildings, caravans, missions, armies, etc.
 */
export interface UnitType {
  unitTypeID: UnitTypeID;
  name: string;
  description: string;
  processes: ProcessType[];
  storages: StorageType[];
  workerRequirement: WorkerRequirement[];
}

/**
 * Unit instance
 */
export interface Unit {
  unitID: UnitID;
  unitTypeID: UnitTypeID;
  ownerOrganizationID?: OrganizationID;
  workers: SpeciesID[];
}
