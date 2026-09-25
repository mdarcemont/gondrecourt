/** The big lavoir on the Ornain: hipped roof on pillars, low wall on the land sides, the washing basin. */
import { buildShelter } from './shelter.js';

export const style = {};
export const build = (ctx) => buildShelter(ctx, { eaveAbove: 2.6, ridgeAbove: 4.9, overhang: 0.6, pillarsEvery: 3.5, lowWall: true, basin: true });
