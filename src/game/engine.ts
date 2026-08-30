import { buildWorld, T, MW, MH, tileAt, districtAt } from './world';
import type { World, Interior, WObj, Npc, Dog, InteriorObj } from './world';
import {
  ITEMS, BACKPACKS, APARTMENTS, SHOPS, RECYCLE, RECIPES, WORKERS, APPLIANCES,
  INVESTMENTS, QUESTS, LOOT, SELL_VALS, fmt, clamp, rnd, ri, pick,
  SHOP_MULT, TRANSPORT, genCities, ONETIME_JOBS, PERM_JOBS, NEIGHBOR_LINES,
  CARRY_NAME, PILE_NAME, DROP_NAME, FREE_APT, TRASHCAN_LOOT, THEFT_OPTIONS, APT_INTERIORS, VEHICLE_IDS, VEHICLES 
} from './core';
import type { CarryType } from './core';
import type { Stats, InvSlot, QuestDef, WorkerDef, ApartmentDef, EquipSlot, CityDef, Transport, OneTimeJobDef, PermJobDef } from './core';
import { prerenderWorld, prerenderInterior, drawScene } from './render';
import type { View, Outfit, FloatText, Particle } from './render';
import { sfx, initAudio, setMuted, isMuted } from './audio';
import { music } from './music';
import { ACHIEVEMENTS, getAchievement } from '../data/achievements';

const SAVE_KEY = 'ulitsy_goroda_save_v1';
const MIN_PER_SEC = 1.2; // игровых минут за реальную секунду

export type Weather = 'sun' | 'rain' | 'snow' | 'heat';
export interface WorkerState { id: string; hired: boolean; sick: boolean; fed: boolean; }
export interface ApplianceState { dur: number; broken: boolean; }
export interface ApartmentState { id: string; appliances: Record<string, ApplianceState>; dirt: number; rented: boolean; }
export interface QuestState { def: QuestDef; progress: number; claimed: boolean; }
export interface Toast { id: number; text: string; kind: 'info' | 'good' | 'bad' | 'money'; t: number; }
export interface NewsJob { id: string; title: string; desc: string; pay: number; energy: number; phone?: boolean; }
export interface NewsState { jobs: NewsJob[]; sales: { item: string; price: number }[]; missing: string[]; crime: string[]; taken: string[]; }

export type Modal =
  | { kind: 'shop'; id: string }
  | { kind: 'recycle'; kindId: 'glass' | 'metal' | 'paper' }
  | { kind: 'baraholka' }
  | { kind: 'inventory' }
  | { kind: 'map' }
  | { kind: 'menu' }
  | { kind: 'sleep' }
  | { kind: 'realtor' }
  | { kind: 'room' }
  | { kind: 'newspaper' }
  | { kind: 'phone' }
  | { kind: 'workers' }
  | { kind: 'craft' }
  | { kind: 'quests' }
  | { kind: 'achievements' }
  | { kind: 'charity'; id: 'soup' | 'church' }
  | { kind: 'apartment' }
  | { kind: 'event'; ev: 'wallet' | 'crime' }
  | { kind: 'mugged' }
  | { kind: 'police' }
  | { kind: 'hospital' }
  | { kind: 'gameover' }
  | { kind: 'victory' }
  | { kind: 'intro' }
  | { kind: 'citymap' }
  | { kind: 'music' }
  | { kind: 'factory'; id: 'factory' | 'workshop' }
  | { kind: 'entrance'; id: string }
  | { kind: 'theft' }
  | { kind: 'minigame'; game: 'dump' | 'clean' | 'repair' | 'fish' | 'qte' | 'carry' | 'cut'; data: Record<string, unknown> };

export interface TravelState { to: number; mode: Transport; t: number; dur: number; }

export interface GState {
  day: number; time: number; weather: Weather;
  money: number; stats: Stats;
  inv: InvSlot[]; backpack: number; backpackAge: number;
  housing: 'street' | 'shelter' | 'room' | 'freeapt';
  ownedApts: string[]; apts: ApartmentState[];
  phone: string | null;
  rep: { homeless: number; people: number; police: number };
  criminal: number;
  workers: WorkerState[];
  quests: QuestState[];
  counters: Record<string, number>;
  claimedEver: string[];
  investments: string[];
  ill: '' | 'cold' | 'poison';
  partner: boolean; family: boolean;
  hospitalizations: number;
  cansSold: number;
  sales: Record<string, { idx: number; pct: number }>;
  news: NewsState | null;
  flags: Record<string, boolean>;
  milestones: string[];
  equipped: Record<EquipSlot, string | null>;
  cities: CityDef[];
  cityIndex: number;
  job: { id: string | null; days: number };
  docs: { passport: boolean; registration: boolean; workPermit: boolean };
  factoryJob: { id: string; progress: number } | null;
  factoryCooldowns: Record<string, number>; // jobId → игровая минута последнего выполнения
  freeApt: { daysLeft: number } | null; // бесплатная квартира: осталось дней льготного периода
  achievements: Record<string, { unlocked: boolean; progress: number; notified?: boolean }>; // ачивки
  vehicles: { id: string; fuel: number; parkedAt: string | null }[]; // купленный транспорт
  activeVehicle: string | null; // на чём сейчас едет (ID транспорта)
  // Доставка из Пятёрочки
  deliveryActive: boolean; // активный заказ доставки
  deliveryTarget: { x: number; y: number; homeName: string; reward: number } | null; // точка доставки
  deliveryPhase: 'toCustomer' | 'toStore'; // фаза: к клиенту или обратно в магазин
  // Междугородняя доставка
  highwayActive: boolean; // активна ли миссия на трассе
  highwayProgress: number; // прогресс поездки (0-100%)
  highwayTargetCity: string | null; // город назначения
}

function freshState(): GState {
  return {
    day: 1, time: 8 * 60, weather: 'sun', money: 50,
    stats: { hp: 100, energy: 100, fatigue: 10, hunger: 80, hygiene: 55, mood: 60 },
    inv: [{ id: 'bread', qty: 1 }], backpack: 0, backpackAge: 0,
    housing: 'street', ownedApts: [], apts: [], phone: null,
    rep: { homeless: 5, people: 0, police: 0 }, criminal: 0,
    workers: WORKERS.map(w => ({ id: w.id, hired: false, sick: false, fed: false })),
    quests: [], counters: {}, claimedEver: [], investments: [],
    ill: '', partner: false, family: false, hospitalizations: 0, cansSold: 0,
    sales: {}, news: null, flags: {}, milestones: [],
    equipped: { torso: null, legs: null, feet: null, head: null },
    cities: genCities(), cityIndex: 0,
    job: { id: null, days: 0 },
    docs: { passport: false, registration: false, workPermit: false },
    factoryJob: null,
    factoryCooldowns: {},
    freeApt: null,
    achievements: {},
    vehicles: [],
    activeVehicle: null,
    deliveryActive: false,
    deliveryTarget: null,
    deliveryPhase: 'toCustomer',
    highwayActive: false,
    highwayProgress: 0,
    highwayTargetCity: null,
  };
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  world: World;
  worldCanvas: HTMLCanvasElement;
  intCanvases: Record<string, HTMLCanvasElement> = {};
  state: GState = freshState();
  mode: { type: 'world' } | { type: 'interior'; id: string } = { type: 'world' };
  px = 51 * T; py = 37.5 * T; dir = 0; anim = 0; moving = false;
  camX = 0; camY = 0; zoom = 1.6; vw = 800; vh = 600;
  keys = new Set<string>();
  joy = { x: 0, y: 0 };
  npcs: Npc[]; dogs: Dog[];
  floats: FloatText[] = []; particles: Particle[] = [];
  shake = 0; flash = 0; sleepFade = 0;
  modal: Modal | null = null;
  toasts: Toast[] = []; toastId = 1;
  nearObj: WObj | null = null; nearWorker: Npc | null = null;
  intObj: InteriorObj | null = null;
  prompt: string | null = null;
  started = false;
  lostDog: { x: number; y: number } | null = null;
  travel: TravelState | null = null;
  musicMinute = -1;
  carrying: 'sheets' | 'beams' | 'alu' | 'pallet' | null = null; // груз на заводе
  forkliftMounted = false; // сидим ли в погрузчике
  forkliftDir = 0; // 0 — вилы вправо, 1 — влево (разворот по направлению движения)
  trashCleaned: string[] = []; // убранные кучи мусора (ключ: intId_idx), сбрасываются ежедневно
  private raf = 0; private lastT = 0; private autoT = 0; private evT = 40;
  private dogCd = 0; private trampCd: Record<string, number> = {}; private copCd = 0;
  private version = 0;
  private onUi: () => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.world = buildWorld();
    this.worldCanvas = prerenderWorld(this.world);
    for (const k of Object.keys(this.world.interiors)) {
      this.intCanvases[k] = prerenderInterior(this.world.interiors[k]);
    }
    this.npcs = this.world.npcs;
    this.dogs = this.world.dogs;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        this.worldCanvas = prerenderWorld(this.world);
        for (const k of Object.keys(this.world.interiors)) this.intCanvases[k] = prerenderInterior(this.world.interiors[k]);
      });
    }
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointer);
  }
  setUiListener(fn: () => void) { this.onUi = fn; }
  bump() { this.version++; this.onUi(); }

  // ==================== ВВОД ====================
  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    this.keys.add(k);
    if (!this.started) return;
    if (k === 'escape') {
      if (this.modal) this.closeModal(); else this.openModal({ kind: 'menu' });
    }
    if (this.modal) return;
    if (k === 'e' || k === 'у') this.interact(); // у = e на русской раскладке
    if (k === 'i' || k === 'ш') this.openModal({ kind: 'inventory' });
    if (k === 'm' || k === 'ь') this.openModal({ kind: 'map' });
    if (k === 'c' || k === 'с') this.openModal({ kind: 'craft' });
    if (k === 'q' || k === 'й') this.openModal({ kind: 'quests' });
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
  private onPointer = (e: PointerEvent) => {
    initAudio();
    if (!this.started || this.modal) return;
    const rect = this.canvas.getBoundingClientRect();
    const wx = this.camX + (e.clientX - rect.left) / this.zoom;
    const wy = this.camY + (e.clientY - rect.top) / this.zoom;
    const d = Math.hypot(wx - this.px, wy - this.py);
    if (d < 70 && this.nearObj) { this.interact(); return; }
    // лёгкий поворот в сторону тапа
    this.dir = Math.abs(wx - this.px) > Math.abs(wy - this.py) ? (wx > this.px ? 3 : 2) : (wy > this.py ? 0 : 1);
  };
  setJoy(x: number, y: number) { this.joy.x = x; this.joy.y = y; }
  resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.vw = this.canvas.clientWidth || window.innerWidth;
    this.vh = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = this.vw * dpr; this.canvas.height = this.vh * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.zoom = clamp(Math.min(this.vw / 700, this.vh / 520), 1.05, 2.4);
  };

  // ==================== СТАРТ / СОХРАНЕНИЯ ====================
  hasSave(): boolean { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  newGame() {
    this.state = freshState();
    this.px = 51 * T; this.py = 38.6 * T; this.dir = 0;
    this.mode = { type: 'world' };
    this.onNewDay(true);
    this.started = true;
    this.modal = { kind: 'intro' } as Modal;
    this.toast('Добро пожаловать в город. Выжить — уже победа.', 'info');
    this.bump();
  }
  saveGame(): boolean {
    try {
      const data = { v: 1, state: this.state, px: this.px, py: this.py, mode: this.mode };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch { return false; }
  }
  loadGame(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.state = { ...freshState(), ...data.state };
      this.px = data.px; this.py = data.py;
      this.mode = data.mode?.type === 'interior' && this.world.interiors[data.mode.id] ? data.mode : { type: 'world' };
      this.started = true;
      this.refreshLostDog();
      this.toast('Сохранение загружено', 'good');
      this.bump();
      return true;
    } catch { return false; }
  }
  deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ } }

  startLoop() { this.lastT = performance.now(); cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(this.loop); }
  stopLoop() { cancelAnimationFrame(this.raf); }

  // ==================== ЦИКЛ ====================
  private loop = (t: number) => {
    const dt = Math.min(0.05, (t - this.lastT) / 1000);
    this.lastT = t;
    if (this.started) this.update(dt);
    this.render(t / 1000);
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const s = this.state;
    // затухания
    this.shake = Math.max(0, this.shake - dt * 2.2);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.sleepFade = Math.max(0, this.sleepFade - dt * .6);
    for (const f of this.floats) f.t += dt;
    this.floats = this.floats.filter(f => f.t < 1.2);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt; }
    this.particles = this.particles.filter(p => p.t < 2 && p.y < this.vh + 20);
    for (const tt of this.toasts) tt.t += dt;
    const before = this.toasts.length;
    this.toasts = this.toasts.filter(tt => tt.t < 4);
    if (this.toasts.length !== before) this.bump();

    if (this.modal) { this.npcUpdate(dt * .3); return; } // мир замирает при открытых окнах

    // поездка между городами
    if (this.travel) {
      this.travel.t += dt;
      if (this.travel.t >= this.travel.dur) this.arriveCity();
      return;
    }

    // фоновая музыка: днём и ночью разные треки (если игрок не выбирал сам)
    const hh = Math.floor(s.time / 60);
    if (hh !== this.musicMinute) { this.musicMinute = hh; music.setAuto(hh >= 22 || hh < 6 ? 'night' : 'day'); }

    // время
    s.time += dt * MIN_PER_SEC * 60 / 60 * 60 / 60; // = dt * MIN_PER_SEC минут
    s.time += 0; // (формула выше уже корректна)
    if (s.time >= 1440) { s.time -= 1440; s.day++; this.onNewDay(false); }

    // погода
    if (Math.random() < dt / 90) this.rollWeather();
    this.spawnWeatherParticles(dt);

    // ночное задание
    if (s.time < 300 && s.housing === 'street' && this.mode.type === 'world' && !s.flags.night_done) {
      s.flags.night_done = true;
      this.questProgress('night', 1);
      this.toast('Вы пережили ночь на улице', 'good');
    }

    this.updateStats(dt);
    this.updatePlayer(dt);
    this.npcUpdate(dt);
    this.intNpcUpdate(dt);
    this.dogUpdate(dt);
    this.dangers(dt);

    // полуденные доходы
    if (!s.flags.noon && s.time >= 12 * 60) { s.flags.noon = true; this.noonIncome(); }

    // случайные события
    this.evT -= dt;
    if (this.evT <= 0) { this.evT = rnd(55, 110); this.randomEvent(); }

    // автосохранение
    this.autoT += dt;
    if (this.autoT > 75) { this.autoT = 0; if (this.saveGame()) this.toast('Автосохранение', 'info'); }

    this.computePrompt();
    this.updateCamera(dt);

    if (s.stats.hp <= 0) this.hospitalize();
  }

  // ==================== СТАТЫ ====================
  private roofed(): boolean { return this.mode.type === 'interior'; }
  private hasWarm(): boolean {
    return this.equippedWarmth() > 0 || this.hasItem('heater');
  }
  private updateStats(dt: number) {
    const st = this.state.stats, s = this.state;
    st.hunger = clamp(st.hunger - dt * 0.085, 0, 100);
    st.fatigue = clamp(st.fatigue + dt * 0.05, 0, 100);
    st.hygiene = clamp(st.hygiene - dt * (this.roofed() ? 0.008 : 0.02) - (s.weather === 'rain' && !this.roofed() ? dt * 0.12 : 0), 0, 100);
    const run = this.keys.has('shift');
    if (run && this.moving) st.energy = clamp(st.energy - dt * 0.6, 0, 100);
    else st.energy = clamp(st.energy + (st.hunger > 40 && st.fatigue < 60 ? dt * 0.12 : -dt * 0.03), 0, 100);
    // настроение дрейфует
    let target = 45;
    if (st.hunger < 25) target -= 20;
    if (st.hygiene < 25) target -= 15;
    if (s.weather === 'rain' && !this.roofed()) target -= 10;
    if (s.ill) target -= 15;
    if (s.partner) target += 10;
    if (this.hasItem('suit') || this.hasItem('nike')) target += 5;
    st.mood = clamp(st.mood + (target - st.mood) * dt * 0.01, 0, 100);
    // здоровье
    let dmg = 0;
    if (st.hunger <= 0) dmg += 0.055;
    if (s.weather === 'snow' && !this.roofed() && !this.hasWarm()) dmg += 0.1;
    if (s.weather === 'heat' && !this.roofed()) { st.energy = clamp(st.energy - dt * 0.06, 0, 100); if (st.energy <= 5) dmg += 0.04; }
    if (s.ill === 'cold') dmg += 0.035;
    if (s.ill === 'poison') { dmg += 0.07; st.energy = clamp(st.energy - dt * 0.04, 0, 100); }
    if (st.hp < 100 && dmg === 0 && st.hunger > 60 && this.roofed()) st.hp = clamp(st.hp + dt * 0.05, 0, 100);
    if (dmg > 0) this.damage(dt * dmg * 60 / 60, true);
    // простуда от холода
    if (s.weather === 'snow' && !this.roofed() && !this.hasWarm() && !s.ill && Math.random() < dt / 45) {
      s.ill = 'cold'; this.toast('Вы простудились! Нужны таблетки', 'bad'); sfx.fail(); this.bump();
    }
  }

  // ==================== ИГРОК ====================
  private updatePlayer(dt: number) {
    let dx = 0, dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup') || this.keys.has('ц')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown') || this.keys.has('ы')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft') || this.keys.has('ф')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright') || this.keys.has('в')) dx += 1;
    dx += this.joy.x; dy += this.joy.y;
    const mag = Math.hypot(dx, dy);
    this.moving = mag > 0.15;
    if (this.moving) {
      dx /= Math.max(1, mag); dy /= Math.max(1, mag);
      const run = (this.keys.has('shift') || mag > 1.2) && this.state.stats.energy > 1;
let sp = run ? 178 : 112;

// ✅ Ускорение от транспорта
if (this.state.activeVehicle) {
  const def = VEHICLES[this.state.activeVehicle];
  if (def) {
    sp *= def.speedMult;
    // Расход топлива
    if (def.needsFuel) {
      const v = this.state.vehicles.find(v => v.id === this.state.activeVehicle);
      if (v) {
        v.fuel = Math.max(0, v.fuel - 0.002 * def.fuelConsumption);
        if (v.fuel <= 0) {
          this.toast('Топливо закончилось!', 'bad');
          this.exitVehicle();
        }
      }
    }
  }
} else if (this.hasItem('scooter')) {
  sp *= 1.35; // старый самокат
}
      if (this.hasItem('scooter')) sp *= 1.35;
      sp *= 1 + this.equippedTotals().speed / 100; // бонус скорости от экипировки
      if (this.carrying) sp *= 0.55; // с грузом на плечах идти тяжело
      const nx = this.px + dx * sp * dt, ny = this.py + dy * sp * dt;
      if (!this.collides(nx, this.py)) this.px = nx;
      if (!this.collides(this.px, ny)) this.py = ny;
      if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 3 : 2;
      else this.dir = dy > 0 ? 0 : 1;
      // погрузчик разворачивается в сторону движения (горизонтальный флип)
      if (this.forkliftMounted && Math.abs(dx) > 0.15) this.forkliftDir = dx > 0 ? 0 : 1;
      this.anim += dt * (run ? 1.6 : 1);
    }
    // выход из интерьера: наступи на коврик у двери (зона внутри комнаты — достижима)
    if (this.mode.type === 'interior') {
      const int = this.world.interiors[this.mode.id];
      const exo = int.objs.find(o => o.kind === 'exit');
      const ex = exo ? exo.x : Math.floor(int.w / 2) * T + 16;
      if (Math.abs(this.px - ex) < 22 && this.py > (int.h - 1) * T - 26) this.exitInterior();
    }
  }
  private collides(x: number, y: number): boolean {
    const r = 8;
    const solids = this.mode.type === 'interior' ? this.world.interiors[this.mode.id].solids : this.world.solids;
    for (const s of solids) {
      if (x + r > s.x && x - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h) return true;
    }
    if (this.mode.type === 'world') {
      const t = tileAt(this.world, Math.floor(x / T), Math.floor(y / T));
      if (t === 5) return true; // вода
      if (x < 10 || y < 10 || x > MW * T - 10 || y > MH * T - 10) return true;
    } else {
      // границы — по реальным размерам интерьера (завод 24×16, цех 18×13, квартиры 15×11)
      const int = this.world.interiors[this.mode.id];
      if (x < T + 6 || y < T + 6 || x > (int.w - 1) * T - 6 || y > (int.h - 1) * T - 6) return true;
    }
    return false;
  }
  private updateCamera(dt: number) {
    let tx: number, ty: number, cw: number, ch: number;
    if (this.mode.type === 'interior') {
      const int = this.world.interiors[this.mode.id];
      cw = int.w * T; ch = int.h * T;
      const vwz = this.vw / this.zoom, vhz = this.vh / this.zoom;
      tx = cw > vwz ? clamp(this.px - vwz / 2, 0, cw - vwz) : (cw - vwz) / 2;
      ty = ch > vhz ? clamp(this.py - vhz / 2, 0, ch - vhz) : (ch - vhz) / 2;
    } else {
      cw = MW * T; ch = MH * T;
      tx = clamp(this.px - this.vw / this.zoom / 2, 0, cw - this.vw / this.zoom);
      ty = clamp(this.py - this.vh / this.zoom / 2, 0, ch - this.vh / this.zoom);
    }
    const k = 1 - Math.exp(-dt * 6);
    this.camX += (tx - this.camX) * k; this.camY += (ty - this.camY) * k;
  }

  // ==================== NPC / СОБАКИ ====================
  private npcUpdate(dt: number) {
    const night = this.state.time >= 1320 || this.state.time < 360;
    for (const n of this.npcs) {
      if (n.speed <= 0) continue;
      // маршрут патруля по точкам
      if (n.route && n.route.length) {
        const wp = n.route[n.ri ?? 0];
        n.tx = wp.x; n.ty = wp.y;
        if (Math.hypot(wp.x - n.x, wp.y - n.y) < 8) n.ri = ((n.ri ?? 0) + 1) % n.route.length;
      }
      // напарник идёт следом за ведущим
      if (n.follow) {
        const lead = this.npcs.find(l => l.id === n.follow);
        if (lead) { n.tx = lead.x + 24; n.ty = lead.y; }
      }
      let tx = n.tx, ty = n.ty, sp = n.speed;
      if (n.kind === 'tramp' && night && this.mode.type === 'world') {
        const d = Math.hypot(this.px - n.x, this.py - n.y);
        if (d < 170) { tx = this.px; ty = this.py; sp = 46; }
        else if (Math.hypot(n.tx - n.x, n.ty - n.y) < 6) { n.tx = n.hx + rnd(-n.r, n.r); n.ty = n.hy + rnd(-n.r, n.r); }
      } else if (!n.route && !n.follow && Math.hypot(n.tx - n.x, n.ty - n.y) < 6) {
        if (n.kind === 'cop') { n.tx = n.tx > n.hx + 100 ? n.hx - n.r : n.hx + n.r; n.ty = n.hy; }
        else { n.tx = n.hx + rnd(-n.r, n.r); n.ty = clamp(n.hy + rnd(-n.r, n.r), n.hy - 20, n.hy + 20); }
      }
      const ddx = tx - n.x, ddy = ty - n.y, dd = Math.hypot(ddx, ddy);
      if (dd > 2) {
        n.x += (ddx / dd) * sp * dt; n.y += (ddy / dd) * sp * dt;
        n.anim += dt; n.moving = true;
      } else n.moving = false;
    }
  }
  // NPC внутри интерьеров (мастер, рабочие) — бродят рядом с домом
  private intNpcUpdate(dt: number) {
    if (this.mode.type !== 'interior') return;
    const int = this.world.interiors[this.mode.id];
    if (!int?.npcs) return;
    for (const n of int.npcs) {
      if (n.kind === 'foreman') continue; // мастер стоит у стола
      if (Math.hypot(n.tx - n.x, n.ty - n.y) < 6) {
        n.tx = clamp(n.hx + rnd(-n.r, n.r), T * 1.5, (int.w - 1.5) * T);
        n.ty = clamp(n.hy + rnd(-n.r, n.r), T * 1.5, (int.h - 1.5) * T);
      }
      const ddx = n.tx - n.x, ddy = n.ty - n.y, dd = Math.hypot(ddx, ddy);
      if (dd > 2) {
        n.x += (ddx / dd) * n.speed * dt; n.y += (ddy / dd) * n.speed * dt;
        n.anim += dt; n.moving = true;
      } else n.moving = false;
    }
  }
  private dogUpdate(dt: number) {
    if (this.mode.type !== 'world') return;
    for (const d of this.dogs) {
      d.t -= dt;
      const dist = Math.hypot(this.px - d.x, this.py - d.y);
      const nearDump = this.world.objects.some(o => o.kind === 'dump' && !o.searched && Math.hypot(o.x - d.x, o.y - d.y) < 130 && Math.hypot(o.x - this.px, o.y - this.py) < 90);
      if (d.state === 'flee') {
        if (d.t <= 0) d.state = 'idle';
      } else if (nearDump || dist < 60) {
        d.state = 'aggro';
        d.tx = this.px; d.ty = this.py;
        if (Math.random() < dt * 1.5) sfx.bark();
      } else if (d.state === 'idle' && (d.t <= 0 || Math.hypot(d.tx - d.x, d.ty - d.y) < 6)) {
        d.tx = d.x + rnd(-90, 90); d.ty = d.y + rnd(-60, 60); d.t = rnd(2, 5);
      }
      const dd = Math.hypot(d.tx - d.x, d.ty - d.y);
      const sp = d.state === 'aggro' ? 85 : d.state === 'flee' ? 110 : 30;
      if (dd > 3) { d.x += ((d.tx - d.x) / dd) * sp * dt; d.y += ((d.ty - d.y) / dd) * sp * dt; }
      if (d.state === 'aggro' && dist < 22 && this.dogCd <= 0) { this.dogBite(); }
    }
    this.dogCd = Math.max(0, this.dogCd - dt);
  }
  private dogBite() {
    this.dogCd = 6;
    if (this.hasItem('stick')) {
      this.toast('Вы отпугнули собаку палкой!', 'good');
      for (const d of this.dogs) if (Math.hypot(d.x - this.px, d.y - this.py) < 60) { d.state = 'flee'; d.t = 6; d.tx = d.x * 2 - this.px; d.ty = d.y * 2 - this.py; }
      sfx.bark();
      return;
    }
    sfx.bark();
    this.openModal({ kind: 'minigame', game: 'qte', data: { qtype: 'dog', need: 8, time: 3 } });
  }

  private dangers(dt: number) {
    if (this.mode.type !== 'world') return;
    const danger = this.cityNow().danger; // в одних городах опаснее, в других спокойнее
    const night = this.state.time >= 1320 || this.state.time < 360;
    // гопники-бомжи
    if (night) {
      for (const n of this.npcs) {
        if (n.kind !== 'tramp') continue;
        this.trampCd[n.id] = Math.max(0, (this.trampCd[n.id] || 0) - dt);
        if (Math.hypot(n.x - this.px, n.y - this.py) < 24 && (this.trampCd[n.id] || 0) <= 0) {
          this.trampCd[n.id] = 30 / danger;
          sfx.punch();
          this.openModal({ kind: 'mugged' });
          return;
        }
      }
    }
    // полиция — любой из патрульных может проверить документы
    this.copCd = Math.max(0, this.copCd - dt);
    if (this.copCd <= 0) {
      for (const n of this.npcs) {
        if (n.kind !== 'cop') continue;
        if (Math.hypot(n.x - this.px, n.y - this.py) < 64) {
          this.copCd = 25;
          if (Math.random() < 0.45 * danger) this.openModal({ kind: 'police' });
          break;
        }
      }
    }
  }

  // ==================== ПОДСКАЗКИ / ВЗАИМОДЕЙСТВИЕ ====================
  private computePrompt() {
    this.nearObj = null; this.intObj = null; this.prompt = null;
    if (this.mode.type === 'interior') {
      const int = this.world.interiors[this.mode.id];
      let best: InteriorObj | null = null; let bd = 46;
      for (const o of int.objs) {
        if (o.kind === 'trash' && this.trashCleaned.includes(this.trashKey(o))) continue; // убранное не трогать
        const d = Math.hypot(o.x - this.px, o.y - this.py);
        if (d < bd) { bd = d; best = o; }
      }
      this.intObj = best;
      if (best) this.prompt = this.intPrompt(best);
      else if (this.forkliftMounted) this.prompt = 'Выйти из погрузчика [E]';
      return;
    }
    const objs = this.mode.type === 'world' ? this.world.objects : [];
    let best: WObj | null = null, bd = 46;
    for (const o of objs) {
      const d = Math.hypot(o.x - this.px, o.y - this.py);
      if (d < bd) { bd = d; best = o; }
    }
    this.nearObj = best;
    if (best) {
      switch (best.kind) {
        case 'door_shop': {
          const sh = SHOPS.find(s => s.id === best!.data);
          // Особые промпты для Пятёрочки и Стройматериалов с доставкой
          if (best!.data === 'pyaterochka') {
            this.prompt = `${sh?.name ?? 'Магазин'} — посмотреть витрину, Работа курьером`;
          } else if (best!.data === 'stroymarket') {
            this.prompt = `${sh?.name ?? 'Магазин'} — посмотреть витрину, Доставка стройматериалов`;
          } else {
            this.prompt = `${sh?.name ?? 'Магазин'} — посмотреть витрину`;
          }
          break;
        }
        case 'ticket': this.prompt = 'Касса вокзала — билеты в другие города'; break;
        case 'busstop': this.prompt = 'Остановка — междугородний автобус'; break;
        case 'door_factory': this.prompt = 'Войти на завод «Красный Октябрь» [цех]'; break;
        case 'door_workshop': this.prompt = 'Войти в Цех №2 [работа с металлом]'; break;
        case 'police_station': this.prompt = 'Полицейский участок'; break;
        case 'recycle': this.prompt = best.data === 'glass' ? 'Сдать стеклотару' : best.data === 'metal' ? 'Сдать металлолом' : 'Сдать макулатуру'; break;
        case 'dump': this.prompt = best.searched ? 'Мусор уже разобран' : 'Обыскать мусор [мини-игра]'; break;
        case 'trashcan': this.prompt = 'Поворошить мусорный бак'; break;
        case 'theft': this.prompt = 'Чёрный вход цеха — рискованная кража'; break;
        case 'bench': this.prompt = 'Прилечь на лавочке'; break;
        case 'door_shelter': this.prompt = 'Ночлежка — 100 ₽/ночь'; break;
        case 'door_church': this.prompt = 'Церковь: приют и волонтёрство'; break;
        case 'door_soup': this.prompt = 'Столовая: горячая еда'; break;
        case 'door_granny': this.prompt = 'Дом бабушки Зины — комнаты'; break;
        case 'door_realtor': this.prompt = 'Агентство — купить квартиру'; break;
        case 'door_apart': this.prompt = 'Подъезд — войти [этажи, квартиры, соседи]'; break;
        case 'kiosk': this.prompt = 'Киоск «Печать» — газета 20 ₽'; break;
        case 'baraholka': this.prompt = 'Барахолка: продать и купить'; break;
        case 'worker': { const w = WORKERS.find(w => w.id === best!.data); this.prompt = `${w?.name} — предложить работу`; break; }
case 'vehicle': {
  const vid = o.data;
  const def = VEHICLES[vid];
  this.prompt = this.state.activeVehicle === vid 
    ? `Выйти из ${def?.name}` 
    : !this.state.activeVehicle 
      ? `Сесть на ${def?.name}` 
      : 'Сначала выйдите из текущего транспорта';
  break;
}
        default: break;
      }
    }
    // потерянная собака
    if (this.lostDog && Math.hypot(this.lostDog.x - this.px, this.lostDog.y - this.py) < 40) {
      this.prompt = 'Это же собака из объявления!';
      this.nearObj = { id: 'lostdog', kind: 'bench', x: this.lostDog.x, y: this.lostDog.y };
    }
  }

  private curJob(): OneTimeJobDef | null {
    const fj = this.state.factoryJob;
    return fj ? ONETIME_JOBS.find(j => j.id === fj.id) ?? null : null;
  }
  private needCount(job: OneTimeJobDef): number { return job.count ?? clamp(Math.round(job.pay / 25), 3, 10); }
  /** Точки маршрута текущего задания: откуда брать (from) и куда нести (to) — для стрелок на карте. */
  private computeJobRoute(objs: InteriorObj[]): { from: { x: number; y: number; label: string }; to: { x: number; y: number; label: string } | null } | null {
    const job = this.curJob();
    if (!job) return null;
    if (job.kind === 'cut') {
      const m = objs.find(o => o.kind === 'machine');
      return m ? { from: { x: m.x, y: m.y, label: 'ВЫТОЧИ ЗДЕСЬ' }, to: null } : null;
    }
    if (job.kind === 'trash') {
      const tr = objs.find(o => o.kind === 'trash' && !this.trashCleaned.includes(this.trashKey(o)));
      return tr ? { from: { x: tr.x, y: tr.y, label: 'УБЕРИ МУСОР' }, to: null } : null;
    }
    // carry
    const src = objs.find(o =>
      (job.carry === 'pallet' ? o.kind === 'pallet' : (o.kind === 'metalpile' && o.data === job.carry)));
    const dst = objs.find(o => o.kind === job.drop);
    if (!src) return null;
    return {
      from: { x: src.x, y: src.y, label: this.carrying ? '' : 'БЕРИ ЗДЕСЬ' },
      to: dst ? { x: dst.x, y: dst.y, label: job.drop === 'truck' ? 'НЕСИ В КУЗОВ' : 'НЕСИ НА СКЛАД' } : null,
    };
  }
  // подсказка для объекта интерьера
  private intPrompt(o: InteriorObj): string {
    const job = this.curJob();
    const cn = (t: string) => CARRY_NAME[t as CarryType] ?? t;
    switch (o.kind) {
      case 'exit': return 'Выйти наружу [E]';
      case 'counter': return 'Подойти к прилавку — открыть магазин';
      case 'bed': case 'bunk': return 'Лечь спать';
      case 'shower': return 'Принять душ (10 ₽)';
      case 'bath': return 'Принять ванну (+40 гигиены, +8 настроения)';
      case 'desk': return 'Поговорить с мастером — взять работу [E]';
      case 'machine':
        if (job?.kind === 'cut') return 'Вытачивать деталь — мини-игра [E]';
        return 'Станок гудит. Работа — у мастера за столом';
      case 'metalpile': case 'pallet': {
        const t = o.kind === 'pallet' ? 'pallet' : (o.data as string);
        if (!job) return 'Сначала возьмите работу у мастера';
        if (this.carrying) return 'Руки заняты — отнесите груз';
        if (job.kind === 'carry' && job.carry === t) {
          if (t === 'pallet' && !this.forkliftMounted) return 'Нужен погрузчик — сядьте в него [E]';
          return `Взять ${cn(t)} [E]`;
        }
        return `Не для задания «${job.name}»`;
      }
      case 'warehouse':
        if (this.carrying && job?.kind === 'carry' && job.drop === 'warehouse' && job.carry === this.carrying) return `Сдать ${cn(this.carrying)} на склад [E]`;
        return this.carrying ? 'Сюда это не несут' : 'Склад готовой продукции';
      case 'truck':
        if (this.carrying && job?.kind === 'carry' && job.drop === 'truck' && job.carry === this.carrying) return `Загрузить ${cn(this.carrying)} в кузов [E]`;
        return this.carrying ? 'Не в этот кузов' : 'Грузовик ждёт погрузки';
      case 'ramp': return 'Пандус — по нему заезжают в кузов грузовика';
      case 'trash': {
        const key = this.trashKey(o);
        if (this.trashCleaned.includes(key)) return 'Здесь уже чисто';
        return job?.kind === 'trash' ? 'Убрать мусор [E]' : 'Подобрать мусор (+5 ₽)';
      }
      case 'forklift': return this.forkliftMounted ? 'Выйти из погрузчика [E]' : 'Сесть в погрузчик [E]';
      case 'kitchen': return 'Управление квартирой: техника, уборка, аренда [E]';
      case 'sofa': return 'Отдохнуть на диване (выносливость +10) [E]';
      case 'stove': return 'Приготовить еду (голод +30) [E]';
      case 'fridge': return 'Открыть холодильник [E]';
      case 'washer': return 'Постирать одежду (гигиена +20) [E]';
      case 'tv': return 'Смотреть ТВ (настроение +15) [E]';
case 'vehicle': {
  const vid = o.data;
  if (this.state.activeVehicle === vid) {
    this.exitVehicle();
  } else if (!this.state.activeVehicle) {
    this.enterVehicle(vid);
  } else {
    this.toast('Сначала выйдите из текущего транспорта', 'info');
  }
  break;
}
      case 'toilet': return 'Воспользоваться туалетом [E]';
      default: return 'Осмотреть';
    }
  }
  private trashKey(o: InteriorObj): string {
    const id = this.mode.type === 'interior' ? this.mode.id : '';
    return `${id}_${o.data ?? o.x}_${o.y}`;
  }
  // взаимодействие с объектом интерьера
  private intInteract(o: InteriorObj) {
    sfx.click();
    const intId = this.mode.type === 'interior' ? this.mode.id : '';
    switch (o.kind) {
      case 'exit': this.exitInterior(); return;
      case 'counter': this.openModal({ kind: 'shop', id: o.data ?? 'pyaterochka' }); return;
      case 'bed': this.sleepInBed(); return;
      case 'bunk': this.openModal({ kind: 'sleep' }); return;
      case 'shower': this.shower(); return;
      case 'bath': this.takeBath(); return;
      case 'desk': this.openModal({ kind: 'factory', id: intId === 'i_workshop' ? 'workshop' : 'factory' }); return;
      case 'machine': this.useMachine(); return;
      case 'metalpile': this.pickCargo(o.data as CarryType); return;
      case 'pallet': this.pickCargo('pallet'); return;
      case 'warehouse': case 'truck': this.dropCargo(o.kind); return;
      case 'trash': this.cleanTrash(o); return;
      case 'forklift': this.toggleForklift(); return;
      case 'ramp': this.toast('По пандусу заезжают в кузов — возьмите балки и несите к грузовику', 'info'); return;
      // бытовая техника квартиры
      case 'stove': this.useStove(); return;
      case 'fridge': this.openFridge(); return;
      case 'washer': this.useWasher(); return;
      case 'tv': this.watchTv(); return;
      case 'toilet': this.useToilet(); return;
      case 'sofa': this.restOnSofa(); return;
      // квартира/комната: управление жильём; в прочих интерьерах — ничего
      case 'kitchen':
        if (this.isHomeInterior(intId)) this.openModal({ kind: 'apartment' });
        return;
      default: return;
    }
  }
  private restOnSofa() {
    const s = this.state;
    this.applyFx({ mood: 5 });
    s.stats.energy = clamp(s.stats.energy + 10, 0, 100);
    s.time = clamp(s.time + 30, 0, 1439);
    sfx.quest();
    this.toast('Отдохнули на диване: выносливость +10', 'good');
    this.bump();
  }
  private gameNow(): number { return this.state.day * 1440 + this.state.time; }
  /** Сколько минут осталось до повторного доступа к халтуре (0 — доступна). */
  factoryCooldownLeft(id: string): number {
    const last = this.state.factoryCooldowns[id];
    if (last === undefined) return 0;
    return Math.max(0, last + 240 - this.gameNow()); // 240 мин = 4 игровых часа
  }
  // взять работу у мастера — выполняем её физически в цеху
  startPhysicalJob(id: string) {
    const job = ONETIME_JOBS.find(j => j.id === id);
    if (!job) return;
    const s = this.state;
    const cd = this.factoryCooldownLeft(id);
    if (cd > 0) {
      const h = Math.floor(cd / 60), m = Math.round(cd % 60);
      this.toast(`Мастер: «Эту работу уже сдали. Новая смена через ${h} ч ${m} мин»`, 'info');
      sfx.fail();
      return;
    }
    if (s.stats.energy < job.energy) { this.toast('Слишком устал для этой работы', 'bad'); sfx.fail(); return; }
    s.factoryJob = { id, progress: 0 };
    this.carrying = null;
    this.closeModal();
    sfx.quest();
    if (job.kind === 'cut') this.toast('Идите к станку (жёлтая надпись) и жмите E', 'info');
    else if (job.kind === 'trash') this.toast(`Уберите ${this.needCount(job)} куч мусора (коричневые) по цеху`, 'info');
    else this.toast(`Маршрут: ${PILE_NAME[job.carry!]} → ${DROP_NAME[job.drop!]} · ${this.needCount(job)} шт.`, 'info');
  }
  private useMachine() {
    const job = this.curJob();
    if (!job || job.kind !== 'cut') { this.toast('Мастер не давал вам работу за станком', 'info'); return; }
    this.openModal({ kind: 'minigame', game: 'cut', data: { jobId: job.id, sheets: this.needCount(job) } });
  }
  private pickCargo(type: CarryType) {
    const fj = this.state.factoryJob;
    const job = this.curJob();
    if (!fj || !job) { this.toast('Сначала возьмите работу у мастера', 'info'); return; }
    if (this.carrying) { this.toast('Руки уже заняты грузом', 'info'); return; }
    if (job.kind !== 'carry' || job.carry !== type) { this.toast(`Для задания «${job.name}» нужно другое`, 'info'); sfx.fail(); return; }
    if (type === 'pallet' && !this.forkliftMounted) { this.toast('Поддоны возят погрузчиком — сядьте в него', 'info'); sfx.fail(); return; }
    this.carrying = type;
    sfx.pickup();
    this.toast(type === 'pallet' ? 'Поддон на вилах — везите на склад №2' : 'Груз на плечах — идите медленнее. Несите к цели', 'info');
  }
  private dropCargo(where: 'warehouse' | 'truck') {
    const fj = this.state.factoryJob;
    const job = this.curJob();
    if (!fj || !job || !this.carrying) { this.toast('У вас нет груза', 'info'); return; }
    if (job.kind !== 'carry' || job.carry !== this.carrying || job.drop !== where) {
      this.toast(job.drop === 'truck' ? 'Это несут в кузов грузовика!' : 'Это несут на склад!', 'info');
      return;
    }
    // поддон сдан, но игрок ОСТАЁТСЯ в погрузчике — выход только по E
    this.carrying = null;
    sfx.coin();
    this.float(this.px, this.py - 40, '+1', '#5ee06e');
    fj.progress++;
    const need = this.needCount(job);
    if (fj.progress >= need) {
      this.state.factoryJob = null;
      if (!this.state.docs.workPermit) {
        this.state.docs.workPermit = true;
        this.toast('Мастер выдал разрешение на работу!', 'good');
      }
      this.finishOneTimeJob(fj.id);
    } else {
      this.toast(`Сдано ${fj.progress}/${need}`, 'info');
    }
    this.bump();
  }
  private cleanTrash(o: InteriorObj) {
    const key = this.trashKey(o);
    if (this.trashCleaned.includes(key)) return;
    this.trashCleaned.push(key);
    const job = this.curJob();
    const fj = this.state.factoryJob;
    sfx.pickup();
    this.float(o.x, o.y - 20, 'убрано', '#8ee06e');
    if (job?.kind === 'trash' && fj) {
      fj.progress++;
      const need = this.needCount(job);
      if (fj.progress >= need) {
        this.state.factoryJob = null;
        this.finishOneTimeJob(job.id);
      } else this.toast(`Убрано ${fj.progress}/${need} куч`, 'info');
    } else {
      this.gainMoney(5);
      this.state.stats.energy = clamp(this.state.stats.energy - 3, 0, 100);
      this.toast('Подобрали мусор +5 ₽', 'money');
    }
    this.bump();
  }
  private toggleForklift() {
    this.forkliftMounted = !this.forkliftMounted;
    sfx.click();
    this.toast(this.forkliftMounted ? 'Вы в погрузчике. Поддоны теперь вам по силам' : 'Вы вышли из погрузчика', 'info');
    if (!this.forkliftMounted && this.carrying === 'pallet') {
      this.carrying = null;
      this.toast('Поддон остался на вилах', 'info');
    }
    this.bump();
  }
  private takeBath() {
    const s = this.state;
    if (this.isApplianceBroken('bath')) { this.toast('Ванна сломана — нужен ремонт', 'bad'); this.openModal({ kind: 'apartment' }); return; }
    this.applyFx({ hygiene: 40, mood: 8 });
    s.time = clamp(s.time + 25, 0, 1439);
    this.wearAppliance('bath');
    sfx.quest();
    this.toast('Тёплая ванна... Как заново родился', 'good');
    this.bump();
s.bathCount = (s.bathCount || 0) + 1;
this.updateAchievement('apartment_bath_20', s.bathCount);
  }
  // сломанная техника текущей квартиры (для значка !)
  private brokenApplianceIds(): string[] {
    const s = this.state;
    if (this.mode.type !== 'interior') return [];
    const apt = s.apts[0];
    if (!apt) return [];
    return Object.entries(apt.appliances).filter(([, a]) => a.broken).map(([id]) => id);
  }
  // --- бытовая техника в квартире ---
  private useStove() {
    const s = this.state;
    if (this.isApplianceBroken('stove')) { this.toast('Плита сломана — нужен ремонт', 'bad'); this.openModal({ kind: 'apartment' }); return; }
    if (s.stats.hunger > 85) { this.toast('Вы и так сыты', 'info'); return; }
    this.applyFx({ hunger: 30, mood: 4 });
    s.time = clamp(s.time + 30, 0, 1439);
    this.wearAppliance('stove');
    sfx.quest();
    this.toast('Приготовили еду: голод +30', 'good');
    this.bump();
s.cookCount = (s.cookCount || 0) + 1;
this.updateAchievement('apartment_cook_15', s.cookCount);
  }
  private openFridge() {
    if (this.isApplianceBroken('fridge')) { this.toast('Холодильник сломан — продукты портятся!', 'bad'); this.openModal({ kind: 'apartment' }); return; }
    this.applyFx({ mood: 2 });
    sfx.click();
    this.toast('В холодильнике свежо и пусто. Загляните в «Пятёрочку»', 'info');
    this.bump();
  }
  private watchTv() {
    const s = this.state;
    if (this.isApplianceBroken('tv')) { this.toast('Телевизор сломан — один снег на экране', 'bad'); this.openModal({ kind: 'apartment' }); return; }
    this.applyFx({ mood: 15 });
    s.stats.fatigue = clamp(s.stats.fatigue + 5, 0, 100);
    s.time = clamp(s.time + 120, 0, 1439);
    this.wearAppliance('tv');
    sfx.quest();
    this.toast('Посмотрели ТВ: настроение +15 (2 часа)', 'good');
    this.bump();
  }
  private useWasher() {
    const s = this.state;
    if (this.isApplianceBroken('washer')) { this.toast('Стиралка сломана — нужен ремонт', 'bad'); this.openModal({ kind: 'apartment' }); return; }
    this.applyFx({ hygiene: 20 });
    s.time = clamp(s.time + 60, 0, 1439);
    this.wearAppliance('washer');
    sfx.quest();
    this.toast('Одежда постирана: гигиена +20', 'good');
    this.bump();
  }
  private useToilet() {
    const s = this.state;
    if (this.isApplianceBroken('toilet')) { this.toast('Унитаз сломан — нужен ремонт', 'bad'); this.openModal({ kind: 'apartment' }); return; }
    this.applyFx({ mood: 4 });
    s.time = clamp(s.time + 10, 0, 1439);
    this.wearAppliance('toilet');
    sfx.click();
    this.toast('Воспользовались туалетом', 'info');
    this.bump();
  }
  private isApplianceBroken(id: string): boolean {
    const apt = this.state.apts[0];
    return !!(apt && apt.appliances[id]?.broken);
  }
  // износ техники от использования
  private wearAppliance(id: string) {
    const apt = this.state.apts[0];
    if (!apt) return;
    const ap = apt.appliances[id];
    if (!ap || ap.broken) return;
    const def = APPLIANCES.find(a => a.id === id);
    ap.dur = clamp(ap.dur - (def?.wear ?? 2), 0, 100);
    if (ap.dur <= 0) {
      ap.broken = true;
      sfx.fail();
      this.toast(`${def?.name ?? 'Техника'} сломалась! Нужен ремонт`, 'bad');
    }
    this.bump();
  }
  // --- бесплатная квартира ---
  moveInFreeApt() {
    const s = this.state;
    if (s.ownedApts.length || s.freeApt) { this.toast('Жильё уже есть', 'info'); return; }
    s.freeApt = { daysLeft: FREE_APT.freeDays };
    s.housing = 'freeapt';
    this.closeModal();
    this.enterInterior('i_apt_studio'); // бесплатная квартира — студия
    sfx.win();
    this.toast(`Вы заселились в кв. ${FREE_APT.number}! Бесплатно ${FREE_APT.freeDays} дней`, 'good');
    this.bump();
  }

  interact() {
    if (this.modal) return;
    if (this.mode.type === 'interior') {
      if (this.intObj) { this.intInteract(this.intObj); }
      else if (this.forkliftMounted) { this.toggleForklift(); } // E — выйти из погрузчика
      return;
    }
    const o = this.nearObj;
    if (!o) return;
    sfx.click();
    if (o.id === 'lostdog') {
      this.lostDog = null;
      this.questProgress('dog', 1);
      this.gainMoney(0);
      this.toast('Вы вернули собаку хозяевам!', 'good');
      return;
    }
    switch (o.kind) {
      case 'door_shop': {
        // Особая логика для Пятёрочки и Стройматериалов с доставкой
        if (o.data === 'pyaterochka') {
          // Меню выбора: магазин или работа курьером
          this.openDeliveryMenu('pyaterochka');
        } else if (o.data === 'stroymarket') {
          // Меню выбора: магазин или доставка стройматериалов
          this.openHighwayMenu();
        } else {
          this.openModal({ kind: 'shop', id: o.data ?? 'pyaterochka' });
        }
        break;
      }
      case 'ticket': this.openModal({ kind: 'citymap' }); break;
      case 'busstop': this.openModal({ kind: 'citymap' }); break;
      case 'door_factory': this.enterInterior('i_factory', o); break; // отдельная сцена — цех завода
      case 'police_station': this.toast('Участок полиции. Сюда привозят нарушителей без документов', 'info'); break;
      case 'recycle': this.openModal({ kind: 'recycle', kindId: o.data as 'glass' | 'metal' | 'paper' }); break;
      case 'dump': this.searchDump(o); break;
      case 'trashcan': this.searchTrashCan(o); break;
      case 'theft': this.openModal({ kind: 'theft' }); break;
      case 'bench': this.openModal({ kind: 'sleep' }); break;
      case 'door_shelter': this.openModal({ kind: 'sleep' }); break;
      case 'door_church': this.openModal({ kind: 'charity', id: 'church' }); break;
      case 'door_soup': this.openModal({ kind: 'charity', id: 'soup' }); break;
      case 'door_granny': this.openModal({ kind: 'room' }); break;
      case 'door_realtor': this.openModal({ kind: 'realtor' }); break;
      case 'door_apart':
        this.entranceDoor = o;
        this.openModal({ kind: 'entrance', id: o.data ?? '0' });
        break;
      case 'kiosk': this.buyNewspaper(); break;
      case 'baraholka': this.openModal({ kind: 'baraholka' }); break;
      case 'worker': this.openModal({ kind: 'workers' }); break;
case 'vehicle': {
  // Транспорт игрока
  const vid = o.data;
  if (this.state.activeVehicle === vid) {
    this.exitVehicle();
  } else if (!this.state.activeVehicle) {
    this.enterVehicle(vid);
  } else {
    this.toast('Сначала выйдите из текущего транспорта', 'info');
  }
  break;
}
      default: break;
    }
  }

  private lastDoor: { x: number; y: number } | null = null;
  private enterInterior(id: string, door?: WObj) {
    const int = this.world.interiors[id];
    if (!int) return;
    if (door) this.lastDoor = { x: door.x, y: door.y };
    this.mode = { type: 'interior', id };
    // точка появления: своя у каждого интерьера, иначе у нижней двери
    if (int.spawn) { this.px = int.spawn.x; this.py = int.spawn.y; }
    else { this.px = 7 * T + 16; this.py = (int.h - 3) * T; }
    // страховка: если оказались внутри солида — выталкиваем на свободное место
    for (let i = 0; i < 60 && this.collides(this.px, this.py); i++) this.py += 6;
    sfx.door();
  }
  private exitInterior() {
    this.mode = { type: 'world' };
    if (this.carrying) { this.carrying = null; this.toast('Груз остался в цеху', 'info'); }
    // погрузчик возвращается на своё место только при выходе из цеха
    if (this.forkliftMounted) { this.forkliftMounted = false; this.toast('Погрузчик вернулся на место', 'info'); }
    
    // ИСПРАВЛЕНИЕ: При выходе из квартиры/дома игрок появляется у подъезда (exitPoint), а не в центре города
    // Если это интерьер квартиры и есть lastDoor (дверь подъезда), используем exitPoint здания
    if (this.isHomeInterior(this.mode.id) && this.entranceDoor) {
      // Находим здание по координатам двери подъезда
      const doorTileX = Math.round(this.entranceDoor.x / T);
      const doorTileY = Math.round(this.entranceDoor.y / T);
      const building = this.world.buildings.find(b => 
        b.kind === 'apart' && 
        Math.abs(b.x - doorTileX) < 1 && 
        Math.abs(b.y - doorTileY) < 1
      );
      if (building && building.exitPoint) {
        this.px = building.exitPoint.x;
        this.py = building.exitPoint.y;
        sfx.door();
        return;
      }
    }
    
    // Для других зданий (завод, цех, приют) или если нет exitPoint — используем старую логику
    if (this.lastDoor) { this.px = this.lastDoor.x; this.py = this.lastDoor.y + 26; }
    else { this.px = 51 * T; this.py = 38.6 * T; }
    sfx.door();
  }

  // ==================== ЭКОНОМИКА ====================
  hasItem(id: string): boolean { return this.state.inv.some(i => i.id === id && i.qty > 0); }
  countItem(id: string): number { return this.state.inv.filter(i => i.id === id).reduce((a, b) => a + b.qty, 0); }
  /** Поместится ли qty штук предмета в рюкзак (с учётом стаков). */
  hasSpace(id: string, qty: number): boolean {
    const def = ITEMS[id];
    if (!def) return false;
    let left = qty;
    for (const sl of this.state.inv) {
      if (left <= 0) break;
      if (sl.id === id && sl.qty < def.stack) left -= Math.min(def.stack - sl.qty, left);
    }
    if (left <= 0) return true;
    const cap = BACKPACKS[this.state.backpack].slots;
    const freeSlots = Math.max(0, cap - this.state.inv.length);
    return freeSlots * def.stack >= left;
  }
  addItem(id: string, qty: number): number {
    const def = ITEMS[id];
    if (!def) return 0;
    let left = qty;
    for (const sl of this.state.inv) {
      if (left <= 0) break;
      if (sl.id === id && sl.qty < def.stack) {
        const take = Math.min(def.stack - sl.qty, left);
        sl.qty += take; left -= take;
      }
    }
    const cap = BACKPACKS[this.state.backpack].slots;
    while (left > 0 && this.state.inv.length < cap) {
      const take = Math.min(def.stack, left);
      this.state.inv.push({ id, qty: take }); left -= take;
    }
    if (left > 0) this.toast('Рюкзак полон!', 'bad');
    if (left < qty) this.bump();
    return qty - left;
  }
  removeItem(id: string, qty: number): number {
    let left = qty;
    this.state.inv = this.state.inv.filter(sl => {
      if (sl.id !== id || left <= 0) return true;
      const take = Math.min(sl.qty, left);
      sl.qty -= take; left -= take;
      return sl.qty > 0;
    });
    this.bump();
    return qty - left;
  }
  gainMoney(n: number) {
    if (n === 0) return;
    this.state.money = Math.max(0, this.state.money + n);
    this.float(this.px, this.py - 34, (n > 0 ? '+' : '') + fmt(n) + ' ₽', n > 0 ? '#8ee06e' : '#ff5a5a');
    if (n > 0) sfx.coin();
    if (n >= 100) this.bump();
  }
  spend(n: number): boolean {
    if (this.state.money < n) { this.toast('Не хватает денег', 'bad'); sfx.fail(); return false; }
    this.state.money -= n;
    this.float(this.px, this.py - 34, '−' + fmt(n) + ' ₽', '#ff5a5a');
    this.bump();
    return true;
  }
  damage(n: number, silent = false) {
    const st = this.state.stats;
    st.hp = clamp(st.hp - n, 0, 100);
    if (!silent && n >= 1) { this.flash = 1; this.shake = 1; sfx.hurt(); this.float(this.px, this.py - 40, '−' + Math.round(n) + ' HP', '#ff5a5a'); }
    this.bump();
  }
  heal(n: number) { this.state.stats.hp = clamp(this.state.stats.hp + n, 0, 100); this.bump(); }
  applyFx(fx: Partial<Stats>) {
    const st = this.state.stats;
    for (const k of Object.keys(fx) as (keyof Stats)[]) st[k] = clamp(st[k] + (fx[k] ?? 0), 0, 100);
    this.bump();
  }
  useItem(idx: number) {
    const sl = this.state.inv[idx];
    if (!sl) return;
    const def = ITEMS[sl.id];
    if (!def) return;
    if (def.cat === 'food' || def.cat === 'med') {
      sl.qty--;
      if (sl.qty <= 0) this.state.inv.splice(idx, 1);
      this.applyFx(def.fx ?? {});
      if (def.id === 'spoiled' && Math.random() < 0.45) {
        this.state.ill = 'poison';
        this.toast('Отравление! Срочно нужны таблетки', 'bad');
      }
      if (def.id === 'pills' && this.state.ill) { this.state.ill = ''; this.toast('Вы вылечились', 'good'); }
      if (def.fx?.hp && def.fx.hp < 0) this.flash = .5;
      sfx.eat();
      this.float(this.px, this.py - 34, def.name, '#8ee06e');
      this.bump();
    } else if (def.cat === 'cloth') {
      this.equipItem(idx);
    } else if (def.id === 'player') {
      this.openModal({ kind: 'music' });
    } else if (def.id === 'heater') {
      this.applyFx({ mood: 10 });
      if (Math.random() < 0.15) { this.damage(10); this.toast('Обогреватель полыхнул! Опасно...', 'bad'); }
      else this.toast('Тепло... Хорошо...', 'good');
    } else {
      this.toast(`${def.name}: ${def.desc}`, 'info');
    }
  }
  dropItem(idx: number) {
    const sl = this.state.inv[idx];
    if (!sl) return;
    const def = ITEMS[sl.id];
    sl.qty--;
    if (sl.qty <= 0) this.state.inv.splice(idx, 1);
    this.toast(`Выброшено: ${def?.name ?? 'предмет'}`, 'info');
    sfx.click();
    this.bump();
  }

  // --- экипировка ---
  equipItem(idx: number) {
    const s = this.state;
    const sl = s.inv[idx];
    if (!sl) return;
    const def = ITEMS[sl.id];
    if (!def?.slot) { this.toast('Это нельзя надеть', 'info'); return; }
    const slotKey = def.slot;
    const prev = s.equipped[slotKey];
    // старая вещь из ячейки возвращается в этот же слот рюкзака
    s.equipped[slotKey] = def.id;
    sl.id = prev ?? sl.id;
    if (!prev) {
      sl.qty -= 1;
      if (sl.qty <= 0) s.inv.splice(idx, 1); // вещь УХОДИТ из рюкзака в слот экипировки
    }
    if (def.fx) this.applyFx(def.fx);
    if (def.stylish) s.rep.people = clamp(s.rep.people + def.stylish * 2, 0, 100);
    this.toast(`Надето: ${def.name}`, 'good');
    sfx.buy();
    this.bump();
  }
  unequip(slot: EquipSlot) {
    const s = this.state;
    const id = s.equipped[slot];
    if (!id) return;
    if (s.inv.length >= BACKPACKS[s.backpack].slots) { this.toast('В рюкзаке нет места', 'bad'); sfx.fail(); return; }
    s.equipped[slot] = null;
    this.addItem(id, 1);
    this.toast(`Снято: ${ITEMS[id].name}`, 'info');
    sfx.click();
    this.bump();
  }
  equippedWarmth(): number {
    const eq = this.state.equipped;
    return (['torso', 'legs', 'feet', 'head'] as EquipSlot[]).filter(k => eq[k] && ITEMS[eq[k]!]?.warm).length;
  }
  equippedStyle(): number {
    const eq = this.state.equipped;
    return (['torso', 'legs', 'feet', 'head'] as EquipSlot[]).reduce((a, k) => a + (eq[k] ? (ITEMS[eq[k]!]?.stylish ?? 0) : 0), 0);
  }
  equippedTotals(): { warmth: number; speed: number; rep: number; protect: number; comfort: number } {
    const eq = this.state.equipped;
    const t = { warmth: 0, speed: 0, rep: 0, protect: 0, comfort: 0 };
    for (const k of ['torso', 'legs', 'feet', 'head'] as EquipSlot[]) {
      const id = eq[k]; if (!id) continue;
      const d = ITEMS[id]; if (!d) continue;
      t.warmth += d.warmth ?? 0; t.speed += d.speed ?? 0; t.rep += d.rep ?? 0;
      t.protect += d.protect ?? 0; t.comfort += d.comfort ?? 0;
    }
    return t;
  }

  // ==================== ВРЕМЯ / ДЕНЬ ====================
  private rollWeather() {
    const opts: Weather[] = ['sun', 'sun', 'sun', 'rain', 'snow', 'heat'];
    const w = pick(opts);
    if (w !== this.state.weather) {
      this.state.weather = w;
      const names: Record<Weather, string> = { sun: 'Ясно', rain: 'Дождь — ищите крышу!', snow: 'Снег — без тёплой одежды опасно!', heat: 'Жара — берегите силы' };
      this.toast('Погода: ' + names[w], 'info');
      this.bump();
    }
  }
  private spawnWeatherParticles(dt: number) {
    // под крышей (и в любом интерьере — завод, квартира) осадков нет
    if (this.roofed() || this.modal || this.mode.type === 'interior') return;
    const w = this.state.weather;
    const rate = w === 'rain' ? 220 : w === 'snow' ? 60 : 0;
    const n = Math.floor(rate * dt + (Math.random() < (rate * dt) % 1 ? 1 : 0));
    for (let i = 0; i < n && this.particles.length < 320; i++) {
      if (w === 'rain') this.particles.push({ x: rnd(0, this.vw), y: -10, vx: -60, vy: 520, t: 0, kind: 'rain' });
      else this.particles.push({ x: rnd(0, this.vw), y: -10, vx: rnd(-20, 20), vy: rnd(40, 70), t: 0, kind: 'snow' });
    }
    if (this.moving && Math.random() < dt * 8)
      this.particles.push({ x: this.vw / 2 + rnd(-8, 8), y: this.vh / 2 + rnd(6, 14), vx: rnd(-10, 10), vy: rnd(-14, -4), t: .6, kind: 'dust' });
  }
  private onNewDay(first: boolean) {
    const s = this.state;
    s.flags = {};
    for (const o of this.world.objects) if (o.kind === 'dump') o.searched = false;
    this.trashCleaned = []; // мусор на заводе накапливается заново
    s.backpackAge++;
    if (s.backpack === 0 && s.backpackAge > 3) {
      s.backpackAge = 0;
      this.toast('Пакет «Пятёрочка» порвался. Держите новый', 'info');
this.updateAchievement('survive_7days', 1);
this.updateAchievement('capital_10k', s.money);
this.updateAchievement('capital_1m', s.money);
    }
    this.payUtilities(); // коммунальные платежи за квартиры
    this.trashCleaned = []; // мусор в цехах появляется заново каждое утро
    // бесплатная квартира: льготный период тает, потом — аренда или выселение
    if (s.freeApt) {
      s.freeApt.daysLeft--;
      if (s.freeApt.daysLeft <= 0) {
        if (this.spend(FREE_APT.rentAfter)) {
          s.freeApt = { daysLeft: 1 };
          this.toast(`Льготный период кончился: списано ${FREE_APT.rentAfter} ₽ за аренду`, 'info');
        } else {
          s.freeApt = null;
          s.housing = 'street';
          this.toast('Не смогли оплатить аренду — вас выселили из бесплатной квартиры', 'bad');
        }
      }
    }
    // ежедневные задания
    const pool = [...QUESTS].sort(() => Math.random() - .5).slice(0, 3);
    s.quests = pool.map(def => ({ def, progress: 0, claimed: false }));
    s.counters = {};
    // акции
    s.sales = {};
    for (const sh of SHOPS) {
      if (Math.random() < 0.45) s.sales[sh.id] = { idx: ri(0, sh.goods.length - 1), pct: pick([20, 30, 40, 50]) };
    }
    // газета
    this.genNews();
    // техника и грязь
    for (const a of s.apts) {
      a.dirt = clamp(a.dirt + 2 + (a.rented ? 8 : 0), 0, 100);
      for (const ap of APPLIANCES) {
        const stt = a.appliances[ap.id];
        if (stt && !stt.broken) {
          stt.dur -= ap.wear * (ap.id === 'washer' ? (s.stats.hygiene > 70 ? 2 : 1) : 1);
          if (stt.dur <= 0) { stt.broken = true; this.toast(`Сломалось: ${ap.name} (${APARTMENTS.find(x => x.id === a.id)?.name})`, 'bad'); sfx.fail(); }
        }
      }
      if (a.dirt > 60) { this.state.stats.mood = clamp(this.state.stats.mood - 10, 0, 100); this.toast('В квартире грязно! Нужна уборка', 'bad'); }
    }
    // работники
    for (const w of s.workers) {
      if (!w.hired) continue;
      w.fed = false;
      if (w.sick && Math.random() < 0.5) { w.sick = false; this.toast(`${WORKERS.find(x => x.id === w.id)?.name} снова в строю`, 'good'); }
      else if (!w.sick && Math.random() < 0.12) { w.sick = true; this.toast(`SMS: «Босс, я заболел...» (${WORKERS.find(x => x.id === w.id)?.name})`, 'bad'); }
    }
    if (!first) {
      s.stats.fatigue = clamp(s.stats.fatigue + 8, 0, 100);
      s.stats.hunger = clamp(s.stats.hunger - 25, 0, 100);
      this.saveGame();
      this.toast(`День ${s.day}`, 'info');
    }
    this.refreshLostDog();
    this.bump();
  }
  private noonIncome() {
    const s = this.state;
    let total = 0;
    let hired = 0;
    for (const w of s.workers) {
      if (!w.hired) continue;
      hired++;
      const def = WORKERS.find(x => x.id === w.id)!;
      if (w.sick) continue;
      let inc = def.income;
      if (!w.fed) inc = Math.floor(inc * 0.5);
      total += inc - def.wage;
    }
    if (hired) this.toast(hired > 0 ? `Работники: ${total >= 0 ? '+' : ''}${fmt(total)} ₽ за день` : '', total >= 0 ? 'money' : 'bad');
    for (const inv of s.investments) {
      const d = INVESTMENTS.find(x => x.id === inv);
      if (d) total += d.income;
    }
    if (s.investments.length) this.toast(`Инвестиции: +${fmt(INVESTMENTS.filter(d => s.investments.includes(d.id)).reduce((a, b) => a + b.income, 0))} ₽`, 'money');
    this.factoryDailyPay();
    s.docs.passport = this.hasItem('passport');
    for (const a of s.apts) if (a.rented) {
      const d = APARTMENTS.find(x => x.id === a.id)!;
      total += d.income;
      this.toast(`Аренда (${d.name}): +${fmt(d.income)} ₽`, 'money');
    }
    if (this.hasItem('laptop')) { total += 400; this.toast('Онлайн-подработка: +400 ₽', 'money'); }
    if (total !== 0) this.gainMoney(total);
  }
  private genNews() {
    const jobs: NewsJob[] = [
      { id: 'unload', title: 'Разгрузка вагона', desc: 'Вокзал. Тяжело, но платят сразу.', pay: 300, energy: 35 },
      { id: 'flyers', title: 'Раздача листовок', desc: 'Центр, 2 часа на ногах.', pay: 200, energy: 25 },
      { id: 'courier', title: 'Срочная доставка', desc: 'Разнести посылки по району. Платят отлично.', pay: 500, energy: 30, phone: true },
      { id: 'cleaner', title: 'Уборка двора', desc: 'Спальный район. Метла ваша.', pay: 250, energy: 30 },
    ];
    const salePool: [string, number][] = [['kolbasa', 100], ['wjacket', 280], ['bandage', 40], ['energetik', 45], ['tools', 550]];
    const saleItems = pick(salePool);
    this.state.news = {
      jobs: jobs.sort(() => Math.random() - .5).slice(0, 3),
      sales: [{ item: saleItems[0], price: saleItems[1] }],
      missing: [
        pick(['Пропала собака, порода дворняжка, кличка Шарик. Парк, юг. Награда 500 ₽.',
          'Утерян кошелёк у вокзала. Верните за вознаграждение.',
          'Пропал кот Рыжий. Окраина. Хозяева очень ждут.']),
      ],
      crime: [
        pick(['В парке орудуют карманники. Полиция просит быть бдительными.',
          'На вокзале замечены фальшивомонетчики. Проверяйте купюры!',
          'В промзоне скупают краденую медь. Рейды полиции участились.']),
      ],
      taken: [],
    };
  }

  // ==================== ДЕЙСТВИЯ UI ====================
  openModal(m: Modal) { this.modal = m; this.joy = { x: 0, y: 0 }; this.bump(); }
  closeModal() { this.modal = null; this.bump(); }
  toast(text: string, kind: Toast['kind']) {
    if (!text) return;
    this.toasts.push({ id: this.toastId++, text, kind, t: 0 });
    if (this.toasts.length > 4) this.toasts.shift();
    this.bump();
  }
  float(x: number, y: number, text: string, color: string) {
    if (this.floats.length > 24) this.floats.shift();
    this.floats.push({ x, y, text, color, t: 0 });
  }
  questProgress(counter: string, n: number) {
    for (const q of this.state.quests) {
      if (q.def.counter === counter && !q.claimed) {
        q.progress = Math.min(q.def.target, q.progress + n);
        if (q.progress >= q.def.target) { sfx.quest(); this.toast(`Задание выполнено: ${q.def.text}`, 'good'); }
      }
    }
    this.bump();
  }
  claimQuest(idx: number) {
    const q = this.state.quests[idx];
    if (!q || q.claimed || q.progress < q.def.target) return;
    q.claimed = true;
    if (q.def.money) this.gainMoney(q.def.money);
    if (q.def.rep) {
      const [k, v] = q.def.rep as [keyof GState['rep'], number];
      this.state.rep[k] = clamp(this.state.rep[k] + v, 0, 100);
      this.toast(`Репутация +${v}`, 'good');
    }
    if (q.def.rewardItem) { this.addItem(q.def.rewardItem, 1); this.toast(`Награда: ${ITEMS[q.def.rewardItem].name}`, 'good'); }
    sfx.win();
    this.bump();
  }

  // ==================== АЧИВКИ ====================
  updateAchievement(id: string, amount: number) {
    const achDef = getAchievement(id);
    if (!achDef) return;
    const state = this.state.achievements[id] || { unlocked: false, progress: 0 };
    if (state.unlocked) return; // уже разблокировано
    state.progress = Math.min(achDef.target, state.progress + amount);
    if (state.progress >= achDef.target && !state.unlocked) {
      // Разблокировка!
      state.unlocked = true;
      this.state.achievements[id] = state;
      // Награды
      if (achDef.rewardMoney > 0) this.gainMoney(achDef.rewardMoney);
      if (achDef.rewardRep !== 0) {
        this.state.rep.homeless = clamp(this.state.rep.homeless + achDef.rewardRep, 0, 100);
      }
      // Уведомление
      this.toast(`🏆 Ачивка: ${achDef.name}!`, 'good');
      if (achDef.rewardMoney > 0 || achDef.rewardRep !== 0) {
        const rewards: string[] = [];
        if (achDef.rewardMoney > 0) rewards.push(`+${achDef.rewardMoney}₽`);
        if (achDef.rewardRep !== 0) rewards.push(`${achDef.rewardRep > 0 ? '+' : ''}${achDef.rewardRep} реп`);
        this.toast(`Награда: ${rewards.join(', ')}`, 'money');
      }
      sfx.win();
    } else {
      this.state.achievements[id] = state;
    }
    this.bump();
  }

  getAchievementsData() {
    return ACHIEVEMENTS.map(ach => {
      const state = this.state.achievements[ach.id] || { unlocked: false, progress: 0 };
      return {
        ...ach,
        unlocked: state.unlocked,
        progress: state.progress,
      };
    });
  }

  // --- магазины ---
  buyGood(shopId: string, idx: number) {
    const sh = SHOPS.find(s => s.id === shopId);
    if (!sh) return;
    const g = sh.goods[idx];
    const price = this.shopPriceFor(shopId, idx);
    
    // Если это рюкзак — особая логика
    if (g.item.startsWith('backpack')) {
      const lvl = parseInt(g.item.replace('backpack', ''), 10);
      this.buyBackpack(lvl, price);
      return;
    }
    
    // ✅ ЕСЛИ ЭТО ТРАНСПОРТ — не кладём в рюкзак, а регистрируем как транспорт
    if (VEHICLE_IDS.has(g.item)) {
      if (this.state.vehicles.some(v => v.id === g.item)) {
        this.toast('У вас уже есть такой транспорт', 'info');
        sfx.fail();
        return;
      }
      if (!this.spend(price)) return;
      this.state.vehicles.push({ id: g.item, fuel: VEHICLES[g.item].fuelCapacity, parkedAt: 'autosalon' });
      sfx.win();
      this.toast(`Куплено: ${VEHICLES[g.item].name}! Ищите на парковке`, 'good');
      this.bump();
      return;
    }
    
    // Обычный предмет — в рюкзак (проверяем место ДО списания денег)
    if (!this.hasSpace(g.item, 1)) { 
      this.toast('В рюкзаке нет места!', 'bad'); 
      sfx.fail(); 
      return; 
    }
    if (!this.spend(price)) return;
    
    this.addItem(g.item, 1);
    sfx.buy();
    this.toast(`Куплено: ${ITEMS[g.item].name}`, 'good');
  } // <-- ВАЖНО: только ОДНА закрывающая скобка здесь!

  // Сесть на транспорт
  enterVehicle(vehicleId: string) {
    const v = this.state.vehicles.find(v => v.id === vehicleId);
    if (!v) return;
    const def = VEHICLES[vehicleId];
    if (!def) return;
    
    // Проверка топлива
    if (def.needsFuel && v.fuel <= 0) {
      this.toast('Бак пуст! Нужна заправка на АЗС', 'bad');
      sfx.fail();
      return;
    }
    
    this.state.activeVehicle = vehicleId;
    v.parkedAt = null;
    sfx.door();
    this.toast(`Сел на ${def.name}. WASD — ехать, E — выйти`, 'info');
    this.bump();
  }

  // Выйти из транспорта
  exitVehicle() {
    if (!this.state.activeVehicle) return;
    const v = this.state.vehicles.find(v => v.id === this.state.activeVehicle);
    if (v) v.parkedAt = 'parking'; // паркуем где вышли
    const def = VEHICLES[this.state.activeVehicle];
    this.state.activeVehicle = null;
    sfx.door();
    this.toast(`Вышел из ${def.name}`, 'info');
    this.bump();
  }

  buyNewsSale(idx: number) {
    const s = this.state.news;
    if (!s || idx >= s.sales.length) return;
    const sale = s.sales[idx];
    if (!this.hasSpace(sale.item, 1)) { this.toast('В рюкзаке нет места!', 'bad'); sfx.fail(); return; }
    if (!this.spend(sale.price)) return;
    this.addItem(sale.item, 1);
    s.sales.splice(idx, 1);
    sfx.buy();
    this.bump();
  }
  takeJob(idx: number) {
    const s = this.state;
    if (!s.news) return;
    const job = s.news.jobs[idx];
    if (!job || s.news.taken.includes(job.id)) return;
    if (s.stats.energy < job.energy) { this.toast('Слишком устал для работы', 'bad'); sfx.fail(); return; }
    s.news.taken.push(job.id);
    s.stats.energy = clamp(s.stats.energy - job.energy, 0, 100);
    s.stats.fatigue = clamp(s.stats.fatigue + 10, 0, 100);
    s.stats.hygiene = clamp(s.stats.hygiene - 8, 0, 100);
    s.time = clamp(s.time + 90, 0, 1439);
    this.gainMoney(Math.round(job.pay * this.cityNow().wageMult));
    if (job.phone && !s.phone && !this.hasItem('phone1') && !this.hasItem('phone2')) {
      s.phone = 'phone1';
      this.toast('За доставку подарили кнопочный телефон!', 'good');
      sfx.win();
    }
    sfx.coin();
    this.toast(`Работа сделана: +${fmt(job.pay)} ₽`, 'money');
    this.bump();
  }
  buyNewspaper() {
    if (!this.state.news) this.genNews();
    if (!this.spend(20)) return;
    sfx.buy();
    this.openModal({ kind: 'newspaper' });
  }

  // --- рюкзак ---
  buyBackpack(lvl: number, price?: number) {
    const bp = BACKPACKS[lvl];
    if (!bp) return;
    if (lvl <= this.state.backpack) { this.toast('Такой рюкзак уже есть (или лучше)', 'info'); return; }
    const p = price ?? bp.price;
    if (!this.spend(p)) return;
    this.state.backpack = lvl;
    this.state.backpackAge = 0;
    if (bp.rep) { this.state.rep.people = clamp(this.state.rep.people + bp.rep, 0, 100); }
    sfx.win();
    this.toast(`Новый рюкзак: ${bp.name} (${bp.slots} слотов)`, 'good');
  }

  // --- приём ---
  sellRecycle(kindId: 'glass' | 'metal' | 'paper', itemId?: string) {
    const rc = RECYCLE[kindId];
    let total = 0, soldCans = 0, soldKg = 0;
    const mult = this.cityNow().scrapMult;
    for (const id of rc.items) {
      if (itemId && id !== itemId) continue;
      const qty = this.countItem(id);
      if (!qty) continue;
      total += qty * Math.max(1, Math.round(ITEMS[id].price * mult));
      this.removeItem(id, qty);
      if (kindId === 'glass') soldCans += qty; else soldKg += qty;
    }
    if (total <= 0) { this.toast('Нечего сдавать', 'info'); return; }
    if (kindId === 'glass') {
      const before = Math.floor(this.state.cansSold / rc.bonusEvery);
      this.state.cansSold += soldCans;
      const after = Math.floor(this.state.cansSold / rc.bonusEvery);
      if (after > before) { total += rc.bonus * (after - before); this.toast(`Бонус за ${rc.bonusEvery} банок: +${rc.bonus} ₽!`, 'money'); }
      this.questProgress('cans', soldCans);
    }
    if (kindId === 'paper') this.questProgress('paper', soldKg);
    if (kindId === 'metal') this.questProgress('metal', soldKg);
    this.gainMoney(total);
    sfx.coin();
    this.bump();
  }

  // --- города и путешествия ---
  cityNow(): CityDef { return this.state.cities[this.state.cityIndex] ?? this.state.cities[0]; }
  shopPriceFor(shopId: string, idx: number): number {
    const sh = SHOPS.find(s => s.id === shopId);
    if (!sh) return 0;
    const g = sh.goods[idx];
    const city = this.cityNow();
    const multKey = SHOP_MULT[shopId] ?? 'food';
    const mult = multKey === 'food' ? city.foodMult : multKey === 'cloth' ? city.clothMult : city.techMult;
    const sale = this.state.sales[shopId];
    const base = sale && sale.idx === idx ? Math.round(g.price * (1 - sale.pct / 100)) : g.price;
    return Math.max(1, Math.round(base * mult / 5) * 5);
  }
  ticketPrice(cityIdx: number, mode: Transport): number {
    const c = this.state.cities[cityIdx];
    if (!c) return 0;
    return Math.max(30, Math.round(c.base * TRANSPORT[mode].mult / 10) * 10);
  }
  startTravel(cityIdx: number, mode: Transport) {
    if (this.travel) return;
    if (cityIdx === this.state.cityIndex || cityIdx >= this.state.cities.length) return;
    const price = this.ticketPrice(cityIdx, mode);
    if (!this.spend(price)) return;
    this.closeModal();
    const dur = mode === 'plane' ? 3 : mode === 'train' ? 6 : 10;
    this.travel = { to: cityIdx, mode, t: 0, dur };
    this.moving = false;
    sfx.door();
    this.toast(`Билет куплен: ${TRANSPORT[mode].name.toLowerCase()} до г. ${this.state.cities[cityIdx].name}`, 'info');
    this.bump();
  }
  private arriveCity() {
    if (!this.travel) return;
    const tr = this.travel;
    this.travel = null;
    const s = this.state;
    s.cityIndex = tr.to;
    const city = this.cityNow();
    // время в пути
    if (tr.mode === 'bus') { s.time = 9 * 60; s.day++; this.onNewDay(false); }
    else if (tr.mode === 'train') { s.time = clamp(s.time + 360, 0, 1430); if (s.time < 300) { s.day++; this.onNewDay(false); } }
    else s.time = clamp(s.time + 40, 0, 1430);
    s.stats.energy = clamp(s.stats.energy - (tr.mode === 'bus' ? 20 : 8), 0, 100);
    s.stats.fatigue = clamp(s.stats.fatigue + 12, 0, 100);
    this.rollWeather();
    this.genNews();
    s.news = null; // в новом городе газета свежая
    s.sales = {};
    this.baraholkaPrices = {};
    this.px = 51 * T; this.py = 38.6 * T;
    this.mode = { type: 'world' };
    for (const o of this.world.objects) if (o.kind === 'dump') o.searched = false;
    sfx.win();
    this.toast(`Добро пожаловать в ${city.name}!`, 'good');
    this.toast(city.perk, 'info');
this.updateAchievement('first_travel', 1);
this.updateAchievement('all_cities', s.cities.filter((_, i) => s.milestones.includes('city_' + i) || i === s.cityIndex).length);
// Отметить посещённый город
if (!s.milestones.includes('city_' + s.cityIndex)) {
  s.milestones.push('city_' + s.cityIndex);
  this.updateAchievement('all_cities', s.milestones.filter(m => m.startsWith('city_')).length);
}
    if (!s.milestones.includes('travel')) { s.milestones.push('travel'); this.toast('Новая веха: путешественник', 'money'); }
    this.saveGame();
    this.bump();
  }

  // --- барахолка ---
  baraholkaPrices: Record<string, number> = {};
  getBarPrice(id: string): number {
    if (!this.baraholkaPrices[id]) {
      const [a, b] = SELL_VALS[id] ?? [ITEMS[id]?.price ?? 10, (ITEMS[id]?.price ?? 10) * 1.5];
      this.baraholkaPrices[id] = Math.round(rnd(a, b) / 10) * 10 || 10;
    }
    return this.baraholkaPrices[id];
  }
  sellValuable(id: string) {
    if (id === 'wallet') { this.toast('Кошелёк лучше вернуть... или заглянуть в него', 'info'); return; }
    if (this.removeItem(id, 1) <= 0) return;
    const p = this.getBarPrice(id);
    this.gainMoney(p);
    this.toast(`Продано на барахолке: +${fmt(p)} ₽`, 'money');
    this.bump();
  }
  buyUsed(idx: number) {
    const offers = this.usedOffers();
    const o = offers[idx];
    if (!o) return;
    if (!this.spend(o.price)) return;
    if (o.item.startsWith('backpack')) this.buyBackpack(parseInt(o.item.replace('backpack', ''), 10), 0);
    else this.addItem(o.item, 1);
    sfx.buy();
    this.bump();
  }
  usedOffers(): { item: string; price: number }[] {
    // детерминированные по дню
    const pool = ['tshirt', 'jeans', 'hat', 'boots', 'hammer', 'oldphone', 'book', 'coin', 'cardcity', 'backpack4', 'passport', 'rod', 'wjacket'];
    const res: { item: string; price: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const item = pool[(this.state.day * 7 + i * 3) % pool.length];
      const base = item.startsWith('backpack') ? BACKPACKS[parseInt(item.replace('backpack', ''), 10)].price : (ITEMS[item]?.price ?? 100);
      res.push({ item, price: Math.max(10, Math.round(base * 0.55 / 10) * 10) });
    }
    return res;
  }

  // --- подъезд / квартиры ---
  private entranceDoor: WObj | null = null;
  // лучшая из купленных квартир определяет интерьер (у каждой ступени он свой)
  private bestHomeInterior(): string {
    const order = ['pent', 'three', 'two', 'one', 'studio'];
    for (const a of order) if (this.state.ownedApts.includes(a)) return APT_INTERIORS[a];
    return 'i_apt_studio'; // бесплатная квартира = студия
  }
  private isHomeInterior(id: string): boolean {
    return id === 'i_room' || Object.values(APT_INTERIORS).includes(id);
  }
  enterOwnedApartment() {
    const s = this.state;
    if (!s.ownedApts.length && !s.freeApt) { this.toast('У вас пока нет квартиры', 'info'); return; }
    this.closeModal();
    this.enterInterior(this.bestHomeInterior(), this.entranceDoor ?? undefined);
  }
  neighborKnock() {
    this.toast(pick(NEIGHBOR_LINES), 'info');
    this.applyFx({ mood: 2 });
    sfx.click();
  }
  private payUtilities() {
    const s = this.state;
    if (!s.ownedApts.length) return;
    let cost = 0;
    for (const id of s.ownedApts) {
      const d = APARTMENTS.find(a => a.id === id);
      if (d) cost += 25 * d.rooms;
    }
    // текущий кран влияет на коммуналку
    for (const a of s.apts) {
      const tap = a.appliances['tap'];
      if (tap && tap.broken) cost += 60;
    }
    if (cost > 0 && s.money >= cost) {
      s.money -= cost;
      this.toast(`Коммунальные платежи: −${fmt(cost)} ₽`, 'info');
    } else if (cost > 0) {
      s.rep.police = clamp(s.rep.police - 2, 0, 100);
      this.toast('Не хватило на коммуналку — долг растёт...', 'bad');
    }
  }

  // --- жильё ---
  buyApartment(id: string) {
    const d = APARTMENTS.find(a => a.id === id);
    if (!d) return;
    if (this.state.ownedApts.includes(id)) { this.toast('Уже куплена', 'info'); return; }
    if (!this.spend(d.price)) return;
    this.state.ownedApts.push(id);
    this.state.docs.registration = true;
    const aps: Record<string, ApplianceState> = {};
    for (const ap of APPLIANCES) aps[ap.id] = { dur: 100, broken: false };
    this.state.apts.push({ id, appliances: aps, dirt: 10, rented: false });
    sfx.win();
    this.toast(`Куплена: ${d.name}! Оформлена прописка`, 'good');
    if (id === 'pent' && !this.state.milestones.includes('pent')) {
      this.state.milestones.push('pent');
      this.openModal({ kind: 'victory' });
    }
    this.checkMilestones();
    this.bump();
this.updateAchievement('apartment_first', 1);
this.updateAchievement('apartment_owned', 1);
  }
  rentRoom() {
    if (this.state.housing === 'room') { this.toast('Вы уже снимаете комнату', 'info'); return; }
    if (!this.spend(500)) return;
    this.state.housing = 'room';
    this.state.docs.registration = true;
    sfx.win();
    this.toast('Комната у бабушки Зины — теперь ваш дом. Оформлена прописка!', 'good');
    this.checkMilestones();
    this.bump();
  }
  payRentDaily() {
    const s = this.state;
    if (s.housing === 'room') {
      if (s.money >= 500) { s.money -= 500; this.toast('Оплата комнаты: −500 ₽', 'info'); }
      else { s.housing = 'street'; this.toast('Не смогли оплатить комнату. Бабушка выставила вещи...', 'bad'); }
    }
  }
  toggleRentApt(id: string) {
    const a = this.state.apts.find(x => x.id === id);
    if (!a) return;
    a.rented = !a.rented;
    this.toast(a.rented ? 'Квартира сдана. Съёмщики платят, но мусорят' : 'Съёмщики выселены', 'info');
    this.bump();
  }
  repairAppliance(aptId: string, apId: string, master: boolean) {
    const a = this.state.apts.find(x => x.id === aptId);
    const ap = APPLIANCES.find(x => x.id === apId);
    if (!a || !ap) return;
    const st = a.appliances[apId];
    if (master) {
      if (!this.spend(ap.master)) return;
      st.broken = false; st.dur = 100;
      sfx.win();
      this.toast(`Мастер починил: ${ap.name}`, 'good');
      this.bump();
      return;
    }
    if (!this.hasItem('tools')) { this.toast('Нужен набор инструментов (Строймаркет)', 'bad'); return; }
    if ((apId === 'fridge' || apId === 'washer') && !this.hasItem('parts')) { this.toast('Нужны запчасти (Строймаркет)', 'bad'); return; }
    if (apId === 'fridge' || apId === 'washer') this.removeItem('parts', 1);
    this.closeModal();
    this.openModal({ kind: 'minigame', game: 'repair', data: { aptId, apId } });
  }
  repairResult(success: boolean, aptId: string, apId: string) {
    const a = this.state.apts.find(x => x.id === aptId);
    const ap = APPLIANCES.find(x => x.id === apId);
    if (!a || !ap) return;
    if (success) {
      a.appliances[apId] = { dur: 100, broken: false };
      sfx.win();
      this.toast(`Починено: ${ap.name}`, 'good');
      this.questProgress('repair', 1);
    } else {
      sfx.fail();
      this.toast(`Не вышло... ${ap.name} всё ещё сломана`, 'bad');
      this.damage(5);
    }
    this.bump();
s.repairCount = (s.repairCount || 0) + 1;
this.updateAchievement('apartment_repair_5', s.repairCount);
  }
  startCleaning(where: 'apt' | 'park', aptId?: string) {
    this.closeModal();
    this.openModal({ kind: 'minigame', game: 'clean', data: { where, aptId } });
  }
  cleanResult(success: boolean, where: 'apt' | 'park', aptId?: string) {
    if (success) {
      if (where === 'apt' && aptId) {
        const a = this.state.apts.find(x => x.id === aptId);
        if (a) a.dirt = 0;
        this.toast('Квартира сияет чистотой!', 'good');
      } else {
        this.questProgress('clean', 1);
        this.gainMoney(300);
        this.applyFx({ mood: 15 });
        this.toast('Парк убран! Спасибо от жителей', 'good');
        this.state.rep.people = clamp(this.state.rep.people + 5, 0, 100);
      }
      sfx.win();
    } else {
      sfx.fail();
      this.toast('Не успели убрать всё...', 'bad');
    }
    this.bump();
  }

  // --- сон ---
  /** Кровать в квартире — прямой сон без меню выбора локации. */
  private sleepInBed() {
    const s = this.state;
    const mid = this.mode.type === 'interior' ? this.mode.id : '';
    const inHome = this.isHomeInterior(mid) && (s.ownedApts.length > 0 || !!s.freeApt);
    if (!inHome) { this.openModal({ kind: 'sleep' }); return; }
    // прямой сон дома
    s.stats.fatigue = clamp(s.stats.fatigue - 50, 0, 100);
    s.stats.hp = clamp(s.stats.hp + 10, 1, 100);
    s.stats.mood = clamp(s.stats.mood + 15, 0, 100);
    s.stats.hygiene = clamp(s.stats.hygiene + 25, 0, 100);
    s.stats.hunger = clamp(s.stats.hunger - 20, 0, 100);
    // кража 20% при сне
    if (Math.random() < 0.20) this.applyRobbery();
    sfx.sleep();
    this.sleepFade = 1.6;
    s.time = 7 * 60;
    s.day++;
    this.onNewDay(false);
    this.toast(`День ${s.day}. Вы выспались дома`, 'info');
    if (s.stats.hp <= 1) this.hospitalize();
    this.bump();
// Счётчик снов в квартире
s.apartmentSleepCount = (s.apartmentSleepCount || 0) + 1;
this.updateAchievement('apartment_sleep_10', s.apartmentSleepCount);
  }
  /** Кража во сне: деньги / еда из холодильника / поломка техники. */
  private applyRobbery() {
    const s = this.state;
    const r = Math.random();
    if (r < 0.4) {
      if (s.money > 30) {
        const stolen = Math.floor(s.money * 0.3);
        s.money -= stolen;
        this.toast(`🚨 Вас ограбили во сне! Украдено ${fmt(stolen)} ₽`, 'bad');
      } else this.toast('🚨 Воры ничего не нашли...', 'info');
    } else if (r < 0.7) {
      const food = s.inv.filter(i => ITEMS[i.id].cat === 'food');
      if (food.length) {
        const it = food[Math.floor(Math.random() * food.length)];
        this.removeItem(it.id, 1);
        this.toast(`🚨 Украдена еда: ${ITEMS[it.id].name}`, 'bad');
      } else this.toast('🚨 Холодильник пуст — воры ушли ни с чем', 'info');
    } else {
      const apt = s.apts[0];
      const intact = apt ? APPLIANCES.filter(a => apt.appliances[a.id] && !apt.appliances[a.id].broken) : [];
      if (intact.length) {
        const ap = intact[Math.floor(Math.random() * intact.length)];
        if (apt) { apt.appliances[ap.id] = { dur: Math.floor(rnd(5, 30)), broken: true }; }
        this.toast(`🚨 Сломана техника: ${ap.name}!`, 'bad');
        sfx.fail();
      } else this.toast('🚨 Воры ничего не сломали', 'info');
    }
    s.stats.mood = clamp(s.stats.mood - 15, 0, 100);
this.updateAchievement('robbed_sleep', 1);
  }
  sleepOpts(): { id: string; name: string; desc: string; price: number; hp: number; fat: number; energy: number; risk: boolean; available: boolean }[] {
    const s = this.state;
    const inApt = this.mode.type === 'interior' && this.isHomeInterior(this.mode.id);
    return [
      { id: 'bench', name: 'Лавочка / подъезд', desc: 'Бесплатно. −20 HP, риск кражи', price: 0, hp: -20, fat: 55, energy: 70, risk: true, available: true },
      { id: 'box', name: 'Коробка из картона', desc: 'Нужна коробка. −5 HP', price: 0, hp: this.hasItem('boxitem') ? -5 : -20, fat: 50, energy: 75, risk: true, available: this.hasItem('boxitem') },
      { id: 'shelter', name: 'Ночлежка', desc: '100 ₽. Тепло, безопасно, −10 HP', price: 100, hp: -10, fat: 25, energy: 90, risk: false, available: true },
      { id: 'churchbed', name: 'Приют при церкви', desc: 'Бесплатно, раз в день', price: 0, hp: -10, fat: 30, energy: 85, risk: false, available: !s.flags.churchbed },
      { id: 'room', name: 'Комната у бабушки', desc: '500 ₽. Кровать и душ', price: 500, hp: 15, fat: 8, energy: 100, risk: false, available: s.housing === 'room' },
      { id: 'apt', name: 'Своя квартира', desc: 'Кровать: +30 HP, настроение +15', price: 0, hp: 30, fat: 0, energy: 100, risk: false, available: inApt && (s.ownedApts.length > 0 || !!s.freeApt) },
    ];
  }
  doSleep(id: string) {
    const opt = this.sleepOpts().find(o => o.id === id);
    if (!opt || !opt.available) return;
    if (opt.price && !this.spend(opt.price)) return;
    const s = this.state;
    if (id === 'churchbed') s.flags.churchbed = true;
    if (id === 'shelter') s.housing = s.housing === 'street' ? 'shelter' : s.housing;
    s.stats.hp = clamp(s.stats.hp + opt.hp, 1, 100);
    s.stats.fatigue = opt.fat;
    s.stats.energy = opt.energy;
    s.stats.hunger = clamp(s.stats.hunger - 20, 0, 100);
    if (id === 'apt') s.stats.mood = clamp(s.stats.mood + 15, 0, 100);
    if (id === 'room' || id === 'apt') s.stats.hygiene = clamp(s.stats.hygiene + 25, 0, 100);
    if (opt.risk && Math.random() < 0.3 && s.money > 30) {
      const lost = Math.floor(s.money * 0.25);
      s.money -= lost;
      this.toast(`Пока вы спали, украли ${fmt(lost)} ₽...`, 'bad');
    }
    if (id === 'room') this.payRentDaily();
    if (this.state.ill === '' && (id === 'apt' || id === 'room') && Math.random() < 0.6) { /* тепло восстанавливает */ }
    sfx.sleep();
    this.sleepFade = 1.6;
    this.closeModal();
    // перенос на 7 утра следующего дня
    s.time = 7 * 60;
    s.day++;
    this.onNewDay(false);
    this.toast(`День ${s.day}. Доброе утро!`, 'info');
    if (s.stats.hp <= 1) this.hospitalize();
    this.bump();
  }
  shower() {
    if (this.mode.type !== 'interior') return;
    if (!this.spend(10)) return;
    this.applyFx({ hygiene: 60 });
    this.toast('Душ: гигиена +60 (вода −10 ₽)', 'good');
    sfx.pickup();
  }

  // --- работники ---
  hireWorker(id: string) {
    const def = WORKERS.find(w => w.id === id);
    const st = this.state.workers.find(w => w.id === id);
    if (!def || !st) return;
    if (st.hired) { this.toast('Он уже на вас работает', 'info'); return; }
    if (this.state.housing === 'street') { this.toast('Нужно жильё (хотя бы ночлежка), чтобы нанимать', 'bad'); return; }
    if (this.state.rep.homeless < def.minRep) { this.toast(`Нужна репутация среди бездомных: ${def.minRep}+`, 'bad'); return; }
    if (!this.spend(def.hire)) return;
    st.hired = true; st.sick = false; st.fed = false;
    this.state.rep.homeless = clamp(this.state.rep.homeless + 5, 0, 100);
    sfx.win();
    this.toast(`${def.name} теперь в вашей бригаде!`, 'good');
    this.checkMilestones();
    this.bump();
  }
  feedWorker(id: string) {
    const st = this.state.workers.find(w => w.id === id);
    if (!st || !st.hired || st.fed) return;
    if (!this.spend(50)) return;
    st.fed = true;
    this.toast('Работник накормлен — будет стараться', 'good');
    this.bump();
  }
  cureWorker(id: string) {
    const st = this.state.workers.find(w => w.id === id);
    if (!st || !st.sick) return;
    if (this.removeItem('pills', 1) <= 0) { this.toast('Нужны таблетки (Аптека)', 'bad'); return; }
    st.sick = false;
    this.toast('Работник вылечен', 'good');
    this.bump();
  }
  fireWorker(id: string) {
    const st = this.state.workers.find(w => w.id === id);
    if (!st || !st.hired) return;
    st.hired = false;
    this.toast('Работник уволен', 'info');
    this.bump();
  }
  helpHomeless() {
    if (!this.spend(50)) return;
    this.state.rep.homeless = clamp(this.state.rep.homeless + 6, 0, 100);
    this.questProgress('help', 1);
    this.toast('«Спасибо, добрый человек...» Репутация +6', 'good');
    this.bump();
  }

  // --- крафт ---
  craft(id: string) {
    const r = RECIPES.find(x => x.id === id);
    if (!r) return;
    for (const [item, qty] of r.needs) if (this.countItem(item) < qty) { this.toast(`Не хватает: ${ITEMS[item].name}`, 'bad'); sfx.fail(); return; }
    for (const [item, qty] of r.needs) this.removeItem(item, qty);
    this.addItem(r.out, 1);
    sfx.win();
    this.toast(`Создано: ${ITEMS[r.out].name}`, 'good');
    this.bump();
  }

  // --- инвестиции ---
  buyInvestment(id: string) {
    const d = INVESTMENTS.find(x => x.id === id);
    if (!d) return;
    if (this.state.investments.includes(id)) return;
    if (!this.spend(d.price)) return;
    this.state.investments.push(id);
    sfx.win();
    this.toast(`Куплено: ${d.name} (+${fmt(d.income)} ₽/день)`, 'money');
    this.checkMilestones();
    this.bump();
  }

  // --- события ---
  private randomEvent() {
    if (this.modal || this.mode.type !== 'world') return;
    const s = this.state;
    const r = Math.random();
    if (r < 0.22) {
      const amt = s.rep.people > 20 ? ri(100, 300) : ri(20, 80);
      this.gainMoney(amt);
      this.toast(`Прохожий: «Держи, браток» +${amt} ₽`, 'good');
    } else if (r < 0.34) {
      this.addItem('wallet', 1);
      this.openModal({ kind: 'event', ev: 'wallet' });
      sfx.pickup();
    } else if (r < 0.44 && s.criminal < 5) {
      this.openModal({ kind: 'event', ev: 'crime' });
      sfx.phone();
    } else if (r < 0.54) {
      this.applyFx({ mood: 8 });
      this.toast(pick(['Уличный музыкант сыграл вам — настроение +8', 'Дворник поделился чаем — настроение +8', 'Вы нашли солнечный дворик — настроение +8']), 'good');
    } else if (r < 0.62 && !s.flags.fest) {
      s.flags.fest = true;
      this.applyFx({ mood: 20 });
      this.toast('В городе фестиваль! В столовой сегодня кормят бесплатно', 'good');
    } else if (r < 0.7 && !s.partner && s.stats.hygiene > 50 && s.stats.mood > 55) {
      s.partner = true;
      sfx.win();
      this.toast('Вы познакомились с замечательным человеком! +настроение каждый день', 'good');
      this.applyFx({ mood: 25 });
    } else if (r < 0.76 && s.partner && !s.family && this.hasItem('ring')) {
      s.family = true;
      this.removeItem('ring', 1);
      sfx.win();
      this.toast('Свадьба! Теперь у вас семья. Настроение всегда выше', 'good');
    } else if (r < 0.85) {
      const found = pick(['can05', 'can05', 'news', 'branch', 'rope', 'mag']);
      if (this.addItem(found, 1) > 0) this.toast(`Под ногами: ${ITEMS[found].name}`, 'info');
    }
  }
  resolveWallet(keep: boolean) {
    this.removeItem('wallet', 1);
    if (keep) {
      const amt = ri(500, 1500);
      this.gainMoney(amt);
      this.state.rep.people = clamp(this.state.rep.people - 10, 0, 100);
      this.state.criminal += 1;
      this.toast(`В кошельке ${fmt(amt)} ₽... Совесть нечиста`, 'bad');
    } else {
      this.gainMoney(100);
      this.state.rep.people = clamp(this.state.rep.people + 15, 0, 100);
      this.toast('Хозяин нашёлся! Награда 100 ₽, уважение людей +15', 'good');
      sfx.win();
    }
    this.closeModal();
  }
  resolveCrime(accept: boolean) {
    if (accept) {
      this.gainMoney(1000);
      this.state.criminal += 2;
      this.state.rep.police = clamp(this.state.rep.police - 10, 0, 100);
      this.state.stats.fatigue = clamp(this.state.stats.fatigue + 15, 0, 100);
      this.toast('Пакет передан. +1000 ₽. Полиция что-то заподозрила...', 'bad');
    } else {
      this.state.rep.police = clamp(this.state.rep.police + 5, 0, 100);
      this.toast('Вы отказались. Чистая совесть +5 к доверию полиции', 'good');
    }
    this.closeModal();
  }
  // гопники
  muggedChoice(fight: boolean) {
    if (!fight) {
      const lost = Math.floor(this.state.money * 0.3);
      this.state.money -= lost;
      let itemLost = '';
      const scraps = this.state.inv.filter(i => ITEMS[i.id].cat === 'scrap');
      if (scraps.length) { const s0 = pick(scraps); const q = Math.ceil(s0.qty / 2); this.removeItem(s0.id, q); itemLost = `${ITEMS[s0.id].name} ×${q}`; }
      sfx.fail();
      this.toast(`Отдали ${fmt(lost)} ₽${itemLost ? ' и ' + itemLost : ''}. Обидно...`, 'bad');
      this.closeModal();
    } else {
      this.closeModal();
      this.openModal({ kind: 'minigame', game: 'qte', data: { qtype: 'fight', need: 14, time: 4 } });
    }
    this.bump();
  }
  qteResult(success: boolean, qtype: string) {
    if (qtype === 'dog') {
      if (success) {
        this.toast('Вы отбились от собаки!', 'good');
        for (const d of this.dogs) if (Math.hypot(d.x - this.px, d.y - this.py) < 120) { d.state = 'flee'; d.t = 8; d.tx = d.x * 2 - this.px; }
        this.state.rep.homeless = clamp(this.state.rep.homeless + 2, 0, 100);
        sfx.win();
      } else {
        this.damage(15);
        this.toast('Собака укусила! −15 HP', 'bad');
        for (const d of this.dogs) if (Math.hypot(d.x - this.px, d.y - this.py) < 120) { d.state = 'flee'; d.t = 5; d.tx = d.x * 2 - this.px; }
      }
    } else if (qtype === 'fight') {
      if (success) {
        sfx.win();
        this.toast('Победа в драке! Уважение +10', 'good');
        this.state.rep.homeless = clamp(this.state.rep.homeless + 10, 0, 100);
        if (Math.random() < 0.5) { const amt = ri(100, 400); this.gainMoney(amt); this.toast(`В кармане у нападавшего: ${amt} ₽`, 'money'); }
        this.damage(5);
      } else {
        this.damage(25);
        const lost = Math.floor(this.state.money * 0.3);
        this.state.money -= lost;
        sfx.hurt();
        this.toast(`Избили и обобрали: −25 HP, −${fmt(lost)} ₽`, 'bad');
      }
    }
    this.closeModal();
    if (this.state.stats.hp <= 0) this.hospitalize();
  }
  // полиция
  policeChoice(pay: boolean) {
    const s = this.state;
    const hasPassport = this.hasItem('passport');
    const allDocs = hasPassport && s.docs.registration && s.docs.workPermit;
    if (allDocs) {
      s.rep.police = clamp(s.rep.police + 5, 0, 100);
      this.toast('Полицейский: «Все документы в порядке. Хорошего дня!» +5 доверия', 'good');
      this.closeModal();
      return;
    }
    if (hasPassport) {
      s.rep.police = clamp(s.rep.police + 2, 0, 100);
      this.toast('Полицейский: «Паспорт есть — хорошо. Но оформите прописку» +2 доверия', 'good');
      this.closeModal();
      return;
    }
    if (pay) {
      if (!this.spend(500)) return;
      s.rep.police = clamp(s.rep.police - 5, 0, 100);
      this.toast('Штраф за отсутствие паспорта: −500 ₽', 'bad');
    } else {
      s.rep.police = clamp(s.rep.police - 10, 0, 100);
      s.stats.energy = clamp(s.stats.energy - 20, 0, 100);
      this.toast('Вы сбежали от патруля! −20 выносливости, −10 доверия', 'info');
    }
    this.closeModal();
  }
  policeToStation() {
    // нет паспорта и нет денег — забирают в участок
    const s = this.state;
    const st = this.world.objects.find(o => o.kind === 'police_station');
    if (st) { 
      this.px = st.x; 
      this.py = st.y + 30; 
      this.mode = { type: 'world' }; 
    }
    s.time = clamp(s.time + 120, 0, 1439);
    const lost = Math.floor(s.money * 0.3);
    s.money -= lost;
    s.stats.mood = clamp(s.stats.mood - 20, 0, 100);
    s.rep.police = clamp(s.rep.police - 15, 0, 100);
    
    this.toast(`Вас отвезли в участок: −2 часа, −${fmt(lost)} ₽, −20 настроения`, 'bad');
    
    // ✅ ДОБАВЛЕНО: Обновление ачивки и обновление UI
    this.updateAchievement('caught_police', 1);
    this.bump();
    
    this.closeModal();
  }

  // ==================== РАБОТА НА ЗАВОДЕ ====================
  doOneTimeJob(id: string) { this.startPhysicalJob(id); }
  /** Начислить награду за выполненную халтуру (вызывается после успеха мини-игры). */
  private finishOneTimeJob(id: string) {
    const job = ONETIME_JOBS.find(j => j.id === id);
    if (!job) return;
    const s = this.state;
    s.stats.energy = clamp(s.stats.energy - job.energy, 0, 100);
    s.stats.fatigue = clamp(s.stats.fatigue + 8, 0, 100);
    s.time = clamp(s.time + job.dur * 60, 0, 1439);
    if (job.risk > 0 && Math.random() * 100 < job.risk) {
      this.damage(5);
      this.toast('Ой! Травма на производстве −5 HP', 'bad');
    }
    const pay = Math.round(job.pay * this.cityNow().wageMult);
    this.gainMoney(pay);
    sfx.coin();
    this.toast(`${job.name}: +${fmt(pay)} ₽`, 'money');
    // повторить эту халтуру можно через 4 игровых часа
    s.factoryCooldowns[id] = this.gameNow();
    this.bump();
  }
  /** Результат заводской мини-игры (переноска/резка). */
  factoryJobResult(jobId: string, success: boolean) {
    this.closeModal();
    if (success) {
      this.state.factoryJob = null;
      if (!this.state.docs.workPermit) {
        this.state.docs.workPermit = true;
        this.toast('Мастер выдал разрешение на работу!', 'good');
      }
      this.finishOneTimeJob(jobId);
      return;
    }
    const s = this.state;
    s.stats.energy = clamp(s.stats.energy - 10, 0, 100);
    sfx.fail();
    this.toast('Заготовка испорчена — мастер недоволен. Попробуйте ещё', 'bad');
    this.bump();
  }
  hireFactoryJob(id: string) {
    const job = PERM_JOBS.find(j => j.id === id);
    if (!job) return;
    const s = this.state;
    if (s.job.id === id) { this.toast('Вы уже работаете на этой должности', 'info'); return; }
    s.job = { id, days: 0 };
    s.docs.workPermit = true;
    sfx.win();
    this.toast(`Вы устроились: ${job.name}. Получено разрешение на работу!`, 'good');
    this.bump();
this.updateAchievement('first_job', 1);
  }
  quitFactoryJob() {
    this.state.job = { id: null, days: 0 };
    this.toast('Вы уволились с завода', 'info');
    this.bump();
  }
  factoryJobInfo(): { def: PermJobDef | null; days: number; rank: string; pay: number } {
    const s = this.state;
    if (!s.job.id) return { def: null, days: 0, rank: '', pay: 0 };
    const def = PERM_JOBS.find(j => j.id === s.job.id)!;
    let rank = def.name, pay = def.pay;
    for (const p of def.promos) {
      if (s.job.days >= p.days) { rank = p.name; pay = def.pay + p.bonus; }
    }
    return { def, days: s.job.days, rank, pay };
  }
  private factoryDailyPay() {
    const info = this.factoryJobInfo();
    if (!info.def) return;
    const s = this.state;
    const pay = Math.round(info.pay * this.cityNow().wageMult);
    this.gainMoney(pay);
    s.stats.energy = clamp(s.stats.energy - info.def.energy * 0.5, 0, 100);
    s.stats.fatigue = clamp(s.stats.fatigue + 12, 0, 100);
    this.toast(`Зарплата (${info.rank}): +${fmt(pay)} ₽`, 'money');
    // повышения
    for (const p of info.def.promos) {
      if (s.job.days === p.days) { this.toast(`ПОВЫШЕНИЕ! Теперь вы: ${p.name}`, 'good'); sfx.win(); }
    }
    s.job.days++;
this.updateAchievement('work_7days', 1);
this.updateAchievement('work_30days', 1);
  }
  buyDocument(kind: 'registration') {
    const s = this.state;
    if (kind === 'registration') {
      if (s.docs.registration) { this.toast('Прописка уже есть', 'info'); return; }
      if (!this.spend(300)) return;
      s.docs.registration = true;
      sfx.win();
      this.toast('Оформлена прописка: −300 ₽', 'good');
    }
    this.bump();
  }
  openPhone(idx?: number) {
    if (idx !== undefined) {
      const sl = this.state.inv[idx];
      if (sl && sl.id.startsWith('phone')) {
        this.state.phone = sl.id;
        this.toast(`Телефон ${ITEMS[sl.id].name} активирован`, 'good');
        sfx.phone();
      }
    }
    this.openModal({ kind: 'phone' });
  }
  nearbyPois(): { name: string; dist: number }[] {
    const pois: { name: string; x: number; y: number }[] = [];
    for (const b of this.world.buildings) {
      if (b.kind === 'factory') pois.push({ name: b.name, x: b.x * T + b.w * T / 2, y: b.y * T + b.h * T });
      else if (b.kind === 'police_station') pois.push({ name: 'Полицейский участок', x: b.x * T + b.w * T / 2, y: b.y * T + b.h * T });
      else if (b.kind === 'vokzal') pois.push({ name: 'Вокзал', x: b.x * T + b.w * T / 2, y: b.y * T + b.h * T });
      else if (b.kind === 'soup') pois.push({ name: 'Столовая', x: b.x * T + b.w * T / 2, y: b.y * T + b.h * T });
      else if (b.kind === 'church') pois.push({ name: 'Церковь (приют)', x: b.x * T + b.w * T / 2, y: b.y * T + b.h * T });
      else if (b.kind === 'booth') pois.push({ name: b.name, x: b.x * T + b.w * T / 2, y: b.y * T + b.h * T });
    }
    for (const o of this.world.objects) {
      if (o.kind === 'dump' && !o.searched) pois.push({ name: 'Свалка', x: o.x, y: o.y });
      else if (o.kind === 'baraholka') pois.push({ name: 'Барахолка', x: o.x, y: o.y });
    }
    return pois
      .map(p => ({ name: p.name, dist: Math.round(Math.hypot(p.x - this.px, p.y - this.py) / 10) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 7);
  }

  // --- свалка ---
  searchDump(o: WObj) {
    if (o.searched) { this.toast('Тут уже всё разобрали', 'info'); return; }
    if (this.state.stats.energy < 5) { this.toast('Слишком устал даже мусор разгребать', 'bad'); return; }
    const rival = this.state.time > 12 * 60 && Math.random() < 0.45;
    this.openModal({ kind: 'minigame', game: 'dump', data: { table: o.data ?? 'park', piles: 10, rival, dumpId: o.id } });
  }
  dumpResult(items: string[], dumpId: string) {
    this.closeModal();
    const o = this.world.objects.find(x => x.id === dumpId);
    if (o) { o.searched = true; o.cooldown = this.state.day; }
    let got = 0;
    for (const id of items) {
      if (this.addItem(id, 1) > 0) { got++; this.float(this.px + rnd(-20, 20), this.py - 30 - rnd(0, 16), '+ ' + ITEMS[id].name, '#5db8ff'); }
    }
    this.state.stats.energy = clamp(this.state.stats.energy - 8, 0, 100);
    this.state.stats.hygiene = clamp(this.state.stats.hygiene - 6, 0, 100);
    if (got > 0) sfx.pickup();
    this.toast(`Найдено предметов: ${got}`, got > 0 ? 'good' : 'info');
    if (o && Math.random() < 0.35) { // шанс отравиться, копаясь в еде
      if (items.includes('spoiled') && Math.random() < 0.3) { this.state.ill = 'poison'; this.toast('Вы чем-то отравились...', 'bad'); }
    }
    this.bump();
// Трекинг ачивок за сбор мусора
for (const id of items) {
  if (id === 'can05' || id === 'can1') this.updateAchievement('bottle_1', 1);
  if (id === 'can05' || id === 'can1') this.updateAchievement('bottle_100', 1);
  if (id === 'can05' || id === 'can1') this.updateAchievement('bottle_500', 1);
  if (id === 'can05' || id === 'can1') this.updateAchievement('bottle_1000', 1);
  if (id === 'news' || id === 'card' || id === 'book' || id === 'mag') this.updateAchievement('paper_50', 1);
  if (id === 'news' || id === 'card' || id === 'book' || id === 'mag') this.updateAchievement('paper_200', 1);
}
  }
  genDumpLoot(table: string, n: number): string[] {
    const tbl = LOOT[table] ?? LOOT.park;
    const total = tbl.reduce((a, b) => a + b[1], 0);
    const res: string[] = [];
    for (let i = 0; i < n; i++) {
      let r = Math.random() * total;
      for (const [item, w] of tbl) { r -= w; if (r <= 0) { res.push(item); break; } }
    }
    return res;
  }

  // --- мусорные баки (кулдаун 1 мин, лут беднее свалки) ---
  searchTrashCan(o: WObj) {
    const now = Date.now();
    const cd = o.cooldown ?? 0;
    if (now - cd < 60000) {
      const wait = Math.ceil((60000 - (now - cd)) / 1000);
      this.toast(`Бак пуст. Подождите ${wait} с`, 'info');
      return;
    }
    if (this.state.stats.energy < 3) { this.toast('Слишком устал даже бак поворошить', 'bad'); return; }
    o.cooldown = now;
    // 1–3 предмета из бедного лута
    const n = ri(1, 3);
    const total = TRASHCAN_LOOT.reduce((a, b) => a + b[1], 0);
    const found: string[] = [];
    for (let i = 0; i < n; i++) {
      let r = Math.random() * total;
      for (const [item, w] of TRASHCAN_LOOT) { r -= w; if (r <= 0) { found.push(item); break; } }
    }
    const names: string[] = [];
    for (const id of found) if (this.addItem(id, 1) > 0) names.push(ITEMS[id]?.name ?? id);
    this.state.stats.energy = clamp(this.state.stats.energy - 3, 0, 100);
    this.state.stats.hygiene = clamp(this.state.stats.hygiene - 4, 0, 100);
    if (names.length > 0) sfx.pickup();
    this.toast(names.length > 0 ? `Найдено: ${names.join(', ')}` : 'В баке пусто...', names.length > 0 ? 'good' : 'info');
    if (found.includes('spoiled') && Math.random() < 0.2) { this.state.ill = 'poison'; this.toast('Вы поворошили что-то тухлое...', 'bad'); }
    this.bump();
// Трекинг ачивок
for (const id of found) {
  if (id === 'can05' || id === 'can1' || id === 'wbotl') {
    this.updateAchievement('bottle_1', 1);
    this.updateAchievement('bottle_100', 1);
    this.updateAchievement('bottle_500', 1);
    this.updateAchievement('bottle_1000', 1);
  }
}
  }

  // --- кража на цехе (рискованно) ---
  attemptTheft(id: string) {
    const def = THEFT_OPTIONS.find(t => t.id === id);
    if (!def) return;
    this.closeModal();
    const caught = Math.random() < def.risk;
    if (caught) {
      // попались: штраф + участок, если нет паспорта
      const fine = 500;
      this.state.money = Math.max(0, this.state.money - fine);
      sfx.fail();
      this.shake = 1;
      if (!this.hasItem('passport')) {
        this.state.stats.mood = clamp(this.state.stats.mood - 30, 0, 100);
        this.state.time = clamp(this.state.time + 120, 0, 1439);
        this.px = 67.5 * T; this.py = 36 * T; // к участку
        this.toast(`🚨 Поймали! Штраф ${fine} ₽, 2 часа в участке, −30 настроения`, 'bad');
      } else {
        this.toast(`🚨 Поймали с поличным! Штраф ${fine} ₽, украденное конфисковано`, 'bad');
      }
      this.state.rep.police = clamp(this.state.rep.police - 15, 0, 100);
    } else {
      this.gainMoney(def.reward);
      this.state.rep.homeless = clamp(this.state.rep.homeless + 5, 0, 100);
      sfx.coin();
      this.toast(`✅ Украдено: ${def.name.toLowerCase()}! +${fmt(def.reward)} ₽`, 'money');
    }
    this.bump();
this.updateAchievement('steal_workshop', 1);
  }

  // --- рыбалка ---
  fishResult(count: number) {
    this.closeModal();
    if (count > 0) {
      this.addItem('fish', count);
      this.questProgress('fish', count);
      this.toast(`Улов: рыба ×${count}`, 'good');
      sfx.win();
    } else this.toast('Рыба сорвалась...', 'info');
    this.bump();
  }

  // --- больница ---
  hospitalize() {
    const s = this.state;
    s.hospitalizations++;
    s.inv = s.inv.filter(i => ITEMS[i.id].cat !== 'scrap' && ITEMS[i.id].cat !== 'mat');
    s.money = Math.floor(s.money / 2);
    s.stats.hp = 60; s.stats.energy = 70; s.stats.fatigue = 30;
    s.ill = '';
    s.time = 9 * 60; s.day++;
    if (this.mode.type === 'interior') this.mode = { type: 'world' };
    this.px = 50 * T; this.py = 37.5 * T;
    this.onNewDay(false);
    if (s.hospitalizations >= 5) { this.openModal({ kind: 'gameover' }); }
    else { sfx.fail(); this.openModal({ kind: 'hospital' }); }
    this.bump();
  }
  private checkMilestones() {
    const s = this.state;
    const mk = (id: string, text: string) => {
      if (!s.milestones.includes(id)) { s.milestones.push(id); this.toast('В Е Х А: ' + text, 'good'); sfx.win(); }
    };
    if (s.housing === 'room') mk('room', 'Первое жильё — комната!');
    if (s.ownedApts.length === 1) mk('apt1', 'Своя квартира!');
    if (s.money >= 1000000) mk('million', 'Вы — миллионер!');
    if (s.workers.some(w => w.hired)) mk('brigade', 'Своя бригада!');
  }
  private refreshLostDog() {
    this.lostDog = null;
    if (this.state.quests.some(q => q.def.counter === 'dog' && !q.claimed && q.progress < 1)) {
      this.lostDog = { x: ri(8, 90) * T, y: ri(46, 56) * T };
    }
  }

  toggleMute() { setMuted(!isMuted()); this.bump(); }

  // ==================== РЕНДЕР ====================
  private outfit(): Outfit {
    const s = this.state;
    const hy = s.stats.hygiene;
    const dirty = hy < 40;
    const eq = s.equipped;
    const torso = eq.torso, legs = eq.legs, head = eq.head;
    let o: Outfit;
    if (torso === 'suit') o = { skin: '#e0c0a0', hair: '#241a10', shirt: '#e8e2d0', pants: '#2c2c38', jacket: '#2c2c38', trim: '#8a2020' };
    else if (torso === 'nike') o = { skin: '#e0c0a0', hair: '#241a10', shirt: '#2a2a34', pants: '#3a3a48', jacket: '#2a2a34', trim: '#e0483e' };
    else if (torso === 'wjacket') o = { skin: '#e0c0a0', hair: '#3a2c1e', shirt: '#3e5e82', pants: legs === 'jeans' ? '#4a5a72' : '#4e463c', jacket: '#2e4a6e', trim: '#8a9aa8' };
    else if (torso === 'tshirt' || legs === 'jeans') o = { skin: '#e0c0a0', hair: '#3a2c1e', shirt: torso === 'tshirt' ? '#3e6ea2' : '#6e5e4a', pants: legs === 'jeans' ? '#4a5a72' : '#4e463c' };
    else o = { skin: dirty ? '#c8a888' : '#d8b898', hair: '#4a3a2a', shirt: '#6e5e4a', pants: '#4e463c' };
    if (head === 'hat') o.hat = '#8a4a3a';
    if (dirty && torso !== 'suit' && torso !== 'nike') { o.shirt = '#5e564a'; o.pants = '#463f36'; }
    return o;
  }
  private render(t: number) {
    const v: View = {
      world: this.world,
      interior: this.mode.type === 'interior' ? this.world.interiors[this.mode.id] : null,
      worldCanvas: this.worldCanvas, intCanvases: this.intCanvases,
      px: this.px, py: this.py, dir: this.dir, anim: this.anim, moving: this.moving,
      outfit: this.outfit(), sleeping: false,
      camX: this.camX, camY: this.camY, vw: this.vw, vh: this.vh, zoom: this.zoom,
      timeMin: this.state.time, weather: this.state.weather,
      npcs: this.npcs, dogs: this.dogs,
      floats: this.floats, particles: this.particles,
      shake: this.shake, flash: this.flash,
      nearObj: !this.modal ? (this.nearObj ?? (this.intObj ? { x: this.intObj.x, y: this.intObj.y } : null)) : null,
      lostDog: this.lostDog,
      piles: this.world.objects.filter(o => o.kind === 'dump'),
      roofed: this.roofed(),
      carrying: !!this.carrying,
      carryingType: this.carrying,
      forkliftMounted: this.forkliftMounted,
      forkliftDir: this.forkliftDir,
      intNpcs: this.mode.type === 'interior' ? (this.world.interiors[this.mode.id].npcs ?? []) : [],
      intObjs: this.mode.type === 'interior' ? this.world.interiors[this.mode.id].objs : [],
      cleanedTrash: this.trashCleaned,
      jobRoute: this.mode.type === 'interior' ? this.computeJobRoute(this.world.interiors[this.mode.id].objs) : null,
      brokenAppliances: this.brokenApplianceIds(),
    };
    drawScene(this.ctx, v, t);
  }

  // ==================== UI SNAPSHOT ====================
  getUI() {
    const s = this.state;
    const h = Math.floor(s.time / 60), m = Math.floor(s.time % 60);
    return {
      version: this.version,
      started: this.started,
      hasSave: this.hasSave(),
      stats: { ...s.stats }, money: s.money,
      day: s.day, timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, timeMin: s.time,
      weather: s.weather,
      district: this.mode.type === 'interior' ? 'В помещении' : districtAt(this.px, this.py),
      prompt: this.modal ? null : this.prompt,
      modal: this.modal,
      toasts: [...this.toasts],
      inv: s.inv.map(i => ({ ...i })),
      backpack: BACKPACKS[s.backpack],
      housing: s.housing,
      ownedApts: [...s.ownedApts],
      phone: s.phone,
      rep: { ...s.rep },
      criminal: s.criminal,
      ill: s.ill,
      partner: s.partner, family: s.family,
      hospitalizations: s.hospitalizations,
      cansSold: s.cansSold,
      quests: s.quests.map(q => ({ ...q })),
      workers: s.workers.map(w => ({ def: WORKERS.find(x => x.id === w.id) as WorkerDef, st: { ...w } })),
      news: s.news,
      sales: s.sales,
      flags: s.flags,
      investments: [...s.investments],
      apts: s.apts.map(a => ({ ...a })),
      sleepFade: Math.min(1, this.sleepFade),
      muted: isMuted(),
      usedOffers: this.usedOffers(),
      aptsDefs: APARTMENTS.map(a => ({ ...a })),
      milestones: [...s.milestones],
      equipped: { ...s.equipped },
      warmth: this.equippedWarmth(),
      style: this.equippedStyle(),
      eqTotals: this.equippedTotals(),
      cities: s.cities.map(c => ({ ...c })),
      cityIndex: s.cityIndex,
      cityName: this.cityNow().name,
      travel: this.travel ? { ...this.travel, toName: s.cities[this.travel.to].name } : null,
      hasPlayer: this.hasItem('player'),
      hasPhone: this.hasItem('phone1') || this.hasItem('phone2') || this.hasItem('phone3') || !!s.phone,
      job: this.factoryJobInfo(),
      factoryJob: (() => {
        const fj = s.factoryJob;
        if (!fj) return null;
        const def = ONETIME_JOBS.find(j => j.id === fj.id);
        return { id: fj.id, name: def?.name ?? fj.id, progress: fj.progress, need: def ? this.needCount(def) : 0, carrying: !!this.carrying, kind: def?.kind ?? 'carry', pay: def ? Math.round(def.pay * this.cityNow().wageMult) : 0 };
      })(),
      factoryCooldowns: (() => {
        const res: Record<string, number> = {};
        for (const j of ONETIME_JOBS) { const left = this.factoryCooldownLeft(j.id); if (left > 0) res[j.id] = left; }
        return res;
      })(),
      freeApt: s.freeApt ? { ...s.freeApt, number: FREE_APT.number, rentAfter: FREE_APT.rentAfter } : null,
      forkliftMounted: this.forkliftMounted,
      carryingType: this.carrying,
      docs: { ...s.docs, passport: this.hasItem('passport') },
      pois: this.nearbyPois(),
      achievementsUnlocked: Object.values(s.achievements).filter(a => a.unlocked).length,
      achievementsTotal: ACHIEVEMENTS.length,
    };
  }
}

export type UIState = ReturnType<Game['getUI']>;
export type { ApartmentDef };
