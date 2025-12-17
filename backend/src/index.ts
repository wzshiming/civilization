/**
 * Main backend server entry point
 */

import express from 'express';
import cors from 'cors';
import { SimulationEngine } from './simulation/SimulationEngine';
import { StateManager } from './state/StateManager';
import { SettingsManager } from './settings/SettingsManager';
import { MapLoader } from './map-loader/MapLoader';
import { SSEBroadcaster } from './sse/SSEBroadcaster';

const PORT = process.env.PORT || 3001;
const MAPS_DIR = process.env.MAPS_DIR || './maps';

// Initialize components
const stateManager = new StateManager();
const settingsManager = new SettingsManager();
const mapLoader = new MapLoader(MAPS_DIR);
const simulationEngine = new SimulationEngine(stateManager);
const sseBroadcaster = new SSEBroadcaster(stateManager);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SSE endpoint
app.get('/events', (req, res) => {
  sseBroadcaster.addClient(res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Civilization Simulation Backend Server               ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}              ║
║  SSE endpoint: http://localhost:${PORT}/events            ║
║  API endpoint: http://localhost:${PORT}/api               ║
║  Maps directory: ${MAPS_DIR}                              ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Load default map if available
  const maps = mapLoader.listMaps();
  if (maps.length > 0) {
    const defaultMap = settingsManager.getMapFile();
    if (mapLoader.mapExists(defaultMap)) {
      console.log(`Loading default map: ${defaultMap}`);
      try {
        const worldMap = mapLoader.loadMap(defaultMap);
        stateManager.loadMap(worldMap);
        console.log(`✓ Map loaded successfully: ${worldMap.parcels.size} parcels`);
        
        // Start broadcasting
        sseBroadcaster.startBroadcasting();
        console.log('✓ SSE broadcasting started');

        simulationEngine.start()
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
