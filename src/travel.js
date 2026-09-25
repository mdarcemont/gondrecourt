/**
 * Fast travel: digits 1-8 put the walker at a stop from data/travel.json,
 * facing the place.  A small list in the corner shows the stops.
 */
import travel from '../data/travel.json';

/** Yaw that makes the walker's forward (-sin yaw, -cos yaw) point from (x, z) to (tx, tz). */
export const yawToward = (x, z, tx, tz) => Math.atan2(-(tx - x), -(tz - z));

/** First free spot on a growing spiral round (x, z): never drop the walker inside a building. */
export function freeSpot(x, z, isFree, step = 1, rings = 12) {
  if (isFree(x, z)) return [x, z];
  for (let r = 1; r <= rings; r++) {
    for (let k = 0; k < 8 * r; k++) {
      const a = (k / (8 * r)) * Math.PI * 2;
      const p = [x + Math.cos(a) * r * step, z + Math.sin(a) * r * step];
      if (isFree(...p)) return p;
    }
  }
  return [x, z];
}

export function createTravel({ player, world, flash }) {
  const isFree = (x, z) => {
    const q = world.collide([x, z], 0.34);
    return q !== null && Math.hypot(q[0] - x, q[1] - z) < 1e-6;
  };
  const list = document.getElementById('travel');
  if (list) list.innerHTML = travel.stops.map((s, i) => `<div><kbd>${i + 1}</kbd> ${s.name}</div>`).join('');
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
    const m = /^Digit([1-9])$/.exec(e.code);
    const stop = m && travel.stops[Number(m[1]) - 1];
    if (!stop) return;
    const [x, z] = freeSpot(stop.x, stop.z, isFree);
    player.teleport({ x, z, yaw: yawToward(x, z, ...stop.look), pitch: 0.02 });
    flash(stop.name);
  });
  return travel.stops;
}
