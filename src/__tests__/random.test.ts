import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../utils/random.js';

describe('SeededRandom', () => {
  it('should produce deterministic results with the same seed', () => {
    const random1 = new SeededRandom(42);
    const random2 = new SeededRandom(42);

    const values1 = [random1.next(), random1.next(), random1.next()];
    const values2 = [random2.next(), random2.next(), random2.next()];

    expect(values1).toEqual(values2);
  });

  it('should produce different results with different seeds', () => {
    const random1 = new SeededRandom(42);
    const random2 = new SeededRandom(123);

    const values1 = [random1.next(), random1.next(), random1.next()];
    const values2 = [random2.next(), random2.next(), random2.next()];

    expect(values1).not.toEqual(values2);
  });

  it('should generate values in range [0, 1)', () => {
    const random = new SeededRandom(42);

    for (let i = 0; i < 1000; i++) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should generate integers in the specified range', () => {
    const random = new SeededRandom(42);

    for (let i = 0; i < 100; i++) {
      const value = random.nextInt(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(10);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('should generate floats in the specified range', () => {
    const random = new SeededRandom(42);

    for (let i = 0; i < 100; i++) {
      const value = random.nextRange(-10, 10);
      expect(value).toBeGreaterThanOrEqual(-10);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it('should shuffle arrays consistently with the same seed', () => {
    const random1 = new SeededRandom(42);
    const random2 = new SeededRandom(42);

    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];

    random1.shuffle(arr1);
    random2.shuffle(arr2);

    expect(arr1).toEqual(arr2);
  });
});
