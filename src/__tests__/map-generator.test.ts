import { describe, it, expect } from 'vitest';
import { MapGenerator, createDefaultMapConfig, generateMap } from '../generators/map-generator.js';
import type { MapConfig } from '../types/index.js';

describe('MapGenerator', () => {
  it('should generate a map with the specified number of plots', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 100,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    expect(map.plots.length).toBe(100);
  });

  it('should generate deterministic maps with the same seed', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      randomSeed: 42,
      relaxationSteps: 1
    };

    const map1 = new MapGenerator(config).generate();
    const map2 = new MapGenerator(config).generate();

    expect(map1.plots.length).toBe(map2.plots.length);
    
    // Check that plot centers match
    for (let i = 0; i < map1.plots.length; i++) {
      expect(map1.plots[i].center.x).toBeCloseTo(map2.plots[i].center.x, 5);
      expect(map1.plots[i].center.y).toBeCloseTo(map2.plots[i].center.y, 5);
    }
  });

  it('should generate different maps with different seeds', () => {
    const config1: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      randomSeed: 42,
      relaxationSteps: 1
    };

    const config2: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      randomSeed: 123,
      relaxationSteps: 1
    };

    const map1 = new MapGenerator(config1).generate();
    const map2 = new MapGenerator(config2).generate();

    // At least some plot centers should be different
    let differentCount = 0;
    for (let i = 0; i < map1.plots.length; i++) {
      if (map1.plots[i].center.x !== map2.plots[i].center.x ||
          map1.plots[i].center.y !== map2.plots[i].center.y) {
        differentCount++;
      }
    }
    expect(differentCount).toBeGreaterThan(0);
  });

  it('should generate plots with valid attributes', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    for (const plot of map.plots) {
      // Check plot structure
      expect(plot.plotID).toBeTruthy();
      expect(typeof plot.plotID).toBe('string');
      expect(plot.center.x).toBeGreaterThanOrEqual(0);
      expect(plot.center.x).toBeLessThanOrEqual(config.dimensions.width);
      expect(plot.center.y).toBeGreaterThanOrEqual(0);
      expect(plot.center.y).toBeLessThanOrEqual(config.dimensions.height);
      expect(plot.area).toBeGreaterThanOrEqual(0);
      expect(plot.perimeter).toBeGreaterThanOrEqual(0);
      
      // Check plot attributes
      expect(plot.plotAttributes).toBeDefined();
      expect(plot.plotAttributes.terrainType).toBeTruthy();
      expect(Array.isArray(plot.plotAttributes.neighborPlots)).toBe(true);
    }
  });

  it('should generate terrain types', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    expect(map.terrainTypes.length).toBeGreaterThan(0);
    
    for (const terrainType of map.terrainTypes) {
      expect(terrainType.terrainTypeID).toBeTruthy();
      expect(terrainType.name).toBeTruthy();
    }
  });

  it('should respect ocean percentage approximately', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 200,
      terrain: {
        oceanPercentage: 0.6,
        continentCount: 4,
        islandFrequency: 0.15,
        coastalRoughness: 0.3
      },
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    // Find ocean and coastal terrain types
    const oceanTypes = map.terrainTypes
      .filter(t => t.name === 'Ocean' || t.name === 'Coastal')
      .map(t => t.terrainTypeID);

    // Count ocean plots
    const oceanPlots = map.plots.filter(p => 
      oceanTypes.includes(p.plotAttributes.terrainType)
    );

    const actualOceanPercentage = oceanPlots.length / map.plots.length;
    
    // Allow some variance since terrain generation isn't exact
    expect(actualOceanPercentage).toBeGreaterThan(0.4);
    expect(actualOceanPercentage).toBeLessThan(0.8);
  });

  it('should calculate neighbor relationships', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    // At least some plots should have neighbors
    const plotsWithNeighbors = map.plots.filter(p => 
      p.plotAttributes.neighborPlots.length > 0
    );
    expect(plotsWithNeighbors.length).toBeGreaterThan(0);

    // Neighbors should be valid plot IDs
    const plotIDs = new Set(map.plots.map(p => p.plotID));
    for (const plot of map.plots) {
      for (const neighborID of plot.plotAttributes.neighborPlots) {
        expect(plotIDs.has(neighborID)).toBe(true);
      }
    }
  });

  it('should work with the generateMap convenience function', () => {
    const map = generateMap({
      plotCount: 30,
      randomSeed: 42,
      relaxationSteps: 1
    });

    expect(map.plots.length).toBe(30);
    expect(map.terrainTypes.length).toBeGreaterThan(0);
  });

  it('should support flat projection (no wrapping)', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      projection: {
        wrapHorizontal: false,
        wrapVertical: false,
        poleScaling: 1.0
      },
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    expect(map.plots.length).toBe(50);
  });

  it('should support cylindrical projection (horizontal wrap)', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      projection: {
        wrapHorizontal: true,
        wrapVertical: false,
        poleScaling: 1.0
      },
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    expect(map.plots.length).toBe(50);
  });

  it('should support spherical projection (both wrap with pole scaling)', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      projection: {
        wrapHorizontal: true,
        wrapVertical: true,
        poleScaling: 1.5
      },
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    expect(map.plots.length).toBe(50);
  });
});
