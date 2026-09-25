/**
 * Terrain (the IGN elevation grid, river bed already carved) and the land
 * cover painted onto it as vertex colours.
 */
import * as THREE from 'three';
import { PAL } from '../engine/palette.js';
import { cel } from '../engine/toon.js';
import { pointInPolygon, pointSegment } from '../geo/polygon.js';

const COVER = {
  forest: PAL.forest,
  meadow: PAL.meadow,
  cemetery: PAL.cemetery,
  parking: PAL.parking,
  water: PAL.waterDeep,
  lavoir: PAL.pavement,
};
// later entries win where areas overlap
const PRIORITY = ['meadow', 'forest', 'cemetery', 'parking', 'lavoir', 'water'];

// street frontage in a Lorraine village is paved (the usoir), not lawn
const FRONTAGE = 5; // metres beyond the carriageway edge
const TOWN_STREETS = new Set(['primary', 'secondary', 'tertiary', 'residential', 'living_street', 'pedestrian']);

function streetSegments(roads) {
  return roads
    .filter((r) => TOWN_STREETS.has(r.kind))
    .flatMap((r) => r.pts.slice(1).map((b, i) => ({ a: r.pts[i], b, reach: r.width / 2 + FRONTAGE })));
}

// percent of a terrain cell the infrared photo sees as low vegetation
const GRASS_MIN = 45;

/** grassShare is measured (aerial); the street-frontage rule is the fallback. */
function coverAt(p, areas, streets, grassShare) {
  const hit = PRIORITY.reduce((found, kind) => {
    const inside = areas.some((a) => a.kind === kind && pointInPolygon(p, a.ring));
    return inside ? kind : found;
  }, null);
  if (hit) return COVER[hit];
  if (grassShare !== undefined) return grassShare >= GRASS_MIN ? PAL.grass : PAL.pavement;
  const frontage = streets.some((s) => pointSegment(p, s.a, s.b).dist <= s.reach);
  return frontage ? PAL.pavement : PAL.grass;
}

export function buildTerrain(field, areas, roads = []) {
  const streets = streetSegments(roads);
  const { x0, z0, x1, z1, cols, rows, heights } = field;
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0, cols - 1, rows - 1);
  geo.rotateX(-Math.PI / 2); // plane now lies in x/z, row 0 at -z (north)
  geo.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);

  const pos = geo.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, heights[i]);
    c.set(coverAt([pos.getX(i), pos.getZ(i)], areas, streets, field.grass?.[i]));
    colours.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, cel({ color: 0xffffff, vertexColors: true, bands: 3 }));
  mesh.receiveShadow = true;
  return mesh;
}
