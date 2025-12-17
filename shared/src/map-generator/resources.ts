/**
 * Resource generation and placement
 */

import type { Parcel, Resource, ResourceAttribute } from '../types';
import { ResourceType, TerrainType } from '../types';
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
const RESOURCE_PROPERTIES: Record<ResourceType, { max: number; changeRate: number; attributes: ResourceAttribute[] }> = {
  [ResourceType.WATER]: { 
    max: 1000, 
    changeRate: 0,
    attributes: [
      { name: 'hydration', efficiency: 1.0 },
    ]
  },
  [ResourceType.WOOD]: { 
    max: 500, 
    changeRate: 0.5,
    attributes: [
      { name: 'energy', efficiency: 0.8 },
      { name: 'construction', efficiency: 1.0 },
    ]
  },
  [ResourceType.STONE]: { 
    max: 800, 
    changeRate: 0,
    attributes: [
      { name: 'construction', efficiency: 1.2 },
    ]
  },
  [ResourceType.IRON]: { 
    max: 300, 
    changeRate: 0,
    attributes: [
      { name: 'tools', efficiency: 1.0 },
      { name: 'construction', efficiency: 0.9 },
    ]
  },
  [ResourceType.GOLD]: { 
    max: 150, 
    changeRate: 0,
    attributes: [
      { name: 'wealth', efficiency: 1.0 },
    ]
  },
  [ResourceType.OIL]: { 
    max: 400, 
    changeRate: 0,
    attributes: [
      { name: 'energy', efficiency: 1.5 },
    ]
  },
  [ResourceType.COAL]: { 
    max: 600, 
    changeRate: 0,
    attributes: [
      { name: 'energy', efficiency: 1.2 },
    ]
  },
  [ResourceType.FERTILE_SOIL]: { 
    max: 100, 
    changeRate: 0.2,
    attributes: [
      { name: 'food', efficiency: 1.0 },
    ]
  },
  [ResourceType.FISH]: { 
    max: 300, 
    changeRate: 0.3,
    attributes: [
      { name: 'food', efficiency: 0.9 },
    ]
  },
  [ResourceType.GAME]: { 
    max: 200, 
    changeRate: 0.4,
    attributes: [
      { name: 'food', efficiency: 1.2 },
    ]
  },
};

// Resource richness scaling bounds
const MIN_RICHNESS_MULTIPLIER = 0.5; // Minimum resource capacity/amount (at richness=0)
const MAX_RICHNESS_MULTIPLIER = 1.5; // Maximum resource capacity/amount (at richness=1)

/**
 * Create a new resource instance
 */
function createResource(type: ResourceType, random: SeededRandom, resourceRichness: number = 0.5): Resource {
  const props = RESOURCE_PROPERTIES[type];
  // Richness affects initial amount and maximum capacity
  // Scale from 0.5x (sparse) to 1.5x (abundant)
  const richnessMultiplier = MIN_RICHNESS_MULTIPLIER + resourceRichness * (MAX_RICHNESS_MULTIPLIER - MIN_RICHNESS_MULTIPLIER);
  const initial = random.randomFloat(0.3, 0.9) * props.max * richnessMultiplier;
  const maximum = props.max * richnessMultiplier;
  
  return {
    type,
    current: initial,
    maximum: maximum,
    changeRate: props.changeRate,
    attributes: props.attributes,
  };
}

// Maximum multiplier for resource spawn probability
const MAX_PROBABILITY_MULTIPLIER = 2; // Richness can double the base spawn probability

/**
 * Generate resources for all parcels
 * Each parcel can have multiple resources
 */
export function generateResources(parcels: Parcel[], random: SeededRandom, resourceRichness: number = 0.5): void {
  // Scale probabilities based on richness (0 = no resources, 1 = abundant)
  // At richness=0: multiplier=0 (no resources), at richness=1: multiplier=2 (double probability)
  const richnessMultiplier = Math.min(MAX_PROBABILITY_MULTIPLIER, Math.max(0, resourceRichness * MAX_PROBABILITY_MULTIPLIER));
  
  for (const parcel of parcels) {
    const rules = RESOURCE_RULES[parcel.terrain];
    
    // Skip if terrain doesn't support resources or probability check fails
    const adjustedProbability = Math.min(1, rules.probability * richnessMultiplier);
    if (!random.chance(adjustedProbability)) {
      continue;
    }

    // Determine how many resource types this parcel will have (1-3)
    // Higher richness = more resources per parcel
    const multiResourceChance = 0.4 * richnessMultiplier;
    const tripleResourceChance = 0.1 * richnessMultiplier;
    const numResources = random.chance(multiResourceChance) ? 2 : random.chance(tripleResourceChance) ? 3 : 1;
    
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
        parcel.resources.push(createResource(type, random, resourceRichness));
        resourcesAdded.add(type);
      }
    }

    // Special case: add water resource to parcels near water
    if (parcel.terrain === TerrainType.GRASSLAND || parcel.terrain === TerrainType.FOREST) {
      if (parcel.moisture > 0.7 && random.chance(0.5 * richnessMultiplier)) {
        if (!resourcesAdded.has(ResourceType.WATER)) {
          parcel.resources.push(createResource(ResourceType.WATER, random, resourceRichness));
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
