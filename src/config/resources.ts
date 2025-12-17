/**
 * Default resource configuration
 * This file defines all available resource types and their properties
 */

import type { ResourceConfig } from '../types/resource-config';
import { TerrainType } from '../types/map';

/**
 * Default resource definitions with configurable attributes
 */
export const DEFAULT_RESOURCE_CONFIG: ResourceConfig = {
  definitions: {
    water: {
      id: 'water',
      nameKey: 'water',
      maximum: 1000,
      changeRate: 0,
      consumable: true,
      edible: false,
      energyEfficiency: 0,
      rarity: 0.2,
    },
    wood: {
      id: 'wood',
      nameKey: 'wood',
      maximum: 500,
      changeRate: 0.5,
      consumable: true,
      edible: false,
      energyEfficiency: 0.8,
      rarity: 0.3,
    },
    stone: {
      id: 'stone',
      nameKey: 'stone',
      maximum: 800,
      changeRate: 0,
      consumable: true,
      edible: false,
      energyEfficiency: 0,
      rarity: 0.4,
    },
    iron: {
      id: 'iron',
      nameKey: 'iron',
      maximum: 300,
      changeRate: 0,
      consumable: true,
      edible: false,
      energyEfficiency: 0,
      rarity: 0.6,
    },
    gold: {
      id: 'gold',
      nameKey: 'gold',
      maximum: 150,
      changeRate: 0,
      consumable: false,
      edible: false,
      rarity: 0.8,
    },
    oil: {
      id: 'oil',
      nameKey: 'oil',
      maximum: 400,
      changeRate: 0,
      consumable: true,
      edible: false,
      energyEfficiency: 1.5,
      rarity: 0.7,
    },
    coal: {
      id: 'coal',
      nameKey: 'coal',
      maximum: 600,
      changeRate: 0,
      consumable: true,
      edible: false,
      energyEfficiency: 1.2,
      rarity: 0.5,
    },
    fertile_soil: {
      id: 'fertile_soil',
      nameKey: 'fertile_soil',
      maximum: 100,
      changeRate: 0.2,
      consumable: false,
      edible: false,
      rarity: 0.3,
    },
    fish: {
      id: 'fish',
      nameKey: 'fish',
      maximum: 300,
      changeRate: 0.3,
      consumable: true,
      edible: true,
      satiety: 50,
      energyEfficiency: 0.9,
      rarity: 0.4,
    },
    game: {
      id: 'game',
      nameKey: 'game',
      maximum: 200,
      changeRate: 0.4,
      consumable: true,
      edible: true,
      satiety: 75,
      energyEfficiency: 1.0,
      rarity: 0.5,
    },
  },

  terrainRules: {
    [TerrainType.OCEAN]: {
      resourceIds: ['fish', 'oil'],
      probability: 0.4,
    },
    [TerrainType.SHALLOW_WATER]: {
      resourceIds: ['fish', 'water'],
      probability: 0.5,
    },
    [TerrainType.BEACH]: {
      resourceIds: ['stone'],
      probability: 0.2,
    },
    [TerrainType.GRASSLAND]: {
      resourceIds: ['fertile_soil', 'game', 'stone'],
      probability: 0.6,
    },
    [TerrainType.FOREST]: {
      resourceIds: ['wood', 'game', 'fertile_soil'],
      probability: 0.7,
    },
    [TerrainType.JUNGLE]: {
      resourceIds: ['wood', 'game', 'gold'],
      probability: 0.65,
    },
    [TerrainType.DESERT]: {
      resourceIds: ['oil', 'stone'],
      probability: 0.3,
    },
    [TerrainType.TUNDRA]: {
      resourceIds: ['game', 'iron'],
      probability: 0.35,
    },
    [TerrainType.MOUNTAIN]: {
      resourceIds: ['stone', 'iron', 'gold', 'coal'],
      probability: 0.8,
    },
    [TerrainType.SNOW]: {
      resourceIds: ['water'],
      probability: 0.2,
    },
  },
};
