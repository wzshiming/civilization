/**
 * Main backend server entry point
 */

import express, { Response } from 'express';
import cors from 'cors';
import { SimulationEngine } from './simulation/SimulationEngine';
import { StateManager } from './state/StateManager';
import { MapLoader } from './map-loader/MapLoader';
import { SSEBroadcaster } from './sse/SSEBroadcaster';

const PORT = process.env.PORT || 3001;
const MAPS_DIR = process.env.MAPS_DIR || './maps';

// Initialize components
const stateManager = new StateManager();
const mapLoader = new MapLoader(MAPS_DIR);
const sseBroadcaster = new SSEBroadcaster(stateManager);
const simulationEngine = new SimulationEngine(stateManager, sseBroadcaster);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Store SSE responses per client to allow viewport updates
const clientResponses = new Map<string, Response>();

// SSE endpoint
app.get('/events', (req, res) => {
  const clientId = req.query.clientId as string || `client-${Date.now()}-${Math.random()}`;
  clientResponses.set(clientId, res);
  
  res.on('close', () => {
    clientResponses.delete(clientId);
  });
  
  // Add client first (sets headers)
  sseBroadcaster.addClient(res);
  
  // Then send client ID back as a comment
  res.write(`: clientId: ${clientId}\n\n`);
});

// Viewport update endpoint
app.post('/viewport', (req, res) => {
  const { clientId, viewport } = req.body;
  
  if (!clientId || !viewport) {
    res.status(400).json({ error: 'Missing clientId or viewport' });
    return;
  }
  
  const clientResponse = clientResponses.get(clientId);
  if (clientResponse) {
    sseBroadcaster.updateClientViewport(clientResponse, viewport);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Client not found' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);

  // Load default map if available
  const maps = mapLoader.listMaps();
  if (maps.length > 0) {
    const defaultMap = 'default-map.json';
    if (mapLoader.mapExists(defaultMap)) {
      console.log(`Loading default map: ${defaultMap}`);
      try {
        const worldMap = mapLoader.loadMap(defaultMap);
        stateManager.loadMap(worldMap);
        console.log(`✓ Map loaded successfully: ${worldMap.parcels.size} parcels`);
        
        // Simulation engine will push updates through SSE after each simulation update
        simulationEngine.start();
        console.log('✓ Simulation started - updates will be pushed via SSE after each tick');
      } catch (error) {
        console.error('Failed to load default map:', error);
      }
    } else {
      console.log('Default map not found. Available maps:', maps);
    }
  } else {
    console.log('No maps found. Please generate a map using the map-generator-cli tool.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  simulationEngine.stop();
  sseBroadcaster.stopBroadcasting();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  simulationEngine.stop();
  sseBroadcaster.stopBroadcasting();
  process.exit(0);
});
