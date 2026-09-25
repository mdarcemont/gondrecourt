/** Window bands for the 1960s-70s school buildings (école, collège). */
import * as THREE from 'three';

const cache = new Map();
function draw(key, w, h, fn) {
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  fn(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

/** One window of a continuous ribbon (u = 1 window, 1.5 m): white frame, 3 panes. */
export const ribbonWindow = () => draw('ribbon', 96, 96, (c, w, h) => {
  c.fillStyle = '#f4f4f0';
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#3d4a58';
  c.fillRect(8, 8, w - 16, h * 0.55);
  c.fillRect(8, h * 0.55 + 14, w - 16, h * 0.3);
  c.fillStyle = '#f4f4f0';
  c.fillRect(w / 2 - 2, 8, 4, h * 0.55);
});

/** One window of the collège: tall pane with a white roller shutter half down (u = 1 window). */
export const rollerWindow = () => draw('roller-col', 96, 128, (c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#efe9da';
  c.fillRect(14, 10, w - 28, h - 24);
  c.fillStyle = '#3d4a58';
  c.fillRect(20, 16, w - 40, h - 36);
  c.fillStyle = '#f2f2ee';
  c.fillRect(20, 16, w - 40, (h - 36) * 0.55);
  c.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 20; y < 16 + (h - 36) * 0.55; y += 5) c.fillRect(20, y, w - 40, 1);
});
