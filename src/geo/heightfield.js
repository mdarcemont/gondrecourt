/**
 * A regular elevation grid in local metres, sampled bilinearly.
 *
 * Grid layout: row 0 is the north edge (smallest z), column 0 the west edge
 * (smallest x); heights are row-major.  Samples outside the grid clamp to
 * the nearest edge rather than returning garbage.
 */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function makeHeightField({ x0, z0, stepX, stepZ, cols, rows, heights }) {
  if (heights.length !== cols * rows) {
    throw new Error(`height grid is ${heights.length} values, expected ${cols}x${rows}`);
  }
  const at = (c, r) => heights[r * cols + c];

  const sample = (x, z) => {
    const fc = clamp((x - x0) / stepX, 0, cols - 1);
    const fr = clamp((z - z0) / stepZ, 0, rows - 1);
    const c = Math.min(Math.floor(fc), cols - 2);
    const r = Math.min(Math.floor(fr), rows - 2);
    const tx = fc - c;
    const tz = fr - r;
    const top = at(c, r) * (1 - tx) + at(c + 1, r) * tx;
    const bottom = at(c, r + 1) * (1 - tx) + at(c + 1, r + 1) * tx;
    return top * (1 - tz) + bottom * tz;
  };

  return Object.freeze({
    x0, z0, stepX, stepZ, cols, rows, heights,
    x1: x0 + stepX * (cols - 1),
    z1: z0 + stepZ * (rows - 1),
    sample,
  });
}
