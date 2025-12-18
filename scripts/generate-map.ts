#!/usr/bin/env node
/**
 * Generate a civilization map
 * 
 * Usage:
 *   npx tsx scripts/generate-map.ts [options]
 * 
 * Options:
 *   --plots=<number>    Number of plots (default: 500)
 *   --seed=<number>     Random seed (default: 42)
 *   --ocean=<number>    Ocean percentage 0-1 (default: 0.65)
 *   --output=<file>     Output HTML file (default: map.json)
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateMap } from '../src/generators/map-generator.js';

// Parse command line arguments
function parseArgs(): {
  plotCount: number;
  randomSeed: number;
  oceanPercentage: number;
  output: string;
} {
  const args = process.argv.slice(2);
  const options = {
    plotCount: 500,
    randomSeed: 42,
    oceanPercentage: 0.65,
    output: 'maps/map.json',
  };

  for (const arg of args) {
    if (arg.startsWith('--plots=')) {
      options.plotCount = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--seed=')) {
      options.randomSeed = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--ocean=')) {
      options.oceanPercentage = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    }
  }
  return options;
}

async function main() {
  const options = parseArgs();

  console.log('🗺️  Generating map...');
  console.log(`   Plots: ${options.plotCount}`);
  console.log(`   Seed: ${options.randomSeed}`);
  console.log(`   Ocean: ${(options.oceanPercentage * 100).toFixed(0)}%`);

  const startTime = Date.now();

  const map = generateMap({
    plotCount: options.plotCount,
    randomSeed: options.randomSeed,
    terrain: {
      oceanPercentage: options.oceanPercentage,
      continentCount: 4,
      islandFrequency: 0.15,
      coastalRoughness: 0.3
    },
    relaxationSteps: 3
  });

  const genTime = Date.now() - startTime;
  console.log(`   Generated in ${genTime}ms`);

  // Generate output
  let outputFile = options.output;

  // Ensure the output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let jsonOutput = JSON.stringify(map, null, 2);

  // Write to file
  fs.writeFileSync(outputFile, jsonOutput);
  console.log(`\n✅ Map saved to: ${path.resolve(outputFile)}`);
}

main().catch(console.error);
