export function createAudio() {
  let context = null, master = null, engineOsc = null, engineGain = null;
  let volume = .32;
  function start() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain(); master.gain.value = volume; master.connect(context.destination);
      engineOsc = context.createOscillator(); engineOsc.type = 'sawtooth';
      engineGain = context.createGain(); engineGain.gain.value = .018;
      engineOsc.connect(engineGain).connect(master); engineOsc.start();
    }
    if (context.state === 'suspended') context.resume();
  }
  function tone(frequency, duration, type = 'triangle', gain = .12) {
    if (!context) return;
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(gain, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
    oscillator.connect(envelope).connect(master); oscillator.start(); oscillator.stop(context.currentTime + duration);
  }
  return {
    start,
    setVolume(value) { volume = value; if (master) master.gain.value = volume; },
    engine(speed = 0) { if (engineOsc && context) engineOsc.frequency.setTargetAtTime(55 + Math.abs(speed) * 7, context.currentTime, .14); },
    shot() { start(); tone(82, .13, 'sawtooth', .21); tone(580, .055, 'square', .08); },
    horn() { start(); tone(185, .3, 'sawtooth', .08); tone(232, .28, 'sawtooth', .06); },
    siren() { if (context) tone(450 + Math.sin(context.currentTime * 5) * 120, .22, 'triangle', .025); },
    radio() { start(); [261.6, 329.6, 392, 440].forEach((note, i) => setTimeout(() => tone(note, .3, 'sine', .035), i * 320)); },
    notification() { if (context) { tone(587, .08, 'sine', .04); setTimeout(() => tone(784, .12, 'sine', .04), 85); } },
  };
}
