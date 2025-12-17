# Resource System Documentation

## Overview

The resource system in Civilization has been refactored to support configurable and extensible resource types. Resources are no longer hardcoded and can have various custom attributes.

## Resource Configuration

### Resource Definition

Each resource is defined using the `ResourceDefinition` interface:

```typescript
interface ResourceDefinition {
  id: string;                    // Unique identifier
  nameKey: string;               // i18n translation key
  maximum: number;               // Max amount that can exist
  changeRate: number;            // Regeneration/depletion rate per time unit
  consumable: boolean;           // Can be consumed
  edible: boolean;               // Can be eaten (food)
  satiety?: number;              // Satiety value when eaten
  energyEfficiency?: number;     // Energy conversion ratio
  rarity?: number;               // Rarity score (0-1)
  customAttributes?: Record<string, unknown>; // Custom properties
}
```

### Terrain Resource Rules

Each terrain type has rules for which resources can spawn:

```typescript
interface TerrainResourceRule {
  resourceIds: string[];    // Available resource types
  probability: number;      // Spawn probability (0-1)
}
```

## Adding Custom Resources

### Step 1: Define Your Resource

Edit `/src/config/resources.ts` and add your custom resource to the `definitions` object:

```typescript
export const DEFAULT_RESOURCE_CONFIG: ResourceConfig = {
  definitions: {
    // ... existing resources ...
    
    // Example: Add a new fruit resource
    fruit: {
      id: 'fruit',
      nameKey: 'fruit',
      maximum: 250,
      changeRate: 0.6,       // Grows back fairly quickly
      consumable: true,
      edible: true,
      satiety: 40,           // Provides moderate satiety
      energyEfficiency: 0.7,
      rarity: 0.3,
      customAttributes: {
        // Add any custom properties you need
        vitamins: true,
        spoilageRate: 0.1
      }
    },
  },
  // ...
};
```

### Step 2: Configure Terrain Rules

Add your resource to the appropriate terrain types:

```typescript
terrainRules: {
  [TerrainType.FOREST]: {
    resourceIds: ['wood', 'game', 'fertile_soil', 'fruit'], // Add 'fruit' here
    probability: 0.7,
  },
  // ...
}
```

### Step 3: Add Translation

Add translations for your resource in the locale files:

**`/src/i18n/locales/en.ts`:**
```typescript
resourceTypes: {
  // ... existing types ...
  fruit: 'Fruit',
}
```

**`/src/i18n/locales/zh-CN.ts`:**
```typescript
resourceTypes: {
  // ... existing types ...
  fruit: '水果',
}
```

## Resource Attributes

### Built-in Attributes

- **edible**: Indicates the resource can be eaten
  - If `true`, the resource appears with a 🍴 icon in the UI
  - Should have a `satiety` value

- **consumable**: Indicates the resource can be consumed for energy/crafting
  - If `true`, the resource appears with a ⚡ icon in the UI
  - Can have an `energyEfficiency` value

- **satiety**: How much hunger/satiety this food provides
  - Only relevant for edible resources
  - Higher values = more filling

- **energyEfficiency**: Efficiency ratio when consumed for energy
  - Values > 1 = more efficient energy source
  - Values < 1 = less efficient

- **rarity**: Rarity score (0-1)
  - Higher values = more rare
  - Can be used for game balancing

### Custom Attributes

Use the `customAttributes` object to add any additional properties:

```typescript
customAttributes: {
  durability: 100,
  weight: 5.0,
  quality: 'high',
  craftingTime: 30,
  // ... any other properties you need
}
```

## Using Custom Configuration

To replace the default configuration at runtime:

```typescript
import { setResourceConfig } from './map-generator/resources';
import type { ResourceConfig } from './types/resource-config';

const customConfig: ResourceConfig = {
  definitions: {
    // Your custom resource definitions
  },
  terrainRules: {
    // Your custom terrain rules
  }
};

// Apply the custom configuration
setResourceConfig(customConfig);

// Generate the world map (will use custom config)
const worldMap = generateWorldMap(config);
```

## Examples

### Example 1: High-Energy Fuel

```typescript
uranium: {
  id: 'uranium',
  nameKey: 'uranium',
  maximum: 100,
  changeRate: 0,
  consumable: true,
  edible: false,
  energyEfficiency: 10.0,  // Very efficient!
  rarity: 0.95,            // Very rare
  customAttributes: {
    radioactive: true,
    halfLife: 4500000000
  }
}
```

### Example 2: Luxury Food

```typescript
truffle: {
  id: 'truffle',
  nameKey: 'truffle',
  maximum: 50,
  changeRate: 0.1,         // Grows very slowly
  consumable: true,
  edible: true,
  satiety: 30,
  energyEfficiency: 0.8,
  rarity: 0.9,             // Very rare
  customAttributes: {
    luxury: true,
    value: 1000
  }
}
```

### Example 3: Building Material

```typescript
marble: {
  id: 'marble',
  nameKey: 'marble',
  maximum: 400,
  changeRate: 0,
  consumable: true,
  edible: false,
  rarity: 0.7,
  customAttributes: {
    buildingQuality: 'excellent',
    durability: 500,
    beautyBonus: 10
  }
}
```

## Best Practices

1. **Balance resource attributes** - Consider how resources interact with each other
2. **Use appropriate rarity values** - Rare resources should have useful properties
3. **Set realistic change rates** - Renewable resources should regenerate at balanced rates
4. **Add meaningful custom attributes** - Use `customAttributes` for game-specific logic
5. **Update all locale files** - Ensure translations exist for all languages
6. **Test terrain rules** - Verify resources spawn in appropriate terrain types

## Future Extensions

The resource system is designed to be extended. Potential future additions:

- Resource combinations/crafting recipes
- Dynamic resource mutation based on conditions
- Resource quality tiers
- Resource transportation costs
- Season-based resource availability
- Biome-specific resource variants
