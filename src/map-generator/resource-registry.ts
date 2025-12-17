/**
 * Resource registry and configuration system
 * This centralizes all resource definitions and allows easy addition of new resources
 */

import type { ResourceDefinition, ResourceType } from '../types/map';

/**
 * Default resource types (for backwards compatibility)
 */
export const DEFAULT_RESOURCE_TYPES = {
  WATER: 'water',
  WOOD: 'wood',
  STONE: 'stone',
  IRON: 'iron',
  GOLD: 'gold',
  OIL: 'oil',
  COAL: 'coal',
  FERTILE_SOIL: 'fertile_soil',
  FISH: 'fish',
  GAME: 'game',
} as const;

/**
 * Default resource definitions
 */
const DEFAULT_RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  {
    id: 'water',
    nameKey: 'water',
    attributes: {
      consumable: true,
      storable: true,
      edible: true, // drinking
    },
    maximum: 1000,
    changeRate: 0,
    color: '#4a9eff',
  },
  {
    id: 'wood',
    nameKey: 'wood',
    attributes: {
      consumable: true,
      renewable: true,
      tradeable: true,
      storable: true,
      energy: true,
    },
    maximum: 500,
    changeRate: 0.5,
    color: '#8b4513',
  },
  {
    id: 'stone',
    nameKey: 'stone',
    attributes: {
      consumable: true,
      tradeable: true,
      storable: true,
    },
    maximum: 800,
    changeRate: 0,
    color: '#808080',
  },
  {
    id: 'iron',
    nameKey: 'iron',
    attributes: {
      consumable: true,
      tradeable: true,
      strategic: true,
      storable: true,
    },
    maximum: 300,
    changeRate: 0,
    color: '#b87333',
  },
  {
    id: 'gold',
    nameKey: 'gold',
    attributes: {
      tradeable: true,
      luxury: true,
      storable: true,
    },
    maximum: 150,
    changeRate: 0,
    color: '#ffd700',
  },
  {
    id: 'oil',
    nameKey: 'oil',
    attributes: {
      consumable: true,
      tradeable: true,
      strategic: true,
      storable: true,
      energy: true,
    },
    maximum: 400,
    changeRate: 0,
    color: '#1a1a1a',
  },
  {
    id: 'coal',
    nameKey: 'coal',
    attributes: {
      consumable: true,
      tradeable: true,
      storable: true,
      energy: true,
    },
    maximum: 600,
    changeRate: 0,
    color: '#2f2f2f',
  },
  {
    id: 'fertile_soil',
    nameKey: 'fertile_soil',
    attributes: {
      renewable: true,
      storable: false,
    },
    maximum: 100,
    changeRate: 0.2,
    color: '#654321',
  },
  {
    id: 'fish',
    nameKey: 'fish',
    attributes: {
      edible: true,
      consumable: true,
      renewable: true,
      tradeable: true,
      storable: true,
    },
    maximum: 300,
    changeRate: 0.3,
    color: '#00bfff',
  },
  {
    id: 'game',
    nameKey: 'game',
    attributes: {
      edible: true,
      consumable: true,
      renewable: true,
      tradeable: true,
      storable: true,
    },
    maximum: 200,
    changeRate: 0.4,
    color: '#8b6914',
  },
];

/**
 * Resource registry class
 * Manages all resource definitions in the game
 */
export class ResourceRegistry {
  private definitions: Map<ResourceType, ResourceDefinition>;

  constructor(initialDefinitions: ResourceDefinition[] = DEFAULT_RESOURCE_DEFINITIONS) {
    this.definitions = new Map();
    initialDefinitions.forEach(def => this.register(def));
  }

  /**
   * Register a new resource type
   */
  register(definition: ResourceDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  /**
   * Unregister a resource type
   */
  unregister(id: ResourceType): boolean {
    return this.definitions.delete(id);
  }

  /**
   * Get a resource definition by ID
   */
  get(id: ResourceType): ResourceDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Check if a resource type is registered
   */
  has(id: ResourceType): boolean {
    return this.definitions.has(id);
  }

  /**
   * Get all registered resource types
   */
  getAllTypes(): ResourceType[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get all resource definitions
   */
  getAllDefinitions(): ResourceDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get resources where the specified attribute is true
   */
  getResourcesWithAttribute(attribute: keyof ResourceDefinition['attributes']): ResourceDefinition[] {
    return this.getAllDefinitions().filter(def => def.attributes[attribute] === true);
  }

  /**
   * Get edible resources
   */
  getEdibleResources(): ResourceDefinition[] {
    return this.getResourcesWithAttribute('edible');
  }

  /**
   * Get renewable resources
   */
  getRenewableResources(): ResourceDefinition[] {
    return this.getResourcesWithAttribute('renewable');
  }

  /**
   * Get strategic resources
   */
  getStrategicResources(): ResourceDefinition[] {
    return this.getResourcesWithAttribute('strategic');
  }

  /**
   * Get luxury resources
   */
  getLuxuryResources(): ResourceDefinition[] {
    return this.getResourcesWithAttribute('luxury');
  }
}

/**
 * Global resource registry instance
 */
export const globalResourceRegistry = new ResourceRegistry();

/**
 * Helper function to get resource definition
 */
export function getResourceDefinition(type: ResourceType): ResourceDefinition | undefined {
  return globalResourceRegistry.get(type);
}

/**
 * Helper function to register a new resource type
 */
export function registerResource(definition: ResourceDefinition): void {
  globalResourceRegistry.register(definition);
}
