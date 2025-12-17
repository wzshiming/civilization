/**
 * Custom hook for Server-Sent Events connection to backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WorldMap, Parcel, ViewportBounds } from '@civilization/shared';
import type { SerializableWorldMap, StateDelta } from '@civilization/shared';

interface UseSSEOptions {
  url: string;
  autoConnect?: boolean;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useSSE(options: UseSSEOptions) {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);

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
        let hasUpdates = false;
        
        setWorldMap((prevWorldMap) => {
          if (!prevWorldMap) return prevWorldMap;

          // Update parcels in place to keep worldMap reference stable
          // This prevents MapRenderer from re-initializing on every delta
          delta.parcels.forEach((parcelDelta) => {
            const parcel = prevWorldMap.parcels.get(parcelDelta.id);
            if (parcel && parcelDelta.resources) {
              // Update the parcel's resources in place
              parcel.resources = parcelDelta.resources;
              hasUpdates = true;
            }
          });

          // Return the same reference
          return prevWorldMap;
        });
        
        // Increment counter only if parcels were actually updated
        if (hasUpdates) {
          setUpdateCounter(c => c + 1);
        }
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

    // Generate a unique client ID
    const newClientId = `client-${Date.now()}-${Math.random()}`;
    setClientId(newClientId);

    console.log(`Connecting to SSE at ${options.url} with clientId: ${newClientId}`);
    const es = new EventSource(`${options.url}?clientId=${newClientId}`);

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
      setClientId(null);
    };
    es.addEventListener('full-state', (event: MessageEvent) => {
      try {
        handleMessage('full-state', event.data);
      } catch (err) {
        console.error('Error parsing full-state SSE message:', err);
      }
    });
    es.addEventListener('delta', (event: MessageEvent) => {
      try {
        handleMessage('delta', event.data);
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
      setClientId(null);
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

  const updateViewport = useCallback(async (viewport: ViewportBounds) => {
    if (!clientId) {
      console.warn('Cannot update viewport: no clientId');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/viewport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          viewport,
        }),
      });

      if (!response.ok) {
        console.error('Failed to update viewport:', response.statusText);
      }
    } catch (err) {
      console.error('Error updating viewport:', err);
    }
  }, [clientId]);

  return {
    worldMap,
    isConnected,
    error,
    connect,
    disconnect,
    updateCounter, // Used to trigger re-renders when worldMap is updated in place
    clientId,
    updateViewport,
  };
}
