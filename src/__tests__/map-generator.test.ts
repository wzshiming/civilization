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

  it('should generate unit types including building and movable units', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    expect(map.unitTypes.length).toBeGreaterThan(0);

    // Check for building units
    const buildingUnits = map.unitTypes.filter(u => u.category === 'BUILDING');
    expect(buildingUnits.length).toBeGreaterThan(0);

    // Check for movable units  
    const movableUnits = map.unitTypes.filter(u => u.category === 'MOVABLE');
    expect(movableUnits.length).toBeGreaterThan(0);

    // Check unit structure
    for (const unitType of map.unitTypes) {
      expect(unitType.unitTypeID).toBeTruthy();
      expect(unitType.name).toBeTruthy();
      expect(unitType.category).toMatch(/^(BUILDING|MOVABLE)$/);
      expect(Array.isArray(unitType.terrainCompatibility)).toBe(true);
    }
  });

  it('should generate cluster types including enlightened and animal clusters', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    expect(map.clusterTypes.length).toBeGreaterThan(0);

    // Check for enlightened clusters
    const enlightenedClusters = map.clusterTypes.filter(c => c.category === 'ENLIGHTENED');
    expect(enlightenedClusters.length).toBeGreaterThan(0);

    // Check for animal clusters
    const animalClusters = map.clusterTypes.filter(c => c.category === 'ANIMAL');
    expect(animalClusters.length).toBeGreaterThan(0);

    // Check cluster type structure
    for (const clusterType of map.clusterTypes) {
      expect(clusterType.clusterTypeID).toBeTruthy();
      expect(clusterType.name).toBeTruthy();
      expect(clusterType.category).toMatch(/^(ENLIGHTENED|ANIMAL)$/);
      expect(Array.isArray(clusterType.terrainPreference)).toBe(true);
      expect(typeof clusterType.domesticable).toBe('boolean');
    }
  });

  it('should spawn units on plots based on terrain compatibility', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 200,
      randomSeed: 42,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    // At least some plots should have units
    const plotsWithUnits = map.plots.filter(p => p.plotAttributes.units.length > 0);
    expect(plotsWithUnits.length).toBeGreaterThan(0);

    // Verify unit structure on plots
    for (const plot of plotsWithUnits) {
      for (const unit of plot.plotAttributes.units) {
        expect(unit.unitID).toBeTruthy();
        expect(unit.unitTypeID).toBeTruthy();
        expect(Array.isArray(unit.workerClusterIDs)).toBe(true);
      }
    }
  });

  it('should spawn clusters on plots based on terrain preference', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 200,
      randomSeed: 42,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    // At least some plots should have clusters
    const plotsWithClusters = map.plots.filter(p => p.plotAttributes.clusters.length > 0);
    expect(plotsWithClusters.length).toBeGreaterThan(0);

    // Clusters should also be in the top-level clusters array
    expect(map.clusters.length).toBeGreaterThan(0);

    // Verify cluster structure
    for (const cluster of map.clusters) {
      expect(cluster.clusterID).toBeTruthy();
      expect(cluster.clusterTypeID).toBeTruthy();
      expect(cluster.name).toBeTruthy();
      expect(typeof cluster.size).toBe('number');
      expect(cluster.size).toBeGreaterThan(0);
    }
  });

  it('should include expected building unit types', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    const unitNames = map.unitTypes.map(u => u.name);
    expect(unitNames).toContain('Cave');
    expect(unitNames).toContain('Bonfire');
    expect(unitNames).toContain('Farm Ground');
    expect(unitNames).toContain('Ranch Ground');
    expect(unitNames).toContain('Fishing Ground');
    expect(unitNames).toContain('Picking Ground');
  });

  it('should include expected movable unit types', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    const unitNames = map.unitTypes.map(u => u.name);
    expect(unitNames).toContain('Hunting Team');
    expect(unitNames).toContain('Trade Team');
    expect(unitNames).toContain('Warriors Team');
  });

  it('should include expected enlightened cluster types', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    const clusterNames = map.clusterTypes.map(c => c.name);
    expect(clusterNames).toContain('Human');
    expect(clusterNames).toContain('Elf');
    expect(clusterNames).toContain('Orc');
  });

  it('should include expected animal cluster types', () => {
    const config: MapConfig = {
      ...createDefaultMapConfig(),
      plotCount: 50,
      relaxationSteps: 1
    };

    const generator = new MapGenerator(config);
    const map = generator.generate();

    const clusterNames = map.clusterTypes.map(c => c.name);
    expect(clusterNames).toContain('Horse');
    expect(clusterNames).toContain('Cattle');
    expect(clusterNames).toContain('Chicken');
    expect(clusterNames).toContain('Goat');
    expect(clusterNames).toContain('Sheep');
  });
});
