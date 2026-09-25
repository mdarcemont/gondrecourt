/**
 * The former 18th-century tribunal joined to the tower (now the Musée
 * Lorrain du Cheval).  User photos: pale grey-cream render, three rows of
 * plain windows (no shutters), a hipped brown tile roof.  Heights: BD TOPO,
 * which agrees with LiDAR here.
 */
import * as THREE from 'three';

const RENDER = 0xd9d3c4;
// white shutters multiply to the wall colour, so the windows read as plain openings
export const style = { wall: RENDER, shutter: 0xffffff, roof: 0x8a5a45, roofShape: 'hip', floors: 3 };

export function build() {
  return new THREE.Group();
}
