/**
 * API service for communicating with the backend server
 */

import type { WorldMap, Parcel } from '../types/map';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Deserialize WorldMap from API response
 */
function deserializeWorldMap(data: any): WorldMap {
  const parcelsMap = new Map<number, Parcel>();
  
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

/**
 * API client class
 */
export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Generate a new world map
   */
  async generateMap(config: { numParcels?: number; seed?: number }): Promise<WorldMap> {
    const response = await fetch(`${this.baseUrl}/api/map/generate`, {
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
    return deserializeWorldMap(data.worldMap);
  }
  
  /**
   * Get current world map
   */
  async getMap(): Promise<WorldMap> {
    const response = await fetch(`${this.baseUrl}/api/map`);
    
    if (!response.ok) {
      throw new Error('Failed to get map');
    }
    
    const data = await response.json();
    return deserializeWorldMap(data.worldMap);
  }
  
  /**
   * Start simulation
   */
  async startSimulation(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/simulation/start`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to start simulation');
    }
  }
  
  /**
   * Stop simulation
   */
  async stopSimulation(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/simulation/stop`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to stop simulation');
    }
  }
  
  /**
   * Set simulation speed
   */
  async setSimulationSpeed(speed: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/simulation/speed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ speed }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to set simulation speed');
    }
  }
  
  /**
   * Get simulation state
   */
  async getSimulationState(): Promise<{ isSimulating: boolean; simulationSpeed: number }> {
    const response = await fetch(`${this.baseUrl}/api/simulation`);
    
    if (!response.ok) {
      throw new Error('Failed to get simulation state');
    }
    
    const data = await response.json();
    return {
      isSimulating: data.isSimulating,
      simulationSpeed: data.simulationSpeed,
    };
  }
  
  /**
   * Create SSE connection for real-time updates
   */
  createEventSource(): EventSource {
    return new EventSource(`${this.baseUrl}/api/events`);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
