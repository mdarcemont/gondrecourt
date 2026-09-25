/**
 * IGN aerial layers for the area, all on one 0.5 m grid (same bbox, same size):
 *   mnh.bil  LiDAR HD height above ground (float32, little endian), metres
 *   rgb.jpg  BD ORTHO colour orthophoto
 *   irc.jpg  infrared-colour orthophoto (R = near infrared, G = red, B = green)
 * Licence Ouverte Etalab 2.0 -- "IGN - LiDAR HD, BD ORTHO".
 */
import fs from 'node:fs';
import { metresPerDegree } from '../src/geo/project.js';

const RES = 0.5; // metres per pixel
const area = JSON.parse(fs.readFileSync(new URL('./area.json', import.meta.url)));
const out = (f) => new URL(`../data/raw/aerial/${f}`, import.meta.url);

const m = metresPerDegree(area.origin.lat);
const width = Math.round(((area.east - area.west) * m.lon) / RES);
const height = Math.round(((area.north - area.south) * m.lat) / RES);

const LAYERS = [
  { file: 'mnh.bil', layer: 'IGNF_LIDAR-HD_MNH_ELEVATION.ELEVATIONGRIDCOVERAGE.WGS84G', format: 'image/x-bil;bits=32' },
  { file: 'rgb.jpg', layer: 'ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO', format: 'image/jpeg' },
  { file: 'irc.jpg', layer: 'ORTHOIMAGERY.ORTHOPHOTOS.IRC-EXPRESS.2025', format: 'image/jpeg' },
];

async function getMap({ layer, format }, attempt = 1) {
  const url = new URL('https://data.geopf.fr/wms-r/wms');
  Object.entries({
    SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetMap', LAYERS: layer, STYLES: '',
    CRS: 'EPSG:4326', BBOX: `${area.south},${area.west},${area.north},${area.east}`,
    WIDTH: String(width), HEIGHT: String(height), FORMAT: format,
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'gondrecourt-3d/0.1' } });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || type.includes('xml')) throw new Error(`HTTP ${res.status} ${type} ${(await res.text()).slice(0, 200)}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (attempt >= 3) throw new Error(`${layer}: ${err.message}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
    return getMap({ layer, format }, attempt + 1);
  }
}

for (const l of LAYERS) {
  const buf = await getMap(l);
  fs.writeFileSync(out(l.file), buf);
  console.log(`${l.file}: ${(buf.length / 1e6).toFixed(1)} MB`);
}
fs.writeFileSync(out('meta.json'), JSON.stringify({ ...area, width, height, res: RES }, null, 2));
console.log(`grid ${width}x${height} at ${RES} m`);
