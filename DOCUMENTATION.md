# Custom Map Generation System Documentation

## Overview

This system implements a sophisticated procedural map generator with a **separated backend and frontend architecture**. The backend (Go) handles all simulation and map generation logic, while the frontend (React/TypeScript) serves only as a display layer. Communication happens via **Server-Sent Events (SSE)** for real-time updates.

## Architecture

### Technology Stack

#### Backend
- **Go 1.21+**: Server and simulation engine
- **Perlin Noise Library**: Procedural terrain generation
- **HTTP/SSE**: Real-time communication with frontend
- **Standard Library**: HTTP server, JSON encoding

#### Frontend
- **React 19 with TypeScript**: UI display (read-only)
- **Pixi.js 8**: High-performance 2D graphics rendering
- **Vite 7**: Build tool with API proxy support
- **Server-Sent Events**: Real-time updates from backend

### Core Components

#### 1. Backend Server (`main.go`)

**Map Generation**
- Perlin noise-based terrain generation with elevation, moisture, and temperature
- Hexagonal parcel layout with randomized positions
- Neighbor calculation for parcel adjacency
- Terrain type determination based on environmental parameters
- Resource placement based on terrain type

**Simulation Engine**
- 100ms tick rate for resource updates
- Configurable simulation speed (multiplier)
- Real-time resource regeneration/depletion
- Thread-safe world state management with mutex locks

**SSE Communication**
- Real-time world state streaming to all connected clients
- Automatic client connection/disconnection handling
- Efficient JSON serialization of world state
- Simulation state broadcasts (running/paused, speed)

**HTTP API Endpoints**
- `GET /api/sse` - Server-Sent Events stream
- `POST /api/generate` - Generate new map
- `POST /api/toggle-simulation` - Start/stop simulation
- `POST /api/set-speed` - Adjust simulation speed
- `GET /` - Serve static frontend files

#### 2. Frontend (Display Only)

**Data Management** (`src/hooks/useBackend.ts`)
- SSE connection management
- Automatic reconnection on disconnect
- World state synchronization from backend
- API calls for user actions (no local state modification)

**Rendering System** (`src/components/MapRenderer.tsx`)
- Pixi.js Application with WebGL/Canvas fallback
- Polygon rendering using modern Graphics API
- Interactive parcel selection with pointer events
- Color-coded terrain visualization
- Resource indicators as small colored circles
- Efficient render loop with cleanup on unmount

**Control Panel** (`src/components/ControlPanel.tsx`)
- Simulation control buttons (requests sent to backend)
- Speed control slider (updates backend setting)
- Map configuration form (triggers backend generation)
- **Note**: All controls trigger backend API calls, no local state changes

#### 3. User Interface

**Control Panel** (`src/components/ControlPanel.tsx`)
- Simulation start/pause toggle
- Speed control slider (0.1x to 5x)
- Map configuration options
- Regenerate map with custom parameters

**Parcel Detail Panel** (`src/components/ParcelDetailPanel.tsx`)
- Selected parcel information display
- Terrain properties (type, elevation, moisture, temperature)
- Resource list with progress bars
- Current/maximum values and change rates
- Location coordinates and neighbor count

#### 4. Simulation System (`src/hooks/useSimulation.ts`)

- React hook for managing simulation state
- Interval-based resource updates
- Delta time calculation for consistent simulation
- Speed multiplier support

## Data Structures

### Core Types (`src/types/map.ts`)

```typescript
// Terrain types using const assertion for type safety
TerrainType: ocean, shallow_water, beach, grassland, forest, 
             jungle, desert, tundra, mountain, snow

// Resource types
ResourceType: water, wood, stone, iron, gold, oil, coal, 
              fertile_soil, fish, game

// Resource with dynamic properties
Resource {
  type: ResourceType
  current: number        // Current reserve amount
  maximum: number        // Maximum capacity
  changeRate: number     // Positive=regeneration, negative=depletion
}

// Parcel (map cell)
Parcel {
  id: number
  vertices: Point[]      // Polygon boundary points
  center: Point          // Centroid
  terrain: TerrainType
  resources: Resource[]  // Multiple resources supported
  neighbors: number[]    // Adjacent parcel IDs
  elevation: number      // 0-1
  moisture: number       // 0-1
  temperature: number    // 0-1
}

// Boundary between parcels
Boundary {
  parcel1: number
  parcel2: number
  edge: Point[]          // Shared edge vertices
  resources: Resource[]  // Boundary resources
}

// Complete world map
WorldMap {
  parcels: Map<number, Parcel>
  boundaries: Boundary[]
  width: number
  height: number
  lastUpdate: number
}
```

## Key Algorithms

### 1. Voronoi Diagram Generation

1. **Site Generation**: Use Poisson disk sampling approximation for well-spaced initial points
2. **Delaunay Triangulation**: Create triangulation from sites using d3-delaunay
3. **Voronoi Extraction**: Compute dual graph to get Voronoi cells
4. **Lloyd Relaxation**: Apply 2 iterations to create more uniform cells
   - Calculate centroid of each cell
   - Use centroids as new sites
   - Regenerate Voronoi diagram

### 2. Terrain Generation

Uses three noise layers:
- **Elevation**: 6 octaves, modified by distance from center for continent formation
- **Moisture**: 4 octaves, boosted near water bodies
- **Temperature**: 3 octaves, varied by latitude and elevation

Terrain determination logic:
```
if elevation < 0.30: ocean
if elevation < 0.35: shallow_water
if elevation < 0.38: beach
if elevation > 0.75 and temperature < 0.3: snow
if elevation > 0.75: mountain
if temperature < 0.25: tundra
if temperature > 0.7 and moisture < 0.3: desert
if temperature > 0.6 and moisture > 0.6: jungle
if moisture > 0.5: forest
else: grassland
```

### 3. Resource Simulation

Each simulation tick (100ms interval):
```
for each resource:
  current += changeRate * deltaTime * simulationSpeed
  current = clamp(current, 0, maximum)
```

## Resource System Details

### Resource Distribution Rules

Each terrain type has:
- List of possible resource types
- Spawn probability
- Support for 1-3 simultaneous resources per parcel

Examples:
- **Mountains**: Stone, iron, gold, coal (80% spawn chance)
- **Forests**: Wood, game, fertile soil (70% spawn chance)
- **Oceans**: Fish, oil (40% spawn chance)
- **Grasslands**: Fertile soil, game, stone (60% spawn chance)

### Resource Properties

- **Regenerating**: Wood (0.5/s), fertile soil (0.2/s), fish (0.3/s), game (0.4/s)
- **Non-regenerating**: Stone, iron, gold, oil, coal, water (0/s)
- **Maximum capacities**: Range from 100 (fertile soil) to 1000 (water)

## Visual Design

### Terrain Color Palette

- Ocean: Deep blue (#1a5490)
- Shallow Water: Medium blue (#3a7ca8)
- Beach: Sand beige (#f4e7c7)
- Grassland: Bright green (#7ec850)
- Forest: Dark green (#2d6b22)
- Jungle: Very dark green (#1a5018)
- Desert: Sandy yellow (#e8c878)
- Tundra: Gray-blue (#b8c8d0)
- Mountain: Brown (#8b7355)
- Snow: White (#f0f8ff)

### Resource Colors

- Water: Light blue (#4a9eff)
- Wood: Brown (#8b4513)
- Stone: Gray (#808080)
- Iron: Bronze (#b87333)
- Gold: Gold (#ffd700)
- Oil: Black (#1a1a1a)
- Coal: Dark gray (#2f2f2f)
- Fertile Soil: Dark brown (#654321)
- Fish: Cyan (#00bfff)
- Game: Orange-brown (#8b6914)

### Interactive Elements

- **Parcel borders**: Semi-transparent black (0.3 alpha, 0.5px)
- **Selected parcel**: Yellow border (3px, full opacity)
- **Resource indicators**: Small circles (3px radius) around parcel center

## Usage Examples

### Generating a New Map

```typescript
import { generateWorldMap } from './map-generator';

const worldMap = generateWorldMap({
  width: 1200,
  height: 800,
  numParcels: 500,
  seed: 12345, // Optional for reproducibility
});
```

### Running Simulation

```typescript
import { simulateWorld } from './map-generator';

// In a game loop or interval
const deltaTime = 0.1; // seconds since last update
simulateWorld(worldMap, deltaTime);
```

### Customizing Map Parameters

```typescript
// Small, detailed map
generateWorldMap({ width: 800, height: 600, numParcels: 300 });

// Large, sparse map
generateWorldMap({ width: 1600, height: 1200, numParcels: 800 });

// Reproducible map
generateWorldMap({ 
  width: 1200, 
  height: 800, 
  numParcels: 500,
  seed: 98765 
});
```

## Performance Considerations

- **Voronoi Generation**: O(n log n) for n parcels
- **Terrain Generation**: O(n) with noise evaluation
- **Rendering**: GPU-accelerated via WebGL
- **Simulation**: O(n * r) where r is average resources per parcel
- **Typical Performance**: 
  - 500 parcels: ~100-200ms generation time
  - 60 FPS rendering with Pixi.js
  - Simulation updates every 100ms

## Future Enhancement Ideas

1. **Biome Systems**: More complex terrain relationships
2. **Weather Patterns**: Dynamic environmental changes
3. **Resource Depletion**: Consumption mechanics
4. **Path Finding**: Navigation between parcels
5. **Save/Load**: Persist world state
6. **Minimap**: Overview navigation
7. **Zoom/Pan**: Camera controls
8. **Multi-layer Resources**: Underground/surface distinction
9. **Seasonal Changes**: Time-based terrain modifications
10. **Export/Import**: Share map seeds and configurations
