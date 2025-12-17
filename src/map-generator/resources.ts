/**
 * Resource generation and placement
 */

import type { Parcel, Resource, ResourceType } from '../types/map';
import { TerrainType } from '../types/map';
import { SeededRandom } from '../utils/random';
import { DEFAULT_RESOURCE_TYPES, getResourceDefinition } from './resource-registry';

/**
 * Resource spawn rules based on terrain
 */
const RESOURCE_RULES: Record<TerrainType, { types: ResourceType[]; probability: number }> = {
  [TerrainType.OCEAN]: {
    types: [DEFAULT_RESOURCE_TYPES.FISH, DEFAULT_RESOURCE_TYPES.OIL],
    probability: 0.4,
  },
  [TerrainType.SHALLOW_WATER]: {
    types: [DEFAULT_RESOURCE_TYPES.FISH, DEFAULT_RESOURCE_TYPES.WATER],
    probability: 0.5,
  },
  [TerrainType.BEACH]: {
    types: [DEFAULT_RESOURCE_TYPES.STONE],
    probability: 0.2,
  },
  [TerrainType.GRASSLAND]: {
    types: [DEFAULT_RESOURCE_TYPES.FERTILE_SOIL, DEFAULT_RESOURCE_TYPES.GAME, DEFAULT_RESOURCE_TYPES.STONE],
    probability: 0.6,
  },
  [TerrainType.FOREST]: {
    types: [DEFAULT_RESOURCE_TYPES.WOOD, DEFAULT_RESOURCE_TYPES.GAME, DEFAULT_RESOURCE_TYPES.FERTILE_SOIL],
    probability: 0.7,
  },
  [TerrainType.JUNGLE]: {
    types: [DEFAULT_RESOURCE_TYPES.WOOD, DEFAULT_RESOURCE_TYPES.GAME, DEFAULT_RESOURCE_TYPES.GOLD],
    probability: 0.65,
  },
  [TerrainType.DESERT]: {
    types: [DEFAULT_RESOURCE_TYPES.OIL, DEFAULT_RESOURCE_TYPES.STONE],
    probability: 0.3,
  },
  [TerrainType.TUNDRA]: {
    types: [DEFAULT_RESOURCE_TYPES.GAME, DEFAULT_RESOURCE_TYPES.IRON],
    probability: 0.35,
  },
  [TerrainType.MOUNTAIN]: {
    types: [DEFAULT_RESOURCE_TYPES.STONE, DEFAULT_RESOURCE_TYPES.IRON, DEFAULT_RESOURCE_TYPES.GOLD, DEFAULT_RESOURCE_TYPES.COAL],
    probability: 0.8,
  },
  [TerrainType.SNOW]: {
    types: [DEFAULT_RESOURCE_TYPES.WATER],
    probability: 0.2,
  },
};

/**
 * Create a new resource instance
 */
function createResource(type: ResourceType, random: SeededRandom): Resource | null {
  const definition = getResourceDefinition(type);
  if (!definition) {
    console.warn(`Resource definition not found for type: ${type}`);
    return null;
  }

  const initial = random.randomFloat(0.3, 0.9) * definition.maximum;
  
  return {
    type,
    current: initial,
    maximum: definition.maximum,
    changeRate: definition.changeRate,
    attributes: { ...definition.attributes },
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
        const resource = createResource(type, random);
        if (resource) {
          parcel.resources.push(resource);
          resourcesAdded.add(type);
        }
      }
    }

    // Special case: add water resource to parcels near water
    if (parcel.terrain === TerrainType.GRASSLAND || parcel.terrain === TerrainType.FOREST) {
      if (parcel.moisture > 0.7 && random.chance(0.5)) {
        if (!resourcesAdded.has(DEFAULT_RESOURCE_TYPES.WATER)) {
          const waterResource = createResource(DEFAULT_RESOURCE_TYPES.WATER, random);
          if (waterResource) {
            parcel.resources.push(waterResource);
          }
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
