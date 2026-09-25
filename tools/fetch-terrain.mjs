/**
 * Sample IGN RGE ALTI (1 m national elevation model) on a regular grid over
 * the area in tools/area.json and write data/raw/terrain.json.
 *
 * The grid is in lat/lon steps chosen to be ~STEP metres; the build step
 * re-projects it into local metres.
 */
import fs from 'node:fs';

const STEP_M = 4;
const BATCH = 1000;
const API = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json';
const area = JSON.parse(fs.readFileSync(new URL('./area.json', import.meta.url)));

const mPerDegLat = 111_320;
const mPerDegLon = 111_320 * Math.cos((area.origin.lat * Math.PI) / 180);
const dLat = STEP_M / mPerDegLat;
const dLon = STEP_M / mPerDegLon;
const rows = Math.ceil((area.north - area.south) / dLat) + 1;
const cols = Math.ceil((area.east - area.west) / dLon) + 1;

const points = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    points.push([area.west + c * dLon, area.north - r * dLat]);
  }
}

async function fetchBatch(batch, attempt = 1) {
  const body = {
    lon: batch.map((p) => p[0].toFixed(7)).join('|'),
    lat: batch.map((p) => p[1].toFixed(7)).join('|'),
    resource: 'ign_rge_alti_wld',
    zonly: 'true',
    delimiter: '|',
  };
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'gondrecourt-3d/0.1' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.elevations)) throw new Error(JSON.stringify(json).slice(0, 200));
    return json.elevations;
  } catch (err) {
    if (attempt >= 4) throw new Error(`elevation batch failed: ${err.message}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
    return fetchBatch(batch, attempt + 1);
  }
}

const heights = [];
for (let i = 0; i < points.length; i += BATCH) {
  heights.push(...(await fetchBatch(points.slice(i, i + BATCH))));
  process.stdout.write(`\r${Math.min(i + BATCH, points.length)}/${points.length}`);
}
fs.writeFileSync(
  new URL('../data/raw/terrain.json', import.meta.url),
  JSON.stringify({ west: area.west, north: area.north, dLon, dLat, rows, cols, heights })
);
console.log(`\nwrote ${rows}x${cols} grid, min ${Math.min(...heights)} max ${Math.max(...heights)}`);
