/**
 * @deprecated This module is deprecated. Use './unit.js' instead.
 * All building-related types have been renamed to unit types.
 */

// Re-export from unit.ts for backward compatibility
export type {
  WorkerRequirement,
  UnitType as BuildingType,
  Unit as Building,
} from './unit.js';
