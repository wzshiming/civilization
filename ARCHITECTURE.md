# Architecture Documentation

## Overview

This project implements a **monorepo with separated front-end and back-end architecture** for the Civilization simulation system. All shared logic is extracted into an independent package to eliminate duplication.

## Monorepo Structure

The project uses npm workspaces to manage multiple packages:

- **Root**: Main package.json with all dependencies
- **Workspaces**:
  - `shared` - Common types, utilities, and logic
  - `backend` - Backend server
  - `map-generator-cli` - Map generation CLI tool
  - `frontend` - Frontend application

The frontend lives in the `frontend/` workspace and has **no independent logic** - it only consumes the backend API.

## System Components

### 0. Shared Package (`@civilization/shared`)

**Location:** `/shared/`

**Purpose:** Centralized types, utilities, and map generation logic

**Features:**

- All type definitions (WorldMap, Parcel, Resource, etc.)
- Utility functions (SeededRandom, SimplexNoise)
- Complete map generation logic (Voronoi, terrain, resources)
- Simulation update logic
- No duplication across components

**Exports:**

```typescript
// Types
export * from './types'

// Utilities
export { SeededRandom } from './utils/random'
export { SimplexNoise } from './utils/noise'

// Map Generation
export { generateWorldMap, simulateWorld } from './map-generator/index'
```

**Used By:**

- Backend (for simulation and map loading)
- Map Generator CLI (for map generation)
- NOT used by frontend (frontend has no logic)

### 1. Map Generator (Standalone CLI Tool)

**Location:** `/map-generator-cli/`

**Purpose:** Generate maps offline based on demand parameters

**Features:**

- Command-line interface for map generation
- Configurable parameters (width, height, parcel count, seed)
- Reproducible map generation using seeds
- Saves maps as JSON files for backend consumption
- Displays detailed statistics after generation

**Usage:**

```bash
cd map-generator-cli
npm run dev -- --width 1200 --height 800 --parcels 500 --output my-map.json
```

**Output:** Maps are saved to `./maps/` directory by default

---

### 2. Backend Server

**Location:** `/backend/`

**Purpose:** Run the simulation and broadcast state updates

#### 2.1 Simulation Engine

- **File:** `src/simulation/SimulationEngine.ts`
- **Responsibilities:**
  - Run simulation loop at fixed intervals (100ms tick rate)
  - Update resource states based on simulation speed
  - Speed is adjustable from 0.1x to 10x (backend-controlled only)
- **Control:** Start/stop via API, not controllable from frontend

#### 2.2 Map Loader

- **File:** `src/map-loader/MapLoader.ts`
- **Responsibilities:**
  - Load pre-generated maps from `./maps/` directory
  - Deserialize JSON map files into WorldMap objects
  - Provide map management functions (list, load, save, delete)
- **Usage:** Maps must be generated offline using map-generator-cli

#### 2.3 State Manager

- **File:** `src/state/StateManager.ts`
- **Responsibilities:**
  - Manage current simulation state (parcels, resources)
  - Track changes between states
  - Generate delta updates for efficient broadcasting
- **Provides:** Current state and incremental changes to SSE broadcaster

#### 2.4 SSE Broadcaster

- **File:** `src/sse/SSEBroadcaster.ts`
- **Responsibilities:**
  - Broadcast state updates via Server-Sent Events
  - Support both full-state and delta update modes
  - Manage multiple client connections
  - Send updates at configurable frequency (default: 1 second)
- **Endpoint:** `GET /events`

#### 2.5 Settings Manager

- **File:** `src/settings/SettingsManager.ts`
- **Responsibilities:**
  - Manage simulation settings (speed, active map, etc.)
  - Settings are backend-controlled only
  - Frontend cannot modify these settings
- **Access:** Via API endpoints only

#### 2.6 REST API

- **File:** `src/api/routes.ts`
- **Provides:**
  - `GET /api/status` - Get simulation status
  - `POST /api/simulation/start` - Start simulation
  - `POST /api/simulation/stop` - Stop simulation
  - `POST /api/simulation/speed` - Set speed (backend admin only)
  - `GET /api/maps` - List available maps
  - `POST /api/maps/load` - Load a map (backend admin only)
  - `GET /api/settings` - Get current settings
  - `GET /api/state` - Get full state (debugging)

---

### 3. Frontend Application

**Location:** `/frontend/` (workspace)

**Purpose:** Visualize simulation state in real-time (read-only, API-only)

**Critical:** Frontend has **NO independent logic**. It completely relies on backend API.

#### 3.1 SSE Listener

- **File:** `frontend/src/hooks/useSSE.ts`
- **Responsibilities:**
  - Connect to backend SSE stream
  - Receive and parse state updates
  - Handle full-state and delta updates
  - Maintain connection status
- **Connection:** Auto-connects on mount to configured backend URL

#### 3.2 Renderer

- **File:** `frontend/src/components/MapRenderer.tsx`
- **Responsibilities:**
  - Render simulation state using Pixi.js
  - Display terrain colors and resource indicators
  - Handle parcel selection via click
  - Provide zoom and pan controls
- **Performance:** GPU-accelerated via WebGL

#### 3.3 UI Components

- **File:** `frontend/src/components/ReadOnlyControlPanel.tsx`
- **Responsibilities:**
  - Display connection status
  - Show read-only information
  - Provide reconnect functionality
  - Inform users that control is backend-side
- **Limitations:** Cannot control simulation, speed, or map generation

#### 3.4 Detail Panel

- **File:** `frontend/src/components/ParcelDetailPanel.tsx`
- **Responsibilities:**
  - Show selected parcel information
  - Display terrain type, resources, properties
  - Update in real-time as simulation runs

#### 3.5 What Frontend Does NOT Have

- ❌ No map-generator logic
- ❌ No utils (random, noise)
- ❌ No simulation logic
- ❌ No resource update logic
- ❌ No standalone mode
- ✅ Only SSE connection and rendering
- ✅ Imports types from `@civilization/shared` for SSE messages

---

## Data Flow

```
┌─────────────────────┐
│  Map Generator CLI  │
│  (Offline Tool)     │
└──────────┬──────────┘
           │ Generates
           │ JSON files
           ▼
┌─────────────────────┐
│   Backend Server    │
│                     │
│  ┌──────────────┐   │
│  │ Map Loader   │   │
│  └──────┬───────┘   │
│         │           │
│  ┌──────▼───────┐   │
│  │State Manager │   │
│  └──────┬───────┘   │
│         │           │
│  ┌──────▼───────┐   │
│  │ Simulation   │   │
│  │   Engine     │   │
│  └──────┬───────┘   │
│         │           │
│  ┌──────▼───────┐   │
│  │SSE Broadcaster│  │
│  └──────┬───────┘   │
└─────────┼───────────┘
          │ SSE Stream
          │ (Delta/Full State)
          ▼
┌─────────────────────┐
│  Frontend (React)   │
│                     │
│  ┌──────────────┐   │
│  │ SSE Listener │   │
│  └──────┬───────┘   │
│         │           │
│  ┌──────▼───────┐   │
│  │   Renderer   │   │
│  │  (Pixi.js)   │   │
│  └──────────────┘   │
└─────────────────────┘
```

## Communication Protocol

### Server-Sent Events (SSE)

**Endpoint:** `GET /events`

**Message Format:**

```json
{
  "type": "full-state" | "delta" | "simulation-started" | "simulation-paused" | "settings-updated",
  "timestamp": 1234567890,
  "data": { ... }
}
```

**Message Types:**

1. **full-state** - Complete world state
   - Sent on initial connection
   - Contains all parcels, boundaries, dimensions
   - Used to initialize frontend

2. **delta** - Incremental changes
   - Sent periodically (default: 1 second)
   - Contains only changed parcels
   - Reduces bandwidth usage

3. **simulation-started** - Simulation state change
   - Notification that simulation has started

4. **simulation-paused** - Simulation state change
   - Notification that simulation has paused

5. **settings-updated** - Settings change
   - Notification that settings have changed

### REST API

All endpoints return JSON responses:

```json
{
  "success": true | false,
  "message": "...",
  "data": { ... },
  "error": "..."
}
```

## Frontend Cannot Control

As per requirements, the frontend is **read-only** and cannot:

- ❌ Start or stop simulation
- ❌ Adjust simulation speed
- ❌ Generate new maps
- ❌ Load different maps
- ❌ Modify any simulation settings

The frontend can only:

- ✅ Connect to SSE stream
- ✅ Render received state
- ✅ Select parcels to view details
- ✅ View connection status
- ✅ Reconnect if connection lost

## Backend Control

All simulation control is done via the backend:

1. **Via API** - For programmatic control
   - Use curl, Postman, or custom tools
   - Suitable for automation and scripting

2. **Via Server Console** - For manual control
   - Settings can be modified in settings manager
   - Simulation can be started/stopped programmatically

3. **Multiple Simulations** - Future enhancement
   - Backend could support multiple simulations with different settings
   - Frontend could select which simulation to view

## Environment Configuration

### Frontend (.env)

```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (backend/.env)

```env
PORT=3001
MAPS_DIR=./maps
```

## Running the System

### Installation (One Time)

```bash
# Install all dependencies (monorepo)
npm install
```

This single command:

- Installs all root dependencies
- Installs workspace dependencies (shared, backend, map-generator-cli)
- Builds the shared package automatically (postinstall hook)

### Development Mode

**Terminal 1 - Generate a map:**

```bash
cd map-generator-cli
npm run dev
# Copy map: cp maps/default-map.json ../backend/maps/
```

**Terminal 2 - Start backend:**

```bash
cd backend
npm run dev
```

**Terminal 3 - Start frontend:**

```bash
# From root directory
npm run dev:frontend
```

### Production Mode

**Generate map:**

```bash
cd map-generator-cli
npm run build
node dist/index.js
```

**Start backend:**

```bash
cd backend
npm run build
npm start
```

**Build and serve frontend:**

```bash
npm run build
npm run preview
```

## Design Decisions

### Why SSE instead of WebSockets?

- **Unidirectional:** Frontend only receives, never sends (perfect for read-only)
- **Simpler:** Built-in HTTP protocol, no need for separate WebSocket server
- **Reconnection:** Automatic reconnection handling in browsers
- **HTTP/2 Compatible:** Works well with modern HTTP infrastructure

### Why Separate Map Generator?

- **Performance:** Map generation is CPU-intensive, keep it offline
- **Reproducibility:** Maps can be versioned and shared
- **Deterministic:** Same seed always generates same map
- **Backend Simplicity:** Backend only loads, doesn't generate

### Why Backend-Controlled Speed?

- **Consistency:** All clients see same simulation speed
- **Server Authority:** Server controls timing, not influenced by client performance
- **Fair Play:** Prevents clients from "speeding up" their view
- **Resource Management:** Server can manage its own load

## Security Considerations

1. **No Frontend Control** - Frontend cannot manipulate simulation
2. **API Authentication** - Consider adding auth for production
3. **Rate Limiting** - Protect API endpoints from abuse
4. **CORS Configuration** - Properly configure allowed origins
5. **Input Validation** - Validate all API inputs

## Future Enhancements

1. **Multiple Simulations** - Support running multiple simulations
2. **Authentication** - Add user authentication for API control
3. **WebSocket Option** - Alternative to SSE for bidirectional needs
4. **Admin Panel** - Web UI for backend control
5. **Metrics Dashboard** - Monitor simulation performance
6. **Save/Load State** - Persist simulation state
7. **Replay System** - Record and replay simulations

## Troubleshooting

### Backend won't start

- Check if port 3001 is available
- Ensure maps directory exists and has at least one map file
- Verify dependencies are installed: `npm install`

### Frontend can't connect

- Check `VITE_BACKEND_URL` in `.env`
- Verify backend is running: `curl http://localhost:3001/health`
- Check browser console for connection errors

### No state updates

- Verify simulation is started: `GET /api/status`
- Start simulation: `POST /api/simulation/start`
- Check SSE connection: `curl -N http://localhost:3001/events`

### Map generation fails

- Verify parameters are valid (positive numbers)
- Check disk space for output directory
- Ensure output directory exists or can be created
