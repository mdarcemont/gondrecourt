import { describe, expect, it } from 'vitest';
import { makeHeightField } from '../src/geo/heightfield.js';
import { BED_DEPTH, carveWater } from '../src/geo/water.js';

// 11x11 grid, 2 m steps: banks at 5 m, a river strip x in [6, 14] whose
// surface (as the elevation model records it) sits at 2 m
const cols = 11;
const rows = 11;
const heights = Array.from({ length: cols * rows }, (_, i) => {
  const x = (i % cols) * 2;
  return x > 6 && x < 14 ? 2 : 5;
});
const field = makeHeightField({ x0: 0, z0: 0, stepX: 2, stepZ: 2, cols, rows, heights });
const river = [[6.5, -1], [13.5, -1], [13.5, 21], [6.5, 21]];

describe('carveWater', () => {
  const { heights: carved, water } = carveWater(field, [river]);

  it('cuts the bed below the recorded water surface', () => {
    expect(carved[5 * cols + 5]).toBeCloseTo(2 - BED_DEPTH, 9); // x = 10, inside
  });

  it('leaves the banks alone', () => {
    expect(carved[5 * cols + 1]).toBe(5); // x = 2, outside
  });

  it('gives the surface the recorded water level', () => {
    expect(water).toHaveLength(1);
    water[0].levels.forEach((l) => expect(l).toBeCloseTo(2, 9));
  });

  it('reads the bank height outside the polygon, not inside it', () => {
    water[0].banks.forEach((b) => expect(b).toBeGreaterThan(4));
  });
});
