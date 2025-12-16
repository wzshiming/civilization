/**
 * Custom hook for managing Server-Sent Events (SSE) connection
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import type { WorldMap } from '../types/map';
import { apiClient } from '../services/api';

interface SSEUpdateData {
  parcels?: Array<{ id: number; resources: any[] }>;
  lastUpdate?: number;
}

interface SSEHandlers {
  onMapUpdate?: (update: SSEUpdateData) => void;
  onMapGenerated?: (worldMap: WorldMap) => void;
  onSimulationStateChanged?: (state: { isSimulating: boolean; simulationSpeed: number }) => void;
  onSpeedChanged?: (speed: number) => void;
  onConnected?: () => void;
  onError?: (error: Event) => void;
}

export function useSSE(handlers: SSEHandlers) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }
    
    try {
      const eventSource = apiClient.createEventSource();
      eventSourceRef.current = eventSource;
      
      // Connection opened
      eventSource.addEventListener('connected', (event) => {
        console.log('SSE connected:', event);
        setIsConnected(true);
        setReconnectAttempts(0);
        handlers.onConnected?.();
      });
      
      // Initial state
      eventSource.addEventListener('init', (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('SSE init:', data);
        
        if (data.worldMap) {
          const worldMap = deserializeWorldMap(data.worldMap);
          handlers.onMapGenerated?.(worldMap);
        }
        
        if (data.isSimulating !== undefined) {
          handlers.onSimulationStateChanged?.({
            isSimulating: data.isSimulating,
            simulationSpeed: data.simulationSpeed,
          });
        }
      });
      
      // Real-time updates
      eventSource.addEventListener('update', (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        handlers.onMapUpdate?.(data);
      });
      
      // Map generated
      eventSource.addEventListener('mapGenerated', (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('Map generated:', data);
        
        if (data.worldMap) {
          const worldMap = deserializeWorldMap(data.worldMap);
          handlers.onMapGenerated?.(worldMap);
        }
      });
      
      // Simulation state changed
      eventSource.addEventListener('simulationStateChanged', (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('Simulation state changed:', data);
        handlers.onSimulationStateChanged?.(data);
      });
      
      // Simulation speed changed
      eventSource.addEventListener('simulationSpeedChanged', (event) => {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('Simulation speed changed:', data);
        handlers.onSpeedChanged?.(data.simulationSpeed);
      });
      
      // Error handling
      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        handlers.onError?.(error);
        
        // Attempt reconnection
        eventSource.close();
        eventSourceRef.current = null;
        
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      setIsConnected(false);
    }
  }, [handlers, reconnectAttempts]);
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    isConnected,
    reconnectAttempts,
    disconnect,
    reconnect: () => {
      disconnect();
      setReconnectAttempts(0);
      connect();
    },
  };
}

/**
 * Deserialize WorldMap from SSE data
 */
function deserializeWorldMap(data: any): WorldMap {
  const parcelsMap = new Map();
  
  if (data.parcels && Array.isArray(data.parcels)) {
    data.parcels.forEach((parcel: any) => {
      parcelsMap.set(parcel.id, parcel);
    });
  }
  
  return {
    parcels: parcelsMap,
    boundaries: data.boundaries || [],
    width: data.width,
    height: data.height,
    lastUpdate: data.lastUpdate,
  };
}
