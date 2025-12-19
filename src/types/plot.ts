import type { PlotID, OrganizationID, TerrainTypeID } from './ids.js';
import type { Point } from './geometry.js';
import type { StorageType } from './storage.js';
import type { Building } from './building.js';
import type { Species, Population } from './species.js';

/**
 * Plot attributes containing ownership, terrain, and contents
 */
export interface PlotAttributes {
  ownerOrganizationID?: OrganizationID;
  terrainType: TerrainTypeID;
  neighborPlots: PlotID[];
  storages: StorageType[];
  buildings: Building[];
  species: Species[];
  populations: Population[];
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
