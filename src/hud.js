/**
 * Minimal HUD: title screen, hint line, toast, and the coordinate readout
 * used to record reference-view poses (C shows it, Shift+C copies it).
 */
export function createHud(player) {
  const $ = (id) => document.getElementById(id);
  const overlay = $('overlay');
  const coords = $('coords');
  const toast = $('toast');
  let showCoords = false;
  let toastTimer = 0;

  const hud = {
    onStart: null,
    setLocked(locked) {
      overlay.classList.toggle('off', locked);
    },
    flash(text) {
      toast.textContent = text;
      toast.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('on'), 2200);
    },
    pose() {
      const { pos, yaw, pitch } = player.state;
      const r = (v, d = 2) => Number(v.toFixed(d));
      return { x: r(pos.x), z: r(pos.z), yaw: r(yaw, 3), pitch: r(pitch, 3), fov: 46 };
    },
    update() {
      if (!showCoords) return;
      const p = hud.pose();
      coords.textContent = `x ${p.x}  z ${p.z}  y ${player.state.pos.y.toFixed(2)}  yaw ${p.yaw}  pitch ${p.pitch}`;
    },
  };

  $('start').addEventListener('click', () => hud.onStart?.());
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyC' || e.repeat) return;
    if (e.shiftKey) {
      const json = JSON.stringify(hud.pose());
      navigator.clipboard?.writeText(json).then(
        () => hud.flash('pose copied'),
        () => hud.flash(json)
      );
      return;
    }
    showCoords = !showCoords;
    coords.classList.toggle('on', showCoords);
  });
  return hud;
}
