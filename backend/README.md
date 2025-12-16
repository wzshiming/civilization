# Backend Server for Civilization Map Generator

This backend server provides SSE (Server-Sent Events) based real-time updates for the map generator.

## Features

- **Map Generation API**: Generate procedural maps on the server
- **Real-time Updates**: SSE stream pushes resource updates to connected clients
- **Simulation Control**: Start/stop/speed control via REST API
- **Multiple Clients**: Support for multiple simultaneous SSE connections

## API Endpoints

### Map Management
- `POST /api/map/generate` - Generate a new map
- `GET /api/map/current` - Get current map state

### Simulation Control
- `POST /api/simulation/start` - Start the simulation
- `POST /api/simulation/stop` - Stop the simulation
- `POST /api/simulation/speed` - Change simulation speed
- `GET /api/simulation/status` - Get current simulation status

### Real-time Updates
- `GET /api/events` - SSE endpoint for real-time updates

### Health Check
- `GET /health` - Server health and connected clients count

## SSE Events

The `/api/events` endpoint sends the following events:

- `connected` - Initial connection confirmation
- `map-generated` - New map has been generated
- `resource-update` - Resource values updated (sent every 100ms during simulation)
- `simulation-started` - Simulation has started
- `simulation-stopped` - Simulation has stopped
- `speed-changed` - Simulation speed has changed
- `simulation-status` - Current simulation status

## Running the Backend

### Development Mode
```bash
npm run dev:backend
```

### Production Build
```bash
npm run build:backend
npm run start:backend
```

### Run Both Frontend and Backend
```bash
npm run dev:all
```

## Configuration

The backend runs on port 3001 by default. The frontend is configured to proxy API requests through Vite's dev server.
