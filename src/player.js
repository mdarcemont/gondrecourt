/**
 * First-person walker on flat local coordinates.
 *
 * Adapted from Sakura Crossing's player (MIT): pointer-lock look and damped
 * WASD, but no planet wrap and no vehicle.  Collision is delegated to the
 * world, which knows the real footprints and the river.
 */
import * as THREE from 'three';

const EYE = 1.62;
const RADIUS = 0.34;
const WALK = 5.2;
const RUN = 13;
const SENSITIVITY = 0.0022;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createPlayer(camera, dom, world, spawn) {
  const state = {
    pos: new THREE.Vector3(spawn.x, world.heightAt(spawn.x, spawn.z), spawn.z),
    yaw: spawn.yaw,
    pitch: spawn.pitch ?? 0,
    vel: new THREE.Vector2(),
    bob: 0,
    locked: false,
  };
  const keys = new Set();

  document.addEventListener('mousemove', (e) => {
    if (!state.locked) return;
    state.yaw -= e.movementX * SENSITIVITY;
    state.pitch = clamp(state.pitch - e.movementY * SENSITIVITY, -1.2, 1.1);
  });
  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === dom;
    if (!state.locked) keys.clear();
    player.onLockChange?.(state.locked);
  });
  window.addEventListener('keydown', (e) => keys.add(e.code));
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  function tryMove(dx, dz) {
    const next = world.collide([state.pos.x + dx, state.pos.z + dz], RADIUS);
    if (!next) return;
    const b = world.bounds;
    state.pos.x = clamp(next[0], b.x0, b.x1);
    state.pos.z = clamp(next[1], b.z0, b.z1);
  }

  function update(dt) {
    const fwd = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const side = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN : WALK;
    const f = new THREE.Vector2(-Math.sin(state.yaw), -Math.cos(state.yaw));
    const r = new THREE.Vector2(Math.cos(state.yaw), -Math.sin(state.yaw));
    const wish = state.locked ? f.multiplyScalar(fwd).add(r.multiplyScalar(side)) : new THREE.Vector2();
    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);
    const a = 1 - Math.exp(-(wish.lengthSq() > 0 ? 12 : 16) * dt);
    state.vel.lerp(wish, a);

    const steps = Math.max(1, Math.ceil((state.vel.length() * dt) / 0.2));
    for (let i = 0; i < steps; i++) {
      tryMove((state.vel.x * dt) / steps, 0);
      tryMove(0, (state.vel.y * dt) / steps);
    }
    const ground = world.heightAt(state.pos.x, state.pos.z);
    state.pos.y += (ground - state.pos.y) * (1 - Math.exp(-14 * dt));
    state.bob += dt * state.vel.length() * 6.4;
    applyCamera();
  }

  function applyCamera() {
    const amp = Math.min(state.vel.length() / WALK, 1) * 0.014;
    camera.position.set(state.pos.x, state.pos.y + EYE + Math.sin(state.bob) * amp, state.pos.z);
    camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
  }

  /** Jump straight to a pose (used by reference views). */
  function teleport({ x, z, yaw, pitch = 0, eye = null }) {
    state.pos.set(x, world.heightAt(x, z), z);
    state.yaw = yaw;
    state.pitch = pitch;
    state.vel.set(0, 0);
    applyCamera();
    if (eye !== null) camera.position.y = state.pos.y + eye;
  }

  const player = {
    state,
    update,
    teleport,
    lock: () => dom.requestPointerLock?.(),
    onLockChange: null,
  };
  applyCamera();
  return player;
}
