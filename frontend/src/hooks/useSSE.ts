/**
 * Custom hook for Server-Sent Events connection to backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorldMap, Parcel } from '@civilization/shared';
import type { SerializableWorldMap, StateDelta } from '@civilization/shared';

interface UseSSEOptions {
  url: string;
  autoConnect?: boolean;
}

export function useSSE(options: UseSSEOptions) {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback((event: string, data: string) => {
    switch (event) {
      case 'full-state': {
        // Received full state from backend
        const serializable = JSON.parse(data) as SerializableWorldMap;
        const newWorldMap: WorldMap = {
          parcels: new Map(serializable.parcels.map((p: Parcel) => [p.id, p])),
          width: serializable.width,
          height: serializable.height,
        };
        setWorldMap(newWorldMap);
        break;
      }

      case 'delta': {
        const delta = JSON.parse(data) as StateDelta;
        setWorldMap((prevWorldMap) => {
          if (!prevWorldMap) return prevWorldMap;

          // Create a new map to trigger re-render
          const updatedMap = { ...prevWorldMap };
          updatedMap.parcels = new Map(prevWorldMap.parcels);

          // Apply deltas
          delta.parcels.forEach((parcelDelta) => {
            const parcel = updatedMap.parcels.get(parcelDelta.id);
            if (parcel && parcelDelta.resources) {
              const updatedParcel = { ...parcel, resources: parcelDelta.resources };
              updatedMap.parcels.set(parcelDelta.id, updatedParcel);
            }
          });

          return updatedMap;
        });
        break;
      }

      default:
        console.log('Unknown SSE message type:', event);
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
    es.addEventListener('full-state', (event) => {
      try {
        console.log('SSE full-state received');
        handleMessage('full-state', (event as MessageEvent).data);
      } catch (err) {
        console.error('Error parsing full-state SSE message:', err);
      }
    });
    es.addEventListener('delta', (event) => {
      try {
        console.log('SSE delta received');
        handleMessage('delta', (event as MessageEvent).data);
      } catch (err) {
        console.error('Error parsing delta SSE message:', err);
      }
    });

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
