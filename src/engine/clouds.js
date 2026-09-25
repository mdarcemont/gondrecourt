import * as THREE from 'three';

/* Vendored from Sakura Crossing (MIT, see LICENSE-sakura-crossing):
 * the one canvas texture the sky needs. */

const cache = new Map();
const cached = (key, fn) => {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
};

function make(w, h, draw, { srgb = true } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Soft round blob used for the flat anime clouds. */
export const cloudTex = () =>
  cached('cloudTex', () =>
    make(512, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      const puffs = [
        [0.22, 0.62, 0.15], [0.36, 0.46, 0.2], [0.52, 0.4, 0.24],
        [0.68, 0.5, 0.19], [0.82, 0.63, 0.14], [0.45, 0.66, 0.2], [0.6, 0.68, 0.17],
      ];
      c.fillStyle = '#ffffff';
      for (const [x, y, r] of puffs) {
        c.beginPath();
        c.ellipse(x * w, y * h, r * w * 0.55, r * h * 1.1, 0, 0, Math.PI * 2);
        c.fill();
      }
      // trim the bottom flat, the way cel-painted clouds sit on a line
      c.globalCompositeOperation = 'destination-out';
      c.fillRect(0, h * 0.78, w, h * 0.22);
      c.globalCompositeOperation = 'source-over';
    }, { srgb: false })
  );
