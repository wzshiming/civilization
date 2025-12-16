/**
 * Custom hook for backend communication via SSE
 */

import { useState, useEffect, useCallback } from 'react';
import type { WorldMap } from '../types/map';

export function useBackend() {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1.0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: number | null = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      // Connect to SSE endpoint
      eventSource = new EventSource('/api/sse');

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'world_update') {
            // Convert parcels array to Map
            const parcelsMap = new Map();
            if (data.world && data.world.parcels) {
              Object.entries(data.world.parcels).forEach(([id, parcel]) => {
                parcelsMap.set(parseInt(id), parcel);
              });
            }
            
            setWorldMap({
              ...data.world,
              parcels: parcelsMap,
            });
          } else if (data.type === 'simulation_state') {
            setIsSimulating(data.isSimulating);
            setSimulationSpeed(data.speed);
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setIsConnected(false);
        setError('Connection to server lost. Retrying...');
        
        if (eventSource) {
          eventSource.close();
        }
        
        // Attempt to reconnect after 2 seconds
        if (isMounted) {
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 2000);
        }
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const toggleSimulation = useCallback(async () => {
    try {
      const response = await fetch('/api/toggle-simulation', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to toggle simulation');
      }
    } catch (err) {
      console.error('Error toggling simulation:', err);
      setError('Failed to toggle simulation');
    }
  }, []);

  const changeSpeed = useCallback(async (speed: number) => {
    try {
      const response = await fetch('/api/set-speed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ speed }),
      });
      if (!response.ok) {
        throw new Error('Failed to set speed');
      }
    } catch (err) {
      console.error('Error setting speed:', err);
      setError('Failed to set speed');
    }
  }, []);

  const generateMap = useCallback(async (config: { numParcels: number; seed?: number }) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numParcels: config.numParcels,
          seed: config.seed || 0,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate map');
      }
    } catch (err) {
      console.error('Error generating map:', err);
      setError('Failed to generate map');
    }
  }, []);

  return {
    worldMap,
    isSimulating,
    simulationSpeed,
    isConnected,
    error,
    toggleSimulation,
    changeSpeed,
    generateMap,
  };
}
