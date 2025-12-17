/**
 * Resource generation and placement
 */

import type { Parcel, Resource } from '../types/map';
import { TerrainType } from '../types/map';
import type { ResourceConfig, ResourceDefinition } from '../types/resource-config';
import { DEFAULT_RESOURCE_CONFIG } from '../config/resources';
import { SeededRandom } from '../utils/random';

/**
 * Active resource configuration
 * Can be replaced to use custom resource definitions
 */
let activeResourceConfig: ResourceConfig = DEFAULT_RESOURCE_CONFIG;

/**
 * Set the active resource configuration
 * Allows for custom resource types and rules
 */
export function setResourceConfig(config: ResourceConfig): void {
  activeResourceConfig = config;
}

/**
 * Get the active resource configuration
 */
export function getResourceConfig(): ResourceConfig {
  return activeResourceConfig;
}

/**
 * Create a new resource instance from a resource definition
 */
function createResource(resourceId: string, definition: ResourceDefinition, random: SeededRandom): Resource {
  const initial = random.randomFloat(0.3, 0.9) * definition.maximum;
  
  return {
    type: resourceId,
    current: initial,
    maximum: definition.maximum,
    changeRate: definition.changeRate,
    consumable: definition.consumable,
    edible: definition.edible,
    satiety: definition.satiety,
    energyEfficiency: definition.energyEfficiency,
    attributes: definition.customAttributes,
  };
}

/**
 * Generate resources for all parcels using the active configuration
 * Each parcel can have multiple resources
 */
export function generateResources(parcels: Parcel[], random: SeededRandom): void {
  const config = activeResourceConfig;
  
  for (const parcel of parcels) {
    const rules = config.terrainRules[parcel.terrain];
    
    // Skip if terrain doesn't have rules or probability check fails
    if (!rules || !random.chance(rules.probability)) {
      continue;
    }

    // Determine how many resource types this parcel will have (1-3)
    const numResources = random.chance(0.4) ? 2 : random.chance(0.1) ? 3 : 1;
    
    // Shuffle available resource IDs
    const availableIds = [...rules.resourceIds];
    for (let i = availableIds.length - 1; i > 0; i--) {
      const j = random.randomInt(0, i + 1);
      [availableIds[i], availableIds[j]] = [availableIds[j], availableIds[i]];
    }

    // Add resources up to numResources
    const resourcesAdded = new Set<string>();
    for (let i = 0; i < Math.min(numResources, availableIds.length); i++) {
      const resourceId = availableIds[i];
      const definition = config.definitions[resourceId];
      
      if (definition && !resourcesAdded.has(resourceId)) {
        parcel.resources.push(createResource(resourceId, definition, random));
        resourcesAdded.add(resourceId);
      }
    }

    // Special case: add water resource to parcels near water
    if (parcel.terrain === TerrainType.GRASSLAND || parcel.terrain === TerrainType.FOREST) {
      if (parcel.moisture > 0.7 && random.chance(0.5)) {
        const waterDef = config.definitions['water'];
        if (waterDef && !resourcesAdded.has('water')) {
          parcel.resources.push(createResource('water', waterDef, random));
        }
      }
    }
  }
}



/**
 * Simulate resource changes over time
 */
export function updateResources(parcel: Parcel, deltaTime: number): void {
  for (const resource of parcel.resources) {
    // Apply change rate (regeneration or depletion)
    resource.current += resource.changeRate * deltaTime;
    
    // Clamp to valid range
    resource.current = Math.max(0, Math.min(resource.maximum, resource.current));
  }
}
