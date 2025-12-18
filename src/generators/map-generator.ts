import type {
  GameMap,
  MapConfig,
  Plot,
  PlotAttributes,
  PlotID,
  TerrainType,
  TerrainTypeID,
  Point,
  ResourceType,
  SpeciesType,
  BuildingType,
  SkillType,
  Religion,
  Culture
} from '../types/index.js';
import {
  SeededRandom,
  generateId,
  generateSeedPoints,
  generateVoronoi,
  lloydRelaxation,
  calculateCellMetrics
} from '../utils/index.js';
import { NoiseGenerator } from '../utils/noise.js';

/**
 * Default terrain types for the map
 */
function createDefaultTerrainTypes(random: SeededRandom): TerrainType[] {
  return [
    {
      terrainTypeID: generateId(random),
      name: 'Ocean',
      description: 'Deep ocean water',
      processes: []
    },
    {
      terrainTypeID: generateId(random),
      name: 'Coastal',
      description: 'Shallow coastal waters',
      processes: []
    },
    {
      terrainTypeID: generateId(random),
      name: 'Plains',
      description: 'Flat grasslands suitable for farming',
      processes: []
    },
    {
      terrainTypeID: generateId(random),
      name: 'Forest',
      description: 'Dense woodland',
      processes: []
    },
    {
      terrainTypeID: generateId(random),
      name: 'Hills',
      description: 'Rolling hills with varied terrain',
      processes: []
    },
    {
      terrainTypeID: generateId(random),
      name: 'Mountains',
      description: 'Tall mountain ranges',
      processes: []
    },
    {
      terrainTypeID: generateId(random),
      name: 'Desert',
      description: 'Arid desert with little vegetation',
      processes: []
    },
    {
      terrainTypeID: generateId(random),
      name: 'Tundra',
      description: 'Cold arctic region',
      processes: []
    }
  ];
}

/**
 * Map Generator class
 * Responsible for creating game worlds with irregular plot shapes,
 * dynamic attributes, and configurable terrain generation
 */
export class MapGenerator {
  private config: MapConfig;
  private random: SeededRandom;
  private noise: NoiseGenerator;
  private terrainTypes: TerrainType[];

  constructor(config: MapConfig) {
    this.config = config;
    this.random = new SeededRandom(config.randomSeed);
    this.noise = new NoiseGenerator(config.randomSeed);
    this.terrainTypes = createDefaultTerrainTypes(this.random);
  }

  /**
   * Generate the complete game map
   */
  generate(): GameMap {
    // Phase 1: Generate plot shapes using Voronoi tessellation
    const plots = this.generatePlots();

    // Phase 2: Calculate neighbors (accounting for projection wrapping)
    this.calculateNeighbors(plots);

    // Phase 3: Generate terrain
    this.generateTerrain(plots);

    // Return the complete map
    return {
      plots,
      speciesTypes: [],
      resourceTypes: [],
      buildingTypes: [],
      terrainTypes: this.terrainTypes,
      skillTypes: [],
      religions: [],
      cultures: []
    };
  }

  /**
   * Phase 1: Generate irregular plots using Voronoi tessellation
   */
  private generatePlots(): Plot[] {
    const { plotCount, dimensions, relaxationSteps, projection } = this.config;

    // Generate seed points with pole scaling for spherical projection
    let seedPoints = generateSeedPoints(plotCount, dimensions, this.random);

    // Apply pole scaling for spherical projection
    if (projection.poleScaling !== 1.0 && projection.wrapVertical) {
      seedPoints = this.applyPoleScaling(seedPoints);
    }

    // Apply Lloyd's relaxation for more even distribution
    if (relaxationSteps > 0) {
      seedPoints = lloydRelaxation(seedPoints, dimensions, relaxationSteps);
    }

    // Generate Voronoi tessellation
    const voronoi = generateVoronoi(seedPoints, dimensions);

    // Create plots from Voronoi cells
    const plots: Plot[] = [];
    for (let i = 0; i < voronoi.cells.length; i++) {
      const cell = voronoi.cells[i];
      const metrics = calculateCellMetrics(cell);

      const plotID = generateId(this.random);
      const plot: Plot = {
        plotID,
        center: cell.center,
        vertices: cell.vertices,
        area: metrics.area,
        perimeter: metrics.perimeter,
        plotAttributes: {
          terrainType: this.terrainTypes[0].terrainTypeID, // Default to ocean, will be updated
          neighborPlots: [], // Will be filled in neighbor calculation
          storages: [],
          buildings: [],
          species: [],
          populations: []
        }
      };

      plots.push(plot);
    }

    return plots;
  }

  /**
   * Apply pole scaling - reduce point density near poles for spherical projection
   */
  private applyPoleScaling(points: Point[]): Point[] {
    const { dimensions, projection } = this.config;
    const midY = dimensions.height / 2;

    return points.map(p => {
      // Calculate distance from equator (0 at equator, 1 at poles)
      const latitudeFactor = Math.abs(p.y - midY) / midY;
      
      // Apply scaling - points near poles are pushed towards equator
      // This effectively reduces density at poles
      const scaleFactor = 1 - latitudeFactor * (1 - 1 / projection.poleScaling);
      
      return {
        x: p.x,
        y: midY + (p.y - midY) * scaleFactor
      };
    });
  }

  /**
   * Phase 2: Calculate neighbor relationships between plots
   */
  private calculateNeighbors(plots: Plot[]): void {
    const { dimensions, projection } = this.config;
    const plotMap = new Map<PlotID, Plot>();
    
    for (const plot of plots) {
      plotMap.set(plot.plotID, plot);
    }

    // Build spatial index for efficient neighbor lookup
    const gridSize = Math.ceil(Math.sqrt(plots.length));
    const cellWidth = dimensions.width / gridSize;
    const cellHeight = dimensions.height / gridSize;
    const spatialGrid: Map<string, Plot[]> = new Map();

    for (const plot of plots) {
      const gridX = Math.floor(plot.center.x / cellWidth);
      const gridY = Math.floor(plot.center.y / cellHeight);
      const key = `${gridX},${gridY}`;
      
      if (!spatialGrid.has(key)) {
        spatialGrid.set(key, []);
      }
      spatialGrid.get(key)!.push(plot);
    }

    // For each plot, find neighbors by checking nearby grid cells
    for (const plot of plots) {
      const gridX = Math.floor(plot.center.x / cellWidth);
      const gridY = Math.floor(plot.center.y / cellHeight);
      const neighbors: Set<PlotID> = new Set();

      // Check surrounding grid cells
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          let checkX = gridX + dx;
          let checkY = gridY + dy;

          // Handle wrapping
          if (projection.wrapHorizontal) {
            checkX = ((checkX % gridSize) + gridSize) % gridSize;
          }
          if (projection.wrapVertical) {
            checkY = ((checkY % gridSize) + gridSize) % gridSize;
          }

          // Skip if out of bounds (for non-wrapping)
          if (!projection.wrapHorizontal && (checkX < 0 || checkX >= gridSize)) continue;
          if (!projection.wrapVertical && (checkY < 0 || checkY >= gridSize)) continue;

          const key = `${checkX},${checkY}`;
          const cellPlots = spatialGrid.get(key) || [];

          for (const other of cellPlots) {
            if (other.plotID === plot.plotID) continue;

            // Check if plots share an edge (are Voronoi neighbors)
            if (this.areNeighbors(plot, other, projection)) {
              neighbors.add(other.plotID);
            }
          }
        }
      }

      plot.plotAttributes.neighborPlots = Array.from(neighbors);
    }
  }

  /**
   * Check if two plots are neighbors by comparing their Voronoi edges
   */
  private areNeighbors(
    plot1: Plot,
    plot2: Plot,
    projection: { wrapHorizontal: boolean; wrapVertical: boolean }
  ): boolean {
    const { dimensions } = this.config;
    
    // Calculate distance between centers, accounting for wrapping
    let dx = Math.abs(plot1.center.x - plot2.center.x);
    let dy = Math.abs(plot1.center.y - plot2.center.y);

    if (projection.wrapHorizontal) {
      dx = Math.min(dx, dimensions.width - dx);
    }
    if (projection.wrapVertical) {
      dy = Math.min(dy, dimensions.height - dy);
    }

    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Approximate threshold based on average cell size
    const avgCellSize = Math.sqrt((dimensions.width * dimensions.height) / this.config.plotCount);
    const threshold = avgCellSize * 1.5;

    return distance < threshold;
  }

  /**
   * Phase 3: Generate terrain using noise-based elevation
   */
  private generateTerrain(plots: Plot[]): void {
    const { terrain, dimensions } = this.config;
    
    // Calculate elevation for each plot
    const elevations: Map<PlotID, number> = new Map();
    const temperatures: Map<PlotID, number> = new Map();

    for (const plot of plots) {
      // Generate elevation using fractal noise
      const nx = plot.center.x / dimensions.width;
      const ny = plot.center.y / dimensions.height;
      
      // Base elevation from noise
      let elevation = this.noise.fbm(nx * 4, ny * 4, 6, 0.5);
      
      // Add continent influence
      elevation += this.generateContinentNoise(nx, ny);
      
      // Add island noise
      if (terrain.islandFrequency > 0) {
        elevation += this.noise.ridgeNoise(nx * 8, ny * 8, 4, 0.6) * terrain.islandFrequency * 0.3;
      }
      
      // Add coastal roughness
      elevation += this.noise.noise2D(nx * 16, ny * 16) * terrain.coastalRoughness * 0.1;
      
      // Normalize to 0-1 range
      elevation = (elevation + 1) / 2;
      elevations.set(plot.plotID, elevation);

      // Calculate temperature based on latitude
      const latitude = Math.abs(ny - 0.5) * 2; // 0 at equator, 1 at poles
      const temperature = 1 - latitude - this.config.climateVariance * this.noise.noise2D(nx * 2, ny * 2) * 0.2;
      temperatures.set(plot.plotID, Math.max(0, Math.min(1, temperature)));
    }

    // Sort plots by elevation to determine ocean coverage
    const sortedPlots = [...plots].sort((a, b) => 
      (elevations.get(a.plotID) || 0) - (elevations.get(b.plotID) || 0)
    );

    const oceanCount = Math.floor(plots.length * terrain.oceanPercentage);
    const oceanPlots = new Set(sortedPlots.slice(0, oceanCount).map(p => p.plotID));

    // Assign terrain types based on elevation and temperature
    for (const plot of plots) {
      const elevation = elevations.get(plot.plotID) || 0;
      const temperature = temperatures.get(plot.plotID) || 0.5;
      
      plot.plotAttributes.terrainType = this.determineTerrainType(
        plot.plotID,
        elevation,
        temperature,
        oceanPlots,
        terrain.oceanPercentage
      );
    }
  }

  /**
   * Generate noise for continent distribution
   */
  private generateContinentNoise(nx: number, ny: number): number {
    const { terrain } = this.config;
    
    // Use low-frequency noise for large continent shapes
    let continentNoise = this.noise.fbm(nx * terrain.continentCount * 0.5, ny * terrain.continentCount * 0.5, 4, 0.6);
    
    // Adjust based on desired ocean percentage
    const targetLand = 1 - terrain.oceanPercentage;
    continentNoise = continentNoise * targetLand - (1 - targetLand);
    
    return continentNoise;
  }

  /**
   * Determine terrain type based on elevation, temperature, and ocean status
   */
  private determineTerrainType(
    plotID: PlotID,
    elevation: number,
    temperature: number,
    oceanPlots: Set<PlotID>,
    oceanPercentage: number
  ): TerrainTypeID {
    // Check if this is an ocean plot
    if (oceanPlots.has(plotID)) {
      // Distinguish between deep ocean and coastal
      const normalizedElevation = elevation / oceanPercentage;
      if (normalizedElevation > 0.7) {
        return this.terrainTypes[1].terrainTypeID; // Coastal
      }
      return this.terrainTypes[0].terrainTypeID; // Ocean
    }

    // Land terrain types based on elevation and temperature
    const landElevation = (elevation - oceanPercentage) / (1 - oceanPercentage);

    // High elevation = mountains or hills
    if (landElevation > 0.8) {
      return this.terrainTypes[5].terrainTypeID; // Mountains
    }
    if (landElevation > 0.6) {
      return this.terrainTypes[4].terrainTypeID; // Hills
    }

    // Mid elevation - depends on temperature
    if (temperature < 0.2) {
      return this.terrainTypes[7].terrainTypeID; // Tundra
    }
    if (temperature > 0.7 && landElevation < 0.3) {
      return this.terrainTypes[6].terrainTypeID; // Desert
    }
    if (temperature > 0.3 && temperature < 0.8 && landElevation > 0.3) {
      return this.terrainTypes[3].terrainTypeID; // Forest
    }

    // Default to plains
    return this.terrainTypes[2].terrainTypeID; // Plains
  }
}

/**
 * Create a default map configuration
 */
export function createDefaultMapConfig(): MapConfig {
  return {
    plotCount: 2000,
    dimensions: {
      width: 1000.0,
      height: 600.0
    },
    projection: {
      wrapHorizontal: true,
      wrapVertical: false,
      poleScaling: 1.0
    },
    terrain: {
      oceanPercentage: 0.65,
      continentCount: 4,
      islandFrequency: 0.15,
      coastalRoughness: 0.3
    },
    resourceDensity: 0.08,
    climateVariance: 0.2,
    randomSeed: 42,
    relaxationSteps: 3
  };
}

/**
 * Convenience function to generate a map with default or custom config
 */
export function generateMap(config?: Partial<MapConfig>): GameMap {
  const fullConfig = {
    ...createDefaultMapConfig(),
    ...config
  };
  
  const generator = new MapGenerator(fullConfig);
  return generator.generate();
}
