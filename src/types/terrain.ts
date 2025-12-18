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
  color: string; // Hex color for visualization (e.g., '#0077be')
}
