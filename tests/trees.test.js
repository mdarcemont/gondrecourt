import { describe, expect, it } from 'vitest';
import { detectTrees, MIN_HEIGHT } from '../src/geo/trees.js';

const W = 40;
const R = 30;
const res = 0.5;
const bump = (cx, cy, h, sigma) => (c, r) => h * Math.exp(-((c - cx) ** 2 + (r - cy) ** 2) / (2 * sigma ** 2));

function raster(fns) {
  return Array.from({ length: W * R }, (_, i) => Math.max(...fns.map((f) => f(i % W, Math.floor(i / W)))));
}
const all = (v) => Array.from({ length: W * R }, () => v);

describe('detectTrees', () => {
  it('finds one tree per crown, at its top', () => {
    const height = raster([bump(10, 10, 12, 4), bump(30, 18, 8, 3)]);
    const trees = detectTrees({ height, veg: all(true), blocked: all(false), width: W, rows: R, res });
    expect(trees).toHaveLength(2);
    const tall = trees.find((t) => t.height > 10);
    expect([tall.col, tall.row]).toEqual([10, 10]);
  });

  it('ignores canopy that is not vegetation (a roof, a wall)', () => {
    const height = raster([bump(10, 10, 12, 4)]);
    const trees = detectTrees({ height, veg: all(false), blocked: all(false), width: W, rows: R, res });
    expect(trees).toHaveLength(0);
  });

  it('ignores anything on a building', () => {
    const height = raster([bump(10, 10, 12, 4)]);
    const trees = detectTrees({ height, veg: all(true), blocked: all(true), width: W, rows: R, res });
    expect(trees).toHaveLength(0);
  });

  it('ignores hedges and lawns below the minimum height', () => {
    const height = raster([bump(10, 10, MIN_HEIGHT - 0.5, 4)]);
    const trees = detectTrees({ height, veg: all(true), blocked: all(false), width: W, rows: R, res });
    expect(trees).toHaveLength(0);
  });

  it('keeps crowns from overlapping much', () => {
    const height = raster([bump(10, 10, 12, 3), bump(18, 10, 12, 3)]);
    const trees = detectTrees({ height, veg: all(true), blocked: all(false), width: W, rows: R, res });
    expect(trees).toHaveLength(2);
    trees.forEach((t) => expect(t.crown).toBeLessThanOrEqual(8 * res * 0.6 + 1e-9));
  });
});
