import type { SpeciesTypeID, SpeciesID, ResourceTypeID, UnitID, PlotID, ClusterID } from './ids.js';
import type { Skill } from './skills.js';

/**
 * Resource change for process input/output
 */
export interface ResourceChange {
  resourceType: ResourceTypeID;
  unitID?: UnitID;
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
