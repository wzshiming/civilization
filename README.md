# Civilization - Procedural Map Generator

A sophisticated web-based procedural map generation system featuring dynamic terrain, resource simulation, and interactive visualization.

![Map Example](https://github.com/user-attachments/assets/5ad7c5c7-e213-4c2d-97ec-05800a932aa4)

## Features

### 🗺️ Procedural Map Generation
- **Voronoi-based irregular parcels** - No grid system, organic-shaped regions using Delaunay triangulation
- **Diverse terrain types** - Oceans, islands, continents, mountains, deserts, forests, tundra, and more
- **Realistic terrain generation** - Multi-octave noise functions for elevation, moisture, and temperature

### 💎 Advanced Resource System
- **Multiple resources per parcel** - Each parcel can contain 1-3 simultaneous resources (wood + minerals, water + fertile soil, etc.)
- **10+ resource types** - Water, wood, stone, iron, gold, oil, coal, fertile soil, fish, game
- **Dynamic properties** - Current reserve, maximum capacity, regeneration/depletion rates

### 🎮 Interactive Visualization
- **High-performance rendering** - Pixi.js GPU-accelerated graphics for smooth 60 FPS
- **Color-coded terrain** - Clear visual distinction between terrain types
- **Resource indicators** - Small colored dots show resource presence
- **Click interaction** - Select parcels to view detailed information
- **Clear boundaries** - Parcel edges are distinct and overlap cleanly

### ⚡ Real-time Simulation
- **Resource dynamics** - Resources regenerate or deplete over time
- **Configurable speed** - Adjust simulation speed from 0.1x to 5x
- **Live updates** - Watch resources change in real-time

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

- **Node.js** (version 18 or higher recommended)
- **Go** (version 1.21 or higher)
- npm or yarn

### Architecture

This application uses a **Go backend** for all simulation and map generation, with the frontend serving only as a display layer. Communication happens via **Server-Sent Events (SSE)**.

See [README-BACKEND.md](./README-BACKEND.md) for detailed architecture documentation.

### Installation

Install dependencies:

```bash
npm install
# or
yarn install
```

### Development

**Option 1: Separate terminals (recommended)**

Terminal 1 - Start the backend:
```bash
npm run dev:backend
```

Terminal 2 - Start the frontend:
```bash
npm run dev
```

The frontend will be available at [http://localhost:5173/](http://localhost:5173/)

**Option 2: Production mode**

Build and run the server:
```bash
npm run build
./civilization-server
```

The application will be available at [http://localhost:8080/](http://localhost:8080/)

### Build

Build for production (frontend + backend):

```bash
npm run build
```

This builds:
- Frontend static files to `dist/` directory
- Backend binary as `civilization-server`

Run the production server:

```bash
./civilization-server
```

Or use:

```bash
npm start
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
2. Watch resources regenerate or deplete in real-time
3. Use the speed slider to adjust simulation speed (0.1x to 5x)
4. Click "⏸ Pause" to stop the simulation

### Generating New Maps

**Note:** Map generation is handled by the backend server.

1. Click "⚙ Map Config" button
2. Adjust the number of parcels (100-2000)
3. Optionally enter a seed for reproducible maps
4. Click "🔄 Regenerate Map"
5. The backend will generate and stream the new map via SSE

## Technology Stack

### Frontend
- **React 19** - UI library (display only)
- **TypeScript** - Type-safe JavaScript
- **Vite 7** - Fast build tool and dev server
- **Pixi.js 8** - High-performance 2D rendering engine
- **ESLint** - Code linting

### Backend
- **Go 1.21+** - Backend server and simulation engine
- **Perlin Noise** - Procedural terrain generation
- **Server-Sent Events** - Real-time updates to frontend
- **HTTP API** - REST endpoints for frontend commands

## Project Structure

```
civilization/
├── src/
│   ├── map-generator/        # Core map generation logic
│   │   ├── index.ts          # Main orchestrator
│   │   ├── voronoi.ts        # Voronoi diagram generation
│   │   ├── terrain.ts        # Terrain generation
│   │   └── resources.ts      # Resource placement and simulation
│   ├── components/           # React UI components
│   │   ├── MapRenderer.tsx   # Pixi.js map renderer
│   │   ├── ControlPanel.tsx  # Simulation controls
│   │   └── ParcelDetailPanel.tsx  # Parcel information display
│   ├── hooks/               # Custom React hooks
│   │   └── useSimulation.ts # Simulation state management
│   ├── utils/               # Utility functions
│   │   ├── random.ts        # Seeded random number generator
│   │   └── noise.ts         # Simplex noise implementation
│   ├── types/               # TypeScript type definitions
│   │   └── map.ts           # Core data structures
│   ├── App.tsx              # Main App component
│   └── main.tsx             # Application entry point
├── public/                  # Public static files
├── DOCUMENTATION.md         # Detailed technical documentation
├── package.json            # Dependencies and scripts
└── vite.config.ts          # Vite configuration
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
