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
 * Generate Voronoi diagram from a set of points with horizontal wrapping
 * and spherical projection (parcels get larger near poles)
 */
export function generateVoronoi(
  width: number,
  height: number,
  numSites: number,
  random: SeededRandom
): VoronoiCell[] {
  // Generate random sites with spherical projection scaling
  // Sites are denser near the equator (middle) and sparser near poles (top/bottom)
  const sites: Point[] = [];
  const minDistance = Math.sqrt((width * height) / numSites) * 0.7;

  // Try to place sites with minimum spacing, accounting for latitude-based density
  let attempts = 0;
  const maxAttempts = numSites * 50;

  while (sites.length < numSites && attempts < maxAttempts) {
    // Use inverse transform sampling to get latitude-weighted distribution
    // More sites near equator (middle), fewer near poles (edges)
    const u = random.randomFloat(0, 1);
    // Map uniform distribution to latitude with subtle equator bias
    // Using a gentler sine curve for more natural distribution
    const normalizedY = Math.asin(2 * u - 1) / Math.PI + 0.5; // Maps to [0, 1] with equator bias
    // Blend with uniform distribution for more natural look (70% spherical, 30% uniform)
    const uniformY = random.randomFloat(0, 1);
    const blendedY = normalizedY * 0.7 + uniformY * 0.3;
    
    const candidate = {
      x: random.randomFloat(0, width),
      y: blendedY * height,
    };

    let valid = true;
    for (const site of sites) {
      const dx = Math.min(
        Math.abs(candidate.x - site.x),
        width - Math.abs(candidate.x - site.x) // Wrap-around distance
      );
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
    const u = random.randomFloat(0, 1);
    const normalizedY = Math.asin(2 * u - 1) / Math.PI + 0.5;
    const uniformY = random.randomFloat(0, 1);
    const blendedY = normalizedY * 0.7 + uniformY * 0.3;
    sites.push({
      x: random.randomFloat(0, width),
      y: blendedY * height,
    });
  }

  // Create extended site array for wrapping
  // Add mirror sites on the left and right for proper edge handling
  const extendedSites: Point[] = [];
  const siteIndexMap: number[] = []; // Maps extended index to original index

  // Add left mirror sites
  sites.forEach((site, i) => {
    if (site.x > width * 0.8) { // Sites near right edge
      extendedSites.push({ x: site.x - width, y: site.y });
      siteIndexMap.push(i);
    }
  });

  // Add original sites
  const originalStartIndex = extendedSites.length;
  sites.forEach((site, i) => {
    extendedSites.push(site);
    siteIndexMap.push(i);
  });

  // Add right mirror sites
  sites.forEach((site, i) => {
    if (site.x < width * 0.2) { // Sites near left edge
      extendedSites.push({ x: site.x + width, y: site.y });
      siteIndexMap.push(i);
    }
  });

  // Create Delaunay triangulation with extended sites
  const points = new Float64Array(extendedSites.length * 2);
  extendedSites.forEach((site, i) => {
    points[i * 2] = site.x;
    points[i * 2 + 1] = site.y;
  });

  const delaunay = new Delaunay(points);
  const voronoi = delaunay.voronoi([-width * 0.2, 0, width * 1.2, height]);

  // Convert to our cell format, only using original sites
  const cells: VoronoiCell[] = [];

  for (let i = 0; i < sites.length; i++) {
    const extendedIndex = originalStartIndex + i;
    const cellPolygon = voronoi.cellPolygon(extendedIndex);
    if (!cellPolygon) continue;

    // Check if polygon wraps around the boundary
    const rawVertices = cellPolygon.map(([x, y]: [number, number]) => ({ x, y }));
    const minX = Math.min(...rawVertices.map(v => v.x));
    const maxX = Math.max(...rawVertices.map(v => v.x));
    
    let vertices: Point[];
    if (maxX - minX > width * 0.6) {
      // Polygon wraps around - clip it to the main region
      vertices = rawVertices
        .filter(v => v.x >= 0 && v.x <= width)
        .map(v => ({ x: v.x, y: v.y }));
      
      // Add boundary intersections if needed
      if (vertices.length < 3) {
        // Use center point as fallback
        vertices = [sites[i]];
      }
    } else {
      // Normal polygon - wrap coordinates
      vertices = rawVertices.map(v => ({
        x: v.x < 0 ? v.x + width : (v.x > width ? v.x - width : v.x),
        y: v.y,
      }));
    }

    // Find neighbors, accounting for wrapping
    const neighbors: Set<number> = new Set();
    for (const neighborExtendedIndex of voronoi.neighbors(extendedIndex)) {
      const originalNeighborIndex = siteIndexMap[neighborExtendedIndex];
      if (originalNeighborIndex !== i) { // Don't include self
        neighbors.add(originalNeighborIndex);
      }
    }

    cells.push({
      id: i,
      site: sites[i],
      vertices,
      neighbors: Array.from(neighbors),
    });
  }

  return cells;
}

/**
 * Relax Voronoi diagram using Lloyd's algorithm with wrapping support
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
    // Calculate centroids of each cell, handling wrapping
    const newSites: Point[] = currentCells.map(cell => {
      if (cell.vertices.length === 0) return cell.site;

      // For cells that wrap around, we need special handling
      const vertices = cell.vertices;
      
      // Check if cell wraps around the edge
      const minX = Math.min(...vertices.map(v => v.x));
      const maxX = Math.max(...vertices.map(v => v.x));
      const wrapsAround = maxX - minX > width / 2;

      let sumX = 0;
      let sumY = 0;

      if (wrapsAround) {
        // Normalize vertices to a continuous range for averaging
        for (const vertex of vertices) {
          const normalizedX = vertex.x < width / 2 ? vertex.x + width : vertex.x;
          sumX += normalizedX;
          sumY += vertex.y;
        }
        const avgX = (sumX / vertices.length) % width;
        return {
          x: avgX,
          y: Math.max(0, Math.min(height, sumY / vertices.length)),
        };
      } else {
        for (const vertex of vertices) {
          sumX += vertex.x;
          sumY += vertex.y;
        }
        return {
          x: ((sumX / vertices.length) % width + width) % width,
          y: Math.max(0, Math.min(height, sumY / vertices.length)),
        };
      }
    });

    // Create extended site array for wrapping
    const extendedSites: Point[] = [];
    const siteIndexMap: number[] = [];

    // Add left mirror sites
    newSites.forEach((site, i) => {
      if (site.x > width * 0.8) {
        extendedSites.push({ x: site.x - width, y: site.y });
        siteIndexMap.push(i);
      }
    });

    // Add original sites
    const originalStartIndex = extendedSites.length;
    newSites.forEach((site, i) => {
      extendedSites.push(site);
      siteIndexMap.push(i);
    });

    // Add right mirror sites
    newSites.forEach((site, i) => {
      if (site.x < width * 0.2) {
        extendedSites.push({ x: site.x + width, y: site.y });
        siteIndexMap.push(i);
      }
    });

    // Generate new Voronoi from centroids
    const points = new Float64Array(extendedSites.length * 2);
    extendedSites.forEach((site, i) => {
      points[i * 2] = site.x;
      points[i * 2 + 1] = site.y;
    });

    const delaunay = new Delaunay(points);
    const voronoi = delaunay.voronoi([-width * 0.2, 0, width * 1.2, height]);

    currentCells = [];
    for (let i = 0; i < newSites.length; i++) {
      const extendedIndex = originalStartIndex + i;
      const cellPolygon = voronoi.cellPolygon(extendedIndex);
      if (!cellPolygon) continue;

      // Check if polygon wraps around the boundary
      const rawVertices = cellPolygon.map(([x, y]: [number, number]) => ({ x, y }));
      const minX = Math.min(...rawVertices.map(v => v.x));
      const maxX = Math.max(...rawVertices.map(v => v.x));
      
      let vertices: Point[];
      if (maxX - minX > width * 0.6) {
        // Polygon wraps around - clip it to the main region
        vertices = rawVertices
          .filter(v => v.x >= 0 && v.x <= width)
          .map(v => ({ x: v.x, y: v.y }));
        
        // Add boundary intersections if needed
        if (vertices.length < 3) {
          // Use center point as fallback
          vertices = [newSites[i]];
        }
      } else {
        // Normal polygon - wrap coordinates
        vertices = rawVertices.map(v => ({
          x: v.x < 0 ? v.x + width : (v.x > width ? v.x - width : v.x),
          y: v.y,
        }));
      }

      // Find neighbors, accounting for wrapping
      const neighbors: Set<number> = new Set();
      for (const neighborExtendedIndex of voronoi.neighbors(extendedIndex)) {
        const originalNeighborIndex = siteIndexMap[neighborExtendedIndex];
        if (originalNeighborIndex !== i) {
          neighbors.add(originalNeighborIndex);
        }
      }

      currentCells.push({
        id: i,
        site: newSites[i],
        vertices,
        neighbors: Array.from(neighbors),
      });
    }
  }

  return currentCells;
}
