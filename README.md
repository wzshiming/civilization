# Civilization - Procedural Map Generator

A sophisticated web-based procedural map generation system featuring dynamic terrain, resource simulation, and interactive visualization.

![Map Example](https://github.com/user-attachments/assets/5ad7c5c7-e213-4c2d-97ec-05800a932aa4)

## Features

### 🗺️ Procedural Map Generation
- **Voronoi-based irregular parcels** - No grid system, organic-shaped regions using Delaunay triangulation
- **Diverse terrain types** - Oceans, islands, continents, mountains, deserts, forests, tundra, and more
- **Realistic terrain generation** - Multi-octave noise functions for elevation, moisture, and temperature
- **River systems** - Dynamic rivers that flow from highlands to oceans

### 💎 Advanced Resource System
- **Multiple resources per parcel** - Each parcel can contain 1-3 simultaneous resources (wood + minerals, water + fertile soil, etc.)
- **10+ resource types** - Water, wood, stone, iron, gold, oil, coal, fertile soil, fish, game
- **Dynamic properties** - Current reserve, maximum capacity, regeneration/depletion rates
- **Boundary resources** - Rivers and borders can contain resources like water and fish

### 🎮 Interactive Visualization
- **High-performance rendering** - Pixi.js GPU-accelerated graphics for smooth 60 FPS
- **Color-coded terrain** - Clear visual distinction between terrain types
- **Resource indicators** - Small colored dots show resource presence
- **Click interaction** - Select parcels to view detailed information
- **Clear boundaries** - Parcel edges are distinct and overlap cleanly

### ⚡ Real-time Simulation
- **Backend-driven simulation** - Simulation runs on Node.js backend server
- **SSE real-time updates** - Server-Sent Events push resource changes to frontend
- **Resource dynamics** - Resources regenerate or deplete over time
- **Configurable speed** - Adjust simulation speed from 0.1x to 5x
- **Live updates** - Watch resources change in real-time without polling

### 🎨 Modern UI
- **React-based interface** - Clean, responsive design
- **Control panel** - Start/pause simulation, adjust speed
- **Detail panel** - View parcel terrain, resources, and location data
- **Map configuration** - Customize parcel count and seed for reproducible maps

## Screenshots

| Map Overview | Parcel Details | Map Configuration |
|--------------|----------------|-------------------|
| ![Overview](https://github.com/user-attachments/assets/5ad7c5c7-e213-4c2d-97ec-05800a932aa4) | ![Details](https://github.com/user-attachments/assets/e53f55a8-0afb-4548-a02e-1bfb8de6c03a) | ![Config](https://github.com/user-attachments/assets/a261d590-3527-44e8-8071-4852b9e81e79) |

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

Install dependencies:

```bash
npm install
# or
yarn install
```

### Development

The application uses a client-server architecture with SSE (Server-Sent Events) for real-time updates.

**Start both frontend and backend together:**

```bash
npm run dev:all
```

This will start:
- Backend server on [http://localhost:3001](http://localhost:3001)
- Frontend dev server on [http://localhost:5173](http://localhost:5173)

**Or start them separately:**

```bash
# Terminal 1: Start backend server
npm run dev:backend

# Terminal 2: Start frontend dev server
npm run dev
```

The frontend will be available at [http://localhost:5173/](http://localhost:5173/)

### Build

Build for production:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
# or
yarn lint
```

## Usage

### Viewing the Map

1. Launch the application - a map will be automatically generated
2. The map displays 500 parcels by default with various terrains
3. Different colors represent different terrain types (blue=water, green=grassland, etc.)
4. Small colored dots indicate resources on parcels

### Interacting with Parcels

1. Click any parcel on the map
2. A detail panel appears on the right showing:
   - Terrain type and environmental properties
   - All resources with current/max values
   - Resource regeneration rates
   - Location and neighbor information

### Running the Simulation

1. Click the "▶ Start" button in the control panel
2. Backend server begins simulation and pushes updates via SSE
3. Watch resources regenerate or deplete in real-time on the frontend
4. Use the speed slider to adjust simulation speed (0.1x to 5x)
5. Click "⏸ Pause" to stop the simulation

### Generating New Maps

1. Click "⚙ Map Config" button
2. Adjust the number of parcels (100-2000)
3. Optionally enter a seed for reproducible maps
4. Click "🔄 Regenerate Map"

## Technology Stack

### Frontend
- **React 19** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite 7** - Fast build tool and dev server with proxy support
- **Pixi.js 8** - High-performance 2D rendering engine
- **D3-Delaunay** - Voronoi diagram generation
- **EventSource API** - SSE client for real-time updates
- **ESLint** - Code linting

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework for REST API
- **TypeScript** - Type-safe JavaScript
- **tsx** - TypeScript execution for development
- **Server-Sent Events (SSE)** - Real-time push updates

## Project Structure

```
civilization/
├── backend/                  # Backend server
│   ├── src/
│   │   └── server.ts         # Express server with SSE support
│   ├── tsconfig.json         # Backend TypeScript config
│   └── README.md             # Backend documentation
├── src/                      # Frontend application
│   ├── map-generator/        # Core map generation logic (shared with backend)
│   │   ├── index.ts          # Main orchestrator
│   │   ├── voronoi.ts        # Voronoi diagram generation
│   │   ├── terrain.ts        # Terrain and river generation
│   │   └── resources.ts      # Resource placement and simulation
│   ├── api/                  # Backend API client
│   │   └── client.ts         # API communication and SSE setup
│   ├── components/           # React UI components
│   │   ├── MapRenderer.tsx   # Pixi.js map renderer
│   │   ├── ControlPanel.tsx  # Simulation controls
│   │   └── ParcelDetailPanel.tsx  # Parcel information display
│   ├── hooks/                # Custom React hooks
│   │   ├── useSimulation.ts  # Local simulation (deprecated)
│   │   └── useSSESimulation.ts # SSE-based simulation state management
│   ├── utils/                # Utility functions
│   │   ├── random.ts        # Seeded random number generator
│   │   └── noise.ts         # Simplex noise implementation
│   ├── types/               # TypeScript type definitions
│   │   └── map.ts           # Core data structures
│   ├── App.tsx              # Main App component
│   └── main.tsx             # Application entry point
├── public/                  # Public static files
├── DOCUMENTATION.md         # Detailed technical documentation
├── package.json             # Dependencies and scripts
└── vite.config.ts           # Vite configuration with API proxy
```

## Architecture

The application uses a **client-server architecture** with real-time communication:

### Backend (Port 3001)
- **REST API** for map generation and simulation control
- **SSE endpoint** (`/api/events`) for pushing real-time updates
- Runs simulation loop at 100ms intervals
- Broadcasts resource changes to all connected clients
- Maintains simulation state (map, speed, running status)

### Frontend (Port 5173)
- **React UI** for visualization and interaction
- **Pixi.js renderer** for high-performance map rendering
- **EventSource** connection to backend SSE endpoint
- Receives and applies resource updates in real-time
- Vite dev server proxies `/api/*` requests to backend

### Communication Flow
1. Frontend requests map generation via `POST /api/map/generate`
2. Backend generates map and returns it + broadcasts via SSE
3. User clicks "Start" → Frontend calls `POST /api/simulation/start`
4. Backend starts simulation loop and broadcasts resource updates every 100ms
5. Frontend receives SSE events and updates the UI in real-time

## Key Algorithms

- **Voronoi Diagram**: Delaunay triangulation with Lloyd's relaxation
- **Terrain Generation**: Multi-octave Simplex noise with distance-based continent formation
- **River Systems**: Elevation gradient descent from highlands to oceans
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
