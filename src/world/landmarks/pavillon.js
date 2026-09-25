/** The small open pavilion at the end of the path by La Carpière: a tiled pyramid on four stone pillars. */
import { buildShelter } from './shelter.js';

export const style = {};
export const build = (ctx) => buildShelter(ctx, { eaveAbove: 2.5, ridgeAbove: 6.3, overhang: 0.7, pillarsEvery: 0 });
