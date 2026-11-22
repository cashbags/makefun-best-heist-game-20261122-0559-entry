// audio.js — every sound in MIDNIGHT VAULT is a WebAudio oscillator,
// synthesised at run time. No audio files, no network. The context is
// created lazily on the first user gesture (browsers block audio before
// one), and every call is safe when the context does not exist yet.

let ctx = null;
let master = null;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    return true;
  } catch (err) {
    return false;
  }
}

function tone(freq, seconds, type, when, slideTo) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + when + seconds);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + seconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + seconds + 0.05);
}

// Soft footstep tick. `near` is 0..1 (a guard's step, louder when close).
export function playStep(near) {
  if (!ctx) return;
  tone(180 + Math.random() * 40, 0.05, 'triangle', 0);
}

// A pebble skittering across the floor.
export function playPebble() {
  tone(900, 0.06, 'square', 0, 500);
  tone(700, 0.05, 'square', 0.07, 420);
}

// The loot chime: two notes, bright.
export function playPickup() {
  tone(880, 0.12, 'sine', 0);
  tone(1318, 0.18, 'sine', 0.09);
}

// The vault clunking open.
export function playVault() {
  tone(220, 0.2, 'sawtooth', 0, 110);
  tone(440, 0.25, 'sine', 0.18);
  tone(660, 0.3, 'sine', 0.3);
}

// The alarm pulse while the meter is high (called once a second).
export function playAlarmPulse() {
  tone(620, 0.16, 'square', 0, 580);
  tone(620, 0.16, 'square', 0.22, 580);
}

// The caught sting.
export function playCaught() {
  tone(392, 0.25, 'sawtooth', 0, 196);
  tone(311, 0.35, 'sawtooth', 0.2, 155);
}

// The level-clear fanfare.
export function playLevelClear() {
  tone(523, 0.14, 'sine', 0);
  tone(659, 0.14, 'sine', 0.12);
  tone(784, 0.14, 'sine', 0.24);
  tone(1046, 0.3, 'sine', 0.36);
}

// The win arpeggio.
export function playWin() {
  const notes = [523, 659, 784, 1046, 1318];
  notes.forEach((n, i) => tone(n, 0.28, 'sine', i * 0.13));
}

// The EMP crackle.
export function playEmp() {
  tone(1400, 0.1, 'sawtooth', 0, 300);
  tone(1100, 0.14, 'sawtooth', 0.08, 240);
}
