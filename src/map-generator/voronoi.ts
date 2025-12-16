/**
 * Voronoi diagram generation using Delaunay triangulation
 * Implements cylindrical projection (sphere unwrapped) with:
 * - Horizontal wrapping (x-axis represents longitude)
 * - Latitude-based scaling (larger cells near poles)
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
 * Calculate latitude factor (0 at equator, 1 at poles)
 * Used for spherical projection scaling
 */
function getLatitudeFactor(y: number, height: number): number {
  const normalizedY = (y / height) * 2 - 1; // -1 to 1, 0 is equator
  return Math.abs(normalizedY);
}

/**
 * Calculate minimum distance based on latitude for spherical projection
 * Sites near poles should be further apart in x-direction
 */
function getMinDistanceForLatitude(y: number, height: number, baseDistance: number): number {
  const latFactor = getLatitudeFactor(y, height);
  // At poles (latFactor=1), require more x-spacing (up to 1.5x)
  // At equator (latFactor=0), use base spacing
  const xScale = 1 + latFactor * 0.5;
  return baseDistance * xScale;
}

/**
 * Calculate wrapped distance between two points (considering horizontal wrapping)
 */
function wrappedDistance(p1: Point, p2: Point, width: number): number {
  const dx1 = Math.abs(p1.x - p2.x);
  const dx2 = width - dx1; // Distance through wrapping
  const dx = Math.min(dx1, dx2);
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Transform vertex coordinates from extended space back to original space
 */
function transformVertex(x: number, y: number, width: number, height: number): Point {
  return {
    x: x - width,
    y: Math.max(0, Math.min(height, y)),
  };
}

/**
 * Create mirror sites for wrapping support
 * Returns all sites (original + mirrors) and mapping array
 */
function createMirrorSites(sites: Point[], width: number): { allSites: Point[], siteMapping: number[] } {
  const numOriginal = sites.length;
  const allSites: Point[] = [];
  const siteMapping: number[] = [];
  
  // Add original sites shifted to center of extended space
  for (let i = 0; i < numOriginal; i++) {
    allSites.push({ x: sites[i].x + width, y: sites[i].y });
    siteMapping.push(i);
  }
  
  // Add left mirror sites
  for (let i = 0; i < numOriginal; i++) {
    allSites.push({ x: sites[i].x, y: sites[i].y });
    siteMapping.push(i);
  }
  
  // Add right mirror sites
  for (let i = 0; i < numOriginal; i++) {
    allSites.push({ x: sites[i].x + width * 2, y: sites[i].y });
    siteMapping.push(i);
  }
  
  return { allSites, siteMapping };
}

/**
 * Generate Voronoi diagram from a set of points with spherical projection
 */
export function generateVoronoi(
  width: number,
  height: number,
  numSites: number,
  random: SeededRandom
): VoronoiCell[] {
  // Generate random sites with latitude-aware spacing
  const sites: Point[] = [];
  const baseMinDistance = Math.sqrt((width * height) / numSites) * 0.7;

  // Try to place sites with minimum spacing (considering wrapping and latitude)
  let attempts = 0;
  const maxAttempts = numSites * 50;

  while (sites.length < numSites && attempts < maxAttempts) {
    const candidate = {
      x: random.randomFloat(0, width),
      y: random.randomFloat(0, height),
    };

    const minDist = getMinDistanceForLatitude(candidate.y, height, baseMinDistance);
    let valid = true;
    
    for (const site of sites) {
      const dist = wrappedDistance(candidate, site, width);
      if (dist < minDist) {
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

  // Create Delaunay triangulation with extended bounds for wrapping
  const extendedWidth = width * 3;
  const { allSites, siteMapping } = createMirrorSites(sites, width);
  const numOriginal = sites.length;

  const points = new Float64Array(allSites.length * 2);
  allSites.forEach((site, i) => {
    points[i * 2] = site.x;
    points[i * 2 + 1] = site.y;
  });

  const delaunay = new Delaunay(points);
  const voronoi = delaunay.voronoi([0, 0, extendedWidth, height]);

  // Convert to our cell format (only for original sites)
  const cells: VoronoiCell[] = [];

  for (let i = 0; i < numOriginal; i++) {
    const cellPolygon = voronoi.cellPolygon(i);
    if (!cellPolygon) continue;

    // Transform vertices back to original coordinate space
    const vertices: Point[] = cellPolygon.map(([x, y]: [number, number]) => 
      transformVertex(x, y, width, height)
    );

    // Find neighbors (map back to original site indices)
    const neighborSet = new Set<number>();
    for (const neighbor of voronoi.neighbors(i)) {
      const originalIndex = siteMapping[neighbor];
      if (originalIndex !== i) {
        neighborSet.add(originalIndex);
      }
    }

    cells.push({
      id: i,
      site: sites[i],
      vertices,
      neighbors: Array.from(neighborSet),
    });
  }

  return cells;
}

/**
 * Relax Voronoi diagram using Lloyd's algorithm with wrapping support
 * This creates more evenly distributed cells while respecting spherical projection
 */
export function relaxVoronoi(
  width: number,
  height: number,
  cells: VoronoiCell[],
  iterations: number = 2
): VoronoiCell[] {
  let currentCells = cells;

  for (let iter = 0; iter < iterations; iter++) {
    // Calculate centroids of each cell with wrapping consideration
    const newSites: Point[] = currentCells.map(cell => {
      if (cell.vertices.length === 0) return cell.site;

      // For cells that cross the wrapping boundary, adjust vertices for centroid calculation
      const vertices = [...cell.vertices];
      const refX = cell.site.x;
      
      // Adjust vertices for wrapping (if a vertex is far from site, it might be wrapped)
      const adjustedVertices = vertices.map(v => {
        let x = v.x;
        if (Math.abs(x - refX) > width / 2) {
          x = x < refX ? x + width : x - width;
        }
        return { x, y: v.y };
      });

      let sumX = 0;
      let sumY = 0;
      for (const vertex of adjustedVertices) {
        sumX += vertex.x;
        sumY += vertex.y;
      }
      
      const centroidX = sumX / adjustedVertices.length;
      const centroidY = sumY / adjustedVertices.length;
      
      return {
        x: ((centroidX % width) + width) % width, // Wrap x coordinate
        y: Math.max(0, Math.min(height, centroidY)), // Clamp y coordinate
      };
    });

    // Generate new Voronoi from centroids with extended bounds
    const extendedWidth = width * 3;
    const { allSites, siteMapping } = createMirrorSites(newSites, width);
    const numOriginal = newSites.length;

    const points = new Float64Array(allSites.length * 2);
    allSites.forEach((site, i) => {
      points[i * 2] = site.x;
      points[i * 2 + 1] = site.y;
    });

    const delaunay = new Delaunay(points);
    const voronoi = delaunay.voronoi([0, 0, extendedWidth, height]);

    currentCells = [];
    for (let i = 0; i < numOriginal; i++) {
      const cellPolygon = voronoi.cellPolygon(i);
      if (!cellPolygon) continue;

      // Transform vertices back to original coordinate space
      const vertices: Point[] = cellPolygon.map(([x, y]: [number, number]) => 
        transformVertex(x, y, width, height)
      );
      
      const neighborSet = new Set<number>();
      for (const neighbor of voronoi.neighbors(i)) {
        const originalIndex = siteMapping[neighbor];
        if (originalIndex !== i) {
          neighborSet.add(originalIndex);
        }
      }

      currentCells.push({
        id: i,
        site: newSites[i],
        vertices,
        neighbors: Array.from(neighborSet),
      });
    }
  }

  return currentCells;
}
