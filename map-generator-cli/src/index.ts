#!/usr/bin/env node

/**
 * Map Generator CLI - Standalone tool for generating maps
 */

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import { generateWorldMap, type SerializableWorldMap, type MapConfig } from '@civilization/shared';

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
  .option('--mercator', 'Enable Mercator projection - land near poles appears larger')
  .option('--polar-ice', 'Add ice and snow at poles')
  .option('--ocean-proportion <number>', 'Control ocean percentage (0-1)', parseFloat)
  .parse(process.argv);

const options = program.opts();

// Parse options
const config: MapConfig = {
  width: parseInt(options.width),
  height: parseInt(options.height),
  numParcels: parseInt(options.parcels),
  seed: options.seed ? parseInt(options.seed) : undefined,
  mercator: options.mercator || false,
  polarIce: options.polarIce || false,
  oceanProportion: options.oceanProportion,
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

if (config.oceanProportion !== undefined && (isNaN(config.oceanProportion) || config.oceanProportion < 0 || config.oceanProportion > 1)) {
  console.error('Error: Invalid ocean-proportion value (must be between 0 and 1)');
  process.exit(1);
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     Civilization Map Generator                            ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('Configuration:');
console.log(`  Width: ${config.width}`);
console.log(`  Height: ${config.height}`);
console.log(`  Parcels: ${config.numParcels}`);
console.log(`  Seed: ${config.seed || 'random'}`);
console.log(`  Mercator Projection: ${config.mercator ? 'enabled' : 'disabled'}`);
console.log(`  Polar Ice: ${config.polarIce ? 'enabled' : 'disabled'}`);
console.log(`  Ocean Proportion: ${config.oceanProportion !== undefined ? config.oceanProportion : 'default (~0.3)'}\n`);

console.log('Generating map...\n');

try {
  // Generate the map
  const worldMap = generateWorldMap(config);

  // Convert to serializable format
  const serializable: SerializableWorldMap = {
    parcels: Array.from(worldMap.parcels.values()),
    boundaries: worldMap.boundaries,
    width: worldMap.width,
    height: worldMap.height,
    lastUpdate: worldMap.lastUpdate,
  };

  // Ensure output directory exists
  const outputDir = options.outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Determine output file path
  const outputFileName = path.basename(options.output);
  const outputPath = path.join(outputDir, outputFileName);

  // Save to file
  fs.writeFileSync(outputPath, JSON.stringify(serializable, null, 2), 'utf-8');

  console.log('\n✓ Map generation complete!');
  console.log(`\nMap Statistics:`);
  console.log(`  Total parcels: ${worldMap.parcels.size}`);
  console.log(`  Total boundaries: ${worldMap.boundaries.length}`);
  
  // Count terrain types
  const terrainCounts: Record<string, number> = {};
  worldMap.parcels.forEach(parcel => {
    terrainCounts[parcel.terrain] = (terrainCounts[parcel.terrain] || 0) + 1;
  });
  
  console.log(`\nTerrain Distribution:`);
  Object.entries(terrainCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([terrain, count]) => {
      const percentage = ((count / worldMap.parcels.size) * 100).toFixed(1);
      console.log(`  ${terrain}: ${count} (${percentage}%)`);
    });

  // Count total resources
  let totalResources = 0;
  worldMap.parcels.forEach(parcel => {
    totalResources += parcel.resources.length;
  });

  console.log(`\nResource Statistics:`);
  console.log(`  Total resources: ${totalResources}`);
  console.log(`  Average per parcel: ${(totalResources / worldMap.parcels.size).toFixed(2)}`);

  console.log(`\n✓ Map saved to: ${outputPath}`);
  console.log(`  File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

  console.log('\nYou can now load this map in the backend server.');

} catch (error) {
  console.error('\n✗ Error generating map:', error);
  process.exit(1);
}
