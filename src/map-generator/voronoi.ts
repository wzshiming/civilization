/**
 * Voronoi diagram generation using Delaunay triangulation
 */

import { Delaunay } from 'd3-delaunay';
import type { Point } from '../types/map';
import { SeededRandom } from '../utils/random';

export interface VoronoiCell {
  id: number;
  site: Point;
  vertices: Point[];
  neighbors: number[];
}

/**
 * Generate Voronoi diagram from a set of points
 */
export function generateVoronoi(
  width: number,
  height: number,
  numSites: number,
  random: SeededRandom
): VoronoiCell[] {
  // Generate random sites with some spacing using Poisson disk sampling approximation
  const sites: Point[] = [];
  const minDistance = Math.sqrt((width * height) / numSites) * 0.7;

  // Try to place sites with minimum spacing
  let attempts = 0;
  const maxAttempts = numSites * 50;

  while (sites.length < numSites && attempts < maxAttempts) {
    const candidate = {
      x: random.randomFloat(0, width),
      y: random.randomFloat(0, height),
    };

    let valid = true;
    for (const site of sites) {
      const dx = candidate.x - site.x;
      const dy = candidate.y - site.y;
      if (dx * dx + dy * dy < minDistance * minDistance) {
        valid = false;
        break;
      }
    }

    if (valid) {
      sites.push(candidate);
    }
    attempts++;
  }

  // Fill remaining sites if needed
  while (sites.length < numSites) {
    sites.push({
      x: random.randomFloat(0, width),
      y: random.randomFloat(0, height),
    });
  }

  // Create Delaunay triangulation
  const points = new Float64Array(sites.length * 2);
  sites.forEach((site, i) => {
    points[i * 2] = site.x;
    points[i * 2 + 1] = site.y;
  });

  const delaunay = new Delaunay(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  // Convert to our cell format
  const cells: VoronoiCell[] = [];

  for (let i = 0; i < sites.length; i++) {
    const cellPolygon = voronoi.cellPolygon(i);
    if (!cellPolygon) continue;

    const vertices: Point[] = cellPolygon.map(([x, y]: [number, number]) => ({ x, y }));

    // Find neighbors
    const neighbors: number[] = [];
    for (const neighbor of voronoi.neighbors(i)) {
      neighbors.push(neighbor);
    }

    cells.push({
      id: i,
      site: sites[i],
      vertices,
      neighbors,
    });
  }

  return cells;
}

/**
 * Relax Voronoi diagram using Lloyd's algorithm
 * This creates more evenly distributed cells
 */
export function relaxVoronoi(
  width: number,
  height: number,
  cells: VoronoiCell[],
  iterations: number = 2
): VoronoiCell[] {
  let currentCells = cells;

  for (let iter = 0; iter < iterations; iter++) {
    // Calculate centroids of each cell
    const newSites: Point[] = currentCells.map(cell => {
      if (cell.vertices.length === 0) return cell.site;

      let sumX = 0;
      let sumY = 0;
      for (const vertex of cell.vertices) {
        sumX += vertex.x;
        sumY += vertex.y;
      }
      return {
        x: Math.max(0, Math.min(width, sumX / cell.vertices.length)),
        y: Math.max(0, Math.min(height, sumY / cell.vertices.length)),
      };
    });

    // Generate new Voronoi from centroids
    const points = new Float64Array(newSites.length * 2);
    newSites.forEach((site, i) => {
      points[i * 2] = site.x;
      points[i * 2 + 1] = site.y;
    });

    const delaunay = new Delaunay(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    currentCells = [];
    for (let i = 0; i < newSites.length; i++) {
      const cellPolygon = voronoi.cellPolygon(i);
      if (!cellPolygon) continue;

      const vertices: Point[] = cellPolygon.map(([x, y]: [number, number]) => ({ x, y }));
      const neighbors: number[] = [];
      for (const neighbor of voronoi.neighbors(i)) {
        neighbors.push(neighbor);
      }

      currentCells.push({
        id: i,
        site: newSites[i],
        vertices,
        neighbors,
      });
    }
  }

  return currentCells;
}
