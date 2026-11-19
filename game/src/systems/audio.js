export function createAudio() {
  let context = null, master = null, engineOsc = null, engineGain = null;
  let musicGain = null, ambientGain = null, effectGain = null, ambienceOsc = null;
  let volume = .32, mixes = { music: .55, effects: .8, ambient: .35 };
  let musicTimer = null, noteIndex = 0, lastSiren = 0;
  let isDucked = false;

  function start() {
    if (!context) {
      context = new AudioContext();
      master = context.createGain(); master.gain.value = volume; master.connect(context.destination);
      musicGain = context.createGain(); musicGain.gain.value = mixes.music; musicGain.connect(master);
      effectGain = context.createGain(); effectGain.gain.value = mixes.effects; effectGain.connect(master);
      ambientGain = context.createGain(); ambientGain.gain.value = mixes.ambient; ambientGain.connect(master);
      engineOsc = context.createOscillator(); engineOsc.type = 'sawtooth';
      engineGain = context.createGain(); engineGain.gain.value = .018;
      engineOsc.connect(engineGain).connect(effectGain); engineOsc.start();
      ambienceOsc = context.createOscillator(); ambienceOsc.type = 'sine'; ambienceOsc.frequency.value = 58;
      const ambienceLevel = context.createGain(); ambienceLevel.gain.value = .012;
      ambienceOsc.connect(ambienceLevel).connect(ambientGain); ambienceOsc.start();
    }
    if (context.state === 'suspended') context.resume();
    startMusic();
  }

  function startMusic() {
    if (musicTimer || !context) return;
    const notes = [261.6, 329.6, 392, 329.6, 293.7, 349.2, 440, 349.2];
    musicTimer = setInterval(() => {
      if (!context || context.state !== 'running') return;
      tone(notes[noteIndex++ % notes.length], 1.15, 'sine', .035, 'music');
    }, 850);
  }

  function tone(frequency, duration, type = 'triangle', gain = .12, channel = 'effects', pan = 0) {
    if (!context) return;
    const oscillator = context.createOscillator(), envelope = context.createGain();
    const output = channel === 'music' ? musicGain : channel === 'ambient' ? ambientGain : effectGain;
    oscillator.type = type; oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(gain, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
    if (context.createStereoPanner) {
      const panner = context.createStereoPanner();
      panner.pan.value = pan;
      oscillator.connect(envelope).connect(panner).connect(output);
    } else oscillator.connect(envelope).connect(output);
    oscillator.start(); oscillator.stop(context.currentTime + duration);
  }

  return {
    start,
    setVolume(value) { volume = value; if (master) master.gain.setTargetAtTime(volume, context.currentTime, .08); },
    setMix(channel, value) {
      mixes[channel] = value;
      const bus = channel === 'music' ? musicGain : channel === 'ambient' ? ambientGain : effectGain;
      if (bus && context) bus.gain.setTargetAtTime(value * (isDucked && channel !== 'effects' ? .35 : 1), context.currentTime, .08);
    },
    duck(ducked) {
      isDucked = ducked;
      if (!context) return;
      const factor = ducked ? .32 : 1;
      musicGain.gain.setTargetAtTime(mixes.music * factor, context.currentTime, .25);
      ambientGain.gain.setTargetAtTime(mixes.ambient * (ducked ? .55 : 1), context.currentTime, .25);
    },
    engine(speed = 0) { if (engineOsc && context) engineOsc.frequency.setTargetAtTime(55 + Math.abs(speed) * 7, context.currentTime, .14); },
    shot() { start(); tone(82, .13, 'sawtooth', .21); tone(580, .055, 'square', .08); },
    horn() { start(); tone(185, .3, 'sawtooth', .08); tone(232, .28, 'sawtooth', .06); },
    siren(source, listener) {
      if (!context || context.currentTime - lastSiren < .32) return;
      lastSiren = context.currentTime;
      const pan = source && listener ? Math.max(-1, Math.min(1, (source.x - listener.x) / 55)) : 0;
      tone(450 + Math.sin(context.currentTime * 5) * 120, .25, 'triangle', .025, 'effects', pan);
    },
    radio() { start(); [261.6, 329.6, 392, 440].forEach((note, i) => setTimeout(() => tone(note, .3, 'sine', .035, 'music'), i * 320)); },
    notification() { if (context) { tone(587, .08, 'sine', .04); setTimeout(() => tone(784, .12, 'sine', .04), 85); } },
    uiTick() { if (context) tone(1050, .035, 'sine', .025); },
    vehicleEntry() { start(); tone(125, .12, 'triangle', .09); setTimeout(() => tone(72, .22, 'sawtooth', .06), 110); },
    impact() { if (context) { tone(90, .15, 'sawtooth', .15); tone(240, .08, 'triangle', .07); } },
    weaponSwitch() { if (context) tone(720, .055, 'square', .04); },
    mapOpen() { if (context) { tone(440, .08, 'sine', .04); setTimeout(() => tone(660, .1, 'sine', .035), 70); } },
    missionComplete() { if (context) [440, 554.4, 659.3, 880].forEach((note, index) => setTimeout(() => tone(note, .3, 'sine', .06), index * 100)); },
    missionSting() { start(); [220, 330, 440].forEach((note, index) => setTimeout(() => tone(note, .55, 'triangle', .05, 'music'), index * 90)); },
    lowHealth() { if (context) tone(112, .36, 'sine', .035); },
  };
}
