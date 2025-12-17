# Civilization - Procedural Map Simulation

A sophisticated simulation system featuring dynamic terrain, resource simulation, and interactive visualization with separated front-end and back-end architecture.

![Map Example](https://github.com/user-attachments/assets/5ad7c5c7-e213-4c2d-97ec-05800a932aa4)

## Architecture

This project uses a **monorepo structure with separated front-end and back-end architecture**:

### Components

**Shared Package (`@civilization/shared`)**
- Common types, utilities, and map generation logic
- Used by all components (no duplication)
- Exports: types, SeededRandom, SimplexNoise, generateWorldMap, simulateWorld

**Map Generator (Standalone CLI Tool)**
- Generate maps offline with custom parameters
- Uses shared package for generation logic
- Save maps to files for backend loading
- Reproducible map generation using seeds

**Backend Server (Node.js/TypeScript)**
- **Simulation Engine**: Runs simulation loop at fixed/adjustable speed
- **Map Loader**: Loads pre-generated maps from files
- **State Manager**: Manages simulation state (parcels, resources)
- **SSE Broadcaster**: Sends state updates via Server-Sent Events
- **Settings Manager**: Backend-controlled simulation settings
- **REST API**: Backend administration endpoints
- Uses shared package for types and logic

**Frontend (React/TypeScript)**
- **SSE Listener**: Connects to backend SSE stream
- **Renderer**: Visualizes simulation state with Pixi.js
- **Read-only UI**: Cannot control simulation or generate maps
- **Interactive**: Click parcels to view details
- **No independent logic**: Completely relies on backend API

## Features

### 🗺️ Procedural Map Generation
- **Offline generation** - Maps generated using CLI tool
- **Voronoi-based irregular parcels** - Organic-shaped regions using Delaunay triangulation
- **Diverse terrain types** - Oceans, islands, continents, mountains, deserts, forests, tundra
- **Realistic terrain** - Multi-octave noise functions for elevation, moisture, temperature

### 💎 Advanced Resource System
- **Multiple resources per parcel** - Each parcel can contain 1-3 simultaneous resources
- **10+ resource types** - Water, wood, stone, iron, gold, oil, coal, fertile soil, fish, game
- **Dynamic properties** - Current reserve, maximum capacity, regeneration/depletion rates

### 🎮 Interactive Visualization
- **High-performance rendering** - Pixi.js GPU-accelerated graphics for smooth 60 FPS
- **Color-coded terrain** - Clear visual distinction between terrain types
- **Resource indicators** - Small colored dots show resource presence
- **Click interaction** - Select parcels to view detailed information

### ⚡ Real-time Simulation
- **Backend-controlled** - Simulation runs on server at fixed speed
- **SSE updates** - Real-time state updates via Server-Sent Events
- **Delta updates** - Efficient incremental state changes
- **Live visualization** - Watch resources change in real-time

### 🎨 Modern UI
- **React-based interface** - Clean, responsive design
- **Read-only controls** - View simulation status
- **Detail panel** - View parcel terrain, resources, and location data
- **Connection status** - Real-time backend connection indicator

## Screenshots

| Map Overview | Parcel Details | Map Configuration |
|--------------|----------------|-------------------|
| ![Overview](https://github.com/user-attachments/assets/5ad7c5c7-e213-4c2d-97ec-05800a932aa4) | ![Details](https://github.com/user-attachments/assets/e53f55a8-0afb-4548-a02e-1bfb8de6c03a) | ![Config](https://github.com/user-attachments/assets/a261d590-3527-44e8-8071-4852b9e81e79) |

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

**Single command installs all workspace dependencies:**
```bash
npm install
```

This will:
- Install all dependencies for frontend, backend, map-generator-cli, and shared package
- Build the shared package automatically (via postinstall hook)
- Link workspace dependencies

### Quick Start

1. **Generate a map:**
```bash
cd map-generator-cli
npm run dev
cd ..
```

This creates `map-generator-cli/maps/default-map.json`. Copy it to backend:
```bash
cp map-generator-cli/maps/default-map.json backend/maps/
```

2. **Start the backend server:**
```bash
cd backend
npm run dev
```

Backend runs at [http://localhost:3001](http://localhost:3001)

3. **Start the frontend (in a new terminal):**

Create `.env` file in frontend directory:
```bash
echo "VITE_BACKEND_URL=http://localhost:3001" > frontend/.env
```

Start frontend:
```bash
npm run dev:frontend
```

Frontend runs at [http://localhost:5173](http://localhost:5173)

### Environment Configuration

Create `.env` files from examples:

**Frontend** (`frontend/.env`):
```
VITE_BACKEND_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```
PORT=3001
MAPS_DIR=./maps
```

### Production Build

**Frontend:**
```bash
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
npm run build
npm start
```

## Usage

### Generating Maps

Use the map generator CLI to create maps:

```bash
cd map-generator-cli
npm run dev -- --width 1200 --height 800 --parcels 500 --output my-map.json
```

Options:
- `--width <number>` - Map width (default: 1200)
- `--height <number>` - Map height (default: 800)
- `--parcels <number>` - Number of parcels (default: 500)
- `--seed <number>` - Random seed for reproducibility
- `--output <path>` - Output filename (default: default-map.json)

### Backend Control (API)

The backend provides REST API endpoints for control:

**Start simulation:**
```bash
curl -X POST http://localhost:3001/api/simulation/start
```

**Stop simulation:**
```bash
curl -X POST http://localhost:3001/api/simulation/stop
```

**Set speed (0.1 to 10):**
```bash
curl -X POST http://localhost:3001/api/simulation/speed \
  -H "Content-Type: application/json" \
  -d '{"speed": 2.0}'
```

**Load a different map:**
```bash
curl -X POST http://localhost:3001/api/maps/load \
  -H "Content-Type: application/json" \
  -d '{"mapFile": "my-map.json"}'
```

### Frontend Interaction

1. **Viewing the Map**
   - Frontend automatically connects to backend
   - Displays real-time simulation state
   - Different colors represent terrain types
   - Small dots indicate resources

2. **Interacting with Parcels**
   - Click any parcel to view details
   - See terrain type, resources, and properties
   - View resource regeneration rates

3. **Read-only Mode**
   - Frontend cannot start/stop simulation
   - Cannot adjust simulation speed
   - Cannot generate maps
   - All control is backend-side

## Technology Stack

**Frontend:**
- **React 19** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite 7** - Fast build tool and dev server
- **Pixi.js 8** - High-performance 2D rendering engine
- **Server-Sent Events** - Real-time updates from backend

**Backend:**
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **TypeScript** - Type-safe JavaScript
- **Server-Sent Events** - Real-time broadcasting

**Map Generator:**
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **D3-Delaunay** - Voronoi diagram generation
- **Commander** - CLI argument parsing

## Project Structure

```
civilization/
├── package.json                  # Root workspace config
├── shared/                       # Shared package (types, utils, logic)
│   ├── src/
│   │   ├── map-generator/        # Map generation logic
│   │   ├── utils/                # Utility functions (random, noise)
│   │   ├── types.ts              # Shared type definitions
│   │   └── index.ts              # Package exports
│   ├── package.json              # Workspace package
│   └── tsconfig.json
├── backend/                      # Backend server
│   ├── src/
│   │   ├── simulation/           # Simulation Engine
│   │   ├── map-loader/           # Map Loader
│   │   ├── state/                # State Manager
│   │   ├── sse/                  # SSE Broadcaster
│   │   ├── settings/             # Settings Manager
│   │   ├── api/                  # REST API routes
│   │   └── index.ts              # Server entry point
│   ├── maps/                     # Generated map files
│   ├── package.json              # Workspace package
│   └── README.md
├── map-generator-cli/            # Standalone map generator
│   ├── src/
│   │   └── index.ts              # CLI entry point
│   ├── package.json              # Workspace package
│   └── README.md
├── frontend/                     # Frontend application (API-only)
│   ├── src/
│   │   ├── components/           # React UI components
│   │   │   ├── MapRenderer.tsx   # Pixi.js map renderer
│   │   │   ├── ReadOnlyControlPanel.tsx  # Status display
│   │   │   └── ParcelDetailPanel.tsx     # Parcel details
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useSSE.ts         # SSE connection hook
│   │   ├── types/                # Frontend-only types
│   │   ├── App.tsx               # Main App (SSE only)
│   │   └── main.tsx              # Application entry point
│   ├── package.json              # Workspace package
│   ├── index.html
│   └── vite.config.ts
├── ARCHITECTURE.md               # Detailed architecture
├── QUICKSTART.md                 # Quick start guide
└── README.md                     # This file
```

## Key Algorithms

- **Voronoi Diagram**: Delaunay triangulation with Lloyd's relaxation
- **Terrain Generation**: Multi-octave Simplex noise with distance-based continent formation
- **Resource Simulation**: Time-based regeneration/depletion with configurable rates

## Documentation

For detailed technical documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md), which includes:
- Architecture overview
- Data structure specifications
- Algorithm descriptions
- Performance considerations
- Customization examples

## License

MIT License - see the [LICENSE](LICENSE) file for details
