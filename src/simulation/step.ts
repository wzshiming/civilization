import type { GameMap, Plot, StorageType, ResourceChange, ProcessType } from '../types/index.js';
import type { StepResult, ResourceChangeLog, StepError } from './types.js';

/**
 * Apply a resource change to a plot's storage
 */
function applyResourceChange(
  plot: Plot,
  change: ResourceChange,
  source: string,
  resourceChanges: ResourceChangeLog[]
): void {
  // Find existing storage for this resource type
  let storage = plot.plotAttributes.storages.find(
    (s) => s.resourceType === change.resourceType
  );

  const previousSize = storage?.size ?? 0;

  if (!storage) {
    // Create new storage if it doesn't exist
    storage = {
      resourceType: change.resourceType,
      size: 0,
      capacity: Infinity,
    };
    plot.plotAttributes.storages.push(storage);
  }

  // Apply the change
  storage.size += change.size;

  // Clamp to valid range (0 to capacity)
  storage.size = Math.max(0, Math.min(storage.size, storage.capacity));

  // Log the change
  resourceChanges.push({
    plotID: plot.plotID,
    resourceType: change.resourceType,
    previousSize,
    newSize: storage.size,
    source,
  });
}

/**
 * Check if a plot has enough resources for a process's inputs
 */
function hasRequiredResources(plot: Plot, process: ProcessType): boolean {
  for (const input of process.inputResources) {
    const storage = plot.plotAttributes.storages.find(
      (s) => s.resourceType === input.resourceType
    );
    if (!storage || storage.size < input.size) {
      return false;
    }
  }
  return true;
}

/**
 * Execute a single process on a plot
 */
function executeProcess(
  plot: Plot,
  process: ProcessType,
  source: string,
  resourceChanges: ResourceChangeLog[],
  errors: StepError[]
): boolean {
  // Check if we have required input resources
  if (!hasRequiredResources(plot, process)) {
    return false;
  }

  // Consume input resources
  for (const input of process.inputResources) {
    applyResourceChange(
      plot,
      { ...input, size: -input.size },
      `${source}: ${process.name} (input)`,
      resourceChanges
    );
  }

  // Produce output resources
  for (const output of process.outputResources) {
    applyResourceChange(
      plot,
      output,
      `${source}: ${process.name} (output)`,
      resourceChanges
    );
  }

  return true;
}

/**
 * Execute all processes for a single plot
 */
function executeStepForPlot(
  plot: Plot,
  map: GameMap,
  resourceChanges: ResourceChangeLog[],
  errors: StepError[]
): void {
  // 1. Execute terrain processes
  const terrainType = map.terrainTypes.find(
    (t) => t.terrainTypeID === plot.plotAttributes.terrainType
  );
  if (terrainType) {
    for (const process of terrainType.processes) {
      executeProcess(plot, process, 'Terrain', resourceChanges, errors);
    }
  }

  // 2. Execute building processes
  for (const building of plot.plotAttributes.buildings) {
    const buildingType = map.buildingTypes.find(
      (bt) => bt.buildingTypeID === building.buildingTypeID
    );
    if (buildingType) {
      // Only execute if building has workers
      if (building.workers.length > 0) {
        for (const process of buildingType.processes) {
          executeProcess(
            plot,
            process,
            `Building: ${buildingType.name}`,
            resourceChanges,
            errors
          );
        }
      }
    }
  }

  // 3. Execute species processes
  for (const species of plot.plotAttributes.species) {
    const speciesType = map.speciesTypes.find(
      (st) => st.speciesTypeID === species.speciesTypeID
    );
    if (speciesType) {
      // Execute processes based on quantity
      for (let i = 0; i < species.quantity; i++) {
        for (const process of speciesType.processes) {
          executeProcess(
            plot,
            process,
            `Species: ${speciesType.name}`,
            resourceChanges,
            errors
          );
        }
      }
    }
  }
}

/**
 * Execute a single simulation step on the entire map
 * This advances the game state by one time unit
 */
export function executeStep(map: GameMap): StepResult {
  const resourceChanges: ResourceChangeLog[] = [];
  const errors: StepError[] = [];
  let processedPlots = 0;

  // Process each plot
  for (const plot of map.plots) {
    try {
      executeStepForPlot(plot, map, resourceChanges, errors);
      processedPlots++;
    } catch (error) {
      errors.push({
        plotID: plot.plotID,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    success: errors.length === 0,
    processedPlots,
    resourceChanges,
    errors,
  };
}

/**
 * Execute multiple simulation steps on the map
 */
export function executeSteps(map: GameMap, count: number): StepResult[] {
  const results: StepResult[] = [];

  for (let i = 0; i < count; i++) {
    const result = executeStep(map);
    results.push(result);

    // Stop if a step fails critically
    if (!result.success && result.errors.length > 0) {
      break;
    }
  }

  return results;
}
