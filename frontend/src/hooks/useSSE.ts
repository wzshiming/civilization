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
        // Received delta update
        const delta = message.data as StateDelta;
        setWorldMap((prevMap) => {
          if (!prevMap) return prevMap;

          // Create a new map to trigger re-render
          const updatedMap = { ...prevMap };
          updatedMap.parcels = new Map(prevMap.parcels);

          // Apply deltas
          delta.parcels.forEach((parcelDelta) => {
            const parcel = updatedMap.parcels.get(parcelDelta.id);
            if (parcel && parcelDelta.resources) {
              const updatedParcel = { ...parcel, resources: parcelDelta.resources };
              updatedMap.parcels.set(parcelDelta.id, updatedParcel);
            }
          });

          updatedMap.lastUpdate = delta.lastUpdate;
          return updatedMap;
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
