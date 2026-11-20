function capturePointer(element, pointerId) {
  if (!element?.setPointerCapture) return;
  try { element.setPointerCapture(pointerId); }
  catch {}
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
  if (fine && !coarse) return false;
  return Boolean(coarse || (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window);
}

export function createInput() {
  const keys = new Set(), pressed = new Set();
  let mouseDown = false;
  const touchDevice = isTouchDevice();
  const touch = { axis: { x: 0, y: 0 }, lookDelta: { x: 0, y: 0 }, firing: false, brake: false, queued: new Set() };
  let resetPad = () => {}, resetLook = () => {};
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
  if (touchDevice) {
    document.body.dataset.touch = '1';
    const pad = document.getElementById('touch-pad');
    const knob = document.getElementById('touch-knob');
    let padId = null;
    resetPad = () => {
      padId = null; touch.axis.x = 0; touch.axis.y = 0;
      if (knob) knob.style.transform = '';
    };
    const movePad = event => {
      if (!pad) return;
      const rect = pad.getBoundingClientRect();
      const range = rect.width * .36;
      let x = (event.clientX - rect.left - rect.width / 2) / range;
      let y = (event.clientY - rect.top - rect.height / 2) / range;
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      touch.axis.x = x; touch.axis.y = -y;
      if (knob) knob.style.transform = `translate(${x * range}px, ${y * range}px)`;
    };
    const releasePad = event => { if (event.pointerId === padId) resetPad(); };
    pad?.addEventListener('pointerdown', event => {
      event.preventDefault(); padId = event.pointerId;
      capturePointer(pad, event.pointerId); movePad(event);
    });
    pad?.addEventListener('pointermove', event => { if (event.pointerId === padId) movePad(event); });
    pad?.addEventListener('pointerup', releasePad);
    pad?.addEventListener('pointercancel', releasePad);
    pad?.addEventListener('lostpointercapture', releasePad);

    const look = document.getElementById('touch-look');
    let lookId = null, lastX = 0, lastY = 0;
    resetLook = () => { lookId = null; };
    look?.addEventListener('pointerdown', event => {
      event.preventDefault(); lookId = event.pointerId;
      lastX = event.clientX; lastY = event.clientY;
      capturePointer(look, event.pointerId);
    });
    look?.addEventListener('pointermove', event => {
      if (event.pointerId !== lookId) return;
      touch.lookDelta.x += event.clientX - lastX;
      touch.lookDelta.y += event.clientY - lastY;
      lastX = event.clientX; lastY = event.clientY;
    });
    const releaseLook = event => { if (event.pointerId === lookId) lookId = null; };
    look?.addEventListener('pointerup', releaseLook);
    look?.addEventListener('pointercancel', releaseLook);
    look?.addEventListener('lostpointercapture', releaseLook);

    for (const button of document.querySelectorAll('[data-touch-action]')) {
      const action = button.dataset.touchAction;
      button.addEventListener('pointerdown', event => {
        event.preventDefault(); event.stopPropagation();
        capturePointer(button, event.pointerId);
        button.classList.add('pressed');
        if (action === 'fire') touch.firing = true;
        else if (action === 'brake') touch.brake = true;
        else touch.queued.add(action);
      });
      const release = () => {
        if (action === 'fire') touch.firing = false;
        else if (action === 'brake') touch.brake = false;
        button.classList.remove('pressed');
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('contextmenu', event => event.preventDefault());
    }
  }
  return {
    isTouch: touchDevice,
    touch,
    down(code) { return keys.has(code); },
    take(code) { const result = pressed.has(code); pressed.delete(code); return result; },
    downAction(action) {
      if (keys.has(bindings[action])) return true;
      if (action === 'forward') return touch.axis.y > .35;
      if (action === 'reverse') return touch.axis.y < -.35;
      if (action === 'left') return touch.axis.x < -.35;
      if (action === 'right') return touch.axis.x > .35;
      return false;
    },
    takeAction(action) { if (touch.queued.delete(action)) return true; return this.take(bindings[action]); },
    takeTouch(action) { return touch.queued.delete(action); },
    takePause() { if (touch.queued.delete('pause')) return true; return this.take('Escape'); },
    consumeLook() { const delta = { x: touch.lookDelta.x, y: touch.lookDelta.y }; touch.lookDelta.x = 0; touch.lookDelta.y = 0; return delta; },
    bind(action, code) { if (action in bindings && typeof code === 'string') bindings[action] = code; },
    binding(action) { return bindings[action]; },
    clearPressed() { pressed.clear(); touch.queued.clear(); },
    clearTouches() { resetPad(); resetLook(); touch.lookDelta.x = 0; touch.lookDelta.y = 0; touch.firing = false; touch.brake = false; touch.queued.clear(); },
    get firing() { return mouseDown || touch.firing; },
  };
}
