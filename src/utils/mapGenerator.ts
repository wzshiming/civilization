import type { FeatureCollection, Polygon } from 'geojson';
import {
  TerrainType,
  ResourceType,
} from '../types/terrain';
import type {
  TerrainTile,
  TerrainProperties,
  MapGeneratorConfig,
  Resource,
} from '../types/terrain';

/**
 * Simple seeded random number generator
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

/**
 * Generates a 2D noise map using simple algorithm
 */
function generateNoiseMap(
  width: number,
  height: number,
  random: SeededRandom
): number[][] {
  const noise: number[][] = [];

  for (let y = 0; y < height; y++) {
    noise[y] = [];
    for (let x = 0; x < width; x++) {
      noise[y][x] = random.next();
    }
  }

  return noise;
}

/**
 * Smooth the noise map to create more realistic terrain
 */
function smoothNoiseMap(noise: number[][], iterations: number): number[][] {
  const height = noise.length;
  const width = noise[0].length;
  let smoothed = noise.map((row) => [...row]);

  for (let iter = 0; iter < iterations; iter++) {
    const newSmoothed: number[][] = [];
    for (let y = 0; y < height; y++) {
      newSmoothed[y] = [];
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += smoothed[ny][nx];
              count++;
            }
          }
        }

        newSmoothed[y][x] = sum / count;
      }
    }
    smoothed = newSmoothed;
  }

  return smoothed;
}

/**
 * Determine terrain type based on elevation and other factors
 */
function determineTerrainType(
  elevation: number,
  temperature: number,
  humidity: number,
  isNearRiver: boolean
): TerrainType {
  if (elevation < 0.3) {
    return TerrainType.OCEAN;
  } else if (elevation > 0.75) {
    return TerrainType.MOUNTAIN;
  } else if (isNearRiver) {
    return TerrainType.RIVER;
  } else if (temperature > 0.7 && humidity > 0.7) {
    return TerrainType.JUNGLE;
  } else if (temperature > 0.7 && humidity < 0.3) {
    return TerrainType.DESERT;
  } else if (humidity > 0.6) {
    return TerrainType.FOREST;
  } else if (temperature < 0.3) {
    return TerrainType.TUNDRA;
  } else if (elevation > 0.4) {
    return elevation > 0.5 ? TerrainType.CONTINENT : TerrainType.GRASSLAND;
  } else {
    return TerrainType.GRASSLAND;
  }
}

/**
 * Generate resources for a terrain tile
 */
function generateResources(
  terrainType: TerrainType,
  random: SeededRandom,
  resourceDensity: number
): Resource[] {
  const resources: Resource[] = [];

  const resourceMap: Record<TerrainType, ResourceType[]> = {
    [TerrainType.OCEAN]: [ResourceType.FISH, ResourceType.OIL],
    [TerrainType.CONTINENT]: [ResourceType.STONE, ResourceType.IRON],
    [TerrainType.ISLAND]: [ResourceType.SPICES, ResourceType.GEMS],
    [TerrainType.MOUNTAIN]: [ResourceType.GOLD, ResourceType.IRON, ResourceType.STONE, ResourceType.GEMS],
    [TerrainType.RIVER]: [ResourceType.FISH, ResourceType.WHEAT],
    [TerrainType.JUNGLE]: [ResourceType.SPICES, ResourceType.GEMS],
    [TerrainType.DESERT]: [ResourceType.OIL, ResourceType.GOLD],
    [TerrainType.GRASSLAND]: [ResourceType.WHEAT, ResourceType.CATTLE],
    [TerrainType.FOREST]: [ResourceType.CATTLE, ResourceType.STONE],
    [TerrainType.TUNDRA]: [ResourceType.COAL, ResourceType.OIL],
  };

  const availableResources = resourceMap[terrainType] || [];
  if (availableResources.length === 0) return resources;

  // Generate 1-3 resources per tile based on density
  const maxResources = Math.min(3, availableResources.length);
  const numResources = random.next() < resourceDensity ? random.nextInt(1, maxResources) : 0;

  const usedResourceTypes = new Set<ResourceType>();
  
  for (let i = 0; i < numResources; i++) {
    // Pick a unique resource type
    let attempts = 0;
    let resourceType: ResourceType;
    do {
      resourceType = availableResources[random.nextInt(0, availableResources.length - 1)];
      attempts++;
    } while (usedResourceTypes.has(resourceType) && attempts < 10);

    if (usedResourceTypes.has(resourceType)) continue;
    usedResourceTypes.add(resourceType);

    const baseReserves = random.nextInt(100, 1000);

    const isRenewable = resourceType === ResourceType.WHEAT || 
                        resourceType === ResourceType.CATTLE || 
                        resourceType === ResourceType.FISH || 
                        resourceType === ResourceType.SPICES;

    resources.push({
      type: resourceType,
      reserves: baseReserves,
      currentReserves: baseReserves,
      regenerationRate: isRenewable ? random.nextFloat(0.5, 2.0) : 0,
      extractionRate: 0,
      isDiscovered: false,
    });
  }

  return resources;
}

/**
 * Create a hexagonal polygon for a grid cell
 */
function createCellPolygon(x: number, y: number, cellSize: number): Polygon {
  // Hexagon dimensions
  const width = cellSize;
  const height = cellSize * 0.866; // sqrt(3)/2 for hex ratio
  
  // Offset every other row for hex grid
  const xOffset = (y % 2) * (width / 2);
  const centerX = x * width + xOffset + width / 2;
  const centerY = y * height + height / 2;
  
  // Create hexagon points (flat-top orientation)
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = centerX + (width / 2) * Math.cos(angle);
    const py = centerY + (height / 2) * Math.sin(angle);
    points.push([px, py]);
  }
  
  // Close the polygon
  points.push(points[0]);

  return {
    type: 'Polygon',
    coordinates: [points],
  };
}

/**
 * Generate rivers on the map
 */
function generateRivers(
  elevationMap: number[][],
  riverCount: number,
  random: SeededRandom
): Set<string> {
  const rivers = new Set<string>();
  const height = elevationMap.length;
  const width = elevationMap[0].length;

  for (let i = 0; i < riverCount; i++) {
    // Start from a high elevation point
    let x = random.nextInt(0, width - 1);
    let y = random.nextInt(0, height - 1);

    const maxSteps = 100;
    let steps = 0;

    while (steps < maxSteps && elevationMap[y][x] > 0.3) {
      rivers.add(`${x},${y}`);

      // Find the lowest neighbor
      let lowestX = x;
      let lowestY = y;
      let lowestElevation = elevationMap[y][x];

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            if (elevationMap[ny][nx] < lowestElevation) {
              lowestElevation = elevationMap[ny][nx];
              lowestX = nx;
              lowestY = ny;
            }
          }
        }
      }

      if (lowestX === x && lowestY === y) break;

      x = lowestX;
      y = lowestY;
      steps++;
    }
  }

  return rivers;
}

/**
 * Generate a custom map with various terrain types
 */
export function generateMap(config: MapGeneratorConfig): FeatureCollection<Polygon, TerrainProperties> {
  const {
    width,
    height,
    riverCount,
    resourceDensity,
    seed = Date.now(),
  } = config;

  const random = new SeededRandom(seed);
  const cellSize = 10;

  // Generate elevation map
  const elevationNoise = generateNoiseMap(width, height, random);
  const elevationMap = smoothNoiseMap(elevationNoise, 3);

  // Generate temperature map
  const temperatureNoise = generateNoiseMap(width, height, random);
  const temperatureMap = smoothNoiseMap(temperatureNoise, 2);

  // Generate humidity map
  const humidityNoise = generateNoiseMap(width, height, random);
  const humidityMap = smoothNoiseMap(humidityNoise, 2);

  // Generate rivers
  const rivers = generateRivers(elevationMap, riverCount, random);

  // Create terrain tiles
  const features: TerrainTile[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const elevation = elevationMap[y][x];
      const temperature = temperatureMap[y][x];
      const humidity = humidityMap[y][x];
      const isNearRiver = rivers.has(`${x},${y}`);

      const terrainType = determineTerrainType(elevation, temperature, humidity, isNearRiver);
      const resources = generateResources(terrainType, random, resourceDensity);

      const properties: TerrainProperties = {
        id: `tile-${x}-${y}`,
        terrainType,
        elevation,
        temperature,
        humidity,
        resources,
        isExplored: false,
        fertility: humidity * (1 - Math.abs(temperature - 0.5) * 2),
      };

      const feature: TerrainTile = {
        type: 'Feature',
        properties,
        geometry: createCellPolygon(x, y, cellSize),
      };

      features.push(feature);
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
