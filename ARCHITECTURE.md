# Civilization - Architecture Documentation

## Overview

The Civilization map generator uses a **separated frontend-backend architecture** with Server-Sent Events (SSE) for real-time communication. This document describes the architecture, design decisions, and communication protocols.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Display Layer                                       │    │
│  │  - MapRenderer (Pixi.js)                            │    │
│  │  - ControlPanel                                      │    │
│  │  - ParcelDetailPanel                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Client Layer                                    │    │
│  │  - REST API calls (commands)                        │    │
│  │  - SSE client (receive updates)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/SSE
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Backend (Node.js/Express)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  REST API Endpoints                                  │    │
│  │  - POST /api/map/generate                           │    │
│  │  - POST /api/simulation/start                       │    │
│  │  - POST /api/simulation/stop                        │    │
│  │  - POST /api/simulation/speed                       │    │
│  │  - GET  /api/events (SSE)                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Game Logic Layer                                    │    │
│  │  - World simulation (resource updates)              │    │
│  │  - Map generation (Voronoi, terrain, resources)    │    │
│  │  - State management                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

### Separation of Concerns

1. **Backend Responsibilities**
   - All game logic and simulation
   - Map generation
   - State management
   - Resource calculations
   - Configuration management

2. **Frontend Responsibilities**
   - Display state received from backend
   - User input collection
   - Visual rendering
   - User interaction handling

### Communication Protocol

#### REST API (Frontend → Backend)

Used for **commands** from frontend to backend:

- `POST /api/map/generate` - Request new map generation
- `POST /api/simulation/start` - Start the simulation
- `POST /api/simulation/stop` - Stop the simulation
- `POST /api/simulation/speed` - Change simulation speed
- `GET /api/map/current` - Get current map state
- `GET /api/health` - Health check

#### Server-Sent Events (Backend → Frontend)

Used for **state updates** from backend to frontend:

- `event: map` - Complete map state (sent on connection and regeneration)
- `event: update` - Incremental parcel updates (sent every 100ms during simulation)
- `event: simulation` - Simulation state changes (isSimulating, speed)

### Data Flow

#### Map Generation Flow

```
Frontend                Backend
   │                      │
   │  POST /api/map/      │
   │    /generate         │
   ├─────────────────────>│
   │                      │ Generate map
   │                      │ (Voronoi, terrain, resources)
   │                      │
   │   SSE: map event     │
   │<─────────────────────┤
   │                      │
   │ Render map           │
   │                      │
```

#### Simulation Flow

```
Frontend                Backend
   │                      │
   │  POST /api/          │
   │    simulation/start  │
   ├─────────────────────>│
   │                      │ Start simulation loop
   │                      │ (every 100ms)
   │                      │
   │   SSE: simulation    │
   │<─────────────────────┤ {isSimulating: true}
   │                      │
   │   SSE: update        │
   │<─────────────────────┤ Parcel updates
   │                      │
   │ Update display       │
   │                      │
   │   SSE: update        │
   │<─────────────────────┤ (continuous)
   │                      │
```

## State Management

### Backend State

The backend maintains the **single source of truth** for all game state:

- `currentMap: WorldMap | null` - The current world state
- `isSimulating: boolean` - Whether simulation is running
- `simulationSpeed: number` - Simulation speed multiplier (0.1-5.0)
- `sseClients: Set<Response>` - Connected SSE clients

### Frontend State

The frontend maintains **display state only**:

- `worldMap: WorldMap | null` - Local copy of map for rendering
- `selectedParcel: Parcel | null` - Currently selected parcel
- `isSimulating: boolean` - Simulation status (from backend)
- `simulationSpeed: number` - Speed setting (from backend)

The frontend **never modifies game logic** - it only displays what the backend sends.

## Simulation Loop

The backend runs a simulation loop when `isSimulating === true`:

```typescript
setInterval(() => {
  const deltaTime = ((now - lastUpdateTime) / 1000) * simulationSpeed;
  simulateWorld(currentMap, deltaTime);
  lastUpdateTime = now;
  
  // Broadcast updates via SSE
  broadcastSSE('update', {
    parcels: Array.from(currentMap.parcels.values()),
    lastUpdate: currentMap.lastUpdate,
  });
}, 100); // Every 100ms
```

**Key points:**
- Updates every 100ms (10 Hz)
- Delta time accounts for simulation speed
- All clients receive updates simultaneously
- Resources regenerate/deplete based on their change rates

## Error Handling

### Backend

- Try-catch blocks around JSON serialization
- Try-catch around SSE message sending
- Try-catch around client cleanup
- Try-catch around initial map generation
- Server continues running even if initial map generation fails

### Frontend

- Error handling for API requests
- Error handling for SSE connection
- Error handling for initial map load
- Loading states prevent race conditions

## Security Considerations

- CORS enabled for development
- No authentication required (single-player game)
- No user input sanitization needed (numeric parameters only)
- SSE connection automatically cleaned up on disconnect
- No SQL injection risk (no database)

## Performance

### Backend

- **Map Generation**: O(n log n) for n parcels, typically 100-200ms for 500 parcels
- **Simulation**: O(n * r) where r is resources per parcel, ~1-2ms per update
- **SSE Broadcasting**: O(c) where c is number of connected clients

### Frontend

- **Rendering**: GPU-accelerated via Pixi.js, 60 FPS
- **SSE Processing**: ~10 updates/second, minimal CPU impact
- **Memory**: ~5-10MB for 500-parcel map

## Deployment Considerations

### Development

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm run dev
```

### Production

```bash
# Build backend
cd server && npm run build

# Build frontend
npm run build

# Run backend
cd server && npm start

# Serve frontend (use any static server)
npx serve -s dist
```

### Environment Variables

- `PORT` - Backend port (default: 3001)
- `VITE_API_URL` - Frontend API URL (default: http://localhost:3001)

## Future Enhancements

Potential improvements while maintaining architecture:

1. **WebSocket upgrade** - Bidirectional communication for multiplayer
2. **State persistence** - Save/load world state
3. **Backend clustering** - Scale across multiple processes
4. **Rate limiting** - Prevent API abuse
5. **Authentication** - Multi-user support
6. **Compression** - Gzip SSE messages for large maps
7. **Delta updates** - Send only changed parcels (currently sending all)

## References

- **Main README**: Project overview and quick start
- **Server README**: Backend API documentation
- **DOCUMENTATION.md**: Technical implementation details
