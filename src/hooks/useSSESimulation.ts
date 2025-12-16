/**
 * Custom hook for managing world simulation with SSE backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorldMap, Resource } from '../types/map';
import { api, deserializeMap } from '../api/client';

interface UseSSESimulationOptions {
  initialSpeed?: number;
}

export function useSSESimulation(
  worldMap: WorldMap | null,
  setWorldMap: (map: WorldMap | null) => void,
  options: UseSSESimulationOptions = {}
) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(options.initialSpeed || 1.0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const worldMapRef = useRef<WorldMap | null>(worldMap);
  const forceUpdateRef = useRef<number>(0);
  const [, setForceUpdate] = useState(0);

  // Keep worldMapRef in sync with worldMap
  useEffect(() => {
    worldMapRef.current = worldMap;
  }, [worldMap]);

  // Set up SSE connection
  useEffect(() => {
    const eventSource = api.createEventSource();
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established');
      setIsConnected(true);
    };

    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      console.log('Connected:', data.message);
    });

    eventSource.addEventListener('map-generated', (event) => {
      const data = JSON.parse(event.data);
      console.log('Map generated via SSE');
      const map = deserializeMap(data);
      setWorldMap(map);
    });

    eventSource.addEventListener('resource-update', (event) => {
      const updates = JSON.parse(event.data) as Array<{ id: number; resources: Resource[] }>;
      const currentMap = worldMapRef.current;
      if (currentMap && currentMap.parcels) {
        // Update resources for each parcel
        updates.forEach((update) => {
          const parcel = currentMap.parcels.get(update.id);
          if (parcel) {
            parcel.resources = update.resources;
          }
        });
        // Force re-render
        forceUpdateRef.current += 1;
        setForceUpdate(forceUpdateRef.current);
      }
    });

    eventSource.addEventListener('simulation-started', (event) => {
      const data = JSON.parse(event.data);
      console.log('Simulation started:', data);
      setIsSimulating(true);
      setSimulationSpeed(data.speed);
    });

    eventSource.addEventListener('simulation-stopped', () => {
      console.log('Simulation stopped');
      setIsSimulating(false);
    });

    eventSource.addEventListener('speed-changed', (event) => {
      const data = JSON.parse(event.data);
      console.log('Speed changed:', data.speed);
      setSimulationSpeed(data.speed);
    });

    eventSource.addEventListener('simulation-status', (event) => {
      const data = JSON.parse(event.data);
      setIsSimulating(data.isSimulating);
      setSimulationSpeed(data.speed);
    });

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
    };

    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
    };
  }, [setWorldMap]); // Only reconnect if setWorldMap changes

  const toggleSimulation = useCallback(async () => {
    try {
      if (isSimulating) {
        await api.stopSimulation();
      } else {
        await api.startSimulation();
      }
    } catch (error) {
      console.error('Error toggling simulation:', error);
    }
  }, [isSimulating]);

  const changeSpeed = useCallback(async (speed: number) => {
    try {
      await api.changeSimulationSpeed(speed);
    } catch (error) {
      console.error('Error changing speed:', error);
    }
  }, []);

  return {
    isSimulating,
    simulationSpeed,
    isConnected,
    toggleSimulation,
    changeSpeed,
  };
}
