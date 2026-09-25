/**
 * Walking on bridge decks.  A bridge is an OSM road with `deck` heights per
 * point; a position is "on" it when it is within half the road width (plus
 * a margin for the pavement) of the centreline.
 */
import { dot, len, sub } from './polygon.js';

const MARGIN = 0.9;

/** Deck height under p, or null if p is not on this bridge. */
export function deckHeightAt(p, { pts, deck, width }) {
  const hit = pts.slice(1).reduce((best, b, i) => {
    const a = pts[i];
    const ab = sub(b, a);
    const l2 = dot(ab, ab) || 1;
    const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2));
    const d = len(sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t]));
    return d < best.d ? { d, y: deck[i] + (deck[i + 1] - deck[i]) * t } : best;
  }, { d: Infinity, y: null });
  return hit.d <= width / 2 + MARGIN ? hit.y : null;
}
