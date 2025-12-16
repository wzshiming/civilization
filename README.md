# Civilization - Procedural Map Generator

A sophisticated web-based procedural map generation system featuring dynamic terrain, resource simulation, and interactive visualization. Built with a **separated frontend and backend architecture** using **Server-Sent Events (SSE)** for real-time updates.

![Map Example](https://github.com/user-attachments/assets/5ad7c5c7-e213-4c2d-97ec-05800a932aa4)

## Architecture

### Backend-First Design
- **Backend**: Node.js/Express server handles all simulation logic, map generation, and state management
- **Frontend**: React UI for visualization and interaction only
- **Communication**: REST API for commands, SSE for real-time updates
- **Separation**: Frontend cannot generate maps or adjust speed - all controlled by backend

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
- **Backend simulation** - All simulation logic runs on the backend
- **SSE streaming** - Real-time updates pushed to frontend via Server-Sent Events
- **Resource dynamics** - Resources regenerate or deplete over time
- **Backend-controlled speed** - Simulation speed managed by backend (0.1x to 5x)
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

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Development

You need to run both the backend server and frontend development server:

**Terminal 1 - Start Backend Server:**
```bash
cd server
npm run dev
```

The backend will start on [http://localhost:3001](http://localhost:3001)

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

The frontend will be available at [http://localhost:5173/](http://localhost:5173/)

### Configuration

Create a `.env` file in the root directory (optional):

```bash
# Backend API URL (defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

### Build

Build both frontend and backend for production:

```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build
cd ..
```

The built files will be in:
- Frontend: `dist/` directory
- Backend: `server/dist/` directory

### Production Deployment

Run both servers in production:

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run preview
```

Or serve the frontend `dist` directory with any static file server.

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
2. The backend starts the simulation and streams updates via SSE
3. Watch resources regenerate or deplete in real-time
4. Use the speed slider to adjust simulation speed (0.1x to 5x) - this updates the backend
5. Click "⏸ Pause" to stop the simulation on the backend

### Generating New Maps

1. Click "⚙ Map Config" button
2. Adjust the number of parcels (100-2000)
3. Optionally enter a seed for reproducible maps
4. Click "🔄 Regenerate Map"
5. The backend generates the new map and sends it to the frontend via SSE

## Technology Stack

### Backend
- **Node.js/Express** - Backend server
- **TypeScript** - Type-safe JavaScript
- **D3-Delaunay** - Voronoi diagram generation
- **Server-Sent Events** - Real-time updates

### Frontend
- **React 19** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite 7** - Fast build tool and dev server
- **Pixi.js 8** - High-performance 2D rendering engine
- **ESLint** - Code linting

## Project Structure

```
civilization/
├── server/                   # Backend server
│   ├── src/
│   │   ├── index.ts          # Main server file
│   │   ├── map-generator/    # Map generation logic
│   │   ├── types/            # Type definitions
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── README.md
├── src/                      # Frontend application
│   ├── api/
│   │   └── client.ts         # Backend API client and SSE
│   ├── components/           # React UI components
│   │   ├── MapRenderer.tsx   # Pixi.js map renderer
│   │   ├── ControlPanel.tsx  # Simulation controls
│   │   └── ParcelDetailPanel.tsx  # Parcel information display
│   ├── types/               # TypeScript type definitions
│   │   └── map.ts           # Core data structures
│   ├── i18n/                # Internationalization
│   ├── App.tsx              # Main App component
│   └── main.tsx             # Application entry point
├── public/                  # Public static files
├── DOCUMENTATION.md         # Detailed technical documentation
├── package.json            # Frontend dependencies and scripts
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
