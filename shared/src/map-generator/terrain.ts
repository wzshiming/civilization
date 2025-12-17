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
  random: SeededRandom,
  config?: { mercator?: boolean; polarIce?: boolean; oceanProportion?: number }
): void {
  const elevationNoise = new SimplexNoise(random);
  const moistureNoise = new SimplexNoise(random);
  const temperatureNoise = new SimplexNoise(random);

  const scale = 0.003; // Frequency of the noise
  
  // Ocean proportion: adjust water level threshold
  // Default ocean proportion is ~0.3 (elevation < 0.3 = ocean)
  // We adjust the base elevation to achieve the desired ocean proportion
  const oceanProportion = config?.oceanProportion !== undefined ? config.oceanProportion : 0.3;
  const waterLevelAdjustment = (oceanProportion - 0.3) * 0.5; // Scale adjustment factor

  for (const parcel of parcels) {
    const x = parcel.center.x;
    const y = parcel.center.y;

    // Generate base elevation with multiple octaves
    let elevation = elevationNoise.octaveNoise(x * scale, y * scale, 6, 0.5);
    
    // For spherical projection: reduce elevation toward poles (top/bottom edges)
    // but maintain some land at poles (no distance-from-center penalty)
    const latitude = Math.abs(y - height / 2) / (height / 2); // 0 at equator, 1 at poles
    
    // Mercator projection: land near poles appears larger
    // In Mercator projection, the scale factor increases as you move toward poles
    // This makes land masses near poles appear stretched/larger
    // We simulate this by slightly increasing elevation near poles when mercator is enabled
    if (config?.mercator) {
      // Mercator scale factor increases dramatically near poles
      // We apply a gentler version: boost elevation at high latitudes
      const mercatorBoost = latitude * latitude * 0.15; // Quadratic increase toward poles
      elevation = elevation + mercatorBoost;
    }
    
    // Slight reduction at extreme latitudes to create more ocean at poles (if not using mercator)
    if (!config?.mercator) {
      elevation = elevation * (1 - latitude * 0.3);
    }
    
    // Apply ocean proportion adjustment
    elevation = elevation - waterLevelAdjustment;
    
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
    
    // Polar ice: force very cold temperatures at poles
    if (config?.polarIce && latitude > 0.6) {
      // At high latitudes (>60% toward poles), dramatically reduce temperature
      const polarEffect = (latitude - 0.6) / 0.4; // 0 at 60% latitude, 1 at poles
      // Force temperatures to be very low at poles - scale down and subtract
      temperature = temperature * (1 - polarEffect * 0.95) - polarEffect * 0.5;
    }
    
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


