import type { SpeciesTypeID, SpeciesID, ResourceTypeID, BuildingID, PlotID, ClusterID } from './ids.js';
import type { Skill } from './skills.js';

/**
 * Species relationship defining interaction between species types
 */
export interface SpeciesRelationship {
  targetSpecies: SpeciesTypeID;
  favorability: number; // -1.0 to 1.0
  compatibility: number; // 0.0 to 1.0
}

/**
 * Resource change for process input/output
 */
export interface ResourceChange {
  resourceType: ResourceTypeID;
  buildingID?: BuildingID;
  plotID?: PlotID;
  size: number;
}

/**
 * Process type defining resource transformation
 */
export interface ProcessType {
  name: string;
  description: string;
  inputResources: ResourceChange[];
  outputResources: ResourceChange[];
  processTime: number; // Days to complete
}

/**
 * Species type defining a category of species
 */
export interface SpeciesType {
  speciesTypeID: SpeciesTypeID;
  name: string;
  description: string;
  isEnlightened: boolean;
  relationships: SpeciesRelationship[];
  processes: ProcessType[];
}

/**
 * Species instance
 */
export interface Species {
  speciesID: SpeciesID;
  speciesTypeID: SpeciesTypeID;
  quantity: number;
}

/**
 * Population with clusteral affiliations
 */
export interface Population {
  speciesID: SpeciesID;
  clusterIDs: ClusterID[];
  skills: Skill[];
  size: number;
}
