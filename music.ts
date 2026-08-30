// Процедурный музыкальный движок: треки генерируются WebAudio-синтезатором.
import { TRACKS } from './core';
import type { TrackDef } from './core';

const SETTINGS_KEY = 'ulitsy_music_settings_v1';
const midi2f = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

interface Settings { muted: boolean; volume: number; track: number; }

class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private track = 0;
  private playing = false;
  private muted = false;
  private volume = 0.42;
  private autoMode: 'day' | 'night' = 'day';
  manualPick = false;
  private rngSeed = 7;

  constructor() { this.loadSettings(); }

  private loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<Settings>;
        this.muted = !!d.muted;
        this.volume = typeof d.volume === 'number' ? Math.min(1, Math.max(0, d.volume)) : 0.42;
        this.track = typeof d.track === 'number' && d.track >= 0 && d.track < TRACKS.length ? d.track : 0;
      }
    } catch { /* ignore */ }
  }
  private saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ muted: this.muted, volume: this.volume, track: this.track }));
    } catch { /* ignore */ }
  }

  /** Вызывать после пользовательского жеста (initAudio уже создан). */
  attach(ctx: AudioContext | null) {
    if (!ctx || this.ctx) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(ctx.destination);
    // лёгкая реверберация через задержку
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.27;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.22;
    this.master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
    this.start();
  }

  start() {
    if (!this.ctx || this.playing) return;
    this.playing = true;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.tick(), 90);
  }
  stop() {
    this.playing = false;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
  }

  getStatus() {
    return {
      playing: this.playing && !this.muted,
      isPlaying: this.playing,
      muted: this.muted,
      volume: this.volume,
      track: this.track,
      total: TRACKS.length,
      current: TRACKS[this.track],
    };
  }

  playTrack(i: number, manual = true) {
    if (i < 0 || i >= TRACKS.length) return;
    if (manual) this.manualPick = true;
    this.track = i;
    this.step = 0;
    if (this.ctx) this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.08);
    if (!this.playing && this.ctx) this.start();
    this.saveSettings();
  }
  nextTrack() { this.playTrack((this.track + 1) % TRACKS.length); }
  prevTrack() { this.playTrack((this.track - 1 + TRACKS.length) % TRACKS.length); }
  togglePlay() {
    if (!this.ctx) return;
    if (this.playing) this.stop();
    else this.start();
  }
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    this.saveSettings();
    return this.muted;
  }
  setMuted(m: boolean) {
    if (this.muted === m) return;
    this.toggleMute();
  }
  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.master && this.ctx && !this.muted) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    this.saveSettings();
  }
  /** Движок сам переключает «дневной/ночной» трек, если игрок не выбирал сам. */
  setAuto(mode: 'day' | 'night') {
    if (mode === this.autoMode) return;
    this.autoMode = mode;
    if (this.manualPick) return;
    this.playTrack(mode === 'night' ? 0 : 3, false);
  }

  // ---------- синтез ----------
  private rnd() {
    this.rngSeed = (this.rngSeed * 16807) % 2147483647;
    return this.rngSeed / 2147483647;
  }

  private tick() {
    if (!this.ctx || !this.master || !this.playing) return;
    const tr = TRACKS[this.track];
    const eighth = 60 / tr.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.35) {
      this.schedule(tr, this.step, this.nextTime);
      this.nextTime += eighth;
      this.step = (this.step + 1) % 64;
    }
  }

  private note(midi: number, t: number, dur: number, wave: OscillatorType, vol: number, slideTo?: number) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(midi2f(midi), t);
    if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, midi2f(slideTo)), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  private hat(t: number, vol: number, open = false) {
    if (!this.ctx || !this.master) return;
    const dur = open ? 0.14 : 0.045;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, open ? 1.2 : 3);
    const s = this.ctx.createBufferSource(); s.buffer = buf;
    const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    const g = this.ctx.createGain(); g.gain.value = vol;
    s.connect(hp).connect(g).connect(this.master);
    s.start(t);
  }

  private schedule(tr: TrackDef, step: number, t: number) {
    const scale = tr.minor ? MINOR : MAJOR;
    const deg = (i: number, oct = 0) => tr.root + scale[((i % 7) + 7) % 7] + Math.floor(i / 7) * 12 + oct * 12;
    const bar = Math.floor(step / 8);
    const prog = tr.minor ? [0, 0, 5, 3] : [0, 3, 4, 0];
    const chordRoot = prog[bar % 4];
    const eighth = 60 / tr.bpm / 2;

    // бас — каждая доля
    if (step % 2 === 0) {
      const bi = step % 8 === 0 ? chordRoot : (this.rnd() < 0.3 ? chordRoot + 4 : chordRoot);
      this.note(deg(bi, -1) - 12, t, eighth * 1.7, tr.bass, 0.16);
    }
    // пэд — аккорд в начале такта
    if (tr.pad && step % 8 === 0) {
      [chordRoot, chordRoot + 2, chordRoot + 4].forEach((n, i) =>
        this.note(deg(n), t + i * 0.03, eighth * 7.5, 'sine', 0.045));
    }
    // мелодия
    if (this.rnd() < tr.density * (step % 2 === 0 ? 0.8 : 0.45)) {
      const n = chordRoot + [0, 2, 4, 6, 7, 9][Math.floor(this.rnd() * 6)];
      this.note(deg(n, 1), t, eighth * (this.rnd() < 0.3 ? 2.4 : 1.1), tr.lead, 0.05);
    }
    // барабаны
    if (tr.drums) {
      if (step % 8 === 0 || step % 8 === 5) this.note(tr.root - 24, t, 0.12, 'sine', 0.2, tr.root - 31); // кик
      if (step % 4 === 2) this.hat(t, 0.05);
      if (step % 8 === 4) this.hat(t, 0.07, true);
    }
  }
}

export const music = new MusicEngine();
