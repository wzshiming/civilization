import type { UnitCategoryID, UnitTypeID, UnitID, OrganizationID, SpeciesTypeID, SpeciesID } from './ids.js';
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
 * Unit category definition (e.g., Building, Caravan, Mission, Army)
 */
export interface UnitCategory {
  unitCategoryID: UnitCategoryID;
  name: string;
  description: string;
}

/**
 * Unit type definition
 */
export interface UnitType {
  unitTypeID: UnitTypeID;
  unitCategoryID: UnitCategoryID;
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

// Deprecated types for backward compatibility
/** @deprecated Use UnitType instead */
export type BuildingType = UnitType;
/** @deprecated Use Unit instead */
export type Building = Unit;
