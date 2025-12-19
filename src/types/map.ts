import type { Plot } from './plot.js';
import type { SpeciesType } from './species.js';
import type { ResourceType } from './resource.js';
import type { BuildingType } from './building.js';
import type { TerrainType } from './terrain.js';
import type { SkillType } from './skills.js';
import type { Organization, OrganizationType } from './organization.js';
import type { Religion } from './religion.js';
import type { Culture } from './culture.js';
import type { Dimensions } from './geometry.js';

/**
 * Projection configuration for map edges
 */
export interface ProjectionConfig {
  wrapHorizontal: boolean; // Connect left/right edges
  wrapVertical: boolean; // Connect top/bottom edges
  poleScaling: number; // Size multiplier for polar regions (1.0 = no scaling)
}

/**
 * Terrain generation configuration
 */
export interface TerrainConfig {
  oceanPercentage: number; // 0.0 to 1.0
  continentCount: number;
  islandFrequency: number; // 0.0 to 1.0
  coastalRoughness: number; // 0.0 to 1.0
}

/**
 * Map generation configuration
 */
export interface MapConfig {
  plotCount: number;
  dimensions: Dimensions;
  projection: ProjectionConfig;
  terrain: TerrainConfig;
  resourceDensity: number;
  climateVariance: number;
  randomSeed: number;
  relaxationSteps: number; // Lloyd's relaxation iterations
}

/**
 * The complete game map
 */
export interface GameMap {
  plots: Plot[];
  speciesTypes: SpeciesType[];
  resourceTypes: ResourceType[];
  buildingTypes: BuildingType[];
  terrainTypes: TerrainType[];
  skillTypes: SkillType[];
  organizationTypes: OrganizationType[];
  organizations: Organization[];
  religions: Religion[];
  cultures: Culture[];
}
