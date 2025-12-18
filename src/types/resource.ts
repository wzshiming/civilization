import type { ResourceTypeID, ResourceEfficiencyTypeID } from './ids.js';

/**
 * Resource efficiency type defining categories like Food, Tool, etc.
 */
export interface ResourceEfficiencyType {
  resourceEfficiencyTypeID: ResourceEfficiencyTypeID;
  name: string; // e.g., "Food", "Tool", "Construction", "Energy", "Luxury"
  description: string;
}

/**
 * Resource efficiency rating
 */
export interface ResourceEfficiency {
  resourceEfficiencyTypeID: ResourceEfficiencyTypeID;
  rate: number;
}

/**
 * Resource type definition
 */
export interface ResourceType {
  resourceTypeID: ResourceTypeID;
  name: string;
  description: string;
  resourceEfficiencys: ResourceEfficiency[];
}
