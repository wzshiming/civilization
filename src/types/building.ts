/**
 * @deprecated This file is deprecated. Use unit.ts instead.
 * Building types are now generalized as Unit types.
 */

import type { UnitType, Unit, WorkerRequirement } from './unit.js';

/**
 * @deprecated Use UnitType instead
 */
export type BuildingType = UnitType;

/**
 * @deprecated Use Unit instead
 */
export type Building = Unit;

/**
 * Re-export WorkerRequirement for backward compatibility
 */
export type { WorkerRequirement };
