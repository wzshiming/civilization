import type { TerrainTypeID } from './ids.js';
import type { ProcessType } from './species.js';

/**
 * Terrain type definition
 */
export interface TerrainType {
  terrainTypeID: TerrainTypeID;
  name: string;
  description: string;
  processes: ProcessType[];
  color?: string; // Hex color for visualization (e.g., '#0077be')
}

/**
 * Get the default color for a terrain type based on its ID
 */
export function getTerrainColor(terrainID: string): string {
  const colors: Record<string, string> = {
    ocean: '#0077be',
    coastal: '#4a9eff',
    plains: '#7cb342',
    forest: '#2e7d32',
    hills: '#8d6e63',
    mountains: '#5d4037',
    desert: '#fdd835',
    tundra: '#e0e0e0',
  };
  return colors[terrainID.toLowerCase()] || '#666';
}
