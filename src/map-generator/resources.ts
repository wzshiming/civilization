/**
 * Resource generation and placement
 */

import type { Parcel, Resource } from '../types/map';
import { ResourceType, TerrainType } from '../types/map';
import { SeededRandom } from '../utils/random';

/**
 * Resource spawn rules based on terrain
 */
const RESOURCE_RULES: Record<TerrainType, { types: ResourceType[]; probability: number }> = {
  [TerrainType.OCEAN]: {
    types: [ResourceType.FISH, ResourceType.OIL],
    probability: 0.4,
  },
  [TerrainType.SHALLOW_WATER]: {
    types: [ResourceType.FISH, ResourceType.WATER],
    probability: 0.5,
  },
  [TerrainType.BEACH]: {
    types: [ResourceType.STONE],
    probability: 0.2,
  },
  [TerrainType.GRASSLAND]: {
    types: [ResourceType.FERTILE_SOIL, ResourceType.GAME, ResourceType.STONE],
    probability: 0.6,
  },
  [TerrainType.FOREST]: {
    types: [ResourceType.WOOD, ResourceType.GAME, ResourceType.FERTILE_SOIL],
    probability: 0.7,
  },
  [TerrainType.JUNGLE]: {
    types: [ResourceType.WOOD, ResourceType.GAME, ResourceType.GOLD],
    probability: 0.65,
  },
  [TerrainType.DESERT]: {
    types: [ResourceType.OIL, ResourceType.STONE],
    probability: 0.3,
  },
  [TerrainType.TUNDRA]: {
    types: [ResourceType.GAME, ResourceType.IRON],
    probability: 0.35,
  },
  [TerrainType.MOUNTAIN]: {
    types: [ResourceType.STONE, ResourceType.IRON, ResourceType.GOLD, ResourceType.COAL],
    probability: 0.8,
  },
  [TerrainType.SNOW]: {
    types: [ResourceType.WATER],
    probability: 0.2,
  },
};

/**
 * Base resource properties
 */
const RESOURCE_PROPERTIES: Record<ResourceType, { max: number; changeRate: number }> = {
  [ResourceType.WATER]: { max: 1000, changeRate: 0 },
  [ResourceType.WOOD]: { max: 500, changeRate: 0.5 },
  [ResourceType.STONE]: { max: 800, changeRate: 0 },
  [ResourceType.IRON]: { max: 300, changeRate: 0 },
  [ResourceType.GOLD]: { max: 150, changeRate: 0 },
  [ResourceType.OIL]: { max: 400, changeRate: 0 },
  [ResourceType.COAL]: { max: 600, changeRate: 0 },
  [ResourceType.FERTILE_SOIL]: { max: 100, changeRate: 0.2 },
  [ResourceType.FISH]: { max: 300, changeRate: 0.3 },
  [ResourceType.GAME]: { max: 200, changeRate: 0.4 },
};

/**
 * Create a new resource instance
 */
function createResource(type: ResourceType, random: SeededRandom): Resource {
  const props = RESOURCE_PROPERTIES[type];
  const initial = random.randomFloat(0.3, 0.9) * props.max;
  
  return {
    type,
    current: initial,
    maximum: props.max,
    changeRate: props.changeRate,
  };
}

/**
 * Generate resources for all parcels
 * Each parcel can have multiple resources
 */
export function generateResources(parcels: Parcel[], random: SeededRandom): void {
  for (const parcel of parcels) {
    const rules = RESOURCE_RULES[parcel.terrain];
    
    // Skip if terrain doesn't support resources or probability check fails
    if (!random.chance(rules.probability)) {
      continue;
    }

    // Determine how many resource types this parcel will have (1-3)
    const numResources = random.chance(0.4) ? 2 : random.chance(0.1) ? 3 : 1;
    
    // Shuffle available resource types
    const availableTypes = [...rules.types];
    for (let i = availableTypes.length - 1; i > 0; i--) {
      const j = random.randomInt(0, i + 1);
      [availableTypes[i], availableTypes[j]] = [availableTypes[j], availableTypes[i]];
    }

    // Add resources up to numResources
    const resourcesAdded = new Set<ResourceType>();
    for (let i = 0; i < Math.min(numResources, availableTypes.length); i++) {
      const type = availableTypes[i];
      if (!resourcesAdded.has(type)) {
        parcel.resources.push(createResource(type, random));
        resourcesAdded.add(type);
      }
    }

    // Special case: add water resource to parcels near water
    if (parcel.terrain === TerrainType.GRASSLAND || parcel.terrain === TerrainType.FOREST) {
      if (parcel.moisture > 0.7 && random.chance(0.5)) {
        if (!resourcesAdded.has(ResourceType.WATER)) {
          parcel.resources.push(createResource(ResourceType.WATER, random));
        }
      }
    }
  }
}

/**
 * Generate resources on boundaries (no longer used for rivers)
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function generateBoundaryResources(
  _rivers: Set<string>,
  _random: SeededRandom
): Map<string, Resource[]> {
  const boundaryResources = new Map<string, Resource[]>();

  // Rivers are now implemented as shallow water terrain parcels
  // No boundary resources needed

  return boundaryResources;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

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
