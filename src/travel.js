/**
 * Fast travel: digits 1-8 put the walker at a stop from data/travel.json,
 * facing the place.  A small list in the corner shows the stops.
 */
import travel from '../data/travel.json';

/** Yaw that makes the walker's forward (-sin yaw, -cos yaw) point from (x, z) to (tx, tz). */
export const yawToward = (x, z, tx, tz) => Math.atan2(-(tx - x), -(tz - z));

export function createTravel({ player, flash }) {
  const list = document.getElementById('travel');
  if (list) list.innerHTML = travel.stops.map((s, i) => `<div><kbd>${i + 1}</kbd> ${s.name}</div>`).join('');
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
    const m = /^Digit([1-9])$/.exec(e.code);
    const stop = m && travel.stops[Number(m[1]) - 1];
    if (!stop) return;
    player.teleport({ x: stop.x, z: stop.z, yaw: yawToward(stop.x, stop.z, ...stop.look), pitch: 0.02 });
    flash(stop.name);
  });
  return travel.stops;
}
