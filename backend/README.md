# Civilization Backend Server

Backend server for the Civilization simulation with separated front-end and back-end architecture.

## Architecture

The backend implements the following components as specified:

### 1. **Simulation Engine**
- Runs the simulation loop at a fixed speed (adjustable from backend)
- Updates state (plots and resources) automatically
- Speed can be adjusted via API (0.1x to 10x)

### 2. **Map Loader**
- Loads pre-generated maps from the `./maps` directory
- Maps are generated offline using the `map-generator-cli` tool
- Supports loading different maps via API

### 3. **State Manager**
- Manages the current state of the simulation
- Tracks parcels, resources, and entities
- Provides state to SSE broadcaster

### 4. **SSE Broadcaster**
- Sends state updates via Server-Sent Events
- Supports both full-state and delta updates
- Broadcasts at 1-second intervals by default

### 5. **Settings Manager**
- Manages simulation settings (speed, active map, etc.)
- Settings are backend-controlled only
- Frontend cannot modify settings

## Installation

```bash
cd backend
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

- `PORT` - Server port (default: 3001)
- `MAPS_DIR` - Directory containing map files (default: ./maps)

## API Endpoints

### GET /health
Health check endpoint

### GET /events
Server-Sent Events stream for real-time state updates

### GET /api/status
Get current simulation status
```json
{
  "isRunning": boolean,
  "speed": number,
  "settings": {...},
  "clientCount": number,
  "hasMap": boolean
}
```

### POST /api/simulation/start
Start the simulation

### POST /api/simulation/stop
Stop the simulation

### POST /api/simulation/speed
Set simulation speed (backend only)
```json
{
  "speed": 1.5  // 0.1 to 10
}
```

### GET /api/maps
List available maps

### POST /api/maps/load
Load a specific map (backend only)
```json
{
  "mapFile": "default-map.json"
}
```

### GET /api/settings
Get current simulation settings

### GET /api/state
Get current full state (for debugging)

## SSE Message Format

Messages are sent as JSON in the following format:

```json
{
  "type": "full-state" | "delta" | "simulation-started" | "simulation-paused" | "settings-updated",
  "timestamp": 1234567890,
  "data": {...}
}
```

### Message Types

- `full-state` - Complete world state (sent on connect)
- `delta` - Incremental changes to parcels
- `simulation-started` - Simulation has started
- `simulation-paused` - Simulation has paused
- `settings-updated` - Settings have been updated

## Frontend Cannot Control

The following actions are **backend-controlled only**:
- Starting/stopping simulation (via API only)
- Adjusting simulation speed
- Generating maps
- Loading different maps

The frontend is **read-only** and can only:
- Connect to SSE stream
- Render received state
- Select which simulation to view (if multiple)

## Map Generation

Maps must be pre-generated using the `map-generator-cli` tool and placed in the `./maps` directory. See the map-generator-cli README for details.
