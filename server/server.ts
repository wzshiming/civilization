/**
 * Backend server for civilization map generation and simulation
 * Implements SSE for real-time updates
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateWorldMap, simulateWorld } from '../src/map-generator';
import type { WorldMap, MapConfig } from '../src/types/map';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store the current world map and simulation state
let worldMap: WorldMap | null = null;
let isSimulating = false;
let simulationSpeed = 1.0;
let simulationInterval: NodeJS.Timeout | null = null;
let lastUpdateTime = Date.now();

// Store connected SSE clients
const clients = new Set<Response>();

/**
 * Send SSE update to all connected clients
 */
function broadcastUpdate(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      clients.delete(client);
    }
  });
}

/**
 * Convert WorldMap to serializable format
 */
function serializeWorldMap(map: WorldMap) {
  return {
    parcels: Array.from(map.parcels.entries()).map(([id, parcel]) => ({ id, ...parcel })),
    boundaries: map.boundaries,
    width: map.width,
    height: map.height,
    lastUpdate: map.lastUpdate,
  };
}

/**
 * Start the simulation loop
 */
function startSimulation() {
  if (isSimulating || !worldMap) return;
  
  isSimulating = true;
  lastUpdateTime = Date.now();
  
  simulationInterval = setInterval(() => {
    if (!worldMap) return;
    
    const now = Date.now();
    const deltaTime = ((now - lastUpdateTime) / 1000) * simulationSpeed;
    
    simulateWorld(worldMap, deltaTime);
    lastUpdateTime = now;
    
    // Broadcast update to all connected clients
    broadcastUpdate('update', {
      parcels: Array.from(worldMap.parcels.values()).map(parcel => ({
        id: parcel.id,
        resources: parcel.resources,
      })),
      lastUpdate: worldMap.lastUpdate,
    });
  }, 100); // Update every 100ms
}

/**
 * Stop the simulation loop
 */
function stopSimulation() {
  isSimulating = false;
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

// API Routes

/**
 * SSE endpoint for real-time updates
 */
app.get('/api/events', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx
  
  // Send initial connection message
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to simulation server' })}\n\n`);
  
  // Send current world state if available
  if (worldMap) {
    res.write(`event: init\ndata: ${JSON.stringify({
      worldMap: serializeWorldMap(worldMap),
      isSimulating,
      simulationSpeed,
    })}\n\n`);
  }
  
  // Add client to connected clients
  clients.add(res);
  
  // Remove client on connection close
  req.on('close', () => {
    clients.delete(res);
  });
});

/**
 * Generate a new world map
 */
app.post('/api/map/generate', (req: Request, res: Response) => {
  try {
    const config: MapConfig = {
      width: 1200,
      height: 800,
      numParcels: req.body.numParcels || 500,
      seed: req.body.seed,
    };
    
    // Stop simulation if running
    stopSimulation();
    
    // Generate new map
    worldMap = generateWorldMap(config);
    
    // Broadcast new map to all clients
    broadcastUpdate('mapGenerated', {
      worldMap: serializeWorldMap(worldMap),
    });
    
    res.json({
      success: true,
      worldMap: serializeWorldMap(worldMap),
    });
  } catch (error) {
    console.error('Error generating map:', error);
    res.status(500).json({ success: false, error: 'Failed to generate map' });
  }
});

/**
 * Get current world map
 */
app.get('/api/map', (req: Request, res: Response) => {
  if (!worldMap) {
    res.status(404).json({ success: false, error: 'No map generated' });
    return;
  }
  
  res.json({
    success: true,
    worldMap: serializeWorldMap(worldMap),
  });
});

/**
 * Start simulation
 */
app.post('/api/simulation/start', (req: Request, res: Response) => {
  if (!worldMap) {
    res.status(400).json({ success: false, error: 'No map available' });
    return;
  }
  
  startSimulation();
  
  broadcastUpdate('simulationStateChanged', {
    isSimulating: true,
    simulationSpeed,
  });
  
  res.json({ success: true, isSimulating: true });
});

/**
 * Stop simulation
 */
app.post('/api/simulation/stop', (req: Request, res: Response) => {
  stopSimulation();
  
  broadcastUpdate('simulationStateChanged', {
    isSimulating: false,
    simulationSpeed,
  });
  
  res.json({ success: true, isSimulating: false });
});

/**
 * Set simulation speed
 */
app.post('/api/simulation/speed', (req: Request, res: Response) => {
  const speed = parseFloat(req.body.speed);
  
  if (isNaN(speed) || speed <= 0) {
    res.status(400).json({ success: false, error: 'Invalid speed value' });
    return;
  }
  
  simulationSpeed = speed;
  
  broadcastUpdate('simulationSpeedChanged', {
    simulationSpeed,
  });
  
  res.json({ success: true, simulationSpeed });
});

/**
 * Get simulation state
 */
app.get('/api/simulation', (req: Request, res: Response) => {
  res.json({
    success: true,
    isSimulating,
    simulationSpeed,
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('SSE endpoint: /api/events');
  
  // Generate initial map
  worldMap = generateWorldMap({
    width: 1200,
    height: 800,
    numParcels: 500,
  });
  console.log('Initial map generated');
});
