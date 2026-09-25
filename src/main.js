/**
 * Gondrecourt-le-Château -- entry point.
 *
 * Lighting and the render pipeline are Sakura Crossing's (MIT): one warm
 * quantised sun, a strong cool fill so shadows are coloured rather than
 * dark, a hemisphere with a violet ground, then ink + grade + FXAA.
 */
import * as THREE from 'three';
import { PAL } from './engine/palette.js';
import { Pipeline } from './engine/post.js';
import { buildSky } from './engine/sky.js';
import { setOutlineResolution } from './engine/outline.js';
import { buildWorld } from './world/index.js';
import { createPlayer } from './player.js';
import { createCompare } from './compare.js';
import { createHud } from './hud.js';
import { createAmbience } from './audio/ambience.js';
import { centroid } from './geo/polygon.js';

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor(new THREE.Color(PAL.fog), 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(PAL.fog, 70, 420);
const camera = new THREE.PerspectiveCamera(46, 1, 0.25, 900);
camera.rotation.order = 'YXZ';

/* ---- light ---- */
const SUN_DIR = new THREE.Vector3(-52, 62, 56);
const sun = new THREE.DirectionalLight(PAL.sun, 2.25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 260 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.035;
const fill = new THREE.DirectionalLight(PAL.fill, 1.08);
fill.position.set(48, 26, -44);
const bounce = new THREE.DirectionalLight(0xd8cbe8, 0.34);
bounce.position.set(10, -18, 40);
scene.add(sun, sun.target, fill, bounce, new THREE.HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.12));

/* ---- world ---- */
const sky = buildSky(scene, 600);
const world = buildWorld(scene, { sky });

// the bell sounds from the church's real position, about 20 m up its tower
const church = world.data.buildings.find((b) => b.id === world.landmark('eglise')?.buildingId);
const [cx, cz] = church ? centroid(church.ring) : [0, 0];
const ambience = createAmbience({ water: world.data.water, church: { x: cx, y: (church?.ground ?? 0) + 20, z: cz } });
const spawnView = { x: 15.0, z: -53.0, yaw: 1.45, pitch: 0.02 }; // on the bridge, facing Le Central
const player = createPlayer(camera, canvas, world, spawnView);
const pipeline = new Pipeline(renderer, scene, camera);
const hud = createHud(player);

function setViewport(w, h) {
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  pipeline.setSize(w, h);
  setOutlineResolution(pipeline.size.x, pipeline.size.y);
}
const compare = createCompare({ canvas, camera, player, onResize: setViewport, flash: hud.flash });
compare.layout();

hud.onStart = () => {
  ambience.start();
  player.lock();
};
canvas.addEventListener('click', () => {
  ambience.start();
  player.lock();
});
player.onLockChange = (locked) => hud.setLocked(locked);

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'KeyO') pipeline.enabled.ink = !pipeline.enabled.ink;
  if (e.code === 'KeyG') pipeline.enabled.grade = !pipeline.enabled.grade;
  if (e.code === 'KeyR') player.teleport(spawnView);
  if (e.code === 'KeyB') ambience.ring(1);
});

/* ---- loop ---- */
const clock = new THREE.Clock();
const snap = (v, s) => Math.round(v / s) * s;
function frame() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  player.update(dt);
  world.update(dt);
  ambience.update(camera);
  const p = player.state.pos;
  // shadow camera trails the walker on a snapped grid so shadows do not shimmer
  sun.target.position.set(snap(p.x, 4), snap(p.y, 4), snap(p.z, 4));
  sun.position.copy(sun.target.position).add(SUN_DIR);
  sky.dome.position.copy(camera.position);
  sky.clouds.position.copy(camera.position);
  hud.update();
  pipeline.render();
  requestAnimationFrame(frame);
}
frame();

window.__scene = { scene, camera, renderer, pipeline, world, player, THREE };
