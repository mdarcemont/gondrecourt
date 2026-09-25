/**
 * Accumulates triangles (position, uv, colour) and turns them into one
 * BufferGeometry, so a whole class of surfaces is a single draw call.
 */
import * as THREE from 'three';

export function createMeshBuffer() {
  const pos = [];
  const uv = [];
  const col = [];
  const c = new THREE.Color();

  const vertex = ([x, y, z], [u, v], color) => {
    c.set(color);
    pos.push(x, y, z);
    uv.push(u, v);
    col.push(c.r, c.g, c.b);
  };

  return {
    /** a-b-c triangle; each vertex is [x, y, z] and [u, v]. */
    tri(a, b, cc, uvs, color) {
      vertex(a, uvs[0], color);
      vertex(b, uvs[1], color);
      vertex(cc, uvs[2], color);
    },
    /** Quad a-b-c-d (in order around its edge). */
    quad(a, b, cc, d, uvs, color) {
      this.tri(a, b, cc, [uvs[0], uvs[1], uvs[2]], color);
      this.tri(a, cc, d, [uvs[0], uvs[2], uvs[3]], color);
    },
    get empty() {
      return pos.length === 0;
    },
    toGeometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      g.computeBoundingSphere();
      return g;
    },
  };
}

/** Triangulate a planar ring of [x, z] points; returns index triples. */
export function triangulate(ring) {
  const contour = ring.map(([x, z]) => new THREE.Vector2(x, z));
  return THREE.ShapeUtils.triangulateShape(contour, []);
}
