/**
 * River generation system
 * Creates elongated terrain that flows from high altitude to the sea
 */

import type { Parcel } from '../types/map';
import { TerrainType } from '../types/map';
import { SeededRandom } from '../utils/random';

/**
 * Generate rivers that flow from high elevation to ocean
 * Rivers are divided into continuous segments of connected parcels
 */
export function generateRivers(parcels: Parcel[], random: SeededRandom): void {
  // Step 1: Identify potential river source parcels (high elevation, not water)
  const sources = findRiverSources(parcels, random);
  
  // Step 2: For each source, trace a path downhill to the ocean
  for (const source of sources) {
    traceRiverPath(parcels, source, random);
  }
}

/**
 * Find parcels that can serve as river sources
 * These are high-elevation parcels (mountains, hills) that are inland
 */
function findRiverSources(parcels: Parcel[], random: SeededRandom): Parcel[] {
  const sources: Parcel[] = [];
  
  for (const parcel of parcels) {
    // River sources should be:
    // 1. High elevation (above 0.6)
    // 2. Not water terrain
    // 3. Have some moisture (indicating water flow)
    const isHighElevation = parcel.elevation > 0.6;
    const isLand = parcel.terrain !== TerrainType.OCEAN && 
                   parcel.terrain !== TerrainType.SHALLOW_WATER;
    const hasMoisture = parcel.moisture > 0.3;
    
    // Random chance to spawn a river (about 2.5% of eligible parcels - half the original size)
    if (isHighElevation && isLand && hasMoisture && random.chance(0.025)) {
      sources.push(parcel);
    }
  }
  
  return sources;
}

/**
 * Trace a river path from a source parcel downhill to the ocean
 * Marks parcels along the path as river terrain
 */
function traceRiverPath(parcels: Parcel[], source: Parcel, random: SeededRandom): void {
  const visited = new Set<number>();
  const riverPath: Parcel[] = [];
  let current = source;
  let maxLength = 25; // Maximum river length (half the original) to create smaller rivers
  
  visited.add(current.id);
  
  while (maxLength > 0) {
    maxLength--;
    
    // Check if we've reached the ocean or shallow water
    if (current.terrain === TerrainType.OCEAN || 
        current.terrain === TerrainType.SHALLOW_WATER) {
      // River complete - mark all parcels in path as river terrain
      markRiverPath(riverPath);
      break;
    }
    
    // Add current parcel to potential river path
    riverPath.push(current);
    
    // Find next parcel: the neighbor with lowest elevation that we haven't visited
    const nextParcel = findDownhillNeighbor(parcels, current, visited, random);
    
    if (!nextParcel) {
      // Dead end - river doesn't reach ocean, discard this path
      break;
    }
    
    visited.add(nextParcel.id);
    current = nextParcel;
  }
}

/**
 * Find the next parcel downhill from the current one
 * Prefers lower elevation but adds some randomness
 */
function findDownhillNeighbor(
  parcels: Parcel[], 
  current: Parcel, 
  visited: Set<number>,
  random: SeededRandom
): Parcel | null {
  const parcelMap = new Map(parcels.map(p => [p.id, p]));
  const candidates: { parcel: Parcel; elevation: number }[] = [];
  
  for (const neighborId of current.neighbors) {
    if (visited.has(neighborId)) continue;
    
    const neighbor = parcelMap.get(neighborId);
    if (!neighbor) continue;
    
    // Consider neighbors that are lower or equal elevation
    // Ocean and shallow water are always valid targets
    if (neighbor.terrain === TerrainType.OCEAN || 
        neighbor.terrain === TerrainType.SHALLOW_WATER ||
        neighbor.elevation <= current.elevation) {
      candidates.push({ parcel: neighbor, elevation: neighbor.elevation });
    }
  }
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Sort by elevation (lowest first)
  candidates.sort((a, b) => a.elevation - b.elevation);
  
  // Pick one of the lowest elevation neighbors with some randomness
  // 70% chance to pick the lowest, 30% chance to pick randomly from top 3
  if (random.chance(0.7) || candidates.length === 1) {
    return candidates[0].parcel;
  } else {
    const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
    const index = random.randomInt(0, topCandidates.length);
    return topCandidates[index].parcel;
  }
}

/**
 * Mark parcels along a river path as shallow water terrain
 * Only marks parcels that are not already water
 */
function markRiverPath(riverPath: Parcel[]): void {
  for (const parcel of riverPath) {
    // Don't convert ocean or shallow water (already water)
    // Don't convert beaches to river (they're coastal)
    if (parcel.terrain !== TerrainType.OCEAN && 
        parcel.terrain !== TerrainType.SHALLOW_WATER &&
        parcel.terrain !== TerrainType.BEACH) {
      parcel.terrain = TerrainType.SHALLOW_WATER;
      // Rivers should have high moisture
      parcel.moisture = Math.max(parcel.moisture, 0.9);
    }
  }
}
