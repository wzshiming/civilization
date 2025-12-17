/**
 * REST API Routes
 */

import { Router } from 'express';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { SettingsManager } from '../settings/SettingsManager';
import { MapLoader } from '../map-loader/MapLoader';
import { StateManager } from '../state/StateManager';
import { SSEBroadcaster } from '../sse/SSEBroadcaster';

export function createRouter(
  simulationEngine: SimulationEngine,
  settingsManager: SettingsManager,
  mapLoader: MapLoader,
  stateManager: StateManager,
  sseBroadcaster: SSEBroadcaster
): Router {
  const router = Router();

  /**
   * GET /api/status
   * Get simulation status
   */
  router.get('/status', (req, res) => {
    res.json({
      isRunning: simulationEngine.isSimulationRunning(),
      speed: simulationEngine.getSpeed(),
      settings: settingsManager.getSettings(),
      clientCount: sseBroadcaster.getClientCount(),
      hasMap: stateManager.getWorldMap() !== null,
    });
  });

  /**
   * POST /api/simulation/start
   * Start the simulation
   */
  router.post('/simulation/start', (req, res) => {
    try {
      simulationEngine.start();
      sseBroadcaster.broadcastEvent('simulation-started', {
        message: 'Simulation started',
        speed: simulationEngine.getSpeed(),
      });
      res.json({ success: true, message: 'Simulation started' });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/simulation/stop
   * Stop the simulation
   */
  router.post('/simulation/stop', (req, res) => {
    try {
      simulationEngine.stop();
      sseBroadcaster.broadcastEvent('simulation-paused', {
        message: 'Simulation paused',
      });
      res.json({ success: true, message: 'Simulation stopped' });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/simulation/speed
   * Set simulation speed (backend only, not accessible from frontend)
   */
  router.post('/simulation/speed', (req, res) => {
    try {
      const { speed } = req.body;
      if (typeof speed !== 'number' || speed < 0.1 || speed > 10) {
        return res.status(400).json({ 
          success: false, 
          error: 'Speed must be a number between 0.1 and 10' 
        });
      }
      
      simulationEngine.setSpeed(speed);
      settingsManager.setSpeed(speed);
      sseBroadcaster.broadcastEvent('settings-updated', {
        message: 'Speed updated',
        speed,
      });
      
      res.json({ success: true, speed });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/maps
   * List available maps
   */
  router.get('/maps', (req, res) => {
    try {
      const maps = mapLoader.listMaps();
      res.json({ success: true, maps });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/maps/load
   * Load a map (backend only)
   */
  router.post('/maps/load', (req, res) => {
    try {
      const { mapFile } = req.body;
      if (!mapFile) {
        return res.status(400).json({ 
          success: false, 
          error: 'mapFile is required' 
        });
      }

      const worldMap = mapLoader.loadMap(mapFile);
      stateManager.loadMap(worldMap);
      settingsManager.setMapFile(mapFile);
      
      res.json({ 
        success: true, 
        message: `Map ${mapFile} loaded successfully`,
        mapInfo: {
          width: worldMap.width,
          height: worldMap.height,
          parcelCount: worldMap.parcels.size,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/settings
   * Get current settings
   */
  router.get('/settings', (req, res) => {
    try {
      const settings = settingsManager.getSettings();
      res.json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /api/state
   * Get current full state (for initial load or debugging)
   */
  router.get('/state', (req, res) => {
    try {
      const worldMap = stateManager.getWorldMap();
      if (!worldMap) {
        return res.status(404).json({ 
          success: false, 
          error: 'No map loaded' 
        });
      }

      const serializable = {
        parcels: Array.from(worldMap.parcels.values()),
        boundaries: worldMap.boundaries,
        width: worldMap.width,
        height: worldMap.height,
        lastUpdate: worldMap.lastUpdate,
      };

      res.json({ success: true, state: serializable });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * POST /api/viewport
   * Update viewport bounds for SSE filtering
   */
  router.post('/viewport', (req, res) => {
    try {
      const { clientId, minX, maxX, minY, maxY } = req.body;
      
      if (!clientId || typeof clientId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'clientId is required and must be a string.',
        });
      }

      if (
        typeof minX !== 'number' ||
        typeof maxX !== 'number' ||
        typeof minY !== 'number' ||
        typeof maxY !== 'number'
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid viewport bounds. All bounds must be numbers.',
        });
      }

      const viewport = { minX, maxX, minY, maxY };
      const updated = sseBroadcaster.updateViewport(clientId, viewport);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Client not found. Please reconnect to SSE stream.',
        });
      }

      res.json({ success: true, message: 'Viewport updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  return router;
}
