/**
 * Individual trees from a LiDAR canopy-height raster.
 *
 * Standard local-maximum detection: a tree is a canopy pixel that is the
 * highest point within a window that grows with its height (tall trees have
 * wide crowns, so a small window would split one crown into several trees).
 *
 * Inputs are flat row-major rasters on one grid:
 *   height[i]  metres above ground (LiDAR MNH)
 *   veg[i]     true where the infrared photo shows vegetation
 *   blocked[i] true on buildings (a roof is tall and can look green)
 */

export const MIN_HEIGHT = 2.5;      // metres; below this it is a hedge or a shrub
const WINDOW = (h) => 1.0 + 0.12 * h; // search radius in metres for a crown top
const CROWN = (h) => Math.min(7, Math.max(1.2, 0.22 * h + 1.0));

function smooth3(height, canopy, width, rows) {
  return height.map((_, i) => {
    if (!canopy[i]) return 0;
    const c = i % width;
    const r = Math.floor(i / width);
    let sum = 0;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= width) continue;
        const j = rr * width + cc;
        if (!canopy[j]) continue;
        sum += height[j];
        n += 1;
      }
    }
    return sum / n;
  });
}

/** Is pixel i the highest canopy point within radius pixels? Ties go to the lower index. */
function isTop(i, hs, width, rows, radius) {
  const c = i % width;
  const r = Math.floor(i / width);
  const rr2 = radius * radius;
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (dr * dr + dc * dc > rr2 || (dr === 0 && dc === 0)) continue;
      const y = r + dr;
      const x = c + dc;
      if (y < 0 || x < 0 || y >= rows || x >= width) continue;
      const j = y * width + x;
      if (hs[j] > hs[i] || (hs[j] === hs[i] && j < i)) return false;
    }
  }
  return true;
}

/** Returns [{ col, row, height, crown }] with crown radius in metres. */
export function detectTrees({ height, veg, blocked, width, rows, res }) {
  const canopy = height.map((h, i) => h >= MIN_HEIGHT && veg[i] && !blocked[i]);
  const hs = smooth3(height, canopy, width, rows);
  const tops = hs.flatMap((h, i) => {
    if (!canopy[i]) return [];
    const radius = Math.max(1, Math.round(WINDOW(h) / res));
    return isTop(i, hs, width, rows, radius) ? [{ col: i % width, row: Math.floor(i / width), height: height[i] }] : [];
  });
  // a crown cannot be wider than half the gap to its nearest neighbour (plus a little overlap)
  return tops.map((t) => {
    const nearest = tops.reduce((d, o) => (o === t ? d : Math.min(d, Math.hypot(o.col - t.col, o.row - t.row) * res)), Infinity);
    return { ...t, crown: Math.min(CROWN(t.height), Math.max(1.2, nearest * 0.6)) };
  });
}
