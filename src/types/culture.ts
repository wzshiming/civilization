import type { CultureID } from './ids.js';

/**
 * Culture relationship with another culture
 */
export interface CultureRelationship {
  targetCulture: CultureID;
  favorability: number; // -1.0 to 1.0
  affinity: number; // 0.0 to 1.0
}

/**
 * Culture definition
 */
export interface Culture {
  cultureID: CultureID;
  name: string;
  description: string;
  relationships: CultureRelationship[];
}
