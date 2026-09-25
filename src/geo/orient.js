/**
 * Which way a roof ridge runs.
 *
 * In a Lorraine street village the houses stand in continuous rows with the
 * ridge parallel to the street, even when the plot (and so the footprint) is
 * deeper than it is wide.  So a building close to a street takes the
 * street's direction; anything further back (barns, sheds, the church)
 * falls back to the long axis of its footprint.
 */
import { centroid, longAxis, pointSegment } from './polygon.js';

export const STREET_REACH = 14; // metres from footprint centre to street centreline

/** segments: [[a, b], ...] street centreline pieces in local metres. */
export function ridgeDirection(ring, segments, reach = STREET_REACH) {
  const c = centroid(ring);
  const nearest = segments.reduce((best, [a, b]) => {
    const hit = pointSegment(c, a, b);
    return hit.dist < best.dist ? hit : best;
  }, { dist: Infinity, dir: null });
  return nearest.dist <= reach ? nearest.dir : longAxis(ring);
}
