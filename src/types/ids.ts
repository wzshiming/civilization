/**
 * Base ID Types
 * UUID-based unique identifiers for various entities
 */

export type PlotID = string;
export type SpeciesTypeID = string;
export type SpeciesID = string;
export type ResourceTypeID = string;
export type ResourceEfficiencyTypeID = string;
export type UnitTypeID = string;
export type UnitID = string;
export type BuildingTypeID = UnitTypeID; // Deprecated: Use UnitTypeID
export type BuildingID = UnitID; // Deprecated: Use UnitID
export type TerrainTypeID = string;
export type SkillTypeID = string;
export type OrganizationTypeID = string;
export type OrganizationID = string;
export type PlayerID = string;
