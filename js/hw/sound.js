// Sons sintetizados (sem arquivos): clique, parafuso, bipes e o zumbido das ventoinhas.
import { store } from '../store.js';

let ctx = null;
let humNode = null;
let muted = store.get('muted', false);

function ac() {
  if (muted) return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, { type = 'square', gain = 0.06, at = 0 } = {}) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
  g.gain.setValueAtTime(gain, t0 + Math.max(0.01, dur - 0.02));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(dur, { gain = 0.08, at = 0, freq = 3000 } = {}) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + at;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

export const Sound = {
  get muted() { return muted; },
  toggle() {
    muted = !muted;
    store.set('muted', muted);
    if (muted) this.humStop();
    return muted;
  },
  click() { noise(0.035, { gain: 0.25, freq: 2500 }); tone(1900, 0.025, { gain: 0.03 }); },
  snap() { noise(0.05, { gain: 0.3, freq: 1800 }); noise(0.04, { gain: 0.2, freq: 3200, at: 0.06 }); },
  screw() { for (let i = 0; i < 7; i++) noise(0.02, { gain: 0.12, freq: 4200, at: i * 0.075 }); },
  beep(dur = 0.18, freq = 880, at = 0) { tone(freq, dur, { type: 'square', gain: 0.05, at }); },
  beepPattern(pattern) {
    let t = 0;
    for (const d of pattern) { this.beep(d, 880, t); t += d + 0.22; }
    return t;
  },
  chime() { tone(523, 0.14, { type: 'sine', gain: 0.08 }); tone(784, 0.22, { type: 'sine', gain: 0.08, at: 0.12 }); },
  humStart() {
    const a = ac();
    if (!a || humNode) return;
    const len = a.sampleRate * 2;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 380;
    const g = a.createGain();
    g.gain.setValueAtTime(0, a.currentTime);
    g.gain.linearRampToValueAtTime(0.05, a.currentTime + 1.2);
    src.connect(f).connect(g).connect(a.destination);
    src.start();
    humNode = { src, g };
  },
  humStop() {
    if (!humNode || !ctx) { humNode = null; return; }
    const { src, g } = humNode;
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    setTimeout(() => { try { src.stop(); } catch { /* já parado */ } }, 900);
    humNode = null;
  },
};
