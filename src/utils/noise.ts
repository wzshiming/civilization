import { SeededRandom } from './random.js';

/**
 * Simplified Perlin-like noise generator for terrain generation
 * Uses a gradient noise approach with interpolation
 */
export class NoiseGenerator {
  private random: SeededRandom;
  private gradients: Map<string, { x: number; y: number }>;
  private permutation: number[];

  constructor(seed: number) {
    this.random = new SeededRandom(seed);
    this.gradients = new Map();
    
    // Generate permutation table
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation.push(i);
    }
    this.random.shuffle(this.permutation);
    // Duplicate for wraparound
    this.permutation = [...this.permutation, ...this.permutation];
  }

  /**
   * Get or generate gradient vector for a grid point
   */
  private getGradient(ix: number, iy: number): { x: number; y: number } {
    const key = `${ix},${iy}`;
    if (!this.gradients.has(key)) {
      const hash = this.permutation[(this.permutation[ix & 255] + iy) & 255];
      const angle = (hash / 256) * 2 * Math.PI;
      this.gradients.set(key, {
        x: Math.cos(angle),
        y: Math.sin(angle)
      });
    }
    return this.gradients.get(key)!;
  }

  /**
   * Smoothstep interpolation
   */
  private smoothstep(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /**
   * Dot product of distance and gradient vectors
   */
  private dotGridGradient(ix: number, iy: number, x: number, y: number): number {
    const gradient = this.getGradient(ix, iy);
    const dx = x - ix;
    const dy = y - iy;
    return dx * gradient.x + dy * gradient.y;
  }

  /**
   * Generate noise value at a point
   * Returns value in range [-1, 1]
   */
  noise2D(x: number, y: number): number {
    // Grid cell coordinates
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    // Interpolation weights
    const sx = this.smoothstep(x - x0);
    const sy = this.smoothstep(y - y0);

    // Interpolate between grid point gradients
    const n0 = this.dotGridGradient(x0, y0, x, y);
    const n1 = this.dotGridGradient(x1, y0, x, y);
    const ix0 = this.lerp(n0, n1, sx);

    const n2 = this.dotGridGradient(x0, y1, x, y);
    const n3 = this.dotGridGradient(x1, y1, x, y);
    const ix1 = this.lerp(n2, n3, sx);

    return this.lerp(ix0, ix1, sy);
  }

  /**
   * Generate fractal Brownian motion noise (multiple octaves)
   * Returns value approximately in range [-1, 1]
   */
  fbm(x: number, y: number, octaves: number = 6, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }

  /**
   * Generate ridge noise (inverted absolute value for mountain-like features)
   */
  ridgeNoise(x: number, y: number, octaves: number = 6, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const n = 1 - Math.abs(this.noise2D(x * frequency, y * frequency));
      total += n * n * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}
