import type { PlotID, ResourceTypeID } from '../types/ids.js';

/**
 * Log entry for a resource change that occurred during a step
 */
export interface ResourceChangeLog {
  plotID: PlotID;
  resourceType: ResourceTypeID;
  previousSize: number;
  newSize: number;
  source: string;
}

/**
 * Error that occurred during step execution
 */
export interface StepError {
  plotID: PlotID;
  message: string;
  processName?: string;
}

/**
 * Result of executing a simulation step
 */
export interface StepResult {
  success: boolean;
  processedPlots: number;
  resourceChanges: ResourceChangeLog[];
  errors: StepError[];
}
