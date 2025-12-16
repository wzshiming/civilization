/**
 * API client for backend communication
 */

import type { WorldMap, Parcel, Boundary } from '../types/map';

// Use relative URL in development (proxied by Vite) or configured URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface SerializedMap {
  parcels: Array<Parcel & { id: number }>;
  boundaries: Boundary[];
  width: number;
  height: number;
  lastUpdate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Deserialize map from API response
export function deserializeMap(serialized: SerializedMap): WorldMap {
  const parcelsMap = new Map<number, Parcel>();
  serialized.parcels.forEach((parcel) => {
    parcelsMap.set(parcel.id, parcel);
  });

  return {
    parcels: parcelsMap,
    boundaries: serialized.boundaries,
    width: serialized.width,
    height: serialized.height,
    lastUpdate: serialized.lastUpdate,
  };
}

// API functions
export const api = {
  // Generate a new map
  async generateMap(config: {
    width?: number;
    height?: number;
    numParcels?: number;
    seed?: number;
  }): Promise<WorldMap> {
    const response = await fetch(`${API_BASE_URL}/api/map/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to generate map');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Map generation failed');
    }

    return deserializeMap(data.map);
  },

  // Get current map
  async getCurrentMap(): Promise<WorldMap | null> {
    const response = await fetch(`${API_BASE_URL}/api/map/current`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get current map');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to get map');
    }

    return deserializeMap(data.map);
  },

  // Start simulation
  async startSimulation(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/simulation/start`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to start simulation');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Simulation start failed');
    }
  },

  // Stop simulation
  async stopSimulation(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/simulation/stop`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to stop simulation');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Simulation stop failed');
    }
  },

  // Change simulation speed
  async changeSimulationSpeed(speed: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/simulation/speed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ speed }),
    });

    if (!response.ok) {
      throw new Error('Failed to change simulation speed');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Speed change failed');
    }
  },

  // Get simulation status
  async getSimulationStatus(): Promise<{ isSimulating: boolean; speed: number }> {
    const response = await fetch(`${API_BASE_URL}/api/simulation/status`);

    if (!response.ok) {
      throw new Error('Failed to get simulation status');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Failed to get status');
    }

    return {
      isSimulating: data.isSimulating,
      speed: data.speed,
    };
  },

  // Create SSE connection
  createEventSource(): EventSource {
    return new EventSource(`${API_BASE_URL}/api/events`);
  },
};
