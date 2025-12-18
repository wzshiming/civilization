import type { GameMap, TerrainType, TerrainTypeID } from '../types/index.js';

/**
 * Color mapping for terrain types
 */
const TERRAIN_COLORS: Record<string, string> = {
  'Ocean': '#1a5276',
  'Coastal': '#5dade2',
  'Plains': '#82e0aa',
  'Forest': '#196f3d',
  'Hills': '#a9745c',
  'Mountains': '#7f8c8d',
  'Desert': '#f9e79f',
  'Tundra': '#d5dbdb'
};

/**
 * Get color for a terrain type
 */
function getTerrainColor(terrainTypes: TerrainType[], terrainTypeID: TerrainTypeID): string {
  const terrain = terrainTypes.find(t => t.terrainTypeID === terrainTypeID);
  if (terrain && TERRAIN_COLORS[terrain.name]) {
    return TERRAIN_COLORS[terrain.name];
  }
  return '#cccccc'; // Default gray
}

/**
 * Export options for map rendering
 */
export interface MapExportOptions {
  showBorders?: boolean;
  showCenters?: boolean;
  backgroundColor?: string;
}

/**
 * Generate SVG representation of the map
 */
export function mapToSVG(map: GameMap, options: MapExportOptions = {}): string {
  const {
    showBorders = true,
    showCenters = false,
    backgroundColor = '#1a5276'
  } = options;

  // Calculate bounds from all plots
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (const plot of map.plots) {
    for (const vertex of plot.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }
    // Also consider center points
    minX = Math.min(minX, plot.center.x);
    minY = Math.min(minY, plot.center.y);
    maxX = Math.max(maxX, plot.center.x);
    maxY = Math.max(maxY, plot.center.y);
  }

  // Calculate dimensions with explicit edge case handling
  const calculatedWidth = maxX - minX;
  const calculatedHeight = maxY - minY;
  const width = calculatedWidth > 0 ? calculatedWidth : 1000;
  const height = calculatedHeight > 0 ? calculatedHeight : 600;
  const padding = 10;

  const svgParts: string[] = [];

  // SVG header
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}" width="${width + padding * 2}" height="${height + padding * 2}">`);
  
  // Background
  svgParts.push(`  <rect x="${minX - padding}" y="${minY - padding}" width="${width + padding * 2}" height="${height + padding * 2}" fill="${backgroundColor}"/>`);

  // Draw plots
  for (const plot of map.plots) {
    if (plot.vertices.length < 3) continue;

    const color = getTerrainColor(map.terrainTypes, plot.plotAttributes.terrainType);
    const points = plot.vertices.map(v => `${v.x},${v.y}`).join(' ');
    
    const strokeStyle = showBorders ? `stroke="#333" stroke-width="0.5"` : `stroke="${color}" stroke-width="0.5"`;
    svgParts.push(`  <polygon points="${points}" fill="${color}" ${strokeStyle}/>`);
  }

  // Optionally draw centers
  if (showCenters) {
    for (const plot of map.plots) {
      svgParts.push(`  <circle cx="${plot.center.x}" cy="${plot.center.y}" r="2" fill="red"/>`);
    }
  }

  // SVG footer
  svgParts.push('</svg>');

  return svgParts.join('\n');
}

/**
 * Generate an HTML page with the map
 */
export function mapToHTML(map: GameMap, options: MapExportOptions = {}): string {
  const svg = mapToSVG(map, options);
  
  // Create legend
  const legendItems = map.terrainTypes.map(t => {
    const color = TERRAIN_COLORS[t.name] || '#cccccc';
    return `
      <div style="display: flex; align-items: center; margin: 4px 0;">
        <div style="width: 20px; height: 20px; background: ${color}; border: 1px solid #333; margin-right: 8px;"></div>
        <span>${t.name}</span>
      </div>`;
  }).join('');

  // Count plots by terrain type
  const terrainCounts: Record<string, number> = {};
  for (const plot of map.plots) {
    const terrain = map.terrainTypes.find(t => t.terrainTypeID === plot.plotAttributes.terrainType);
    if (terrain) {
      terrainCounts[terrain.name] = (terrainCounts[terrain.name] || 0) + 1;
    }
  }

  const statsItems = Object.entries(terrainCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `<tr><td>${name}</td><td>${count}</td><td>${(count / map.plots.length * 100).toFixed(1)}%</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Civilization Map Viewer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { 
      text-align: center; 
      margin-bottom: 20px;
      color: #f0f0f0;
    }
    .map-container {
      background: #0f0f23;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 20px;
      overflow: auto;
    }
    .map-container svg {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }
    .info-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .panel {
      background: #16213e;
      border-radius: 8px;
      padding: 16px;
    }
    .panel h2 {
      font-size: 1.2em;
      margin-bottom: 12px;
      color: #4ecca3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #333;
    }
    th { color: #4ecca3; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗺️ Civilization Map Viewer</h1>
    
    <div class="map-container">
      ${svg}
    </div>
    
    <div class="info-panel">
      <div class="panel">
        <h2>Legend</h2>
        ${legendItems}
      </div>
      
      <div class="panel">
        <h2>Map Statistics</h2>
        <table>
          <tr><th>Terrain</th><th>Count</th><th>%</th></tr>
          ${statsItems}
          <tr style="font-weight: bold; border-top: 2px solid #4ecca3;">
            <td>Total</td>
            <td>${map.plots.length}</td>
            <td>100%</td>
          </tr>
        </table>
      </div>
      
      <div class="panel">
        <h2>Configuration</h2>
        <p><strong>Plots:</strong> ${map.plots.length}</p>
        <p><strong>Terrain Types:</strong> ${map.terrainTypes.length}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
