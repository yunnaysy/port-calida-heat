export function createInput() {
  const keys = new Set(), pressed = new Set();
  let mouseDown = false;
  const bindings = {
    forward: 'KeyW', reverse: 'KeyS', left: 'KeyA', right: 'KeyD',
    vehicle: 'KeyF', activity: 'KeyE', map: 'KeyM',
  };
  const blocked = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  document.addEventListener('keydown', event => {
    if (blocked.has(event.code)) event.preventDefault();
    if (!keys.has(event.code)) pressed.add(event.code);
    keys.add(event.code);
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', () => { keys.clear(); mouseDown = false; });
  document.addEventListener('mousedown', event => { if (event.button === 0) mouseDown = true; });
  document.addEventListener('mouseup', event => { if (event.button === 0) mouseDown = false; });
  return {
    down(code) { return keys.has(code); },
    take(code) { const result = pressed.has(code); pressed.delete(code); return result; },
    downAction(action) { return keys.has(bindings[action]); },
    takeAction(action) { return this.take(bindings[action]); },
    bind(action, code) { if (action in bindings && typeof code === 'string') bindings[action] = code; },
    binding(action) { return bindings[action]; },
    clearPressed() { pressed.clear(); },
    get firing() { return mouseDown; },
  };
}
