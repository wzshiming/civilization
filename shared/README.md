# @civilization/shared

Shared package containing common types, utilities, and map generation logic for the Civilization simulation system.

## Purpose

This package eliminates code duplication across the backend, map-generator-cli, and any future components by centralizing all shared logic in one place.

## Contents

### Types (`src/types.ts`)
- `WorldMap` - Complete world map structure
- `Parcel` - Map cell/parcel
- `Resource` - Resource with properties
- `Boundary` - Boundary between parcels
- `TerrainType` - All terrain types
- `ResourceType` - All resource types
- `MapConfig` - Map generation configuration
- `SimulationSettings` - Simulation settings
- `SSEMessage` - Server-Sent Events message structure
- And more...

### Utilities

**Random Number Generation (`src/utils/random.ts`)**
- `SeededRandom` class for reproducible random generation
- Used for deterministic map generation

**Noise Generation (`src/utils/noise.ts`)**
- `SimplexNoise` class for terrain generation
- Multi-octave noise for realistic elevation, moisture, temperature

### Map Generation (`src/map-generator/`)

**Voronoi Generation (`voronoi.ts`)**
- Delaunay triangulation
- Lloyd's relaxation for uniform cells
- Toroidal wrapping support

**Terrain Generation (`terrain.ts`)**
- Multi-octave Simplex noise
- Distance-from-center calculation for continents
- Terrain type determination based on elevation, moisture, temperature

**Resource Generation (`resources.ts`)**
- Terrain-specific resource spawn rules
- Multiple resources per parcel (1-3)
- Dynamic resource properties (regeneration/depletion)

**Main Orchestrator (`index.ts`)**
- `generateWorldMap(config)` - Generate complete world map
- `simulateWorld(worldMap, deltaTime)` - Update simulation state

## Usage

### In Backend

```typescript
import { 
  generateWorldMap, 
  simulateWorld,
  type WorldMap, 
  type Parcel 
} from '@civilization/shared';

// Load or generate map
const worldMap = generateWorldMap({
  width: 1200,
  height: 800,
  numParcels: 500,
  seed: 12345
});

// Update simulation
simulateWorld(worldMap, deltaTime);
```

### In Map Generator CLI

```typescript
import { 
  generateWorldMap,
  type MapConfig,
  type SerializableWorldMap 
} from '@civilization/shared';

const config: MapConfig = {
  width: 1200,
  height: 800,
  numParcels: 500,
  seed: 42
};

const worldMap = generateWorldMap(config);
```

## Building

```bash
npm run build
```

Compiles TypeScript to `dist/` with type declarations.

## Development

```bash
npm run watch
```

Watches for changes and rebuilds automatically.

## Dependencies

- `d3-delaunay` - For Voronoi diagram generation

## Integration

This package is automatically linked to other workspace packages via npm workspaces. When you run `npm install` at the root, this package is built and linked to `backend` and `map-generator-cli`.

## Design Principles

1. **No External Dependencies** (except d3-delaunay)
2. **Pure Functions** - No side effects
3. **Type Safety** - Full TypeScript coverage
4. **Deterministic** - Same seed = same map
5. **Immutability-Friendly** - Can be used immutably or mutably

## Not Included in This Package

- Express server logic (backend only)
- SSE broadcasting (backend only)
- CLI argument parsing (map-generator-cli only)
- React components (frontend only)
- Pixi.js rendering (frontend only)

This package only contains the **pure logic** that is shared across components.
