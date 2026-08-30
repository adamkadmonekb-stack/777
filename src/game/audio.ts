// Крошечный WebAudio-синтезатор: все звуки генерируются на лету.
import { music } from './music';

let actx: AudioContext | null = null;
let muted = false;

export function initAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); }
    catch { actx = null; }
  }
  if (actx?.state === 'suspended') void actx.resume();
  music.attach(actx);
}
export function getCtx() { return actx; }
export function setMuted(m: boolean) { muted = m; music.setMuted(m); }
export function isMuted() { return muted; }

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, delay = 0) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay;
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(actx.destination);
  o.start(t0); o.stop(t0 + dur + .02);
}
function noise(dur: number, vol: number, delay = 0) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + delay;
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = actx.createBufferSource(); s.buffer = buf;
  const g = actx.createGain(); g.gain.value = vol;
  s.connect(g).connect(actx.destination);
  s.start(t0);
}

export const sfx = {
  click: () => tone(660, .06, 'square', .06),
  pickup: () => { tone(520, .07, 'square', .07); tone(780, .08, 'square', .06, 0, .05); },
  coin: () => { tone(980, .07, 'square', .07); tone(1320, .1, 'square', .06, 0, .06); },
  buy: () => { tone(440, .08, 'triangle', .09); tone(660, .1, 'triangle', .08, 0, .07); },
  eat: () => { tone(220, .08, 'sawtooth', .05, -60); noise(.06, .03, .05); },
  hurt: () => { tone(160, .18, 'sawtooth', .1, -70); noise(.1, .06); },
  fail: () => { tone(300, .12, 'square', .07); tone(200, .2, 'square', .07, 0, .1); },
  quest: () => { tone(523, .09, 'square', .07); tone(659, .09, 'square', .07, 0, .09); tone(784, .16, 'square', .07, 0, .18); },
  sleep: () => { tone(392, .3, 'sine', .06, -120); tone(262, .4, 'sine', .05, -60, .15); },
  door: () => { noise(.08, .05); tone(180, .08, 'triangle', .05); },
  bark: () => { tone(300, .06, 'sawtooth', .08, 140); tone(280, .07, 'sawtooth', .08, 120, .09); },
  punch: () => { noise(.07, .09); tone(120, .08, 'square', .08, -40); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', .07, 0, i * .1)); },
  phone: () => { tone(880, .12, 'sine', .06); tone(880, .12, 'sine', .06, 0, .2); },
};
