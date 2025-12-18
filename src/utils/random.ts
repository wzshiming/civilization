/**
 * Seeded pseudo-random number generator using xorshift128+
 * Provides deterministic random generation for reproducible map generation
 */
export class SeededRandom {
  private state0: number;
  private state1: number;

  constructor(seed: number) {
    // Initialize state using a simple hash of the seed
    this.state0 = seed >>> 0;
    this.state1 = (seed * 1812433253 + 1) >>> 0;
    
    // Warm up the generator
    for (let i = 0; i < 10; i++) {
      this.next();
    }
  }

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive)
   */
  next(): number {
    let s1 = this.state0;
    const s0 = this.state1;
    this.state0 = s0;
    s1 ^= s1 << 23;
    s1 ^= s1 >>> 17;
    s1 ^= s0;
    s1 ^= s0 >>> 26;
    this.state1 = s1 >>> 0;
    
    // Convert to 0-1 range
    return ((this.state0 + this.state1) >>> 0) / 0x100000000;
  }

  /**
   * Returns a random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Returns a random number between min and max
   */
  nextRange(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
