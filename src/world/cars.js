/**
 * Parked cars, French models of the 90s and 2000s (car-models.js).  Placement is `type-seen`:
 * the photos show cars in these bays, not which car is where.
 */
import { buildCar } from './car-mesh.js';
import { pickModel } from './car-models.js';
import { pointInPolygon, longAxis, centroid, dot, perp } from '../geo/polygon.js';

const STALL = 2.6;
const PARK_L = 4.3; // footprint used to test that a stall fits
const PARK_W = 1.8;

/** A random French car of the 90s/2000s, in one of its period colours. */
export function carMesh(rand) {
  const model = pickModel(rand());
  return buildCar(model, model.colours[Math.floor(rand() * model.colours.length)], rand);
}

/** Cars side by side along the long axis of a car-park polygon, nose across it. */
export function carsInLot(ring, heightAt, share, rand) {
  const u = longAxis(ring);
  const n = perp(u);
  const c = centroid(ring);
  const along = ring.map((p) => dot(p, u));
  const out = [];
  for (let s = Math.min(...along) + STALL / 2; s < Math.max(...along); s += STALL) {
    const t = dot(c, n);
    const p = [u[0] * s + n[0] * t, u[1] * s + n[1] * t];
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) =>
      [p[0] + u[0] * a * (PARK_W / 2) + n[0] * b * (PARK_L / 2), p[1] + u[1] * a * (PARK_W / 2) + n[1] * b * (PARK_L / 2)]);
    if (!corners.every((q) => pointInPolygon(q, ring)) || rand() > share) continue;
    const car = carMesh(rand);
    car.position.set(p[0], heightAt(p[0], p[1]), p[1]);
    car.rotation.y = Math.atan2(n[0], n[1]) + (rand() > 0.5 ? Math.PI : 0);
    out.push(car);
  }
  return out;
}

/** Cars parked nose to tail along a kerb: points already offset to the kerb. */
export function carsAlongKerb(points, heightAt, share, rand) {
  return points.filter(() => rand() < share).map(({ p, dir }) => {
    const car = carMesh(rand);
    car.position.set(p[0], heightAt(p[0], p[1]), p[1]);
    car.rotation.y = Math.atan2(dir[0], dir[1]);
    return car;
  });
}
