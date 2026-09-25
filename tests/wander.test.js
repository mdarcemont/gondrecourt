import { describe, expect, it } from 'vitest';
import { wanderStep } from '../src/geo/wander.js';
import { mulberry32 } from './rng.js';
import { pointInPolygon } from '../src/geo/polygon.js';

// a 40 m x 8 m channel
const river = [[0, 0], [40, 0], [40, 8], [0, 8]];

describe('wanderStep', () => {
  it('moves forward at the given speed in open water', () => {
    const s = wanderStep({ x: 20, z: 4, heading: Math.PI / 2 }, river, 1, 0.3, () => 0.5);
    expect(s.x).toBeCloseTo(20.3, 6);
    expect(s.z).toBeCloseTo(4, 6);
  });

  it('never leaves the water over a long random walk', () => {
    const rand = mulberry32(7);
    let s = { x: 20, z: 4, heading: 0 };
    for (let i = 0; i < 20000; i++) {
      s = wanderStep(s, river, 1 / 30, 0.4, rand);
      expect(pointInPolygon([s.x, s.z], river)).toBe(true);
    }
  });

  it('turns away from the bank it is heading into', () => {
    const s = wanderStep({ x: 20, z: 7, heading: 0 }, river, 0.1, 0.3, () => 0.5); // heading +z, bank 1 m ahead
    expect(Math.cos(s.heading)).toBeLessThan(1 - 1e-6);
  });
});
