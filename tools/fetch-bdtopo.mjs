/**
 * Download IGN BD TOPO buildings (footprint + measured heights) for the area.
 * Licence Ouverte Etalab 2.0 -- attribution "IGN - BD TOPO".
 */
import fs from 'node:fs';

const area = JSON.parse(fs.readFileSync(new URL('./area.json', import.meta.url)));
const crs = 'urn:ogc:def:crs:OGC:1.3:CRS84';
const url = new URL('https://data.geopf.fr/wfs/ows');
Object.entries({
  SERVICE: 'WFS', VERSION: '2.0.0', REQUEST: 'GetFeature',
  TYPENAMES: 'BDTOPO_V3:batiment', SRSNAME: crs, COUNT: '10000',
  OUTPUTFORMAT: 'application/json',
  BBOX: `${area.west},${area.south},${area.east},${area.north},${crs}`,
}).forEach(([k, v]) => url.searchParams.set(k, v));

const res = await fetch(url, { headers: { 'user-agent': 'gondrecourt-3d/0.1' } });
if (!res.ok) throw new Error(`BD TOPO request failed: HTTP ${res.status}`);
const json = await res.json();
if (!Array.isArray(json.features) || json.features.length === 0) {
  throw new Error('BD TOPO returned no buildings; check the bbox axis order');
}
fs.writeFileSync(new URL('../data/raw/bdtopo_batiment.json', import.meta.url), JSON.stringify(json));
console.log(`wrote ${json.features.length} buildings`);
