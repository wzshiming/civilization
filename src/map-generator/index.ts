/**
 * Main map generator orchestrator
 */

import type { WorldMap, Parcel, MapConfig, Boundary } from '../types/map';
import { TerrainType } from '../types/map';
import { SeededRandom } from '../utils/random';
import { generateVoronoi, relaxVoronoi } from './voronoi';
import { generateTerrain, generateRivers } from './terrain';
import { generateResources, generateBoundaryResources, updateResources } from './resources';

/**
 * Generate a complete world map with all features
 */
export function generateWorldMap(config: MapConfig): WorldMap {
  const {
    width,
    height,
    numParcels,
    seed = Date.now(),
  } = config;

  console.log(`Generating world map with seed: ${seed}`);

  const random = new SeededRandom(seed);

  // Step 1: Generate Voronoi diagram
  console.log('Generating Voronoi cells...');
  let cells = generateVoronoi(width, height, numParcels, random);

  // Step 2: Relax the diagram for more uniform cells
  console.log('Relaxing Voronoi cells...');
  cells = relaxVoronoi(width, height, cells, 2);

  // Step 3: Convert cells to parcels
  console.log('Creating parcels...');
  const parcels: Parcel[] = cells.map(cell => ({
    id: cell.id,
    vertices: cell.vertices,
    center: cell.site,
    terrain: TerrainType.GRASSLAND, // Will be set in generateTerrain
    resources: [],
    neighbors: cell.neighbors,
    elevation: 0,
    moisture: 0,
    temperature: 0,
  }));

  // Step 4: Generate terrain
  console.log('Generating terrain...');
  generateTerrain(parcels, width, height, random);

  // Step 5: Generate rivers
  console.log('Generating rivers...');
  const numRivers = Math.floor(numParcels * 0.03);
  const rivers = generateRivers(parcels, numRivers, random);

  // Step 6: Generate resources
  console.log('Generating resources...');
  generateResources(parcels, random);

  // Step 7: Generate boundary resources (rivers)
  const boundaryResourceMap = generateBoundaryResources(rivers, random);

  // Step 8: Create boundaries
  console.log('Creating boundaries...');
  const boundaries: Boundary[] = [];
  const processedEdges = new Set<string>();

  for (const parcel of parcels) {
    for (const neighborId of parcel.neighbors) {
      const edgeKey = [parcel.id, neighborId].sort().join('-');
      if (processedEdges.has(edgeKey)) continue;
      processedEdges.add(edgeKey);

      const neighbor = parcels.find(p => p.id === neighborId);
      if (!neighbor) continue;

      // Find shared edge points (considering wrapping)
      const sharedEdge = findSharedEdge(parcel.vertices, neighbor.vertices, width);

      boundaries.push({
        parcel1: parcel.id,
        parcel2: neighborId,
        edge: sharedEdge,
        resources: boundaryResourceMap.get(edgeKey) || [],
      });
    }
  }

  // Step 9: Create world map
  const parcelMap = new Map<number, Parcel>();
  parcels.forEach(parcel => parcelMap.set(parcel.id, parcel));

  console.log(`Map generation complete! ${parcels.length} parcels, ${boundaries.length} boundaries`);

  return {
    parcels: parcelMap,
    boundaries,
    width,
    height,
    lastUpdate: Date.now(),
  };
}

/**
 * Find shared edge points between two polygons with wrapping support
 */
function findSharedEdge(vertices1: { x: number; y: number }[], vertices2: { x: number; y: number }[], width: number): { x: number; y: number }[] {
  const threshold = 1.0; // Distance threshold for matching vertices
  const shared: { x: number; y: number }[] = [];

  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      // Calculate distance considering wrapping
      const dx1 = Math.abs(v1.x - v2.x);
      const dx2 = width - dx1; // Wrapped distance
      const dx = Math.min(dx1, dx2);
      const dy = v1.y - v2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < threshold) {
        // Check if we already have this point
        const exists = shared.some(p => {
          const pdx1 = Math.abs(p.x - v1.x);
          const pdx2 = width - pdx1;
          const pdx = Math.min(pdx1, pdx2);
          const pdy = p.y - v1.y;
          return Math.sqrt(pdx * pdx + pdy * pdy) < threshold;
        });

        if (!exists) {
          shared.push({ x: v1.x, y: v1.y });
        }
        break;
      }
    }
  }

  return shared;
}

/**
 * Simulate world state for a given time step
 */
export function simulateWorld(world: WorldMap, deltaTime: number): void {
  world.parcels.forEach(parcel => {
    updateResources(parcel, deltaTime);
  });

  // Update boundary resources
  for (const boundary of world.boundaries) {
    for (const resource of boundary.resources) {
      resource.current += resource.changeRate * deltaTime;
      resource.current = Math.max(0, Math.min(resource.maximum, resource.current));
    }
  }

  world.lastUpdate = Date.now();
}
