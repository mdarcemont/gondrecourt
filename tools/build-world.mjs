/**
 * data/raw/* (OSM, BD TOPO, RGE ALTI)  ->  data/world.json
 *
 * Everything the browser needs, already in local metres (see
 * src/geo/project.js for the axes) with y relative to the square.
 * Run after `npm run fetch`, or whenever data/landmarks.json changes.
 */
import fs from 'node:fs';
import { makeProjection } from '../src/geo/project.js';
import { makeHeightField } from '../src/geo/heightfield.js';
import { centroid, pointInPolygon } from '../src/geo/polygon.js';
import { ridgeDirection } from '../src/geo/orient.js';
import { areasFrom, findOsm, parseOsm, roadsFrom } from './lib/osm.mjs';
import { buildingsFrom, matchBuilding } from './lib/bdtopo.mjs';
import { carveWater } from '../src/geo/water.js';
import { analyseAerial, loadAerial } from './lib/aerial.mjs';

const read = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url)));
const round = (v) => Math.round(v * 100) / 100;

const area = read('./area.json');
const proj = makeProjection(area.origin);
const raw = { osm: read('../data/raw/osm.json'), bd: read('../data/raw/bdtopo_batiment.json'), dem: read('../data/raw/terrain.json') };
const { landmarks } = read('../data/landmarks.json');

/* --- terrain: the lat/lon grid is regular, so it is a regular metre grid too --- */
const [x0, z0] = proj.toLocal(raw.dem.west, raw.dem.north);
const [x1] = proj.toLocal(raw.dem.west + raw.dem.dLon, raw.dem.north);
const [, z1] = proj.toLocal(raw.dem.west, raw.dem.north - raw.dem.dLat);
const absolute = makeHeightField({
  x0, z0, stepX: x1 - x0, stepZ: z1 - z0, cols: raw.dem.cols, rows: raw.dem.rows, heights: raw.dem.heights,
});
const base = round(absolute.sample(0, 0));
const relHeights = raw.dem.heights.map((h) => h - base);
const terrain0 = makeHeightField({ ...absolute, heights: relHeights });

/* --- vector data --- */
const osm = parseOsm(raw.osm, proj.toLocal);
const roads = roadsFrom(osm.ways);
const areas = areasFrom(osm.ways);
const waterRings = areas.filter((a) => a.kind === 'water').map((a) => a.ring);
const { heights: carved, water } = carveWater(terrain0, waterRings);
const terrain = makeHeightField({ ...terrain0, heights: carved });

/* bridges keep a straight deck between their two banks instead of dipping into the river */
const roadsOut = roads.map((r) => {
  // OSM bridge ends sit on the low river bank; the deck meets the approach road,
  // so each end takes the higher of its own ground and the ground 6 m beyond it
  const endHeight = (end, inner) => {
    const d = [end[0] - inner[0], end[1] - inner[1]];
    const l = Math.hypot(d[0], d[1]) || 1;
    return Math.max(terrain0.sample(...end), terrain0.sample(end[0] + (d[0] / l) * 6, end[1] + (d[1] / l) * 6));
  };
  const ya = endHeight(r.pts[0], r.pts[1]);
  const yb = endHeight(r.pts[r.pts.length - 1], r.pts[r.pts.length - 2]);
  const deck = r.bridge
    ? r.pts.map((p, i) => round(Math.max(ya + ((yb - ya) * i) / Math.max(1, r.pts.length - 1), terrain0.sample(...p)) + 0.25))
    : null;
  return { ...r, pts: r.pts.map(([x, z]) => [round(x), round(z)]), deck };
});

const streetSegments = roads
  .filter((r) => !['footway', 'path', 'steps', 'cycleway', 'track'].includes(r.kind))
  .flatMap((r) => r.pts.slice(1).map((p, i) => [r.pts[i], p]));

const bareBuildings = buildingsFrom(raw.bd, { toLocal: proj.toLocal, base, groundAt: ([x, z]) => terrain.sample(x, z) });

/* --- aerial: measured roof colours, trees, grass vs paved --- */
const aerial = analyseAerial(loadAerial(new URL('../data/raw/aerial/', import.meta.url)), bareBuildings, proj);
const buildings = bareBuildings.map((b) => ({
  ...b,
  ridgeDir: ridgeDirection(b.ring, streetSegments).map(round),
  roofRgb: aerial.roofRgb.get(b.id) ?? null,
}));
const cover = Array.from({ length: terrain.cols * terrain.rows }, (_, i) => {
  const x = terrain.x0 + (i % terrain.cols) * terrain.stepX;
  const z = terrain.z0 + Math.floor(i / terrain.cols) * terrain.stepZ;
  return Math.round(aerial.grassShare(x, z, terrain.stepX / 2) * 100);
});

/* --- landmarks: link each to its real footprint, loudly if that fails --- */
const linked = landmarks.map((l) => {
  const target = findOsm(l.osm, osm);
  const building = l.bdtopo
    ? buildings.find((b) => b.id === l.bdtopo)
    : target && matchBuilding(target, buildings);
  if (!building && !l.standalone) console.warn(`!! landmark ${l.id}: no building matched for ${l.osm}`);
  const anchor = target?.point ?? (target?.ring ? centroid(target.ring) : null);
  const annexes = (l.annexes ?? []).filter((id) => buildings.some((b) => b.id === id));
  if (annexes.length !== (l.annexes ?? []).length) console.warn(`!! landmark ${l.id}: an annex id did not match`);
  return { id: l.id, name: l.name, buildingId: building?.id ?? null, annexes, replace: Boolean(l.replace), anchor: anchor?.map(round) ?? null };
});

const pois = osm.points
  .filter((p) => p.tags.name && (p.tags.amenity || p.tags.shop || p.tags.tourism))
  .map((p) => ({ name: p.tags.name, kind: p.tags.amenity ?? p.tags.shop ?? p.tags.tourism, p: p.p.map(round) }));

const world = {
  generated: new Date().toISOString(),
  origin: area.origin,
  baseAltitude: base,
  attribution: [
    '© OpenStreetMap contributors (ODbL)',
    'IGN – BD TOPO®, RGE ALTI®, LiDAR HD, BD ORTHO® (Licence Ouverte Etalab 2.0)',
  ],
  terrain: { ...terrain, sample: undefined, heights: terrain.heights.map(round), grass: cover },
  trees: aerial.trees,
  buildings,
  roads: roadsOut,
  areas: areas.map((a) => ({ ...a, ring: a.ring.map(([x, z]) => [round(x), round(z)]) })),
  water,
  landmarks: linked,
  pois,
};
fs.writeFileSync(new URL('../data/world.json', import.meta.url), JSON.stringify(world));

const inside = (p) => pointInPolygon(p, waterRings[0] ?? []);
console.log([
  `base altitude ${base} m`,
  `terrain ${terrain.cols}x${terrain.rows}, ${round(terrain.x1 - terrain.x0)} x ${round(terrain.z1 - terrain.z0)} m`,
  `${buildings.length} buildings, ${buildings.filter((b) => b.ridge - b.eave >= 0.6).length} pitched`,
  `${roadsOut.length} roads (${roadsOut.filter((r) => r.bridge).length} bridges), ${areas.length} areas, ${water.length} water bodies`,
  `origin in water? ${inside([0, 0])}`,
  `${aerial.trees.length} trees (LiDAR), ${aerial.roofRgb.size} roofs coloured from the orthophoto`,
  ...linked.map((l) => `landmark ${l.id.padEnd(10)} -> ${l.buildingId ?? 'UNMATCHED'} @ ${l.anchor}`),
].join('\n'));
