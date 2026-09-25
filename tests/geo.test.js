import { describe, expect, it } from 'vitest';
import { makeProjection, metresPerDegree } from '../src/geo/project.js';
import {
  centroid, clipHalfPlane, ensureCCW, longAxis, openRing, pointInPolygon,
  pointSegment, signedArea, splitAtLine,
} from '../src/geo/polygon.js';
import { planRoof } from '../src/geo/roof.js';
import { makeHeightField } from '../src/geo/heightfield.js';
import { ridgeDirection } from '../src/geo/orient.js';

const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
const rect = [[0, 0], [20, 0], [20, 8], [0, 8]]; // long along x

describe('projection', () => {
  const proj = makeProjection({ lat: 48.513, lon: 5.5061 });

  it('puts the origin at 0,0', () => {
    expect(proj.toLocal(5.5061, 48.513)).toEqual([0, 0]);
  });

  it('maps north to -z and east to +x', () => {
    const [x, z] = proj.toLocal(5.5071, 48.514);
    expect(x).toBeGreaterThan(0);
    expect(z).toBeLessThan(0);
  });

  it('has realistic scale at Gondrecourt (about 111 km/deg lat, 74 km/deg lon)', () => {
    const m = metresPerDegree(48.513);
    expect(m.lat).toBeCloseTo(111210, -2);
    expect(m.lon).toBeCloseTo(73860, -2);
  });

  it('round-trips', () => {
    const [lon, lat] = proj.toGeo(...proj.toLocal(5.5088, 48.5139));
    expect(lon).toBeCloseTo(5.5088, 9);
    expect(lat).toBeCloseTo(48.5139, 9);
  });
});

describe('polygon', () => {
  it('opens a closed ring and drops repeated points', () => {
    expect(openRing([[0, 0], [1, 0], [1, 0], [1, 1], [0, 0]])).toEqual([[0, 0], [1, 0], [1, 1]]);
  });

  it('computes signed area and orientation', () => {
    expect(signedArea(square)).toBe(100);
    expect(signedArea([...square].reverse())).toBe(-100);
    expect(signedArea(ensureCCW([...square].reverse()))).toBe(100);
  });

  it('finds the centroid of an L shape inside its heavier arm', () => {
    const l = [[0, 0], [10, 0], [10, 2], [2, 2], [2, 10], [0, 10]];
    const [cx, cz] = centroid(l);
    expect(cx).toBeCloseTo(cz, 9);
    expect(cx).toBeLessThan(5);
  });

  it('tests point containment', () => {
    expect(pointInPolygon([5, 5], square)).toBe(true);
    expect(pointInPolygon([15, 5], square)).toBe(false);
  });

  it('clips to a half plane', () => {
    const half = clipHalfPlane(square, [1, 0], 4);
    expect(Math.abs(signedArea(half))).toBeCloseTo(60, 9);
  });

  it('splits the outline where it crosses a line', () => {
    expect(splitAtLine(square, [0, 1], 5)).toHaveLength(6);
  });

  it('measures point to segment distance', () => {
    const { dist, dir } = pointSegment([5, 3], [0, 0], [10, 0]);
    expect(dist).toBe(3);
    expect(dir).toEqual([1, 0]);
  });

  it('finds the long axis of a rotated rectangle', () => {
    const a = Math.PI / 6;
    const rot = ([x, z]) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
    const [ux, uz] = longAxis(rect.map(rot));
    expect(Math.abs(ux * Math.cos(a) + uz * Math.sin(a))).toBeCloseTo(1, 6);
  });
});

describe('roof', () => {
  it('builds a gable with the ridge on the centre line', () => {
    const roof = planRoof({ ring: rect, ridgeDir: [1, 0], eave: 6, ridge: 9 });
    expect(roof.kind).toBe('gable');
    expect(roof.faces).toHaveLength(2);
    expect(roof.heightAt([10, 4])).toBeCloseTo(9, 9);
    expect(roof.heightAt([10, 0])).toBeCloseTo(6, 9);
    expect(roof.heightAt([10, 2])).toBeCloseTo(7.5, 9);
    // the two gable ends get a ridge vertex each
    expect(roof.outline).toHaveLength(6);
  });

  it('falls back to flat when the measured drop is tiny', () => {
    const roof = planRoof({ ring: rect, ridgeDir: [1, 0], eave: 6, ridge: 6.3 });
    expect(roof.kind).toBe('flat');
    expect(roof.heightAt([3, 3])).toBe(6.3);
  });
});

describe('height field', () => {
  const hf = makeHeightField({
    x0: 0, z0: 0, stepX: 10, stepZ: 10, cols: 2, rows: 2, heights: [0, 10, 20, 30],
  });

  it('interpolates bilinearly', () => {
    expect(hf.sample(5, 5)).toBe(15);
    expect(hf.sample(10, 0)).toBe(10);
  });

  it('clamps outside the grid', () => {
    expect(hf.sample(-50, -50)).toBe(0);
    expect(hf.sample(99, 99)).toBe(30);
  });

  it('rejects a grid of the wrong size', () => {
    expect(() => makeHeightField({ x0: 0, z0: 0, stepX: 1, stepZ: 1, cols: 3, rows: 3, heights: [1] })).toThrow();
  });
});

describe('ridge direction', () => {
  // a deep narrow plot (6 wide along x, 14 deep along z) fronting a street along x
  const deepPlot = [[0, 0], [6, 0], [6, 14], [0, 14]];
  const street = [[[-50, -3], [50, -3]]];

  it('runs parallel to a nearby street even on a deep plot', () => {
    const [ux, uz] = ridgeDirection(deepPlot, street);
    expect(Math.abs(ux)).toBeCloseTo(1, 9);
    expect(uz).toBeCloseTo(0, 9);
  });

  it('uses the footprint long axis when no street is near', () => {
    const [ux] = ridgeDirection(deepPlot, [[[-50, -300], [50, -300]]]);
    expect(Math.abs(ux)).toBeCloseTo(0, 9);
  });
});

describe('hip roof', () => {
  it('keeps every wall at the eave and peaks at the measured ridge', async () => {
    const { planHipRoof } = await import('../src/geo/roof.js');
    const roof = planHipRoof({ ring: rect, eave: 6, ridge: 9 });
    expect(roof.kind).toBe('hip');
    rect.forEach((p) => expect(roof.heightAt(p)).toBeCloseTo(6, 9));
    expect(roof.heightAt([10, 4])).toBeCloseTo(9, 9);
    expect(roof.faces).toHaveLength(4);
    // the faces tile the footprint exactly
    const area = roof.faces.reduce((s, f) => s + Math.abs(signedArea(f)), 0);
    expect(area).toBeCloseTo(160, 6);
  });
});
