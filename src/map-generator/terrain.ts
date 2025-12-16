/**
 * Terrain generation using noise functions
 */

import type { Parcel } from '../types/map';
import { TerrainType } from '../types/map';
import { SimplexNoise } from '../utils/noise';
import { SeededRandom } from '../utils/random';

/**
 * Assign terrain type based on elevation, moisture, and temperature
 */
export function determineTerrainType(
  elevation: number,
  moisture: number,
  temperature: number
): TerrainType {
  // Deep ocean
  if (elevation < 0.3) {
    return TerrainType.OCEAN;
  }
  
  // Shallow water
  if (elevation < 0.35) {
    return TerrainType.SHALLOW_WATER;
  }
  
  // Beach/coast
  if (elevation < 0.38) {
    return TerrainType.BEACH;
  }

  // High elevation terrains
  if (elevation > 0.75) {
    if (temperature < 0.3) {
      return TerrainType.SNOW;
    }
    return TerrainType.MOUNTAIN;
  }

  // Cold regions
  if (temperature < 0.25) {
    return TerrainType.TUNDRA;
  }

  // Hot and dry
  if (temperature > 0.7 && moisture < 0.3) {
    return TerrainType.DESERT;
  }

  // Hot and wet
  if (temperature > 0.6 && moisture > 0.6) {
    return TerrainType.JUNGLE;
  }

  // Moderate moisture
  if (moisture > 0.5) {
    return TerrainType.FOREST;
  }

  // Default to grassland
  return TerrainType.GRASSLAND;
}

/**
 * Generate terrain properties for all parcels
 */
export function generateTerrain(
  parcels: Parcel[],
  _width: number,
  height: number,
  random: SeededRandom
): void {
  const elevationNoise = new SimplexNoise(random);
  const moistureNoise = new SimplexNoise(random);
  const temperatureNoise = new SimplexNoise(random);

  const scale = 0.003; // Frequency of the noise

  for (const parcel of parcels) {
    const x = parcel.center.x;
    const y = parcel.center.y;

    // Generate base elevation with multiple octaves
    // Use wrapping-aware noise for x-axis (longitude)
    let elevation = elevationNoise.octaveNoise(x * scale, y * scale, 6, 0.5);
    
    // For spherical projection: reduce elevation toward poles (top/bottom edges)
    // but maintain some land at poles (no distance-from-center penalty)
    const latitude = Math.abs(y - height / 2) / (height / 2); // 0 at equator, 1 at poles
    
    // Slight reduction at extreme latitudes to create more ocean at poles
    elevation = elevation * (1 - latitude * 0.3);
    
    // Normalize to 0-1
    elevation = (elevation + 1) / 2;
    elevation = Math.max(0, Math.min(1, elevation));

    // Generate moisture
    let moisture = moistureNoise.octaveNoise(x * scale * 1.5, y * scale * 1.5, 4, 0.5);
    moisture = (moisture + 1) / 2;
    
    // Moisture is higher near water
    if (elevation < 0.35) {
      moisture = 1.0;
    } else if (elevation < 0.45) {
      moisture = Math.max(moisture, 0.7);
    }

    // Generate temperature based on latitude (spherical projection)
    let temperature = temperatureNoise.octaveNoise(x * scale * 0.8, y * scale * 0.8, 3, 0.5);
    
    // Temperature varies strongly with latitude (coldest at poles, warmest at equator)
    // latitude: 0 at equator (warm), 1 at poles (cold)
    temperature = temperature * (1 - latitude * 0.8) + (1 - latitude) * 0.5;
    
    // Higher elevations are colder
    temperature -= (elevation - 0.4) * 0.5;
    
    // Normalize
    temperature = (temperature + 1) / 2;
    temperature = Math.max(0, Math.min(1, temperature));

    parcel.elevation = elevation;
    parcel.moisture = moisture;
    parcel.temperature = temperature;
    parcel.terrain = determineTerrainType(elevation, moisture, temperature);
  }
}

/**
 * Add rivers between parcels
 * Rivers flow from high elevation to low elevation
 */
export function generateRivers(
  parcels: Parcel[],
  numRivers: number,
  random: SeededRandom
): Set<string> {
  const rivers = new Set<string>();
  
  // Find high elevation land parcels as river sources
  const sources = parcels.filter(
    p => p.elevation > 0.6 && p.elevation < 0.8 && p.terrain !== TerrainType.OCEAN
  );

  for (let i = 0; i < numRivers && sources.length > 0; i++) {
    let current = random.pick(sources);
    const visited = new Set<number>();
    let steps = 0;
    const maxSteps = 100;

    while (steps < maxSteps) {
      visited.add(current.id);
      
      // Find lowest neighbor
      let lowest = current;
      for (const neighborId of current.neighbors) {
        const neighbor = parcels.find(p => p.id === neighborId);
        if (!neighbor || visited.has(neighbor.id)) continue;
        
        if (neighbor.elevation < lowest.elevation) {
          lowest = neighbor;
        }
      }

      // Stop if we reached water or no lower neighbor
      if (lowest.id === current.id || lowest.terrain === TerrainType.OCEAN) {
        break;
      }

      // Add river edge
      const edge = [current.id, lowest.id].sort().join('-');
      rivers.add(edge);

      current = lowest;
      steps++;
    }
  }

  return rivers;
}
