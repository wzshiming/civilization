import express, { Request, Response } from 'express';
import cors from 'cors';
import { WorldMap, MapConfig } from '../../src/types/map';
import { generateWorldMap, simulateWorld } from '../../src/map-generator';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Server state
let currentMap: WorldMap | null = null;
let isSimulating = false;
let simulationSpeed = 1.0;
let simulationInterval: NodeJS.Timeout | null = null;
let lastUpdateTime = Date.now();

// SSE clients
const clients = new Set<Response>();

// Helper to broadcast updates via SSE
function broadcastUpdate(event: string, data: unknown) {
  // Stringify once for all clients for better performance
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  });
}

// Convert Map to plain object for JSON serialization
function serializeMap(worldMap: WorldMap) {
  return {
    parcels: Array.from(worldMap.parcels.entries()).map(([id, parcel]) => ({
      ...parcel,
      id,
    })),
    boundaries: worldMap.boundaries,
    width: worldMap.width,
    height: worldMap.height,
    lastUpdate: worldMap.lastUpdate,
  };
}

// Start simulation loop
function startSimulation() {
  if (simulationInterval || !currentMap) return;

  lastUpdateTime = Date.now();
  simulationInterval = setInterval(() => {
    if (!currentMap) return;

    const now = Date.now();
    const deltaTime = ((now - lastUpdateTime) / 1000) * simulationSpeed;

    simulateWorld(currentMap, deltaTime);
    lastUpdateTime = now;

    // Broadcast resource updates
    const resourceUpdates = Array.from(currentMap.parcels.values()).map((parcel) => ({
      id: parcel.id,
      resources: parcel.resources,
    }));

    broadcastUpdate('resource-update', resourceUpdates);
  }, 100); // Update every 100ms
}

// Stop simulation loop
function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

// API Routes

// Generate a new map
app.post('/api/map/generate', (req: Request, res: Response) => {
  try {
    const config: MapConfig = {
      width: req.body.width || 1200,
      height: req.body.height || 800,
      numParcels: req.body.numParcels || 500,
      seed: req.body.seed,
    };

    // Stop simulation if running
    stopSimulation();
    isSimulating = false;

    // Generate new map
    currentMap = generateWorldMap(config);

    // Broadcast map generation event
    broadcastUpdate('map-generated', serializeMap(currentMap));

    res.json({
      success: true,
      map: serializeMap(currentMap),
    });
  } catch (error) {
    console.error('Error generating map:', error);
    res.status(500).json({ success: false, error: 'Failed to generate map' });
  }
});

// Get current map state
app.get('/api/map/current', (req: Request, res: Response) => {
  if (!currentMap) {
    res.status(404).json({ success: false, error: 'No map generated yet' });
    return;
  }

  res.json({
    success: true,
    map: serializeMap(currentMap),
  });
});

// Start simulation
app.post('/api/simulation/start', (req: Request, res: Response) => {
  if (!currentMap) {
    res.status(400).json({ success: false, error: 'No map available' });
    return;
  }

  isSimulating = true;
  startSimulation();
  broadcastUpdate('simulation-started', { speed: simulationSpeed });

  res.json({ success: true, isSimulating: true });
});

// Stop simulation
app.post('/api/simulation/stop', (req: Request, res: Response) => {
  isSimulating = false;
  stopSimulation();
  broadcastUpdate('simulation-stopped', {});

  res.json({ success: true, isSimulating: false });
});

// Simulation speed constants
const MIN_SIMULATION_SPEED = 0.1;
const MAX_SIMULATION_SPEED = 5.0;

// Change simulation speed
app.post('/api/simulation/speed', (req: Request, res: Response) => {
  const speed = parseFloat(req.body.speed);
  if (isNaN(speed) || speed < MIN_SIMULATION_SPEED || speed > MAX_SIMULATION_SPEED) {
    res.status(400).json({ success: false, error: 'Invalid speed value' });
    return;
  }

  simulationSpeed = speed;
  broadcastUpdate('speed-changed', { speed: simulationSpeed });

  res.json({ success: true, speed: simulationSpeed });
});

// Get simulation status
app.get('/api/simulation/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    isSimulating,
    speed: simulationSpeed,
  });
});

// SSE endpoint for real-time updates
app.get('/api/events', (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Add client to set
  clients.add(res);

  // Send initial connection message
  res.write('event: connected\ndata: {"message":"Connected to SSE stream"}\n\n');

  // If there's a current map, send it
  if (currentMap) {
    res.write(`event: map-generated\ndata: ${JSON.stringify(serializeMap(currentMap))}\n\n`);
  }

  // Send current simulation status
  res.write(
    `event: simulation-status\ndata: ${JSON.stringify({
      isSimulating,
      speed: simulationSpeed,
    })}\n\n`
  );

  // Remove client on disconnect
  req.on('close', () => {
    clients.delete(res);
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', clients: clients.size });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/api/events`);
});
