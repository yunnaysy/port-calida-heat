export function createMenus(callbacks) {
  const title = document.getElementById('title-screen');
  const pause = document.getElementById('pause-screen');
  const info = document.getElementById('info-screen');
  const infoTitle = document.getElementById('info-title'), infoCopy = document.getElementById('info-copy');
  const settings = document.getElementById('settings-controls');
  const result = document.getElementById('result-screen');
  let returnTo = 'title';
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'new') callbacks.newGame();
    else if (action === 'continue') callbacks.continueGame();
    else if (action === 'resume') callbacks.resume();
    else if (action === 'save') callbacks.save();
    else if (action === 'controls') {
      returnTo = title.hidden ? 'pause' : 'title'; settings.hidden = true;
      infoTitle.textContent = 'CONTROLS';
      infoCopy.innerHTML = 'WASD move or steer · Shift sprint · Space vault<br>Mouse orbit and aim · Left click fire · F enter or exit<br>1–4 weapons · R reload · E activities · Esc pause';
      info.hidden = false; title.hidden = true; pause.hidden = true;
    }
    else if (action === 'settings') {
      returnTo = title.hidden ? 'pause' : 'title'; settings.hidden = false;
      infoTitle.textContent = 'SETTINGS';
      infoCopy.textContent = 'Tune the radio, camera response and detail level for your machine.';
      info.hidden = false; title.hidden = true; pause.hidden = true;
    } else if (action === 'back') { info.hidden = true; (returnTo === 'pause' ? pause : title).hidden = false; }
    else if (action === 'title') { pause.hidden = true; title.hidden = false; callbacks.title(); }
    else if (action === 'respawn') { result.hidden = true; callbacks.respawn(); }
  }));
  document.getElementById('volume-range').addEventListener('input', event => callbacks.volume(Number(event.target.value)));
  document.getElementById('sensitivity-range').addEventListener('input', event => callbacks.sensitivity(Number(event.target.value)));
  document.getElementById('quality-select').addEventListener('change', event => callbacks.quality(event.target.value));
  return {
    showTitle() { title.hidden = false; pause.hidden = true; info.hidden = true; result.hidden = true; },
    showPause() { title.hidden = true; pause.hidden = false; info.hidden = true; result.hidden = true; },
    hideAll() { title.hidden = true; pause.hidden = true; info.hidden = true; result.hidden = true; },
    showDeath() { result.hidden = false; title.hidden = true; pause.hidden = true; info.hidden = true; },
  };
}
