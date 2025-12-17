/**
 * Example: Using custom resources
 * This example demonstrates how to create and use custom resource types
 */

import { setResourceConfig } from '../src/map-generator/resources';
import { generateWorldMap } from '../src/map-generator';
import { TerrainType } from '../src/types/map';
import type { ResourceConfig } from '../src/types/resource-config';

/**
 * IMPORTANT: This is a simplified example for demonstration purposes.
 * In a production application, you would need to:
 * 1. Define ALL resources needed (or copy from DEFAULT_RESOURCE_CONFIG)
 * 2. Configure ALL terrain types with appropriate resource IDs
 * 3. Add translations for any new resource types
 * 
 * An incomplete configuration will result in missing resources in the game.
 */

// Define a custom resource configuration
const customResourceConfig: ResourceConfig = {
  definitions: {
    // Example 1: A new food resource - Berries
    berries: {
      id: 'berries',
      nameKey: 'berries',
      maximum: 150,
      changeRate: 0.8, // Grows back quickly
      consumable: true,
      edible: true,
      satiety: 30, // Lower satiety than game
      energyEfficiency: 0.5,
      rarity: 0.2,
      customAttributes: {
        seasonal: true,
        vitamins: 'high'
      }
    },
    
    // Example 2: A luxury resource - Gems
    gems: {
      id: 'gems',
      nameKey: 'gems',
      maximum: 50,
      changeRate: 0,
      consumable: false,
      edible: false,
      rarity: 0.95, // Very rare
      customAttributes: {
        luxury: true,
        tradeValue: 500
      }
    },
    
    // Example 3: Advanced fuel - Uranium
    uranium: {
      id: 'uranium',
      nameKey: 'uranium',
      maximum: 100,
      changeRate: 0,
      consumable: true,
      edible: false,
      energyEfficiency: 10.0, // Extremely efficient
      rarity: 0.98, // Extremely rare
      customAttributes: {
        radioactive: true,
        requires_technology: 'nuclear_power',
        danger_level: 'high'
      }
    },
    
    // NOTE: This is a partial example. In a real implementation, you would
    // include all default resources from DEFAULT_RESOURCE_CONFIG or define
    // a complete set of resources for all terrain types
  },
  
  terrainRules: {
    [TerrainType.FOREST]: {
      resourceIds: ['wood', 'berries'], // Forests have berries
      probability: 0.75,
    },
    [TerrainType.MOUNTAIN]: {
      resourceIds: ['stone', 'iron', 'gems', 'uranium'], // Mountains have rare resources
      probability: 0.85,
    },
    // Other terrain types would need their resource definitions too
    // NOTE: Empty arrays mean no resources will spawn in these terrains
    // In a complete implementation, you would define appropriate resources
    // for each terrain type or copy from DEFAULT_RESOURCE_CONFIG
    [TerrainType.GRASSLAND]: {
      resourceIds: [], // Should include appropriate resources
      probability: 0.5,
    },
    [TerrainType.OCEAN]: {
      resourceIds: [], // Should include fish, oil, etc.
      probability: 0.3,
    },
    [TerrainType.SHALLOW_WATER]: {
      resourceIds: [], // Should include fish, water, etc.
      probability: 0.4,
    },
    [TerrainType.BEACH]: {
      resourceIds: [], // Should include stone, etc.
      probability: 0.2,
    },
    [TerrainType.JUNGLE]: {
      resourceIds: [], // Should include wood, game, etc.
      probability: 0.6,
    },
    [TerrainType.DESERT]: {
      resourceIds: [], // Should include oil, stone, etc.
      probability: 0.3,
    },
    [TerrainType.TUNDRA]: {
      resourceIds: [], // Should include game, iron, etc.
      probability: 0.3,
    },
    [TerrainType.SNOW]: {
      resourceIds: [], // Should include water, etc.
      probability: 0.2,
    },
  },
};

// Example usage
export function generateWorldWithCustomResources() {
  // Set the custom resource configuration
  setResourceConfig(customResourceConfig);
  
  // Generate the world map with custom resources
  const worldMap = generateWorldMap({
    width: 1280,
    height: 720,
    numParcels: 500,
    seed: 12345,
  });
  
  console.log('World generated with custom resources!');
  
  // Find parcels with custom resources
  worldMap.parcels.forEach((parcel) => {
    const customResources = parcel.resources.filter(r => 
      ['berries', 'gems', 'uranium'].includes(r.type)
    );
    
    if (customResources.length > 0) {
      console.log(`Parcel #${parcel.id} has custom resources:`, 
        customResources.map(r => r.type).join(', '));
    }
  });
  
  return worldMap;
}

// Example: Using resource attributes for gameplay logic
export function canEatResource(resourceType: string, resourceConfig: ResourceConfig): boolean {
  const definition = resourceConfig.definitions[resourceType];
  return definition?.edible === true;
}

export function getResourceSatiety(resourceType: string, resourceConfig: ResourceConfig): number {
  const definition = resourceConfig.definitions[resourceType];
  return definition?.satiety ?? 0;
}

export function getEnergyFromResource(resourceType: string, amount: number, resourceConfig: ResourceConfig): number {
  const definition = resourceConfig.definitions[resourceType];
  if (!definition?.consumable) return 0;
  
  const efficiency = definition.energyEfficiency ?? 1.0;
  return amount * efficiency;
}
