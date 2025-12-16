/**
 * Backend server for Civilization map generator
 * Handles all simulation and map generation, pushes updates via SSE
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import type { WorldMap, Parcel } from './types/map.js';
import { generateWorldMap, simulateWorld } from './map-generator/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global state
let currentMap: WorldMap | null = null;
let isSimulating = false;
let simulationSpeed = 1.0;
let simulationInterval: NodeJS.Timeout | null = null;
let lastUpdateTime = Date.now();

// SSE clients
const sseClients = new Set<Response>();

/**
 * Send SSE event to all connected clients
 */
function broadcastSSE(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error sending SSE:', error);
      sseClients.delete(client);
    }
  });
}

/**
 * Convert Map to plain object for JSON serialization
 */
function serializeWorldMap(map: WorldMap): any {
  return {
    parcels: Array.from(map.parcels.values()),
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
  if (isSimulating || !currentMap) return;
  
  isSimulating = true;
  lastUpdateTime = Date.now();
  
  simulationInterval = setInterval(() => {
    if (!currentMap) return;
    
    const now = Date.now();
    const deltaTime = ((now - lastUpdateTime) / 1000) * simulationSpeed;
    
    simulateWorld(currentMap, deltaTime);
    lastUpdateTime = now;
    
    // Broadcast update via SSE
    broadcastSSE('update', {
      parcels: Array.from(currentMap.parcels.values()),
      lastUpdate: currentMap.lastUpdate,
    });
  }, 100); // Update every 100ms
  
  broadcastSSE('simulation', { isSimulating: true, speed: simulationSpeed });
}

/**
 * Stop the simulation loop
 */
function stopSimulation() {
  if (!isSimulating) return;
  
  isSimulating = false;
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  
  broadcastSSE('simulation', { isSimulating: false, speed: simulationSpeed });
}

// REST API Endpoints

/**
 * Generate a new map
 */
app.post('/api/map/generate', (req: Request, res: Response) => {
  try {
    const { width = 1200, height = 800, numParcels = 500, seed } = req.body;
    
    // Stop current simulation
    stopSimulation();
    
    // Generate new map
    console.log(`Generating new map: ${numParcels} parcels, seed: ${seed || 'random'}`);
    const newMap = generateWorldMap({
      width,
      height,
      numParcels,
      seed: seed || Date.now(),
    });
    currentMap = newMap;
    
    const serializedMap = serializeWorldMap(newMap);
    
    // Broadcast new map via SSE
    broadcastSSE('map', serializedMap);
    
    res.json({
      success: true,
      map: serializedMap,
    });
  } catch (error) {
    console.error('Error generating map:', error);
    res.status(500).json({ success: false, error: 'Failed to generate map' });
  }
});

/**
 * Get current map state
 */
app.get('/api/map/current', (req: Request, res: Response) => {
  if (!currentMap) {
    return res.status(404).json({ success: false, error: 'No map generated yet' });
  }
  
  res.json({
    success: true,
    map: serializeWorldMap(currentMap),
  });
});

/**
 * Start simulation
 */
app.post('/api/simulation/start', (req: Request, res: Response) => {
  if (!currentMap) {
    return res.status(400).json({ success: false, error: 'No map to simulate' });
  }
  
  startSimulation();
  res.json({ success: true, isSimulating: true, speed: simulationSpeed });
});

/**
 * Stop simulation
 */
app.post('/api/simulation/stop', (req: Request, res: Response) => {
  stopSimulation();
  res.json({ success: true, isSimulating: false, speed: simulationSpeed });
});

/**
 * Set simulation speed
 */
app.post('/api/simulation/speed', (req: Request, res: Response) => {
  const { speed } = req.body;
  
  if (typeof speed !== 'number' || speed < 0.1 || speed > 5) {
    return res.status(400).json({ success: false, error: 'Invalid speed (must be 0.1-5)' });
  }
  
  simulationSpeed = speed;
  broadcastSSE('simulation', { isSimulating, speed: simulationSpeed });
  
  res.json({ success: true, speed: simulationSpeed });
});

/**
 * SSE endpoint for real-time updates
 */
app.get('/api/events', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Add client to set
  sseClients.add(res);
  console.log(`SSE client connected. Total clients: ${sseClients.size}`);
  
  // Send initial state
  if (currentMap) {
    const message = `event: map\ndata: ${JSON.stringify(serializeWorldMap(currentMap))}\n\n`;
    res.write(message);
  }
  
  const simulationMessage = `event: simulation\ndata: ${JSON.stringify({ isSimulating, speed: simulationSpeed })}\n\n`;
  res.write(simulationMessage);
  
  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(res);
    console.log(`SSE client disconnected. Total clients: ${sseClients.size}`);
  });
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasMap: !!currentMap,
    isSimulating,
    simulationSpeed,
    connectedClients: sseClients.size,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Civilization server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/api/events`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  
  // Generate initial map
  console.log('Generating initial map...');
  currentMap = generateWorldMap({
    width: 1200,
    height: 800,
    numParcels: 500,
    seed: Date.now(),
  });
  console.log('Initial map generated successfully');
});
