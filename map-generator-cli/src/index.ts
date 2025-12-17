#!/usr/bin/env node

/**
 * Map Generator CLI - Standalone tool for generating maps
 */

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import { TerrainType } from '@civilization/shared';
import type { SerializableWorldMap, Parcel } from '@civilization/shared';
import { SeededRandom } from './utils/random';
import { generateVoronoi, relaxVoronoi } from './voronoi';
import { generateTerrain } from './terrain';
import { generateResources } from './resources';


program
  .name('generate-map')
  .description('Generate a procedural map for the Civilization simulation')
  .version('1.0.0');

program
  .option('-w, --width <number>', 'Map width', '1200')
  .option('-h, --height <number>', 'Map height', '800')
  .option('-p, --parcels <number>', 'Number of parcels', '500')
  .option('-s, --seed <number>', 'Random seed for reproducibility')
  .option('-o, --output <path>', 'Output file path', './default-map.json')
  .option('-d, --output-dir <path>', 'Output directory', './maps')
  .parse(process.argv);

const options = program.opts();

/** Configuration for map generation */
export interface MapConfig {
  width: number;
  height: number;
  numParcels: number;
  seed?: number;
  waterLevel?: number;
  numContinents?: number;
}

/**
 * Generate a complete world map with all features
 */
function generateWorldMap(config: MapConfig): SerializableWorldMap {
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

  // Step 5: Generate resources
  console.log('Generating resources...');
  generateResources(parcels, random);

  return {
    parcels: parcels,
    width,
    height,
  };
}

// Parse options
const config = {
  width: parseInt(options.width),
  height: parseInt(options.height),
  numParcels: parseInt(options.parcels),
  seed: options.seed ? parseInt(options.seed) : undefined,
};

// Validate configuration
if (isNaN(config.width) || config.width <= 0) {
  console.error('Error: Invalid width value');
  process.exit(1);
}

if (isNaN(config.height) || config.height <= 0) {
  console.error('Error: Invalid height value');
  process.exit(1);
}

if (isNaN(config.numParcels) || config.numParcels <= 0) {
  console.error('Error: Invalid parcels value');
  process.exit(1);
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     Civilization Map Generator                            ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('Configuration:');
console.log(`  Width: ${config.width}`);
console.log(`  Height: ${config.height}`);
console.log(`  Parcels: ${config.numParcels}`);
console.log(`  Seed: ${config.seed || 'random'}\n`);

console.log('Generating map...\n');

try {
  // Generate the map
  const worldMap = generateWorldMap(config);


  // Ensure output directory exists
  const outputDir = options.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Determine output file path
  const outputFileName = path.basename(options.output);
  const outputPath = path.join(outputDir, outputFileName);

  // Save to file
  fs.writeFileSync(outputPath, JSON.stringify(worldMap, null, 2), 'utf-8');

  console.log('\n✓ Map generation complete!');
} catch (error) {
  console.error('\n✗ Error generating map:', error);
  process.exit(1);
}


