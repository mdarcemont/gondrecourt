/**
 * Turn an Overpass JSON dump into plain features in local metres.
 */
import { openRing } from '../../src/geo/polygon.js';

const ROAD_WIDTH = {
  primary: 8, secondary: 7, tertiary: 6, residential: 5, unclassified: 5,
  living_street: 4.5, service: 3.5, track: 3, pedestrian: 4, footway: 1.8,
  path: 1.4, steps: 1.8, cycleway: 2,
};

export function parseOsm(osm, toLocal) {
  const nodes = new Map(
    osm.elements.filter((e) => e.type === 'node').map((e) => [e.id, toLocal(e.lon, e.lat)])
  );
  const ways = osm.elements
    .filter((e) => e.type === 'way')
    .map((e) => ({
      id: e.id,
      tags: e.tags ?? {},
      closed: e.nodes[0] === e.nodes[e.nodes.length - 1],
      pts: e.nodes.map((n) => nodes.get(n)).filter(Boolean),
    }));
  const points = osm.elements
    .filter((e) => e.type === 'node' && e.tags)
    .map((e) => ({ id: e.id, tags: e.tags, p: toLocal(e.lon, e.lat) }));
  return { ways, points };
}

export function roadsFrom(ways) {
  return ways
    .filter((w) => w.tags.highway && ROAD_WIDTH[w.tags.highway] !== undefined && w.pts.length >= 2)
    .map((w) => ({
      id: w.id,
      kind: w.tags.highway,
      name: w.tags.name ?? null,
      width: Number.parseFloat(w.tags.width) || ROAD_WIDTH[w.tags.highway],
      bridge: w.tags.bridge === 'yes',
      pts: w.pts,
    }));
}

const AREA_KIND = (t) =>
  (t.natural === 'water' && 'water') ||
  (t.amenity === 'parking' && 'parking') ||
  (t.landuse === 'cemetery' && 'cemetery') ||
  (t.landuse === 'forest' && 'forest') ||
  (t.natural === 'wood' && 'forest') ||
  (t.landuse === 'meadow' && 'meadow') ||
  (t.landuse === 'grass' && 'meadow') ||
  (t.amenity === 'lavoir' && 'lavoir') ||
  null;

export function areasFrom(ways) {
  return ways
    .filter((w) => w.closed && w.pts.length >= 4 && AREA_KIND(w.tags))
    .map((w) => ({ id: w.id, kind: AREA_KIND(w.tags), ring: openRing(w.pts) }));
}

/** Resolve "node/123" or "way/456" to a point or ring. */
export function findOsm(ref, { ways, points }) {
  const [type, idStr] = ref.split('/');
  const id = Number(idStr);
  if (type === 'node') {
    const hit = points.find((p) => p.id === id);
    return hit ? { point: hit.p, tags: hit.tags } : null;
  }
  const hit = ways.find((w) => w.id === id);
  return hit ? { ring: openRing(hit.pts), tags: hit.tags } : null;
}
