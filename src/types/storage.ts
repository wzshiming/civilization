import type { ResourceTypeID } from './ids.js';

/**
 * Storage type for resources
 */
export interface StorageType {
  size: number;
  capacity: number;
  resourceType: ResourceTypeID;
}
