import { describe, expect, it } from 'vitest';
import { freeSpot, yawToward } from '../src/travel.js';

describe('yawToward', () => {
  it('faces the target with forward = (-sin yaw, -cos yaw)', () => {
    [[10, 0], [0, 10], [-5, -5], [3, -8]].forEach(([tx, tz]) => {
      const yaw = yawToward(0, 0, tx, tz);
      const l = Math.hypot(tx, tz);
      expect(-Math.sin(yaw)).toBeCloseTo(tx / l, 9);
      expect(-Math.cos(yaw)).toBeCloseTo(tz / l, 9);
    });
  });
});

describe('freeSpot', () => {
  const house = (x, z) => !(x > -5 && x < 5 && z > -5 && z < 5); // free outside a 10 m square
  it('keeps a free stop where it is', () => {
    expect(freeSpot(20, 0, house)).toEqual([20, 0]);
  });
  it('moves a stop inside a building to the nearest free spot outside', () => {
    const [x, z] = freeSpot(1, 0, house);
    expect(house(x, z)).toBe(true);
    expect(Math.hypot(x - 1, z)).toBeLessThanOrEqual(7);
  });
});
