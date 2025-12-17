/**
 * Custom hook for Server-Sent Events connection to backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorldMap, Parcel } from '../types/map';
import type { SerializableWorldMap, SSEMessage, StateDelta } from '@civilization/shared';

interface UseSSEOptions {
  url: string;
  autoConnect?: boolean;
}

export function useSSE(options: UseSSEOptions) {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((message: SSEMessage) => {
    switch (message.type) {
      case 'full-state': {
        // Received full state from backend
        const serializable = message.data as SerializableWorldMap;
        const newWorldMap: WorldMap = {
          parcels: new Map(serializable.parcels.map((p: Parcel) => [p.id, p])),
          boundaries: serializable.boundaries,
          width: serializable.width,
          height: serializable.height,
          lastUpdate: serializable.lastUpdate,
        };
        setWorldMap(newWorldMap);
        break;
      }

      case 'delta': {
        // Received delta update - optimized to only update if there are changes
        const delta = message.data as StateDelta;
        if (delta.parcels.length === 0) break; // Skip if no parcel updates
        
        setWorldMap((prevMap) => {
          if (!prevMap) return prevMap;

          // Create a new map to trigger re-render only if needed
          const updatedParcels = new Map(prevMap.parcels);
          let hasChanges = false;

          // Apply deltas more efficiently
          // Note: Currently only resource updates are handled as that's what the backend sends
          // If other parcel properties need updates in the future, extend this logic
          for (const parcelDelta of delta.parcels) {
            if (parcelDelta.resources) {
              const parcel = updatedParcels.get(parcelDelta.id);
              if (parcel) {
                const updatedParcel = { ...parcel, resources: parcelDelta.resources };
                updatedParcels.set(parcelDelta.id, updatedParcel);
                hasChanges = true;
              }
            }
          }

          // Only create new map if there were actual changes
          if (!hasChanges) return prevMap;

          return {
            ...prevMap,
            parcels: updatedParcels,
            lastUpdate: delta.lastUpdate,
          };
        });
        break;
      }

      case 'simulation-started':
      case 'simulation-paused':
      case 'settings-updated':
        console.log('Backend event:', message.type, message.data);
        break;

      default:
        console.log('Unknown SSE message type:', message.type);
    }
  }, []);

  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Already connected to SSE');
      return;
    }

    console.log(`Connecting to SSE at ${options.url}`);
    const es = new EventSource(options.url);

    es.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setError(null);
    };

    es.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      setError('Connection error');
      es.close();
      eventSourceRef.current = null;
    };

    es.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSourceRef.current = es;
  }, [options.url, handleMessage]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Closing SSE connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    let mounted = true;

    if (options.autoConnect && mounted) {
      connect();
    }

    return () => {
      mounted = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.autoConnect]);

  return {
    worldMap,
    isConnected,
    error,
    connect,
    disconnect,
  };
}
