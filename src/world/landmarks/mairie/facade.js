/**
 * The mairie's front, painted onto one canvas from the user's photo.
 * All positions are fractions of the facade (x from the left as you face
 * it, y from the eave down), measured on the photo.
 */
import * as THREE from 'three';

const PX = 64; // pixels per metre
const BAYS = [0.14, 0.42, 0.65, 0.88];
const WIN_W = 0.12;
const ROWS = {
  attic: [0.05, 0.16],
  plaques: [0.19, 0.245],
  first: [0.27, 0.49],
  ground: [0.64, 0.87],
  door: [0.6, 1.0],
};
export const FLOWER_ROWS = { first: 0.5, ground: 0.875 }; // sill heights, same convention
export { BAYS };

const C = {
  wall: '#dcb487', stone: '#efe5d0', stoneShade: '#d9ccb0', frame: '#3f9a7e', glass: '#3d4a58',
  plaque: '#e9e1cf', letters: '#4a4a4a', cornice: '#e6dac2',
};

function windowAt(c, x, y0, y1, w, h, W) {
  const cx = x * W;
  const ww = WIN_W * W;
  const top = y0 * h;
  const bot = y1 * h;
  c.fillStyle = C.stone;
  c.fillRect(cx - ww / 2 - 8, top - 8, ww + 16, bot - top + 14);
  c.fillStyle = C.frame;
  c.fillRect(cx - ww / 2, top, ww, bot - top);
  c.fillStyle = C.glass;
  const pane = (ww - 12) / 2;
  c.fillRect(cx - ww / 2 + 4, top + 4, pane, bot - top - 8);
  c.fillRect(cx + 2, top + 4, pane, bot - top - 8);
  c.fillStyle = C.frame;
  for (let k = 1; k < 3; k++) c.fillRect(cx - ww / 2, top + ((bot - top) * k) / 3, ww, 3);
}

export function mairieFacadeTexture(widthM, heightM) {
  const W = Math.round(widthM * PX);
  const H = Math.round(heightM * PX);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = C.wall;
  c.fillRect(0, 0, W, H);
  c.fillStyle = C.cornice;
  c.fillRect(0, 0, W, H * 0.025);
  // quoins on the right corner, a flat pilaster on the left
  for (let y = 0; y < H; y += 44) {
    c.fillStyle = (y / 44) % 2 ? C.stone : C.stoneShade;
    c.fillRect(W - ((y / 44) % 2 ? 46 : 32), y, 46, 40);
  }
  c.fillStyle = C.stoneShade;
  c.fillRect(0, 0, 22, H);

  BAYS.forEach((x) => {
    windowAt(c, x, ...ROWS.attic, W, H, W);
    windowAt(c, x, ...ROWS.first, W, H, W);
  });
  BAYS.slice(1).forEach((x) => windowAt(c, x, ...ROWS.ground, W, H, W));
  // the door, green and glazed, under a stone arch
  const dx = BAYS[0] * W;
  const dw = WIN_W * W * 1.1;
  c.fillStyle = C.stone;
  c.fillRect(dx - dw / 2 - 10, ROWS.door[0] * H - 10, dw + 20, H);
  c.fillStyle = C.frame;
  c.fillRect(dx - dw / 2, ROWS.door[0] * H, dw, H);
  c.fillStyle = C.glass;
  c.fillRect(dx - dw / 2 + 8, ROWS.door[0] * H + 10, dw - 16, H * 0.18);

  [['HOTEL', 0.235], ['DE', 0.47], ['VILLE', 0.715]].forEach(([text, x]) => {
    const pw = (text.length * 0.034 + 0.04) * W;
    const top = ROWS.plaques[0] * H;
    const ph = (ROWS.plaques[1] - ROWS.plaques[0]) * H;
    c.fillStyle = C.plaque;
    c.fillRect(x * W - pw / 2, top, pw, ph);
    c.fillStyle = C.letters;
    c.font = `bold ${Math.round(ph * 0.7)}px Arial, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x * W, top + ph / 2 + 2);
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
