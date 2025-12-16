# Civilization Backend Server

Backend server for the Civilization procedural map generator. Handles all simulation logic, map generation, and pushes updates to the frontend via Server-Sent Events (SSE).

## Architecture

The backend is responsible for:
- **Map Generation**: Creating procedural maps with Voronoi diagrams, terrain generation, and resource placement
- **Simulation**: Running the resource simulation loop (regeneration/depletion)
- **State Management**: Maintaining the current world state
- **Real-time Updates**: Pushing updates to connected clients via SSE

## API Endpoints

### REST API

- `POST /api/map/generate` - Generate a new map
  - Body: `{ width?, height?, numParcels?, seed? }`
  - Response: `{ success, map }`

- `GET /api/map/current` - Get current map state
  - Response: `{ success, map }`

- `POST /api/simulation/start` - Start the simulation
  - Response: `{ success, isSimulating, speed }`

- `POST /api/simulation/stop` - Stop the simulation
  - Response: `{ success, isSimulating, speed }`

- `POST /api/simulation/speed` - Set simulation speed
  - Body: `{ speed }` (0.1 - 5.0)
  - Response: `{ success, speed }`

- `GET /api/health` - Health check endpoint
  - Response: `{ status, hasMap, isSimulating, simulationSpeed, connectedClients }`

### SSE Endpoint

- `GET /api/events` - Server-Sent Events stream
  - Events:
    - `map` - Complete map state (sent on initial connection and map regeneration)
    - `update` - Parcel updates (sent during simulation, every 100ms)
    - `simulation` - Simulation state changes (isSimulating, speed)

## Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The server will start on port 3001 by default.

### Build for Production

```bash
npm run build
```

### Run Production Server

```bash
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3001)

## Technology Stack

- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **D3-Delaunay** - Voronoi diagram generation
- **Server-Sent Events** - Real-time updates to clients

## Project Structure

```
server/
├── src/
│   ├── index.ts           # Main server file
│   ├── map-generator/     # Map generation logic
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── package.json
└── tsconfig.json
```
