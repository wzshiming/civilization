export interface Point {
  x: number;
  y: number;
}

export interface Plot {
  plotID: string;
  center: Point;
  vertices: Point[];
  plotAttributes: PlotAttributes;
  area: number;
  perimeter: number;
}

export interface PlotAttributes {
  terrainType: string;
  neighborPlots: string[];
  storages: any[];
  buildings: any[];
  species: any[];
  populations: any[];
}

export interface TerrainType {
  terrainTypeID: string;
  name: string;
  description: string;
  processes: any[];
}

export interface GameMap {
  plots: Plot[];
  terrainTypes: TerrainType[];
  speciesTypes: any[];
  resourceTypes: any[];
  buildingTypes: any[];
  skillTypes: any[];
  religions: any[];
  cultures: any[];
}

export enum SelectionMode {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
  REGION = 'REGION',
  PAINT = 'PAINT',
}

export enum Tool {
  SELECT = 'SELECT',
  PAINT = 'PAINT',
}

export interface Edit {
  type: 'terrain';
  plots: Array<{
    plotID: string;
    oldTerrain: string;
    newTerrain: string;
  }>;
}

export interface EditHistory {
  undoStack: Edit[];
  redoStack: Edit[];
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedPlots: string[];
}
