import { describe, expect, it } from 'vitest';
import { yawToward } from '../src/travel.js';

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
