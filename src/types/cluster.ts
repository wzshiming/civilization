import type { ClusterID, ClusterTypeID } from './ids.js';

/**
 * Cluster type defining categories of clusters
 * (e.g., "religion", "culture", "clan", "nation", "alliance")
 */
export interface ClusterType {
  clusterTypeID: ClusterTypeID;
  name: string;
  description: string;
}

/**
 * Cluster relationship with another cluster
 */
export interface ClusterRelationship {
  targetCluster: ClusterID;
  favorability: number; // -1.0 (hostile) to 1.0 (friendly)
  attributes: Record<string, number>; // Additional type-specific attributes
}

/**
 * Cluster definition - base type for religions, cultures, clans, etc.
 */
export interface Cluster {
  clusterID: ClusterID;
  clusterType: ClusterTypeID;
  name: string;
  description: string;
  relationships: ClusterRelationship[];
}
