const SETTINGS_KEY = 'port-calida-heat.settings.v1';
const defaults = {
  volume: .32, music: .55, effects: .8, ambient: .35, sensitivity: .0024,
  quality: 'high', shadows: 'high', resolution: 1.25, fps: 0, timeOfDay: 'golden', invertY: false,
  bindings: { forward: 'KeyW', reverse: 'KeyS', left: 'KeyA', right: 'KeyD', vehicle: 'KeyF', activity: 'KeyE', map: 'KeyM' },
};

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') ?? {};
    return { ...defaults, ...saved, bindings: { ...defaults.bindings, ...(saved.bindings ?? {}) } };
  } catch (error) {
    console.warn('Port Calida settings could not be read.', error);
    return { ...defaults };
  }
}

export function createMenus(callbacks) {
  const title = document.getElementById('title-screen');
  const pause = document.getElementById('pause-screen');
  const info = document.getElementById('info-screen');
  const goodbye = document.getElementById('goodbye-screen');
  const infoTitle = document.getElementById('info-title'), infoCopy = document.getElementById('info-copy');
  const settingsPanel = document.getElementById('settings-controls');
  const result = document.getElementById('result-screen');
  const settings = readSettings();
  let returnTo = 'title';

  function persist() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Port Calida settings could not be saved.', error);
    }
  }

  function applySettings() {
    callbacks.volume(settings.volume);
    callbacks.mix('music', settings.music);
    callbacks.mix('effects', settings.effects);
    callbacks.mix('ambient', settings.ambient);
    callbacks.sensitivity(settings.sensitivity);
    callbacks.quality(settings.quality);
    callbacks.shadowQuality(settings.shadows);
    callbacks.resolutionScale(settings.resolution);
    callbacks.fpsLimit(settings.fps);
    callbacks.timeOfDay(settings.timeOfDay);
    callbacks.invertY(settings.invertY);
    for (const [action, code] of Object.entries(settings.bindings)) callbacks.bindKey(action, code);
  }

  const inputs = [
    ['volume-range', 'volume', value => callbacks.volume(value)],
    ['music-range', 'music', value => callbacks.mix('music', value)],
    ['effects-range', 'effects', value => callbacks.mix('effects', value)],
    ['ambient-range', 'ambient', value => callbacks.mix('ambient', value)],
    ['sensitivity-range', 'sensitivity', value => callbacks.sensitivity(value)],
    ['quality-select', 'quality', value => callbacks.quality(value), 'change', element => element.value],
    ['shadow-select', 'shadows', value => callbacks.shadowQuality(value), 'change', element => element.value],
    ['resolution-range', 'resolution', value => callbacks.resolutionScale(value)],
    ['fps-select', 'fps', value => callbacks.fpsLimit(value), 'change'],
    ['time-select', 'timeOfDay', value => callbacks.timeOfDay(value), 'change', element => element.value],
    ['invert-y', 'invertY', value => callbacks.invertY(value), 'change', element => element.checked ? true : false],
  ];

  for (const [id, key, apply, event = 'input', read = element => Number(element.value)] of inputs) {
    const element = document.getElementById(id);
    element.value = settings[key];
    if (element.type === 'checkbox') element.checked = Boolean(settings[key]);
    element.addEventListener(event, () => {
      settings[key] = read(element);
      apply(settings[key]);
      persist();
    });
  }
  for (const button of document.querySelectorAll('[data-bind]')) {
    const action = button.dataset.bind;
    const showBinding = code => code.replace(/^(Key|Digit)/, '');
    button.textContent = showBinding(settings.bindings[action] ?? defaults.bindings[action]);
    button.addEventListener('click', () => {
      button.textContent = 'PRESS A KEY';
      const capture = event => {
        event.preventDefault();
        if (event.code === 'Escape') { button.textContent = showBinding(settings.bindings[action]); return; }
        settings.bindings[action] = event.code;
        callbacks.bindKey(action, event.code);
        button.textContent = showBinding(event.code);
        persist();
      };
      document.addEventListener('keydown', capture, { once: true });
    });
  }
  applySettings();

  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('pointerenter', () => callbacks.hover());
    button.addEventListener('click', () => {
      callbacks.startAudio();
      const action = button.dataset.action;
      if (action === 'new') callbacks.newGame();
      else if (action === 'continue') callbacks.continueGame();
      else if (action === 'resume') { callbacks.resume(); callbacks.onResume(); }
      else if (action === 'restart') { callbacks.restartMission(); callbacks.onResume(); }
      else if (action === 'save') callbacks.save();
      else if (action === 'controls') {
        returnTo = title.hidden ? 'pause' : 'title'; settingsPanel.hidden = true;
        infoTitle.textContent = 'CONTROLS';
        infoCopy.innerHTML = document.body.dataset.touch === '1'
          ? 'Left pad move or steer · Drag the right side to look<br>FIRE to shoot · ENTER to get in or out · ACT for activities<br>BRAKE brakes in a car and sprints on foot · GUN, RELOAD, PAUSE'
          : 'WASD move or steer · Shift sprint · Space vault<br>Mouse orbit and aim · Left click fire · F enter or exit<br>1–4 weapons · R reload · E activities · Esc pause';
        info.hidden = false; title.hidden = true; pause.hidden = true; goodbye.hidden = true;
      } else if (action === 'settings') {
        returnTo = title.hidden ? 'pause' : 'title'; settingsPanel.hidden = false;
        infoTitle.textContent = 'SETTINGS';
        infoCopy.textContent = 'Tune the city, camera, audio mix and performance.';
        info.hidden = false; title.hidden = true; pause.hidden = true; goodbye.hidden = true;
      } else if (action === 'back') {
        info.hidden = true; (returnTo === 'pause' ? pause : title).hidden = false;
      } else if (action === 'title') {
        callbacks.onResume(); callbacks.title(); showTitle();
      } else if (action === 'respawn') {
        result.hidden = true; callbacks.respawn();
      } else if (action === 'quit') {
        callbacks.onPause(); showGoodbye();
      } else if (action === 'goodbye-back') {
        callbacks.onResume(); callbacks.title(); showTitle();
      }
    });
  });

  document.addEventListener('keydown', event => {
    const active = document.querySelector('.screen:not([hidden])');
    if (!active || /INPUT|SELECT|TEXTAREA/.test(event.target?.tagName ?? '')) return;
    if (event.key === 'Escape') {
      if (active === info) document.querySelector('[data-action="back"]').click();
      else if (active === pause) document.querySelector('[data-action="resume"]').click();
      else if (active === title) document.querySelector('[data-action="quit"]').click();
      else if (active === goodbye) document.querySelector('[data-action="goodbye-back"]').click();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const buttons = [...active.querySelectorAll('.menu-buttons button:not(:disabled)')];
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    buttons[(current + step + buttons.length) % buttons.length].focus();
  });

  function hideOthers() {
    for (const screen of [title, pause, info, result, goodbye]) screen.hidden = true;
  }
  function showTitle() { hideOthers(); title.hidden = false; }
  function showGoodbye() { hideOthers(); goodbye.hidden = false; }

  return {
    showTitle,
    showGoodbye,
    showSettings() {
      returnTo = 'title'; hideOthers(); settingsPanel.hidden = false;
      infoTitle.textContent = 'SETTINGS';
      infoCopy.textContent = 'Tune the city, camera, audio mix and performance.';
      info.hidden = false;
    },
    showPause() { hideOthers(); pause.hidden = false; callbacks.onPause(); },
    hideAll() { hideOthers(); },
    showDeath() { hideOthers(); result.hidden = false; },
  };
}
