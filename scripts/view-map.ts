#!/usr/bin/env node
/**
 * Generate and view a civilization map
 * 
 * Usage:
 *   npx tsx scripts/view-map.ts [options]
 * 
 * Options:
 *   --plots=<number>    Number of plots (default: 500)
 *   --seed=<number>     Random seed (default: 42)
 *   --ocean=<number>    Ocean percentage 0-1 (default: 0.65)
 *   --output=<file>     Output HTML file (default: map.html)
 *   --svg               Output SVG only instead of HTML
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateMap } from '../src/generators/map-generator.js';
import { mapToHTML, mapToSVG } from '../src/viewer/map-viewer.js';

// Parse command line arguments
function parseArgs(): {
  plotCount: number;
  randomSeed: number;
  oceanPercentage: number;
  output: string;
  svgOnly: boolean;
} {
  const args = process.argv.slice(2);
  const options = {
    plotCount: 500,
    randomSeed: 42,
    oceanPercentage: 0.65,
    output: 'map.html',
    svgOnly: false
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
    } else if (arg === '--svg') {
      options.svgOnly = true;
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
  let output: string;
  let outputFile = options.output;

  if (options.svgOnly) {
    output = mapToSVG(map);
    if (!outputFile.endsWith('.svg')) {
      outputFile = outputFile.replace(/(\.[^.]+)?$/, '.svg');
    }
  } else {
    output = mapToHTML(map);
    if (!outputFile.endsWith('.html')) {
      outputFile = outputFile.replace(/(\.[^.]+)?$/, '.html');
    }
  }

  // Write to file
  fs.writeFileSync(outputFile, output);
  console.log(`\n✅ Map saved to: ${path.resolve(outputFile)}`);

  // Print terrain statistics
  console.log('\n📊 Terrain Statistics:');
  const terrainCounts: Record<string, number> = {};
  for (const plot of map.plots) {
    const terrain = map.terrainTypes.find(t => t.terrainTypeID === plot.plotAttributes.terrainType);
    if (terrain) {
      terrainCounts[terrain.name] = (terrainCounts[terrain.name] || 0) + 1;
    }
  }

  Object.entries(terrainCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      const pct = (count / map.plots.length * 100).toFixed(1);
      console.log(`   ${name.padEnd(10)} ${count.toString().padStart(5)} (${pct}%)`);
    });
}

main().catch(console.error);
