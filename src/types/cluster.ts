import type { ClusterID, ClusterTypeID, TerrainTypeID } from './ids.js';
import type { Skill } from './skills.js';
import type { SpeciesID } from './ids.js';

/**
 * Cluster category enum
 */
export enum ClusterCategory {
  ENLIGHTENED = 'ENLIGHTENED',
  ANIMAL = 'ANIMAL'
}

/**
 * Cluster type defining categories of clusters
 * (e.g., "religion", "culture", "clan", "nation", "alliance")
 */
export interface ClusterType {
  clusterTypeID: ClusterTypeID;
  name: string;
  description: string;
  category: ClusterCategory;
  terrainPreference: TerrainTypeID[];
  domesticable: boolean;
}

/**
 * Cluster relationship with another cluster
 */
export interface ClusterRelationship {
  targetCluster: ClusterID;
  favorability: number; // -1.0 (hostile) to 1.0 (friendly)
}

/**
 * Cluster definition - base type for religions, cultures, clans, etc.
 */
export interface Cluster {
  clusterID: ClusterID;
  clusterTypeID: ClusterTypeID;
  name: string;
  description: string;
  skills: Skill[];
  speciesID?: SpeciesID;
  size: number;
  relationships: ClusterRelationship[];
}
