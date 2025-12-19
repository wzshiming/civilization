import { describe, it, expect } from 'vitest';
import { executeStep, executeSteps } from '../simulation/step.js';
import type { GameMap, Plot, PlotAttributes, TerrainType, UnitType } from '../types/index.js';
import { UnitCategory } from '../types/index.js';

function createTestPlot(
  plotID: string,
  terrainTypeID: string,
  storages: PlotAttributes['storages'] = []
): Plot {
  return {
    plotID,
    center: { x: 0, y: 0 },
    vertices: [],
    area: 100,
    perimeter: 40,
    plotAttributes: {
      terrainType: terrainTypeID,
      neighborPlots: [],
      storages,
      units: [],
      clusters: [],
    },
  };
}

function createTestMap(
  plots: Plot[],
  terrainTypes: TerrainType[] = [],
  unitTypes: UnitType[] = []
): GameMap {
  return {
    plots,
    terrainTypes,
    unitTypes,
    resourceTypes: [],
    skillTypes: [],
    clusterTypes: [],
    clusters: [],
  };
}

describe('executeStep', () => {
  it('should process all plots and return success when no errors', () => {
    const plot1 = createTestPlot('plot-1', 'terrain-1');
    const plot2 = createTestPlot('plot-2', 'terrain-1');
    const map = createTestMap([plot1, plot2]);

    const result = executeStep(map);

    expect(result.success).toBe(true);
    expect(result.processedPlots).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('should execute terrain processes and update resources', () => {
    const terrainType: TerrainType = {
      terrainTypeID: 'grassland',
      name: 'Grassland',
      description: 'Fertile grassland',
      color: '#00ff00',
      processes: [
        {
          name: 'Grass Growth',
          description: 'Natural grass growth',
          inputResources: [],
          outputResources: [{ resourceType: 'grass', size: 10 }],
          processTime: 1,
        },
      ],
    };

    const plot = createTestPlot('plot-1', 'grassland');
    const map = createTestMap([plot], [terrainType]);

    const result = executeStep(map);

    expect(result.success).toBe(true);
    expect(result.resourceChanges.length).toBeGreaterThan(0);

    // Check that grass was added to the plot
    const grassStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'grass'
    );
    expect(grassStorage).toBeDefined();
    expect(grassStorage?.size).toBe(10);
  });

  it('should consume input resources when executing processes', () => {
    const terrainType: TerrainType = {
      terrainTypeID: 'farm',
      name: 'Farm',
      description: 'Farming land',
      color: '#00aa00',
      processes: [
        {
          name: 'Harvest',
          description: 'Harvest crops',
          inputResources: [{ resourceType: 'seeds', size: 5 }],
          outputResources: [{ resourceType: 'food', size: 20 }],
          processTime: 1,
        },
      ],
    };

    const plot = createTestPlot('plot-1', 'farm', [
      { resourceType: 'seeds', size: 10, capacity: 100 },
    ]);
    const map = createTestMap([plot], [terrainType]);

    const result = executeStep(map);

    expect(result.success).toBe(true);

    // Check seeds were consumed
    const seedsStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'seeds'
    );
    expect(seedsStorage?.size).toBe(5); // Started with 10, consumed 5

    // Check food was produced
    const foodStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'food'
    );
    expect(foodStorage?.size).toBe(20);
  });

  it('should not execute process when input resources are insufficient', () => {
    const terrainType: TerrainType = {
      terrainTypeID: 'farm',
      name: 'Farm',
      description: 'Farming land',
      color: '#00aa00',
      processes: [
        {
          name: 'Harvest',
          description: 'Harvest crops',
          inputResources: [{ resourceType: 'seeds', size: 10 }],
          outputResources: [{ resourceType: 'food', size: 20 }],
          processTime: 1,
        },
      ],
    };

    // Plot only has 5 seeds, but process requires 10
    const plot = createTestPlot('plot-1', 'farm', [
      { resourceType: 'seeds', size: 5, capacity: 100 },
    ]);
    const map = createTestMap([plot], [terrainType]);

    const result = executeStep(map);

    expect(result.success).toBe(true);

    // Seeds should be unchanged
    const seedsStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'seeds'
    );
    expect(seedsStorage?.size).toBe(5);

    // Food should not be produced
    const foodStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'food'
    );
    expect(foodStorage).toBeUndefined();
  });



  it('should execute unit processes when workers are present', () => {
    const unitType: UnitType = {
      unitTypeID: 'mill',
      name: 'Mill',
      description: 'Grain mill',
      category: UnitCategory.BUILDING,
      storages: [],
      workerRequirement: [],
      terrainCompatibility: [],
      processes: [
        {
          name: 'Grind Grain',
          description: 'Turn grain into flour',
          inputResources: [{ resourceType: 'grain', size: 5 }],
          outputResources: [{ resourceType: 'flour', size: 10 }],
          processTime: 1,
        },
      ],
    };

    const plot = createTestPlot('plot-1', 'terrain-1', [
      { resourceType: 'grain', size: 20, capacity: 100 },
    ]);
    plot.plotAttributes.units = [
      {
        unitID: 'unit-1',
        unitTypeID: 'mill',
        workerClusterIDs: ['cluster-1']
      },
    ];

    const map = createTestMap([plot], [], []);

    const result = executeStep(map);

    expect(result.success).toBe(true);

    // Grain should be consumed
    const grainStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'grain'
    );
    expect(grainStorage?.size).toBe(15); // 20 - 5 = 15

    // Flour should be produced
    const flourStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'flour'
    );
    expect(flourStorage?.size).toBe(10);
  });

  it('should not execute unit processes when no workers are present', () => {
    const unitType: UnitType = {
      unitTypeID: 'mill',
      name: 'Mill',
      description: 'Grain mill',
      category: UnitCategory.BUILDING,
      storages: [],
      workerRequirement: [],
      terrainCompatibility: [],
      processes: [
        {
          name: 'Grind Grain',
          description: 'Turn grain into flour',
          inputResources: [{ resourceType: 'grain', size: 5 }],
          outputResources: [{ resourceType: 'flour', size: 10 }],
          processTime: 1,
        },
      ],
    };

    const plot = createTestPlot('plot-1', 'terrain-1', [
      { resourceType: 'grain', size: 20, capacity: 100 },
    ]);
    plot.plotAttributes.units = [
      {
        unitID: 'unit-1',
        unitTypeID: 'mill',
        workerClusterIDs: [] // No workers
      },
    ];

    const map = createTestMap([plot], [], []);

    const result = executeStep(map);

    expect(result.success).toBe(true);

    // Grain should be unchanged (no workers to run the mill)
    const grainStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'grain'
    );
    expect(grainStorage?.size).toBe(20);

    // Flour should not be produced
    const flourStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'flour'
    );
    expect(flourStorage).toBeUndefined();
  });

  it('should clamp resources at zero', () => {
    const terrainType: TerrainType = {
      terrainTypeID: 'terrain-1',
      name: 'Test Terrain',
      description: 'Test',
      color: '#ffffff',
      processes: [
        {
          name: 'Consume All',
          description: 'Consumes resources',
          inputResources: [{ resourceType: 'resource-1', size: 100 }],
          outputResources: [],
          processTime: 1,
        },
      ],
    };

    const plot = createTestPlot('plot-1', 'terrain-1', [
      { resourceType: 'resource-1', size: 50, capacity: 100 },
    ]);
    const map = createTestMap([plot], [terrainType]);

    executeStep(map);

    // Process should not execute since we don't have enough resources
    const storage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'resource-1'
    );
    expect(storage?.size).toBe(50);
  });

  it('should clamp resources at capacity', () => {
    const terrainType: TerrainType = {
      terrainTypeID: 'terrain-1',
      name: 'Test Terrain',
      description: 'Test',
      color: '#ffffff',
      processes: [
        {
          name: 'Produce Excess',
          description: 'Produces more than capacity',
          inputResources: [],
          outputResources: [{ resourceType: 'resource-1', size: 100 }],
          processTime: 1,
        },
      ],
    };

    const plot = createTestPlot('plot-1', 'terrain-1', [
      { resourceType: 'resource-1', size: 80, capacity: 100 },
    ]);
    const map = createTestMap([plot], [terrainType]);

    executeStep(map);

    // Should be clamped at capacity
    const storage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'resource-1'
    );
    expect(storage?.size).toBe(100);
  });
});

describe('executeSteps', () => {
  it('should execute multiple steps', () => {
    const terrainType: TerrainType = {
      terrainTypeID: 'grassland',
      name: 'Grassland',
      description: 'Fertile grassland',
      color: '#00ff00',
      processes: [
        {
          name: 'Grass Growth',
          description: 'Natural grass growth',
          inputResources: [],
          outputResources: [{ resourceType: 'grass', size: 5 }],
          processTime: 1,
        },
      ],
    };

    const plot = createTestPlot('plot-1', 'grassland');
    const map = createTestMap([plot], [terrainType]);

    const results = executeSteps(map, 3);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);

    // Grass should have grown 3 times
    const grassStorage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === 'grass'
    );
    expect(grassStorage?.size).toBe(15); // 5 * 3 = 15
  });

  it('should return empty array when count is 0', () => {
    const map = createTestMap([]);
    const results = executeSteps(map, 0);
    expect(results).toHaveLength(0);
  });
});
