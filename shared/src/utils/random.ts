/**
 * Seeded random number generator for reproducible map generation
 * Uses a simple LCG (Linear Congruential Generator) algorithm
 */
export class SeededRandom {
  private seed: number

  constructor(seed: number = Date.now()) {
    this.seed = seed % 2147483647
    if (this.seed <= 0) this.seed += 2147483646
  }

  /**
   * Returns a random number between 0 and 1
   */
  random(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }

  /**
   * Returns a random integer between min (inclusive) and max (exclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min
  }

  /**
   * Returns a random float between min and max
   */
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min
  }

  /**
   * Returns true with the given probability (0-1)
   */
  chance(probability: number): boolean {
    return this.random() < probability
  }

  /**
   * Randomly picks an element from an array
   */
  pick<T>(array: T[]): T {
    return array[this.randomInt(0, array.length)]
  }
}
