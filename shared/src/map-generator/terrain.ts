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
  temperature: number,
  waterLevel: number = 0.35,
  polarIceCaps: boolean = true,
  latitude: number = 0
): TerrainType {
  // Polar ice caps - force snow/ice at high latitudes if enabled
  if (polarIceCaps && latitude > 0.85) {
    return TerrainType.SNOW;
  }
  
  // Deep ocean
  if (elevation < waterLevel - 0.05) {
    return TerrainType.OCEAN;
  }
  
  // Shallow water
  if (elevation < waterLevel) {
    return TerrainType.SHALLOW_WATER;
  }
  
  // Beach/coast
  if (elevation < waterLevel + 0.03) {
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
  random: SeededRandom,
  oceanProportion: number = 0.35,
  polarIceCaps: boolean = true
): void {
  const elevationNoise = new SimplexNoise(random);
  const moistureNoise = new SimplexNoise(random);
  const temperatureNoise = new SimplexNoise(random);

  const scale = 0.003; // Frequency of the noise
  
  // Elevation scaling factors
  const POLAR_ELEVATION_REDUCTION = 0.3; // Reduces elevation near poles to create more ocean
  const OCEAN_PROPORTION_SCALE = 0.3; // Controls how much oceanProportion affects elevation distribution

  for (const parcel of parcels) {
    const x = parcel.center.x;
    const y = parcel.center.y;

    // Generate base elevation with multiple octaves
    let elevation = elevationNoise.octaveNoise(x * scale, y * scale, 6, 0.5);
    
    // For spherical projection: reduce elevation toward poles (top/bottom edges)
    // but maintain some land at poles (no distance-from-center penalty)
    const latitude = Math.abs(y - height / 2) / (height / 2); // 0 at equator, 1 at poles
    
    // Slight reduction at extreme latitudes to create more ocean at poles
    elevation = elevation * (1 - latitude * POLAR_ELEVATION_REDUCTION);
    
    // Normalize to 0-1
    elevation = (elevation + 1) / 2;
    
    // Adjust elevation based on desired ocean proportion
    // If oceanProportion is 0.35 (35% ocean), we want elevation threshold around 0.35
    // Scale elevation to match the desired ocean proportion
    elevation = elevation * (1 - oceanProportion * OCEAN_PROPORTION_SCALE) + oceanProportion * OCEAN_PROPORTION_SCALE;
    elevation = Math.max(0, Math.min(1, elevation));

    // Generate moisture
    let moisture = moistureNoise.octaveNoise(x * scale * 1.5, y * scale * 1.5, 4, 0.5);
    moisture = (moisture + 1) / 2;
    
    // Moisture is higher near water
    if (elevation < oceanProportion) {
      moisture = 1.0;
    } else if (elevation < oceanProportion + 0.1) {
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
    parcel.terrain = determineTerrainType(elevation, moisture, temperature, oceanProportion, polarIceCaps, latitude);
  }
}


