/**
 * Shared package for Civilization simulation
 * Contains types, utilities, and map generation logic
 */

// Export all types
export * from './types';

// Export utilities
export { SeededRandom } from './utils/random';
export { SimplexNoise } from './utils/noise';

// Export map generation
export { generateWorldMap, simulateWorld } from './map-generator/index';
