/**
 * Every colour in the scene.
 *
 * The keys in the first block are the ones the vendored engine reads
 * (sky, light, ink, fog).  Everything below them is Gondrecourt: sampled by
 * eye from Street View captures of the lower town (April 2026) and pushed a
 * little toward the pale, high-key look of a painted background.
 */
export const PAL = {
  // --- engine: sky & atmosphere ---
  skyTop: 0x86b4e4,
  skyMid: 0xcfe2f6,
  skyHaze: 0xf3ece2,
  cloud: 0xfdfbf8,
  cloudShade: 0xe3e5ee,
  fog: 0xe4eaf2,
  hill: 0xb9c7b8,
  hillFar: 0xd0d9d6,

  // --- engine: light ---
  sun: 0xfff2dc,
  fill: 0xaabcf0,
  hemiSky: 0xdceaff,
  hemiGround: 0xb2a8bc,

  // --- engine: ink & glass ---
  ink: 0x3a3548,
  glassDark: 0x3d4a58,

  // --- ground ---
  grass: 0xa9bf82,
  meadow: 0xbccb8a,
  forest: 0x7c9a68,
  rock: 0xd6ccb4,
  road: 0x8f8c97,
  pavement: 0xc9c5c3,
  kerb: 0xdad6d4,
  parking: 0x9c99a2,
  cemetery: 0xa3b383,

  // --- water ---
  water: 0x7c9c93,
  waterDeep: 0x5f7f7a,
  quay: 0xc8bea6,

  // --- walls: Lorraine render (enduit) over limestone ---
  wallCream: 0xefe6d3,
  wallBeige: 0xe2d2b3,
  wallGrey: 0xd2ccc1,
  wallOchre: 0xe6c9a6,
  wallPink: 0xe8cbbd,
  wallWhite: 0xf6f3ec,
  wallStone: 0xd8ccb0,
  wallBrick: 0xb8745c,
  wallConcrete: 0xcfcdca,
  wallTimber: 0xa08466,

  // --- roofs ---
  roofTile: 0xb8654b,
  roofTileOld: 0xa4604e,
  roofSlate: 0x5e6576,
  roofZinc: 0x9aa1aa,
  roofConcrete: 0xa9a5a3,

  // --- details ---
  shutterTeal: 0x3f8f96,
  shutterGrey: 0x8f98a0,
  shutterGreen: 0x5f8a6a,
  frameWhite: 0xf4f4f0,
  railingGreen: 0x2f5d4b,
  signGreen: 0x2f7d5a,
  pharmacyGreen: 0x2fae5a,
  veranda: 0xf1efe8,
  brickBase: 0xb06a52,
};

/** Wall colours a plain house can be given (picked per building, seeded). */
export const RENDER_WALLS = [
  PAL.wallCream, PAL.wallBeige, PAL.wallGrey, PAL.wallOchre, PAL.wallPink, PAL.wallWhite,
];
