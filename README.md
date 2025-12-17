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
```bash
npm run dev
```

## License

MIT License - see the [LICENSE](LICENSE) file for details
