/**
 * Resource configuration and definition system
 * Allows for flexible, configurable resource types with various attributes
 */

/**
 * Base interface for resource definitions
 * Each resource type can have custom attributes
 */
export interface ResourceDefinition {
  /** Unique identifier for the resource type */
  id: string;
  /** Display name key for i18n */
  nameKey: string;
  /** Maximum amount of this resource that can exist */
  maximum: number;
  /** Rate of change per time unit (positive for regeneration, negative for depletion) */
  changeRate: number;
  /** Whether this resource can be consumed */
  consumable: boolean;
  /** Whether this resource can be eaten (food) */
  edible: boolean;
  /** Satiety value when eaten (if edible) */
  satiety?: number;
  /** Energy efficiency ratio (if consumable for energy) */
  energyEfficiency?: number;
  /** Rarity score (0-1, higher = more rare) */
  rarity?: number;
  /** Custom attributes for extensibility */
  customAttributes?: Record<string, unknown>;
}

/**
 * Terrain-specific resource spawn configuration
 */
export interface TerrainResourceRule {
  /** Available resource types for this terrain */
  resourceIds: string[];
  /** Probability of resources spawning (0-1) */
  probability: number;
}

/**
 * Complete resource configuration
 */
export interface ResourceConfig {
  /** All available resource definitions */
  definitions: Record<string, ResourceDefinition>;
  /** Terrain-specific spawn rules */
  terrainRules: Record<string, TerrainResourceRule>;
}
