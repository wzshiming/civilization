/**
 * Terrain generation using noise functions
 */

import type { Parcel } from '../types';
import { TerrainType } from '../types';
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
  // Deep ocean - increased threshold for vast oceans
  if (elevation < 0.35) {
    return TerrainType.OCEAN;
  }
  
  // Shallow water
  if (elevation < 0.40) {
    return TerrainType.SHALLOW_WATER;
  }
  
  // Beach/coast
  if (elevation < 0.43) {
    return TerrainType.BEACH;
  }

  // High elevation terrains
  if (elevation > 0.75) {
    if (temperature < 0.3) {
      return TerrainType.SNOW;
    }
    return TerrainType.MOUNTAIN;
  }

  // Cold regions - increased threshold for more tundra at poles
  if (temperature < 0.35) {
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
    let elevation = elevationNoise.octaveNoise(x * scale, y * scale, 6, 0.5);
    
    // For spherical projection: reduce elevation toward poles (top/bottom edges)
    // but maintain some land at poles (no distance-from-center penalty)
    const latitude = Math.abs(y - height / 2) / (height / 2); // 0 at equator, 1 at poles
    
    // More aggressive reduction at extreme latitudes to create more ocean at poles
    // This helps create vast oceans while allowing some polar land for tundra
    elevation = elevation * (1 - latitude * 0.4);
    
    // Normalize to 0-1
    elevation = (elevation + 1) / 2;
    elevation = Math.max(0, Math.min(1, elevation));

    // Generate moisture
    let moisture = moistureNoise.octaveNoise(x * scale * 1.5, y * scale * 1.5, 4, 0.5);
    moisture = (moisture + 1) / 2;
    
    // Moisture is higher near water - adjusted for new water thresholds
    if (elevation < 0.40) {
      moisture = 1.0;
    } else if (elevation < 0.50) {
      moisture = Math.max(moisture, 0.7);
    }

    // Generate temperature based on latitude (spherical projection)
    let temperature = temperatureNoise.octaveNoise(x * scale * 0.8, y * scale * 0.8, 3, 0.5);
    
    // Normalize noise to 0-1 first
    temperature = (temperature + 1) / 2;
    
    // Temperature varies strongly with latitude (coldest at poles, warmest at equator)
    // latitude: 0 at equator (warm), 1 at poles (cold)
    // Apply strong polar cooling - at poles (latitude=1), base temperature becomes very low
    // Formula: temp = noise_variation * (1 - latitude) + base_for_latitude
    // At equator (lat=0): temp = noise * 1 + 0.5 = 0.5-1.5 (warm)
    // At poles (lat=1): temp = noise * 0 + 0.0 = 0.0 (very cold)
    temperature = temperature * 0.3 * (1 - latitude) + (1 - latitude) * 0.7;
    
    // Higher elevations are colder
    temperature -= (elevation - 0.4) * 0.5;
    
    // Clamp to valid range
    temperature = Math.max(0, Math.min(1, temperature));

    parcel.elevation = elevation;
    parcel.moisture = moisture;
    parcel.temperature = temperature;
    parcel.terrain = determineTerrainType(elevation, moisture, temperature);
  }
}


