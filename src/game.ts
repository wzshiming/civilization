// Main game logic
import { Province, Tribe, GameState } from './types';

// Game constants
export const RESOURCE_GENERATION_INTERVAL = 5000; // 5 seconds
export const FOOD_PER_TICK = 2;
export const EXPLORATION_FOOD_COST = 10;
export const EXPLORATION_POPULATION_COST = 1;
export const STARTING_POPULATION = 5;
export const STARTING_FOOD = 20;
export const STARTING_FLINT = 10;

// Initialize game state
export function initializeGame(mapData: any): GameState {
  const provinces = new Map<string, Province>();
  
  // Parse GeoJSON features into provinces
  mapData.features.forEach((feature: any) => {
    const province: Province = {
      id: feature.properties.id,
      name: feature.properties.name,
      type: feature.properties.type,
      owner: null,
      population: 0,
      food: 0,
      flint: 0,
    };
    provinces.set(province.id, province);
  });

  // Create initial tribe
  const tribe: Tribe = {
    id: 'tribe_1',
    name: 'Stone Age Tribe',
    color: '#4CAF50',
  };

  // Find a random land province for the starting location
  const landProvinces = Array.from(provinces.values()).filter(p => p.type === 'land');
  const startingProvince = landProvinces[Math.floor(Math.random() * landProvinces.length)];
  
  // Assign starting province to tribe
  startingProvince.owner = tribe.id;
  startingProvince.population = STARTING_POPULATION;
  startingProvince.food = STARTING_FOOD;
  startingProvince.flint = STARTING_FLINT;

  return {
    provinces,
    tribes: [tribe],
    selectedProvinceId: startingProvince.id,
    hoveredProvinceId: null,
  };
}

// Get adjacent provinces
export function getAdjacentProvinces(provinceId: string, mapData: any): string[] {
  const adjacent: string[] = [];
  const currentFeature = mapData.features.find((f: any) => f.properties.id === provinceId);
  
  if (!currentFeature) return adjacent;

  const currentCoords = currentFeature.geometry.coordinates[0];
  
  // Find provinces that share at least one edge
  mapData.features.forEach((feature: any) => {
    if (feature.properties.id === provinceId) return;
    
    const otherCoords = feature.geometry.coordinates[0];
    
    // Check if provinces share edges (simple check - at least 2 shared points)
    let sharedPoints = 0;
    for (const coord1 of currentCoords) {
      for (const coord2 of otherCoords) {
        if (coord1[0] === coord2[0] && coord1[1] === coord2[1]) {
          sharedPoints++;
        }
      }
    }
    
    if (sharedPoints >= 2) {
      adjacent.push(feature.properties.id);
    }
  });
  
  return adjacent;
}

// Check if exploration is possible
export function canExplore(fromProvince: Province, toProvince: Province): boolean {
  // Can only explore from owned province to unowned land province
  if (!fromProvince.owner) return false;
  if (toProvince.owner) return false;
  if (toProvince.type !== 'land') return false;
  if (fromProvince.food < EXPLORATION_FOOD_COST) return false;
  if (fromProvince.population < EXPLORATION_POPULATION_COST) return false;
  
  return true;
}

// Execute exploration
export function explore(fromProvince: Province, toProvince: Province): void {
  if (!canExplore(fromProvince, toProvince)) return;
  
  // Consume resources
  fromProvince.food -= EXPLORATION_FOOD_COST;
  fromProvince.population -= EXPLORATION_POPULATION_COST;
  
  // Claim new province
  toProvince.owner = fromProvince.owner;
  toProvince.population = EXPLORATION_POPULATION_COST;
  toProvince.food = 0;
  toProvince.flint = 0;
  
  console.log(`Explored ${toProvince.name} (${toProvince.id})`);
}

// Generate resources for all owned provinces
export function generateResources(provinces: Map<string, Province>): void {
  provinces.forEach((province) => {
    if (province.owner) {
      province.food += FOOD_PER_TICK;
      console.log(`${province.name} generated ${FOOD_PER_TICK} food`);
    }
  });
}

// Get total resources for a tribe
export function getTribeResources(provinces: Map<string, Province>, tribeId: string) {
  let totalPopulation = 0;
  let totalFood = 0;
  let totalFlint = 0;
  
  provinces.forEach((province) => {
    if (province.owner === tribeId) {
      totalPopulation += province.population;
      totalFood += province.food;
      totalFlint += province.flint;
    }
  });
  
  return { totalPopulation, totalFood, totalFlint };
}
