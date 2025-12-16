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
 * Sites near poles should be further apart in x-direction to create larger cells
 * At the poles, cells should converge into very large blocks
 */
function getMinDistanceForLatitude(y: number, height: number, baseDistance: number): number {
  const latFactor = getLatitudeFactor(y, height);
  // Use aggressive exponential scaling to make cells much larger near poles
  // At equator (latFactor=0): scale = 1
  // At mid-latitudes (latFactor=0.5): scale ≈ 2.5x
  // At poles (latFactor=1): scale = 6x
  // This causes cells to merge into very large blocks at poles
  const xScale = Math.pow(6, latFactor);
  return baseDistance * xScale;
}

/**
 * Calculate wrapped distance between two points (considering horizontal and vertical wrapping)
 */
function wrappedDistance(p1: Point, p2: Point, width: number, height: number): number {
  const dx1 = Math.abs(p1.x - p2.x);
  const dx2 = width - dx1; // Distance through horizontal wrapping
  const dx = Math.min(dx1, dx2);
  
  const dy1 = Math.abs(p1.y - p2.y);
  const dy2 = height - dy1; // Distance through vertical wrapping
  const dy = Math.min(dy1, dy2);
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Transform vertex coordinates from extended space back to original space
 */
function transformVertex(x: number, y: number, width: number, height: number): Point {
  return {
    x: x - width,
    y: y - height,
  };
}

/**
 * Create mirror sites for toroidal wrapping support (both horizontal and vertical)
 * Returns all sites (original + mirrors) and mapping array
 * Creates a 3x3 grid of mirrored sites to enable wrapping in both directions
 */
function createMirrorSites(sites: Point[], width: number, height: number): { allSites: Point[], siteMapping: number[] } {
  const numOriginal = sites.length;
  const allSites: Point[] = [];
  const siteMapping: number[] = [];
  
  // Create a 3x3 grid of sites (9 copies total)
  // This enables both horizontal (x) and vertical (y) wrapping
  for (let yOffset = 0; yOffset < 3; yOffset++) {
    for (let xOffset = 0; xOffset < 3; xOffset++) {
      for (let i = 0; i < numOriginal; i++) {
        allSites.push({
          x: sites[i].x + xOffset * width,
          y: sites[i].y + yOffset * height,
        });
        siteMapping.push(i);
      }
    }
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
  // Use density weighting to place fewer sites near poles
  let attempts = 0;
  const maxAttempts = numSites * 50;

  while (sites.length < numSites && attempts < maxAttempts) {
    let candidate: Point;
    let accepted = false;
    
    // Try to generate a candidate with latitude-based probability
    for (let i = 0; i < 10 && !accepted; i++) {
      candidate = {
        x: random.randomFloat(0, width),
        y: random.randomFloat(0, height),
      };
      
      // Calculate placement probability based on latitude
      // Sites near poles should be much less likely to be placed
      const latFactor = getLatitudeFactor(candidate.y, height);
      const placementProbability = 1 - latFactor * 0.85; // Only 15% at poles, 100% at equator
      
      if (random.randomFloat(0, 1) < placementProbability) {
        accepted = true;
        break;
      }
    }
    
    if (!accepted) {
      attempts++;
      continue;
    }

    const minDist = getMinDistanceForLatitude(candidate!.y, height, baseMinDistance);
    let valid = true;
    
    for (const site of sites) {
      const dist = wrappedDistance(candidate!, site, width, height);
      if (dist < minDist) {
        valid = false;
        break;
      }
    }

    if (valid) {
      sites.push(candidate!);
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

  // Create Delaunay triangulation with extended bounds for toroidal wrapping
  const extendedWidth = width * 3;
  const extendedHeight = height * 3;
  const { allSites, siteMapping } = createMirrorSites(sites, width, height);
  const numOriginal = sites.length;

  const points = new Float64Array(allSites.length * 2);
  allSites.forEach((site, i) => {
    points[i * 2] = site.x;
    points[i * 2 + 1] = site.y;
  });

  const delaunay = new Delaunay(points);
  const voronoi = delaunay.voronoi([0, 0, extendedWidth, extendedHeight]);

  // Convert to our cell format (only for original sites in center tile)
  // Center tile is at position (1, 1) in the 3x3 grid = index 4
  const centerTileOffset = numOriginal * 4; // yOffset=1, xOffset=1: 1*3 + 1 = 4
  const cells: VoronoiCell[] = [];

  for (let i = 0; i < numOriginal; i++) {
    const centerIndex = centerTileOffset + i;
    const cellPolygon = voronoi.cellPolygon(centerIndex);
    if (!cellPolygon) continue;

    // Transform vertices back to original coordinate space
    const vertices: Point[] = cellPolygon.map(([x, y]: [number, number]) => 
      transformVertex(x, y, width, height)
    );

    // Find neighbors (map back to original site indices)
    const neighborSet = new Set<number>();
    for (const neighbor of voronoi.neighbors(centerIndex)) {
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
        y: ((centroidY % height) + height) % height, // Wrap y coordinate
      };
    });

    // Generate new Voronoi from centroids with extended bounds for toroidal wrapping
    const extendedWidth = width * 3;
    const extendedHeight = height * 3;
    const { allSites, siteMapping } = createMirrorSites(newSites, width, height);
    const numOriginal = newSites.length;

    const points = new Float64Array(allSites.length * 2);
    allSites.forEach((site, i) => {
      points[i * 2] = site.x;
      points[i * 2 + 1] = site.y;
    });

    const delaunay = new Delaunay(points);
    const voronoi = delaunay.voronoi([0, 0, extendedWidth, extendedHeight]);

    // Use center tile (position 1,1 in 3x3 grid = index 4)
    const centerTileOffset = numOriginal * 4;
    currentCells = [];
    for (let i = 0; i < numOriginal; i++) {
      const centerIndex = centerTileOffset + i;
      const cellPolygon = voronoi.cellPolygon(centerIndex);
      if (!cellPolygon) continue;

      // Transform vertices back to original coordinate space
      const vertices: Point[] = cellPolygon.map(([x, y]: [number, number]) => 
        transformVertex(x, y, width, height)
      );
      
      const neighborSet = new Set<number>();
      for (const neighbor of voronoi.neighbors(centerIndex)) {
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
