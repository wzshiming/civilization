import type { PlotID, ClusterID, TerrainTypeID } from './ids.js';
import type { Point } from './geometry.js';
import type { StorageType } from './storage.js';
import type { Unit } from './unit.js';
import type { Cluster } from './cluster.js';

/**
 * Plot attributes containing ownership, terrain, and contents
 */
export interface PlotAttributes {
  ownerClusterID?: ClusterID;
  terrainType: TerrainTypeID;
  neighborPlots: PlotID[];
  storages: StorageType[];
  units: Unit[];
  clusters: Cluster[];
}

/**
 * A plot is an irregular polygon on the map
 */
export interface Plot {
  plotID: PlotID;
  center: Point;
  vertices: Point[];
  plotAttributes: PlotAttributes;
  area: number;
  perimeter: number;
}
