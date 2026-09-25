/**
 * Minimal HUD: title screen, hint line and toast.
 */
export function createHud() {
  const $ = (id) => document.getElementById(id);
  const overlay = $('overlay');
  const toast = $('toast');
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
    update() {},
  };
  $('start').addEventListener('click', () => hud.onStart?.());
  return hud;
}
