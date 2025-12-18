import { describe, it, expect } from 'vitest';
import { NoiseGenerator } from '../utils/noise.js';

describe('NoiseGenerator', () => {
  it('should produce deterministic results with the same seed', () => {
    const noise1 = new NoiseGenerator(42);
    const noise2 = new NoiseGenerator(42);

    const values1 = [
      noise1.noise2D(0.5, 0.5),
      noise1.noise2D(1.0, 1.5),
      noise1.noise2D(2.5, 3.0)
    ];
    const values2 = [
      noise2.noise2D(0.5, 0.5),
      noise2.noise2D(1.0, 1.5),
      noise2.noise2D(2.5, 3.0)
    ];

    expect(values1).toEqual(values2);
  });

  it('should produce different results with different seeds', () => {
    const noise1 = new NoiseGenerator(42);
    const noise2 = new NoiseGenerator(123);

    const value1 = noise1.noise2D(0.5, 0.5);
    const value2 = noise2.noise2D(0.5, 0.5);

    expect(value1).not.toBe(value2);
  });

  it('should generate noise values approximately in range [-1, 1]', () => {
    const noise = new NoiseGenerator(42);

    for (let i = 0; i < 100; i++) {
      const x = i * 0.1;
      const y = i * 0.15;
      const value = noise.noise2D(x, y);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('should generate FBM noise', () => {
    const noise = new NoiseGenerator(42);

    const value = noise.fbm(0.5, 0.5, 6, 0.5);
    
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThanOrEqual(-1);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('should generate ridge noise', () => {
    const noise = new NoiseGenerator(42);

    const value = noise.ridgeNoise(0.5, 0.5, 6, 0.5);
    
    expect(typeof value).toBe('number');
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('should be smooth and continuous', () => {
    const noise = new NoiseGenerator(42);
    
    // Sample two close points - they should have similar values
    const v1 = noise.noise2D(1.0, 1.0);
    const v2 = noise.noise2D(1.01, 1.01);
    
    // The difference should be small
    expect(Math.abs(v1 - v2)).toBeLessThan(0.1);
  });
});
