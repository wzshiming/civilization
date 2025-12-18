import type { Point, Dimensions } from '../types/index.js';
import { SeededRandom } from './random.js';

/**
 * Represents a Voronoi cell with its center and vertices
 */
export interface VoronoiCell {
  center: Point;
  vertices: Point[];
  neighbors: number[]; // Indices of neighboring cells
}

/**
 * Result of Voronoi tessellation
 */
export interface VoronoiResult {
  cells: VoronoiCell[];
}

/**
 * Edge of a Delaunay triangle or Voronoi cell
 */
interface Edge {
  p1: number;
  p2: number;
}

/**
 * Delaunay triangle with vertex indices
 */
interface Triangle {
  a: number;
  b: number;
  c: number;
  circumcenter: Point;
  circumradius: number;
}

/**
 * Calculate the circumcenter and circumradius of a triangle
 */
function calculateCircumcircle(p1: Point, p2: Point, p3: Point): { center: Point; radius: number } {
  const ax = p1.x;
  const ay = p1.y;
  const bx = p2.x;
  const by = p2.y;
  const cx = p3.x;
  const cy = p3.y;

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  
  if (Math.abs(d) < 1e-10) {
    // Degenerate case - points are collinear
    return { 
      center: { x: (ax + bx + cx) / 3, y: (ay + by + cy) / 3 }, 
      radius: Infinity 
    };
  }

  const aSq = ax * ax + ay * ay;
  const bSq = bx * bx + by * by;
  const cSq = cx * cx + cy * cy;

  const ux = (aSq * (by - cy) + bSq * (cy - ay) + cSq * (ay - by)) / d;
  const uy = (aSq * (cx - bx) + bSq * (ax - cx) + cSq * (bx - ax)) / d;

  const radius = Math.sqrt((ax - ux) ** 2 + (ay - uy) ** 2);

  return { center: { x: ux, y: uy }, radius };
}

/**
 * Check if a point is inside a triangle's circumcircle
 */
function isPointInCircumcircle(point: Point, triangle: Triangle, points: Point[]): boolean {
  const dx = point.x - triangle.circumcenter.x;
  const dy = point.y - triangle.circumcenter.y;
  return dx * dx + dy * dy < triangle.circumradius * triangle.circumradius;
}

/**
 * Create a super triangle that encompasses all points
 */
function createSuperTriangle(dimensions: Dimensions): Point[] {
  const margin = Math.max(dimensions.width, dimensions.height) * 3;
  return [
    { x: dimensions.width / 2, y: -margin },
    { x: -margin, y: dimensions.height + margin },
    { x: dimensions.width + margin, y: dimensions.height + margin }
  ];
}

/**
 * Bowyer-Watson algorithm for Delaunay triangulation
 */
function delaunayTriangulation(points: Point[], dimensions: Dimensions): Triangle[] {
  const superTriangle = createSuperTriangle(dimensions);
  const allPoints = [...superTriangle, ...points];
  
  // Create initial triangle from super triangle
  const circumcircle = calculateCircumcircle(superTriangle[0], superTriangle[1], superTriangle[2]);
  const triangles: Triangle[] = [{
    a: 0,
    b: 1,
    c: 2,
    circumcenter: circumcircle.center,
    circumradius: circumcircle.radius
  }];

  // Add each point one by one
  for (let i = 3; i < allPoints.length; i++) {
    const point = allPoints[i];
    const badTriangles: Triangle[] = [];
    
    // Find all triangles whose circumcircle contains the point
    for (const triangle of triangles) {
      if (isPointInCircumcircle(point, triangle, allPoints)) {
        badTriangles.push(triangle);
      }
    }

    // Find the boundary of the polygonal hole
    const polygon: Edge[] = [];
    for (const triangle of badTriangles) {
      const edges: Edge[] = [
        { p1: triangle.a, p2: triangle.b },
        { p1: triangle.b, p2: triangle.c },
        { p1: triangle.c, p2: triangle.a }
      ];

      for (const edge of edges) {
        // Check if this edge is shared with another bad triangle
        let isShared = false;
        for (const other of badTriangles) {
          if (other === triangle) continue;
          const otherEdges: Edge[] = [
            { p1: other.a, p2: other.b },
            { p1: other.b, p2: other.c },
            { p1: other.c, p2: other.a }
          ];
          for (const otherEdge of otherEdges) {
            if ((edge.p1 === otherEdge.p1 && edge.p2 === otherEdge.p2) ||
                (edge.p1 === otherEdge.p2 && edge.p2 === otherEdge.p1)) {
              isShared = true;
              break;
            }
          }
          if (isShared) break;
        }
        if (!isShared) {
          polygon.push(edge);
        }
      }
    }

    // Remove bad triangles
    for (const bad of badTriangles) {
      const idx = triangles.indexOf(bad);
      if (idx !== -1) {
        triangles.splice(idx, 1);
      }
    }

    // Re-triangulate the polygonal hole
    for (const edge of polygon) {
      const cc = calculateCircumcircle(allPoints[edge.p1], allPoints[edge.p2], point);
      triangles.push({
        a: edge.p1,
        b: edge.p2,
        c: i,
        circumcenter: cc.center,
        circumradius: cc.radius
      });
    }
  }

  // Remove triangles that share vertices with super triangle
  return triangles.filter(t => t.a > 2 && t.b > 2 && t.c > 2);
}

/**
 * Calculate the area of a polygon given its vertices
 */
function calculatePolygonArea(vertices: Point[]): number {
  if (vertices.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Calculate the perimeter of a polygon given its vertices
 */
function calculatePolygonPerimeter(vertices: Point[]): number {
  if (vertices.length < 2) return 0;
  
  let perimeter = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const dx = vertices[j].x - vertices[i].x;
    const dy = vertices[j].y - vertices[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

/**
 * Order vertices clockwise around the center
 */
function orderVerticesClockwise(center: Point, vertices: Point[]): Point[] {
  return [...vertices].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
}

/**
 * Clip a point to the bounding box
 */
function clipPoint(point: Point, dimensions: Dimensions): Point {
  return {
    x: Math.max(0, Math.min(dimensions.width, point.x)),
    y: Math.max(0, Math.min(dimensions.height, point.y))
  };
}

/**
 * Generate Voronoi diagram from seed points
 */
export function generateVoronoi(
  points: Point[],
  dimensions: Dimensions
): VoronoiResult {
  if (points.length < 3) {
    throw new Error('Voronoi tessellation requires at least 3 points');
  }

  // Perform Delaunay triangulation
  const triangles = delaunayTriangulation(points, dimensions);
  
  // Build adjacency map: point index -> triangles containing that point
  const pointTriangles: Map<number, Triangle[]> = new Map();
  for (const triangle of triangles) {
    // Adjust indices (subtract 3 for super triangle vertices)
    const indices = [triangle.a - 3, triangle.b - 3, triangle.c - 3];
    for (const idx of indices) {
      if (idx >= 0 && idx < points.length) {
        if (!pointTriangles.has(idx)) {
          pointTriangles.set(idx, []);
        }
        pointTriangles.get(idx)!.push(triangle);
      }
    }
  }

  // Build Voronoi cells
  const cells: VoronoiCell[] = [];
  const neighbors: Map<number, Set<number>> = new Map();

  for (let i = 0; i < points.length; i++) {
    const center = points[i];
    const tris = pointTriangles.get(i) || [];
    
    // Collect circumcenters of adjacent triangles as Voronoi vertices
    let vertices = tris.map(t => clipPoint(t.circumcenter, dimensions));
    
    // Order vertices clockwise
    if (vertices.length > 0) {
      vertices = orderVerticesClockwise(center, vertices);
    }

    // Find neighbors (points that share a Delaunay edge with this point)
    const neighborSet: Set<number> = new Set();
    for (const tri of tris) {
      const triIndices = [tri.a - 3, tri.b - 3, tri.c - 3];
      for (const idx of triIndices) {
        if (idx !== i && idx >= 0 && idx < points.length) {
          neighborSet.add(idx);
        }
      }
    }
    neighbors.set(i, neighborSet);

    cells.push({
      center,
      vertices,
      neighbors: Array.from(neighborSet)
    });
  }

  return { cells };
}

/**
 * Generate random seed points for Voronoi tessellation
 */
export function generateSeedPoints(
  count: number,
  dimensions: Dimensions,
  random: SeededRandom
): Point[] {
  const points: Point[] = [];
  
  for (let i = 0; i < count; i++) {
    points.push({
      x: random.nextRange(0, dimensions.width),
      y: random.nextRange(0, dimensions.height)
    });
  }
  
  return points;
}

/**
 * Lloyd's relaxation for more even point distribution
 * Moves each point to the centroid of its Voronoi cell
 */
export function lloydRelaxation(
  points: Point[],
  dimensions: Dimensions,
  iterations: number
): Point[] {
  let currentPoints = [...points];
  
  for (let iter = 0; iter < iterations; iter++) {
    const voronoi = generateVoronoi(currentPoints, dimensions);
    const newPoints: Point[] = [];
    
    for (let i = 0; i < currentPoints.length; i++) {
      const cell = voronoi.cells[i];
      
      if (cell.vertices.length >= 3) {
        // Calculate centroid
        let cx = 0;
        let cy = 0;
        for (const v of cell.vertices) {
          cx += v.x;
          cy += v.y;
        }
        cx /= cell.vertices.length;
        cy /= cell.vertices.length;
        
        // Clamp to bounds
        newPoints.push({
          x: Math.max(0.01, Math.min(dimensions.width - 0.01, cx)),
          y: Math.max(0.01, Math.min(dimensions.height - 0.01, cy))
        });
      } else {
        // Keep original point if cell is degenerate
        newPoints.push(currentPoints[i]);
      }
    }
    
    currentPoints = newPoints;
  }
  
  return currentPoints;
}

/**
 * Calculate area and perimeter for a Voronoi cell
 */
export function calculateCellMetrics(cell: VoronoiCell): { area: number; perimeter: number } {
  return {
    area: calculatePolygonArea(cell.vertices),
    perimeter: calculatePolygonPerimeter(cell.vertices)
  };
}
