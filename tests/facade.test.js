import { describe, expect, it } from 'vitest';
import { edgeNormal, facadeToward, pushOut } from '../src/geo/facade.js';
import { pointInPolygon } from '../src/geo/polygon.js';

// CCW in (x, z): 12 wide along x, 8 deep along z
const house = [[0, 0], [12, 0], [12, 8], [0, 8]];

describe('edgeNormal', () => {
  it('points outward on a CCW ring', () => {
    expect(edgeNormal(house, 0)).toEqual([0, -1]); // edge along z = 0 faces -z
    expect(edgeNormal(house, 1)).toEqual([1, -0]);
  });
});

describe('facadeToward', () => {
  it('picks the side facing the street', () => {
    const f = facadeToward(house, [6, -10]);
    expect(f.mid).toEqual([6, 0]);
    expect(f.length).toBe(12);
  });

  it('ignores edges too short for a shopfront', () => {
    const notched = [[0, 0], [5, 0], [5, -1], [7, -1], [7, 0], [12, 0], [12, 8], [0, 8]];
    const f = facadeToward(notched, [6, -10], 3);
    expect(f.length).toBeGreaterThanOrEqual(3);
  });
});

describe('pushOut', () => {
  it('leaves a point that is clear alone', () => {
    expect(pushOut([6, -3], house, 0.4, false)).toEqual([6, -3]);
  });

  it('pushes a touching disc to exactly r from the wall', () => {
    const [x, z] = pushOut([6, -0.2], house, 0.4, false);
    expect(x).toBeCloseTo(6, 9);
    expect(z).toBeCloseTo(-0.4, 9);
  });

  it('ejects a point that got inside, through the nearest wall', () => {
    const p = [6, 1];
    const out = pushOut(p, house, 0.4, pointInPolygon(p, house));
    expect(out[1]).toBeCloseTo(-0.4, 9);
    expect(pointInPolygon(out, house)).toBe(false);
  });
});
