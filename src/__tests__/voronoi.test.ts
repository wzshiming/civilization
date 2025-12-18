import { describe, it, expect } from 'vitest';
import { generateVoronoi, generateSeedPoints, lloydRelaxation, calculateCellMetrics } from '../utils/voronoi.js';
import { SeededRandom } from '../utils/random.js';
import type { Dimensions } from '../types/index.js';

describe('Voronoi Tessellation', () => {
  const dimensions: Dimensions = { width: 100, height: 100 };

  it('should generate Voronoi cells from seed points', () => {
    const random = new SeededRandom(42);
    const points = generateSeedPoints(10, dimensions, random);
    
    const result = generateVoronoi(points, dimensions);
    
    expect(result.cells.length).toBe(10);
    
    for (const cell of result.cells) {
      expect(cell.center).toBeDefined();
      expect(cell.vertices).toBeDefined();
      expect(Array.isArray(cell.neighbors)).toBe(true);
    }
  });

  it('should generate deterministic results with the same seed', () => {
    const random1 = new SeededRandom(42);
    const random2 = new SeededRandom(42);
    
    const points1 = generateSeedPoints(10, dimensions, random1);
    const points2 = generateSeedPoints(10, dimensions, random2);
    
    expect(points1).toEqual(points2);
  });

  it('should generate points within bounds', () => {
    const random = new SeededRandom(42);
    const points = generateSeedPoints(100, dimensions, random);
    
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(dimensions.width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(dimensions.height);
    }
  });

  it('should apply Lloyd relaxation to improve distribution', () => {
    const random = new SeededRandom(42);
    const initialPoints = generateSeedPoints(20, dimensions, random);
    
    const relaxedPoints = lloydRelaxation(initialPoints, dimensions, 3);
    
    expect(relaxedPoints.length).toBe(initialPoints.length);
    
    // Points should still be within bounds
    for (const point of relaxedPoints) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(dimensions.width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(dimensions.height);
    }
  });

  it('should calculate cell metrics correctly', () => {
    const random = new SeededRandom(42);
    const points = generateSeedPoints(10, dimensions, random);
    const result = generateVoronoi(points, dimensions);
    
    for (const cell of result.cells) {
      if (cell.vertices.length >= 3) {
        const metrics = calculateCellMetrics(cell);
        expect(metrics.area).toBeGreaterThan(0);
        expect(metrics.perimeter).toBeGreaterThan(0);
      }
    }
  });

  it('should throw error for fewer than 3 points', () => {
    const points = [
      { x: 50, y: 50 },
      { x: 25, y: 25 }
    ];
    
    expect(() => generateVoronoi(points, dimensions)).toThrow('Voronoi tessellation requires at least 3 points');
  });
});
