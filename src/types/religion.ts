import type { ReligionID } from './ids.js';

/**
 * Religion relationship with another religion
 */
export interface ReligionRelationship {
  targetReligion: ReligionID;
  favorability: number; // -1.0 (hostile) to 1.0 (friendly)
  tolerance: number; // 0.0 to 1.0
}

/**
 * Religion definition
 */
export interface Religion {
  religionID: ReligionID;
  name: string;
  description: string;
  relationships: ReligionRelationship[];
}
