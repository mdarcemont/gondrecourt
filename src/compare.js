/**
 * Reference-view comparison (the accuracy loop).
 *
 * Keys 1-9 jump the camera to a reference photo's recorded pose and lay the
 * photo over the render at the photo's own aspect ratio.  F cycles the
 * overlay: off -> half -> full -> off, so edges can be checked by flicking.
 *
 * Photos are served from /reference/photos/ by the dev server only; they
 * are not part of the build.
 */
import views from '../reference/views.json';

const OPACITY = [0, 0.5, 1];

export function createCompare({ canvas, camera, player, onResize, flash }) {
  const img = document.getElementById('ref');
  const caption = document.getElementById('refcap');
  let active = null;
  let level = 1;

  /** Largest rect of the photo's aspect that fits the window. */
  function rect() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (!active || !img.naturalWidth) return { x: 0, y: 0, w: W, h: H };
    const s = Math.min(W / img.naturalWidth, H / img.naturalHeight);
    const w = Math.round(img.naturalWidth * s);
    const h = Math.round(img.naturalHeight * s);
    return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h };
  }

  function layout() {
    const r = rect();
    [canvas, img].forEach((el) => Object.assign(el.style, {
      position: 'fixed', left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`,
    }));
    img.style.opacity = active ? OPACITY[level] : 0;
    onResize(r.w, r.h);
  }

  function show(view) {
    active = view;
    camera.fov = view.pose.fov ?? 46;
    camera.updateProjectionMatrix();
    player.teleport(view.pose);
    caption.textContent = `${view.id}${view.approx ? '  ·  pose approximate' : ''}  ·  F overlay  ·  0 exit`;
    img.onload = layout;
    img.src = `/reference/photos/${view.photo}`;
    img.onerror = () => flash(`photo missing: reference/photos/${view.photo}`);
    layout();
  }

  function hide() {
    active = null;
    caption.textContent = '';
    camera.fov = 46;
    camera.updateProjectionMatrix();
    layout();
  }

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const n = Number.parseInt(e.key, 10);
    if (n === 0) hide();
    else if (n >= 1 && n <= views.views.length) show(views.views[n - 1]);
    if (e.code === 'KeyF' && active) {
      level = (level + 1) % OPACITY.length;
      layout();
    }
  });
  window.addEventListener('resize', layout);

  return { layout, get active() { return active; }, views: views.views };
}
