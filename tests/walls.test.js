import { describe, expect, it } from 'vitest';
import { wallColliders } from '../src/geo/walls.js';
import { pointInPolygon } from '../src/geo/polygon.js';

const room = [[0, 0], [10, 0], [10, 6], [0, 6]];

describe('wallColliders', () => {
  it('makes one slab per wall without doors', () => {
    expect(wallColliders(room, [])).toHaveLength(4);
  });

  it('leaves a gap where the door is', () => {
    const walls = wallColliders(room, [{ edge: 0, at: 0.5, width: 2 }]);
    expect(walls).toHaveLength(5);
    const blocked = (p) => walls.some((w) => pointInPolygon(p, w));
    expect(blocked([5, 0])).toBe(false);
    expect(blocked([2, 0])).toBe(true);
    expect(blocked([10, 3])).toBe(true);
  });
});
