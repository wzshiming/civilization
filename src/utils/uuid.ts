import { SeededRandom } from './random.js';

/**
 * Generates a UUID-like identifier using the seeded random generator
 */
export function generateId(random: SeededRandom): string {
  const hexChars = '0123456789abcdef';
  let uuid = '';
  
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += hexChars[random.nextInt(0, 16)];
  }
  
  return uuid;
}
