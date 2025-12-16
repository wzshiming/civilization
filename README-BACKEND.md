# Backend/Frontend Separation Architecture

This application now uses a **Go backend** for all simulation and map generation logic, with the frontend serving only as a display layer. Communication happens via **Server-Sent Events (SSE)**.

## Architecture Overview

```
┌─────────────────┐         SSE Stream          ┌─────────────────┐
│                 │ ◄──────────────────────────  │                 │
│   Frontend      │                              │   Go Backend    │
│   (React/TS)    │  ──────────────────────────► │   (Simulation)  │
│   Display Only  │         HTTP POST            │                 │
└─────────────────┘                              └─────────────────┘
```

### Backend (Go)
- **Port:** 8080
- **Responsibilities:**
  - World map generation using Perlin noise
  - All simulation logic and resource updates
  - Real-time state broadcasting via SSE
  - Configuration management (speed, parcels, etc.)
- **Endpoints:**
  - `GET /api/sse` - Server-Sent Events stream for world updates
  - `POST /api/generate` - Generate new map (backend decides parameters)
  - `POST /api/toggle-simulation` - Start/stop simulation
  - `POST /api/set-speed` - Adjust simulation speed
  - `GET /` - Serves static frontend files

### Frontend (React + TypeScript)
- **Port:** 5173 (dev), served by backend in production
- **Responsibilities:**
  - Display world map using Pixi.js
  - Show parcel details when clicked
  - Request actions from backend (cannot control directly)
- **Constraints:**
  - **Cannot** generate maps locally
  - **Cannot** adjust simulation speed locally
  - **Cannot** modify world state
  - **Read-only** display of backend state

## Running the Application

### Development Mode

#### Option 1: Separate terminals (recommended for development)

Terminal 1 - Start the backend:
```bash
npm run dev:backend
# or
go run main.go
```

Terminal 2 - Start the frontend:
```bash
npm run dev
```

The frontend dev server (Vite) will proxy `/api/*` requests to the backend at `localhost:8080`.

#### Option 2: Production build

Build everything:
```bash
npm run build
```

Run the server (serves both API and static files):
```bash
./civilization-server
# or
npm start
```

Visit `http://localhost:8080` to see the application.

## How It Works

1. **Backend starts** and generates an initial world map
2. **Frontend connects** to `GET /api/sse` 
3. **Backend streams** initial world state and simulation state via SSE
4. **User interactions** (clicking Start, changing settings) send POST requests to backend
5. **Backend updates** world state and broadcasts changes via SSE to all connected clients
6. **Frontend receives** updates and re-renders the map

### SSE Message Types

```typescript
// World state update
{
  "type": "world_update",
  "world": {
    "parcels": { ... },
    "width": 1200,
    "height": 800,
    "lastUpdate": 1234567890
  }
}

// Simulation state update
{
  "type": "simulation_state",
  "isSimulating": true,
  "speed": 1.5
}
```

## Building

### Frontend Only
```bash
npm run build:frontend
```
Outputs to `dist/` directory.

### Backend Only
```bash
npm run build:backend
```
Outputs to `civilization-server` binary.

### Full Build
```bash
npm run build
```
Builds both frontend and backend.

## Technology Stack

### Backend
- **Go 1.21+**
- **github.com/aquilax/go-perlin** - Perlin noise generation
- Standard library HTTP server with SSE support

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Pixi.js 8** - High-performance rendering
- **Vite 7** - Build tool with dev server and API proxying

## Key Differences from Previous Version

| Aspect | Before | After |
|--------|--------|-------|
| Map Generation | Frontend (TypeScript) | Backend (Go) |
| Simulation | Frontend (React hooks) | Backend (Go goroutines) |
| Speed Control | Frontend state | Backend controlled |
| Communication | N/A (all local) | SSE + REST API |
| Frontend Role | Full control | Display only |
| State Management | React useState | Backend state + SSE sync |

## Configuration

The backend can be configured with command-line flags:

```bash
./civilization-server -port 3000
```

Default port is `8080`.

## Benefits of This Architecture

1. ✅ **Centralized Simulation** - Single source of truth for world state
2. ✅ **Multi-client Ready** - Multiple browsers can view the same simulation
3. ✅ **Backend Performance** - Go is faster than JavaScript for simulation
4. ✅ **Frontend Simplicity** - No complex state management needed
5. ✅ **Clear Separation** - Backend logic isolated from presentation
6. ✅ **Scalability** - Easy to add more backend instances or database persistence

## Frontend Restrictions

As per requirements, the frontend **cannot**:
- ❌ Generate maps (must request from backend)
- ❌ Adjust simulation speed directly (must request from backend)
- ❌ Modify world state
- ❌ Run simulations locally

The frontend **can only**:
- ✅ Display the world map
- ✅ Show parcel details
- ✅ Request actions from backend (Start/Stop/Generate)
- ✅ Navigate and zoom the map

## Troubleshooting

**Frontend shows "Connection to server lost"**
- Ensure backend is running on port 8080
- Check browser console for connection errors

**Map doesn't update**
- Check if simulation is started (backend controls this)
- Verify SSE connection in browser DevTools → Network tab

**Build fails**
- Ensure Go 1.21+ is installed: `go version`
- Ensure Node.js 18+ is installed: `node --version`
- Run `npm install` to install dependencies
- Run `go mod tidy` to download Go dependencies
