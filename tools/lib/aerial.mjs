/**
 * data/raw/aerial/* -> per-building roof colours, individual trees, and a
 * measured ground cover (grass vs paved) for every terrain vertex.
 */
import fs from 'node:fs';
import jpeg from 'jpeg-js';
import { pointInPolygon, pointSegment } from '../../src/geo/polygon.js';
import { detectTrees } from '../../src/geo/trees.js';
import { medianRgb } from '../../src/geo/colour.js';

export const NDVI_VEG = 0.12;
const ROOF_INSET = 0.7;  // metres: skip the roof edge (gutters, parallax, walls)
const BUILDING_BUFFER = 0.75;

export function loadAerial(dir) {
  const meta = JSON.parse(fs.readFileSync(new URL('meta.json', dir)));
  const mnhBuf = fs.readFileSync(new URL('mnh.bil', dir));
  const height = Array.from(new Float32Array(mnhBuf.buffer, mnhBuf.byteOffset, meta.width * meta.height),
    (h) => (Number.isFinite(h) && h > -50 && h < 100 ? Math.max(0, h) : 0));
  const rgb = jpeg.decode(fs.readFileSync(new URL('rgb.jpg', dir)), { useTArray: true });
  const irc = jpeg.decode(fs.readFileSync(new URL('irc.jpg', dir)), { useTArray: true });
  if (rgb.width !== meta.width || irc.width !== meta.width) throw new Error('aerial layers are not on the same grid');
  const ndvi = height.map((_, i) => {
    const nir = irc.data[i * 4];
    const red = irc.data[i * 4 + 1];
    return (nir - red) / Math.max(1, nir + red);
  });
  const colour = (i) => [rgb.data[i * 4], rgb.data[i * 4 + 1], rgb.data[i * 4 + 2]];
  return { meta, height, ndvi, colour };
}

/** local metres <-> pixel, through the geographic projection. */
export function pixelMapper(meta, proj) {
  const sx = meta.width / (meta.east - meta.west);
  const sy = meta.height / (meta.north - meta.south);
  return {
    toPixel: (x, z) => {
      const [lon, lat] = proj.toGeo(x, z);
      return [(lon - meta.west) * sx - 0.5, (meta.north - lat) * sy - 0.5];
    },
    toLocal: (c, r) => proj.toLocal(meta.west + (c + 0.5) / sx, meta.north - (r + 0.5) / sy),
  };
}

/** Visit every pixel whose centre is within `pad` metres of a ring's bounding box. */
function forPixelsNear(ring, map, meta, pad, fn) {
  const px = ring.map(([x, z]) => map.toPixel(x, z));
  const padPx = pad / meta.res;
  const c0 = Math.max(0, Math.floor(Math.min(...px.map((p) => p[0])) - padPx));
  const c1 = Math.min(meta.width - 1, Math.ceil(Math.max(...px.map((p) => p[0])) + padPx));
  const r0 = Math.max(0, Math.floor(Math.min(...px.map((p) => p[1])) - padPx));
  const r1 = Math.min(meta.height - 1, Math.ceil(Math.max(...px.map((p) => p[1])) + padPx));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) fn(r * meta.width + c, map.toLocal(c, r));
}

const edgeDistance = (p, ring) =>
  ring.reduce((d, a, i) => Math.min(d, pointSegment(p, a, ring[(i + 1) % ring.length]).dist), Infinity);

export function analyseAerial(aerial, buildings, proj) {
  const { meta, height, ndvi, colour } = aerial;
  const map = pixelMapper(meta, proj);
  const blocked = height.map(() => false);
  const roofRgb = new Map();

  buildings.forEach((b) => {
    const roofPixels = [];
    forPixelsNear(b.ring, map, meta, BUILDING_BUFFER, (i, p) => {
      const inside = pointInPolygon(p, b.ring);
      const edge = edgeDistance(p, b.ring);
      if (inside || edge <= BUILDING_BUFFER) blocked[i] = true;
      if (inside && edge >= ROOF_INSET) roofPixels.push(colour(i));
    });
    const median = medianRgb(roofPixels);
    if (median && roofPixels.length >= 12) roofRgb.set(b.id, median);
  });

  const veg = ndvi.map((v) => v >= NDVI_VEG);
  const trees = detectTrees({ height, veg, blocked, width: meta.width, rows: meta.height, res: meta.res })
    .map((t) => {
      const [x, z] = map.toLocal(t.col, t.row);
      return { x: +x.toFixed(2), z: +z.toFixed(2), h: +t.height.toFixed(1), r: +t.crown.toFixed(1) };
    });

  /** Share of vegetated, low (not canopy) pixels in a square around a point. */
  const grassShare = (x, z, half) => {
    const [c, r] = map.toPixel(x, z).map(Math.round);
    const k = Math.round(half / meta.res);
    let veg0 = 0;
    let n = 0;
    for (let dr = -k; dr <= k; dr++) {
      for (let dc = -k; dc <= k; dc++) {
        const cc = c + dc;
        const rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= meta.width || rr >= meta.height) continue;
        const i = rr * meta.width + cc;
        if (blocked[i]) continue;
        n += 1;
        if (veg[i]) veg0 += 1;
      }
    }
    return n ? veg0 / n : 1;
  };

  return { roofRgb, trees, grassShare };
}
