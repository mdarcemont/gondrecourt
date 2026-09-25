/**
 * Slow wandering inside a polygon (ducks on the river).
 *
 * One pure step: turn a little at random, look ahead, and if the point
 * ahead leaves the water, turn toward the inside instead of going there.
 */
import { pointInPolygon } from './polygon.js';

const LOOKAHEAD = 2.0; // metres
const MAX_TURN = 0.6;  // radians per second of random turning

export function wanderStep({ x, z, heading }, ring, dt, speed, rand) {
  const turned = heading + (rand() - 0.5) * 2 * MAX_TURN * dt;
  const ahead = (h) => [x + Math.sin(h) * LOOKAHEAD, z + Math.cos(h) * LOOKAHEAD];
  // try the wanted heading, then turn away in growing steps until the way ahead is water
  const tries = [0, 0.5, -0.5, 1, -1, 1.6, -1.6, Math.PI];
  const free = tries.map((d) => turned + d).find((h) => pointInPolygon(ahead(h), ring));
  if (free === undefined) return { x, z, heading: turned + Math.PI };
  const nx = x + Math.sin(free) * speed * dt;
  const nz = z + Math.cos(free) * speed * dt;
  return pointInPolygon([nx, nz], ring) ? { x: nx, z: nz, heading: free } : { x, z, heading: free };
}
