/**
 * English translations
 */

import type { TerrainType, ResourceType } from '../../types/map';

export const en = {
  // App level
  loadingMap: 'Generating world map...',
  mapGenerationFailed: 'Failed to generate map',
  
  // Control Panel
  simulation: 'Simulation',
  pause: '⏸ Pause',
  start: '▶ Start',
  speed: 'Speed',
  closeConfig: '✕ Close Config',
  mapConfig: '⚙ Map Config',
  numberOfParcels: 'Number of Parcels:',
  seedOptional: 'Seed (optional):',
  random: 'Random',
  regenerateMap: '🔄 Regenerate Map',
  
  // Parcel Detail Panel
  parcel: 'Parcel',
  terrain: 'Terrain',
  type: 'Type:',
  elevation: 'Elevation:',
  moisture: 'Moisture:',
  temperature: 'Temperature:',
  resources: 'Resources',
  noResources: 'No resources available',
  location: 'Location',
  center: 'Center:',
  neighbors: 'Neighbors:',
  
  // Terrain types
  terrainTypes: {
    ocean: 'Ocean',
    shallow_water: 'Shallow Water',
    beach: 'Beach',
    grassland: 'Grassland',
    forest: 'Forest',
    jungle: 'Jungle',
    desert: 'Desert',
    tundra: 'Tundra',
    mountain: 'Mountain',
    snow: 'Snow',
  } as Record<TerrainType, string>,
  
  // Resource types
  resourceTypes: {
    water: 'Water',
    wood: 'Wood',
    stone: 'Stone',
    iron: 'Iron',
    gold: 'Gold',
    oil: 'Oil',
    coal: 'Coal',
    fertile_soil: 'Fertile Soil',
    fish: 'Fish',
    game: 'Game',
  } as Record<ResourceType, string>,
  
  // Language selector
  language: 'Language',
  
  // Map controls
  tip: 'Tip',
  mapControlsHint: 'Use WASD or Arrow Keys to move the map, Mouse Wheel to zoom',
};

export type TranslationKeys = typeof en;
