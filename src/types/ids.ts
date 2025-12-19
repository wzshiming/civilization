/**
 * Base ID Types
 * UUID-based unique identifiers for various entities
 */

export type PlotID = string;
export type SpeciesTypeID = string;
export type SpeciesID = string;
export type ResourceTypeID = string;
export type ResourceEfficiencyTypeID = string;
export type UnitCategoryID = string;
export type UnitTypeID = string;
export type UnitID = string;
export type TerrainTypeID = string;
export type SkillTypeID = string;
export type OrganizationTypeID = string;
export type OrganizationID = string;
export type PlayerID = string;

// Deprecated: Use UnitTypeID instead
export type BuildingTypeID = UnitTypeID;
// Deprecated: Use UnitID instead
export type BuildingID = UnitID;
