/**
 * API client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface MapGenerationRequest {
  width?: number;
  height?: number;
  numParcels?: number;
  seed?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generate a new map on the backend
 */
export async function generateMap(config: MapGenerationRequest): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/map/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating map:', error);
    return { success: false, error: 'Failed to generate map' };
  }
}

/**
 * Get current map state from backend
 */
export async function getCurrentMap(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/map/current`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting map:', error);
    return { success: false, error: 'Failed to get map' };
  }
}

/**
 * Start simulation on backend
 */
export async function startSimulation(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simulation/start`, {
      method: 'POST',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error starting simulation:', error);
    return { success: false, error: 'Failed to start simulation' };
  }
}

/**
 * Stop simulation on backend
 */
export async function stopSimulation(): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simulation/stop`, {
      method: 'POST',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error stopping simulation:', error);
    return { success: false, error: 'Failed to stop simulation' };
  }
}

/**
 * Set simulation speed on backend
 */
export async function setSimulationSpeed(speed: number): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simulation/speed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ speed }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error setting speed:', error);
    return { success: false, error: 'Failed to set speed' };
  }
}

/**
 * Connect to SSE stream for real-time updates
 */
export function connectSSE(callbacks: {
  onMap?: (map: any) => void;
  onUpdate?: (update: any) => void;
  onSimulation?: (state: any) => void;
  onError?: (error: any) => void;
}): EventSource {
  const eventSource = new EventSource(`${API_BASE_URL}/api/events`);
  
  eventSource.addEventListener('map', (event) => {
    try {
      const data = JSON.parse(event.data);
      callbacks.onMap?.(data);
    } catch (error) {
      console.error('Error parsing map event:', error);
    }
  });
  
  eventSource.addEventListener('update', (event) => {
    try {
      const data = JSON.parse(event.data);
      callbacks.onUpdate?.(data);
    } catch (error) {
      console.error('Error parsing update event:', error);
    }
  });
  
  eventSource.addEventListener('simulation', (event) => {
    try {
      const data = JSON.parse(event.data);
      callbacks.onSimulation?.(data);
    } catch (error) {
      console.error('Error parsing simulation event:', error);
    }
  });
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    callbacks.onError?.(error);
  };
  
  return eventSource;
}
