import type { World, Interior, Npc, Dog, WObj, InteriorObj } from './world';
import { T, MW, MH, tileAt } from './world';
import { VEHICLES } from './core';

export interface Outfit {
  skin: string; hair: string; shirt: string; pants: string;
  jacket?: string; hat?: string; trim?: string; dress?: string;
}
export interface FloatText { x: number; y: number; text: string; color: string; t: number; }
export interface Particle { x: number; y: number; vx: number; vy: number; t: number; kind: 'rain' | 'snow' | 'spark' | 'dust' | 'zZ'; }
export interface View {
  world: World; interior: Interior | null;
  worldCanvas: HTMLCanvasElement; intCanvases: Record<string, HTMLCanvasElement>;
  px: number; py: number; dir: number; anim: number; moving: boolean;
  outfit: Outfit; sleeping: boolean;
  camX: number; camY: number; vw: number; vh: number; zoom: number;
  timeMin: number; weather: 'sun' | 'rain' | 'snow' | 'heat';
  npcs: Npc[]; dogs: Dog[];
  floats: FloatText[]; particles: Particle[];
  shake: number; flash: number;
  nearObj: { x: number; y: number; } | null;
  lostDog: { x: number; y: number } | null;
  piles: WObj[];
  roofed: boolean;
  carrying: boolean;
  carryingType: 'sheets' | 'beams' | 'alu' | 'pallet' | null;
  forkliftMounted: boolean;
  forkliftDir: number;
  intNpcs: Npc[];
  intObjs: InteriorObj[];
  cleanedTrash: string[];
  jobRoute: { from: { x: number; y: number; label: string }; to: { x: number; y: number; label: string } | null } | null;
  brokenAppliances: string[]; // id сломанной техники ('stove','fridge','washer','sofa')
}

const TILE_COL = ['#5c8a4a', '#3e4248', '#8a8f96', '#7a6a52', '#6e7278', '#3e6a8a', '#c8b888', '#9aa0a8'];
const TILE_DARK = ['#527e42', '#383c42', '#7e838a', '#70614b', '#656a70', '#375f7c', '#bcad7e', '#8e949c'];

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
const srand = (seed: number) => { let s = seed || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ==================== ПРЕ-РЕНДЕР МИРА ====================
export function prerenderWorld(world: World): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = MW * T; c.height = MH * T;
  const g = c.getContext('2d')!;
  // плитка
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const t = tileAt(world, tx, ty);
    const r = srand(ty * 131 + tx * 7 + 1);
    g.fillStyle = r() > .5 ? TILE_COL[t] : TILE_DARK[t];
    g.fillRect(tx * T, ty * T, T, T);
    if (t === 0 || t === 3) { // трава/земля — крапинки
      for (let k = 0; k < 3; k++) {
        g.fillStyle = t === 0 ? 'rgba(30,60,20,.35)' : 'rgba(50,40,25,.3)';
        g.fillRect(tx * T + r() * 28, ty * T + r() * 28, 3, 2);
      }
    }
    if (t === 1 && ty === 37 && tx % 3 !== 0) { g.fillStyle = '#c8b23e'; g.fillRect(tx * T + 4, ty * T + 14, 20, 3); }
    if (t === 2) { g.strokeStyle = 'rgba(0,0,0,.12)'; g.strokeRect(tx * T + .5, ty * T + .5, T, T); }
  }
  // зебры на перекрёстках
  const zebra = (zx: number) => {
    for (let i = 0; i < 3; i++) for (let s = 0; s < 4; s++) {
      g.fillStyle = '#d8dce2'; g.fillRect((zx + i) * T + 4 + s * 0, 36 * T + 2 + s * 24, 24, 14);
    }
  };
  zebra(18); zebra(50); zebra(82);

  // здания
  for (const b of world.buildings) {
    const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 6, y + 8, w, h);
    g.fillStyle = b.wall; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, w, 6);
    g.fillStyle = b.roof; g.fillRect(x - 3, y - 6, w + 6, 14);
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2; g.strokeRect(x - 3, y - 6, w + 6, h + 6);
    // окна
    const rows = Math.max(1, Math.floor((h - 34) / 26));
    const cols = Math.max(1, Math.floor((w - 16) / 24));
    for (let rj = 0; rj < rows; rj++) for (let ci = 0; ci < cols; ci++) {
      const wx = x + 10 + ci * 24, wy = y + 16 + rj * 26;
      if (wy > y + h - 26) continue;
      g.fillStyle = 'rgba(20,24,40,.85)'; g.fillRect(wx, wy, 14, 16);
      g.fillStyle = 'rgba(140,190,255,.25)'; g.fillRect(wx + 2, wy + 2, 10, 5);
    }
    // дверь
    g.fillStyle = '#241a10'; g.fillRect(x + w / 2 - 11, y + h - 22, 22, 22);
    g.fillStyle = '#4a3a26'; g.fillRect(x + w / 2 - 9, y + h - 20, 18, 20);
    g.fillStyle = '#c8b888'; g.fillRect(x + w / 2 - 14, y + h - 2, 28, 6);
    // вывеска
    if (b.sign) {
      const tw = Math.min(w - 8, b.sign.length * 8.2 + 14);
      g.fillStyle = '#141821'; rr(g, x + w / 2 - tw / 2, y + 2, tw, 15, 3); g.fill();
      g.strokeStyle = 'rgba(255,181,46,.6)'; g.lineWidth = 1; rr(g, x + w / 2 - tw / 2, y + 2, tw, 15, 3); g.stroke();
      g.fillStyle = '#ffcf6e'; g.font = '9px "Russo One"'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(b.sign, x + w / 2, y + 10, tw - 8);
    }
    // купол церкви
    if (b.kind === 'church') {
      g.fillStyle = '#d8b23e'; g.beginPath(); g.arc(x + w / 2, y - 14, 12, Math.PI, 0); g.fill();
      g.fillRect(x + w / 2 - 1.5, y - 34, 3, 12); g.fillRect(x + w / 2 - 6, y - 29, 12, 3);
    }
    if (b.kind === 'vokzal') {
      g.fillStyle = '#e8e2d0'; g.beginPath(); g.arc(x + w / 2, y + 26, 9, 0, 7); g.fill();
      g.strokeStyle = '#241a10'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x + w / 2, y + 26); g.lineTo(x + w / 2, y + 20); g.moveTo(x + w / 2, y + 26); g.lineTo(x + w / 2 + 5, y + 28); g.stroke();
    }
    if (b.kind === 'police_station') {
      g.fillStyle = '#141821'; g.fillRect(x + w / 2 - 12, y - 16, 24, 8);
      g.fillStyle = '#3e6ae0'; g.fillRect(x + w / 2 - 10, y - 14, 9, 4);
      g.fillStyle = '#e0483e'; g.fillRect(x + w / 2 + 1, y - 14, 9, 4);
    }
  }
// лавочки
for (const o of world.objects) if (o.kind === 'bench') {
  // Проверяем, не является ли объект парковочной машиной или парковкой
  if (o.data && (o.data.startsWith('car_') || o.data === 'parking_pond')) {
    // Рисуем припаркованную машину
    const carColor = o.data === 'car_gray' ? '#808080' : o.data === 'car_black' ? '#2a2a2a' : o.data === 'car_white' ? '#f0f0f0' : '#606060';
    g.fillStyle = carColor; 
    g.fillRect(o.x - 14, o.y - 8, 28, 14); // корпус машины
    g.fillStyle = '#1a1a1a'; // окна
    g.fillRect(o.x - 10, o.y - 5, 8, 8);
    g.fillRect(o.x + 2, o.y - 5, 8, 8);
    g.fillStyle = '#333'; // колеса
    g.fillRect(o.x - 12, o.y + 4, 6, 4);
    g.fillRect(o.x + 6, o.y + 4, 6, 4);
  } else {
    // Обычная скамейка
    g.fillStyle = '#5e4630'; g.fillRect(o.x - 20, o.y - 4, 40, 6);
    g.fillStyle = '#7a5c3e'; g.fillRect(o.x - 20, o.y - 10, 40, 5);
    g.fillStyle = '#3a2c1e'; g.fillRect(o.x - 18, o.y + 2, 4, 6); g.fillRect(o.x + 14, o.y + 2, 4, 6);
  }
}

// Транспорт игрока на парковке
for (const o of world.objects) {
  if (o.kind !== 'vehicle') continue;
  
  const vehicleId = o.data;
  if (!vehicleId) continue;
  
  // Проверяем — куплен ли этот транспорт
  // (пока рисуем все, позже можно добавить проверку state.vehicles)
  
  const colors: Record<string, string> = {
    bike_old: '#8B7355',
    scooter_china: '#4a6741',
    car_lada: '#c0c0c0',
    car_kia: '#ffffff',
    car_toyota: '#1a1a2e',
    truck_gaz: '#ffffff',
  };
  
  const color = colors[vehicleId] || '#8a8f96';
  
  if (vehicleId === 'bike_old') {
    // Велосипед — БОЛЬШЕ И ЗАМЕТНЕЕ
    g.fillStyle = '#1a1a1a';
    g.beginPath(); g.arc(o.x - 12, o.y + 6, 9, 0, 7); g.arc(o.x + 12, o.y + 6, 9, 0, 7); g.fill();
    g.strokeStyle = color; g.lineWidth = 3;
    g.beginPath(); g.moveTo(o.x - 12, o.y + 6); g.lineTo(o.x, o.y - 12); g.lineTo(o.x + 12, o.y + 6); g.stroke();
    g.fillStyle = '#3a3a3a'; g.fillRect(o.x - 3, o.y - 16, 6, 10);
    // Рама
    g.strokeStyle = '#5e4630'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(o.x - 8, o.y + 6); g.lineTo(o.x, o.y - 8); g.lineTo(o.x + 8, o.y + 6); g.stroke();
  } else if (vehicleId === 'scooter_china') {
    // Скутер
    g.fillStyle = '#1a1a1a';
    g.beginPath(); g.arc(o.x - 8, o.y + 6, 7, 0, 7); g.arc(o.x + 8, o.y + 6, 7, 0, 7); g.fill();
    g.fillStyle = color;
    g.fillRect(o.x - 10, o.y - 10, 20, 12);
    g.fillStyle = '#3a3a3a'; g.fillRect(o.x - 3, o.y - 16, 6, 10);
  } else {
    // Машины — БОЛЬШИЕ И ЗАМЕТНЫЕ
    g.fillStyle = 'rgba(0,0,0,.3)';
    g.beginPath(); g.ellipse(o.x, o.y + 8, 28, 8, 0, 0, 7); g.fill();
    g.fillStyle = color;
    g.fillRect(o.x - 24, o.y - 12, 48, 18);
    g.fillStyle = '#9ec8e8';
    g.fillRect(o.x - 16, o.y - 10, 32, 8);
    g.fillStyle = '#1a1a1a';
    g.beginPath(); g.arc(o.x - 16, o.y + 6, 6, 0, 7); g.arc(o.x + 16, o.y + 6, 6, 0, 7); g.fill();
    // Фары
    g.fillStyle = '#ffe8a8';
    g.fillRect(o.x - 22, o.y - 8, 4, 4);
    g.fillRect(o.x + 18, o.y - 8, 4, 4);
  }
}
  // фонари
  for (const l of world.lamps) {
    g.fillStyle = '#3a3f48'; g.fillRect(l.x - 2, l.y - 26, 4, 28);
    g.fillStyle = '#2c3038'; g.fillRect(l.x - 7, l.y - 30, 14, 6);
    g.fillStyle = '#ffe8a8'; g.fillRect(l.x - 5, l.y - 25, 10, 3);
  }
  // деревья (стволы)
  for (const tr of world.trees) {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(tr.x + 3, tr.y + 4, 9, 4, 0, 0, 7); g.fill();
    g.fillStyle = '#5e4630'; g.fillRect(tr.x - 3, tr.y - 8, 6, 12);
  }
  // берег пруда
  const pond = world.objects.find(o => o.id === 'pond');
  if (pond) {
    g.fillStyle = '#6e5236'; g.fillRect(pond.x - 6, pond.y - 26, 12, 30);
    g.fillStyle = '#8a6a46'; g.fillRect(pond.x - 30, pond.y - 26, 60, 6);
  }
  // касса вокзала и остановки
  for (const o of world.objects) {
    if (o.kind === 'ticket') {
      g.fillStyle = '#3e4248'; rr(g, o.x - 16, o.y - 22, 32, 22, 3); g.fill();
      g.fillStyle = '#ffb52e'; g.fillRect(o.x - 12, o.y - 16, 24, 8);
      g.fillStyle = '#241a10'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('КАССА', o.x, o.y - 10);
      g.fillStyle = '#5ce0d3'; g.font = '8px "Russo One"'; g.fillText('БИЛЕТЫ', o.x, o.y - 26);
    } else if (o.kind === 'busstop') {
      g.fillStyle = '#3a3f48'; g.fillRect(o.x - 2, o.y - 30, 4, 30);
      g.fillStyle = '#5ce0d3'; rr(g, o.x - 12, o.y - 42, 24, 14, 3); g.fill();
      g.fillStyle = '#12141c'; g.font = '9px "Russo One"'; g.textAlign = 'center'; g.fillText('🚌', o.x, o.y - 32);
    } else if (o.kind === 'trashcan') {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(o.x, o.y + 12, 13, 5, 0, 0, 7); g.fill();
      g.fillStyle = '#2d5a27'; rr(g, o.x - 11, o.y - 12, 22, 24, 3); g.fill();
      g.fillStyle = '#1a3a1a'; rr(g, o.x - 13, o.y - 16, 26, 7, 3); g.fill();
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(o.x - 8, o.y - 8, 3, 16);
      g.fillStyle = '#8ee06e'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('БАК', o.x, o.y + 22);
    } else if (o.kind === 'theft') {
      g.fillStyle = '#1a1e26'; rr(g, o.x - 13, o.y - 22, 26, 30, 2); g.fill();
      g.fillStyle = '#3a2c1e'; rr(g, o.x - 10, o.y - 19, 20, 26, 2); g.fill();
      g.fillStyle = '#c8a86e'; g.fillRect(o.x + 4, o.y - 8, 3, 5);
      g.fillStyle = '#ff5a5a'; g.font = '8px "Russo One"'; g.textAlign = 'center'; g.fillText('ЧЁРНЫЙ ВХОД', o.x, o.y - 26);
      g.fillStyle = '#ffb52e'; g.fillText('⚠', o.x, o.y + 18);
    }
  }
  return c;
}

// ==================== ПРЕ-РЕНДЕР ИНТЕРЬЕРА ====================
export function prerenderInterior(int: Interior): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = int.w * T; c.height = int.h * T;
  const g = c.getContext('2d')!;
  const r = srand(hash(int.id));
  for (let ty = 0; ty < int.h; ty++) for (let tx = 0; tx < int.w; tx++) {
    g.fillStyle = (tx + ty) % 2 ? int.floor : shade(int.floor, -8);
    g.fillRect(tx * T, ty * T, T, T);
  }
  // стены
  g.fillStyle = int.wall;
  g.fillRect(0, 0, int.w * T, T); g.fillRect(0, 0, T, int.h * T); g.fillRect((int.w - 1) * T, 0, T, int.h * T);
  g.fillRect(0, (int.h - 1) * T, int.w * T, T);
  g.fillStyle = shade(int.wall, -25); g.fillRect(T, T, (int.w - 2) * T, 5);
  // дверь-выход (по центру нижней стены — совпадает с объектом exit)
  const doorX = Math.floor(int.w / 2) * T + 16;
  g.fillStyle = '#4a3a26'; g.fillRect(doorX - 12, (int.h - 1) * T + 2, T - 8, T - 4);
  g.fillStyle = '#c8b23e'; g.font = '8px "Russo One"'; g.textAlign = 'center'; g.fillText('ВЫХОД', doorX, (int.h - 1) * T + 18);
  // коврик-подсказка перед дверью (внутри комнаты)
  g.fillStyle = 'rgba(200,178,62,.28)'; g.fillRect(doorX - 14, (int.h - 1) * T - 22, 28, 20);
  g.strokeStyle = 'rgba(200,178,62,.7)'; g.lineWidth = 1; g.strokeRect(doorX - 14, (int.h - 1) * T - 22, 28, 20);
  const solidAt = (tx: number, ty: number) => int.solids.some(s =>
    tx * T >= s.x && tx * T < s.x + s.w && ty * T >= s.y && ty * T < s.y + s.h);
  if (int.kind === 'shop') {
    // прилавок
    g.fillStyle = '#6e5236'; g.fillRect(3 * T, 2 * T, 9 * T, T);
    g.fillStyle = '#8a6a46'; g.fillRect(3 * T, 2 * T, 9 * T, 8);
    g.fillStyle = '#3e4248'; g.fillRect(6.4 * T, 2 * T + 10, 20, 14);
    // полки с товаром
    const cols = ['#d85a5a', '#5a8ad8', '#5ad878', '#d8c85a', '#b05ad8', '#5ad8c8'];
    for (const [y1] of [[4], [7]]) for (const x1 of [2, 6, 10]) {
      g.fillStyle = '#8a8f96'; g.fillRect(x1 * T, y1 * T, 3 * T, 2 * T);
      g.fillStyle = '#5e646c'; g.fillRect(x1 * T, y1 * T + T - 4, 3 * T, 4);
      for (let k = 0; k < 12; k++) {
        g.fillStyle = cols[Math.floor(r() * cols.length)];
        g.fillRect(x1 * T + 6 + (k % 6) * 15, y1 * T + 6 + Math.floor(k / 6) * 32, 9, 14);
      }
    }
  } else if (int.kind === 'shelter') {
    for (let j = 2; j <= 8; j++) { // нары
      g.fillStyle = '#4e4238'; g.fillRect(2 * T, j * T, 2 * T, T);
      g.fillStyle = j % 2 ? '#6e6a5e' : '#5e5a4e'; g.fillRect(2 * T + 4, j * T + 6, 2 * T - 8, T - 12);
    }
    g.fillStyle = '#5e5236'; g.fillRect(11 * T, 2 * T, 2 * T, 3 * T); g.fillRect(11 * T, 6 * T, 2 * T, 3 * T);
    g.fillStyle = '#3e4248'; g.fillRect(11.3 * T, 2.4 * T, 44, 30);
  } else {
    // кровать (в квартире шире)
    const bedW = int.kind === 'apartment' ? 3 * T : 2 * T;
    g.fillStyle = '#6e4a3a'; g.fillRect(2 * T, 2 * T, bedW, 2 * T);
    g.fillStyle = '#c86a6a'; g.fillRect(2 * T + 5, 2 * T + 10, bedW - 10, 2 * T - 16);
    g.fillStyle = '#e8e2d0'; g.fillRect(2 * T + 8, 2 * T + 6, bedW - 16, 10);
    if (int.kind === 'apartment') {
      // зоны и перегородки считаются от размера (синхронно с world.ts: kc=bc=w-10, bt=h-5)
      const w = int.w, h = int.h, kc = w - 10, bt = h - 5;
      // зона кухни — светлая плитка (cols kc..w-2, rows 1..bt-2)
      for (let ty = 1; ty <= bt - 2; ty++) for (let tx = kc; tx <= w - 2; tx++) {
        g.fillStyle = (tx + ty) % 2 ? '#c9cfd4' : '#bfc6cc'; g.fillRect(tx * T, ty * T, T, T);
      }
      // зона ванной — голубая плитка (cols kc..w-2, rows bt-1..h-2)
      for (let ty = bt - 1; ty <= h - 2; ty++) for (let tx = kc; tx <= w - 2; tx++) {
        g.fillStyle = (tx + ty) % 2 ? '#a8c8d8' : '#9dbccd'; g.fillRect(tx * T, ty * T, T, T);
      }
      // внутренние перегородки как стены
      const wallBlock = (x1: number, y1: number, x2: number, y2: number) => {
        g.fillStyle = int.wall; g.fillRect(x1 * T, y1 * T, (x2 - x1 + 1) * T, (y2 - y1 + 1) * T);
        g.fillStyle = shade(int.wall, -25); g.fillRect(x1 * T, y1 * T, (x2 - x1 + 1) * T, 4);
      };
      wallBlock(kc, 2, kc, 3); wallBlock(kc, 5, kc, 6);
      wallBlock(kc, bt, kc, bt + 1); wallBlock(kc, h - 2, kc, h - 2);
      wallBlock(kc + 1, bt - 1, kc + 3, bt - 1); wallBlock(kc + 5, bt - 1, w - 2, bt - 1);
      // окно в гостиной
      g.fillStyle = '#8ab8d8'; g.fillRect(9 * T, 4, 2 * T, T - 8);
      g.strokeStyle = '#f0ead8'; g.lineWidth = 2; g.strokeRect(9 * T, 4, 2 * T, T - 8);
      g.beginPath(); g.moveTo(10 * T, 4); g.lineTo(10 * T, T - 4); g.stroke();
      // ковёр в гостиной
      g.fillStyle = 'rgba(160,60,60,.45)'; g.beginPath(); g.ellipse(4.5 * T, (h - 6.4) * T, 52, 28, 0, 0, 7); g.fill();
    } else {
      g.fillStyle = '#6e5236'; g.fillRect(10 * T, 2 * T, 2 * T, T);
      g.fillStyle = '#4e8a4e'; g.beginPath(); g.arc(11 * T, 2 * T - 4, 8, 0, 7); g.fill();
      g.fillStyle = '#5e4630'; g.fillRect(2 * T, 7 * T, 2 * T, T);
    }
    if (int.id === 'i_penthouse') { // золотые акценты пентхауса
      g.strokeStyle = '#d8b23e'; g.lineWidth = 3; g.strokeRect(6, 6, (int.w - 2) * T - 12, (int.h - 2) * T - 12);
      g.fillStyle = '#8ab8d8'; g.fillRect(9 * T, 4, 3 * T, T - 8); // панорамное окно
      g.strokeStyle = '#f0ead8'; g.lineWidth = 2; g.strokeRect(9 * T, 4, 3 * T, T - 8);
    }
  }
  // объекты, рисуемые по данным (завод, цех, ванна)
  for (const o of int.objs) {
    const ox = o.x, oy = o.y;
    if (o.kind === 'machine') { // станок
      g.fillStyle = '#3e5a3e'; rr(g, ox - 30, oy - 34, 60, 40, 4); g.fill();
      g.fillStyle = '#5e7a5e'; g.fillRect(ox - 30, oy - 34, 60, 10);
      g.fillStyle = '#c8c8d0'; g.beginPath(); g.arc(ox - 12, oy - 14, 8, 0, 7); g.fill(); // штурвал
      g.fillStyle = '#2c3e2c'; g.fillRect(ox + 4, oy - 24, 20, 22);
      g.fillStyle = '#e05a2a'; g.fillRect(ox + 24, oy - 30, 4, 8); // аварийная кнопка
      g.fillStyle = '#1a1e26'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('СТАНК', ox, oy - 38);
    } else if (o.kind === 'metalpile') { // стопка листов/балок
      const beam = o.data === 'beams' || o.data === 'alu';
      for (let i = 0; i < 5; i++) {
        g.fillStyle = i % 2 ? '#9aa2ac' : '#7e8791';
        g.fillRect(ox - 40 + i * 2, oy - 8 - i * 5, 80 - i * 4, beam ? 6 : 5);
      }
      g.strokeStyle = '#1a1e26'; g.lineWidth = 1; g.strokeRect(ox - 40, oy - 32, 80, 32);
      g.fillStyle = '#c8cdd4'; g.font = '7px "Russo One"'; g.textAlign = 'center';
      g.fillText(o.data === 'sheets' ? 'ЛИСТЫ' : o.data === 'beams' ? 'БАЛКИ' : 'АЛЮМИНИЙ', ox, oy + 12);
    } else if (o.kind === 'warehouse') { // зона склада
      g.fillStyle = 'rgba(94,224,110,.12)'; g.fillRect(ox - 44, oy - 40, 88, 62);
      g.strokeStyle = '#5ee06e'; g.setLineDash([6, 4]); g.lineWidth = 2; g.strokeRect(ox - 44, oy - 40, 88, 62); g.setLineDash([]);
      // поддон с грузом
      g.fillStyle = '#8a6a3e'; g.fillRect(ox - 20, oy - 6, 40, 6);
      g.fillStyle = '#9aa2ac'; g.fillRect(ox - 16, oy - 22, 32, 16);
      g.fillStyle = '#5ee06e'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('СКЛАД', ox, oy + 14);
    } else if (o.kind === 'truck') { // грузовик
      g.fillStyle = '#5e6a72'; rr(g, ox - 60, oy - 30, 78, 34, 3); g.fill(); // кузов
      g.fillStyle = '#8a4a3e'; rr(g, ox + 18, oy - 22, 34, 26, 3); g.fill(); // кабина
      g.fillStyle = '#9ec8e8'; g.fillRect(ox + 24, oy - 18, 16, 12);
      g.fillStyle = '#1a1e26'; g.beginPath(); g.arc(ox - 40, oy + 6, 7, 0, 7); g.arc(ox + 30, oy + 6, 7, 0, 7); g.fill();
      g.fillStyle = '#c8cdd4'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('ГРУЗОВИК', ox, oy + 22);
    } else if (o.kind === 'ramp') { // пандус
      g.fillStyle = '#7e838a'; g.beginPath(); g.moveTo(ox - 24, oy + 14); g.lineTo(ox + 24, oy + 14); g.lineTo(ox + 24, oy - 10); g.closePath(); g.fill();
      g.strokeStyle = '#ffd34d'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(ox - 8 + i * 10, oy + 12); g.lineTo(ox + 2 + i * 8, oy - 2 - i * 3); g.stroke(); }
      g.fillStyle = '#c8cdd4'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('ПАНДУС', ox, oy + 24);
    } else if (o.kind === 'desk') { // стол мастера
      g.fillStyle = '#6e5236'; rr(g, ox - 30, oy - 22, 60, 28, 3); g.fill();
      g.fillStyle = '#8a6a46'; g.fillRect(ox - 30, oy - 22, 60, 6);
      g.fillStyle = '#e8e2d0'; g.fillRect(ox - 14, oy - 14, 18, 12); // бумаги
      g.fillStyle = '#3e4248'; g.fillRect(ox + 10, oy - 18, 12, 8); // кружка... нет, рация
      g.fillStyle = '#ffd34d'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('МАСТЕР', ox, oy - 26);
    } else if (o.kind === 'bath') { // ванна
      g.fillStyle = '#e8eef2'; rr(g, ox - 26, oy - 16, 52, 30, 10); g.fill();
      g.fillStyle = '#a8d0e0'; rr(g, ox - 20, oy - 10, 40, 18, 7); g.fill();
      g.fillStyle = '#5a8ad8'; g.beginPath(); g.arc(ox + 18, oy - 14, 3, 0, 7); g.fill();
      g.fillStyle = '#5a8ad8'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('ВАННА', ox, oy + 22);
    } else if (o.kind === 'pallet') { // стопка поддонов
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i % 2 ? '#a8834e' : '#8a6a3e';
        g.fillRect(ox - 30, oy - 6 - i * 9, 60, 7);
        g.fillStyle = '#6e5230';
        g.fillRect(ox - 26, oy - 4 - i * 9, 8, 4); g.fillRect(ox - 4, oy - 4 - i * 9, 8, 4); g.fillRect(ox + 18, oy - 4 - i * 9, 8, 4);
      }
      g.strokeStyle = '#1a1e26'; g.lineWidth = 1; g.strokeRect(ox - 30, oy - 32, 60, 32);
      g.fillStyle = '#c8a86e'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('ПОДДОНЫ', ox, oy + 12);
    } else if (o.kind === 'stove') { // плита
      g.fillStyle = '#3a3f46'; rr(g, ox - 24, oy - 18, 48, 34, 4); g.fill();
      g.fillStyle = '#20242b'; for (const [bx, by] of [[-12, -8], [12, -8], [-12, 6], [12, 6]]) { g.beginPath(); g.arc(ox + bx, oy + by, 5, 0, 7); g.fill(); }
      g.fillStyle = '#c8cdd4'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('ПЛИТА', ox, oy + 26);
    } else if (o.kind === 'fridge') { // холодильник
      g.fillStyle = '#d8dce2'; rr(g, ox - 16, oy - 26, 32, 44, 3); g.fill();
      g.fillStyle = '#b8bec6'; g.fillRect(ox - 16, oy - 8, 32, 2);
      g.fillStyle = '#8a929c'; g.fillRect(ox + 10, oy - 22, 3, 12); g.fillRect(ox + 10, oy - 2, 3, 14);
      g.fillStyle = '#8a929c'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('ХОЛОДИЛЬНИК', ox, oy + 28);
    } else if (o.kind === 'washer') { // стиральная машина
      g.fillStyle = '#e0e4e8'; rr(g, ox - 15, oy - 16, 30, 32, 3); g.fill();
      g.fillStyle = '#8ab8d8'; g.beginPath(); g.arc(ox, oy, 9, 0, 7); g.fill();
      g.fillStyle = '#5a8ad8'; g.beginPath(); g.arc(ox, oy, 5, 0, 7); g.fill();
      g.fillStyle = '#8a929c'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('СТИРАЛКА', ox, oy + 26);
    } else if (o.kind === 'tv') { // телевизор
      g.fillStyle = '#241a10'; rr(g, ox - 26, oy - 22, 52, 36, 3); g.fill();
      g.fillStyle = '#3e6a8a'; g.fillRect(ox - 22, oy - 18, 44, 28);
      g.fillStyle = '#6e5236'; g.fillRect(ox - 6, oy + 14, 12, 4);
      g.fillStyle = '#8a929c'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('ТВ', ox, oy + 28);
    } else if (o.kind === 'toilet') { // унитаз
      g.fillStyle = '#e8eef2'; rr(g, ox - 11, oy - 14, 22, 26, 8); g.fill();
      g.fillStyle = '#c8d4dc'; g.beginPath(); g.ellipse(ox, oy + 2, 9, 7, 0, 0, 7); g.fill();
      g.fillStyle = '#8a929c'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('УНИТАЗ', ox, oy + 24);
    } else if (o.kind === 'sofa') { // диван
      g.fillStyle = '#5a7a5e'; rr(g, ox - 28, oy - 16, 56, 30, 6); g.fill();
      g.fillStyle = '#4a6a50'; g.fillRect(ox - 24, oy - 10, 48, 12);
      g.fillStyle = '#6e8a70'; g.fillRect(ox - 28, oy - 16, 56, 6);
    } else if (o.kind === 'kitchen') { // кухонная столешница (управление)
      g.fillStyle = '#9aa0a8'; rr(g, ox - 26, oy - 16, 52, 32, 3); g.fill();
      g.fillStyle = '#7e8791'; g.fillRect(ox - 26, oy - 16, 52, 6);
      g.fillStyle = '#c8cdd4'; g.font = '7px "Russo One"'; g.textAlign = 'center'; g.fillText('УПРАВЛЕНИЕ', ox, oy + 26);
    }
    // мусор и погрузчик рисуются динамически в drawScene (состояние меняется)
  }
  return c;
}
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt)), gg = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${gg},${b})`;
}

// ==================== ПЕРСОНАЖИ ====================
export function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, anim: number, moving: boolean, o: Outfit, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  const swing = moving ? Math.sin(anim * 11) * 3.2 : 0;
  // тень
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(0, 1, 8, 3.6, 0, 0, 7); ctx.fill();
  // ноги
  ctx.fillStyle = o.pants;
  ctx.fillRect(-5, -9 + Math.max(0, swing), 4, 9 - Math.max(0, swing));
  ctx.fillRect(1, -9 + Math.max(0, -swing), 4, 9 - Math.max(0, -swing));
  // руки
  ctx.fillStyle = o.jacket ?? o.shirt;
  ctx.fillRect(-9, -19 + swing * .6, 4, 10);
  ctx.fillRect(5, -19 - swing * .6, 4, 10);
  ctx.fillStyle = o.skin;
  ctx.fillRect(-9, -10 + swing * .6, 4, 3);
  ctx.fillRect(5, -10 - swing * .6, 4, 3);
  // торс
  ctx.fillStyle = o.shirt;
  rr(ctx, -7, -20, 14, 12, 3); ctx.fill();
  if (o.jacket) {
    ctx.fillStyle = o.jacket;
    rr(ctx, -7, -20, 14, 12, 3); ctx.fill();
    ctx.fillStyle = o.trim ?? shade(o.jacket, 30);
    ctx.fillRect(-1.5, -20, 3, 12);
  }
  if (o.dress) { ctx.fillStyle = o.dress; ctx.fillRect(-7, -12, 14, 5); }
  // голова
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(0, -25, 5.6, 0, 7); ctx.fill();
  // волосы
  ctx.fillStyle = o.hair;
  if (dir === 1) { ctx.beginPath(); ctx.arc(0, -25.5, 5.8, 0, 7); ctx.fill(); }
  else {
    ctx.beginPath(); ctx.arc(0, -26.5, 5.6, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.fillRect(-5.6, -27, 11.2, 3);
  }
  if (o.hat) {
    ctx.fillStyle = o.hat;
    ctx.beginPath(); ctx.arc(0, -26.5, 6, Math.PI, 0); ctx.fill();
    ctx.fillRect(-6, -27, 12, 3);
  }
  // лицо
  if (dir !== 1) {
    ctx.fillStyle = '#1a1410';
    const ex = dir === 2 ? -2 : dir === 3 ? 2 : 0;
    if (dir === 0) { ctx.fillRect(-2.6, -26, 1.6, 2); ctx.fillRect(1, -26, 1.6, 2); }
    else ctx.fillRect(ex - .8, -26, 1.6, 2);
  }
  ctx.restore();
}

export function npcOutfit(n: Npc): Outfit {
  const r = srand(n.seed);
  const skins = ['#e8c8a8', '#d8b090', '#c89878', '#b8886a'];
  const hairs = ['#3a2c1e', '#241a10', '#6e5a3e', '#8a8a8a', '#a8682e'];
  const skin = skins[Math.floor(r() * skins.length)];
  const hair = hairs[Math.floor(r() * hairs.length)];
  switch (n.kind) {
    case 'cop': return { skin: '#e0c0a0', hair: '#2a2016', shirt: '#3e5a9e', pants: '#2c3e6e', hat: '#2c3e6e', trim: '#c8c8d8' };
    case 'worker': return { skin, hair, shirt: '#5e6a4e', pants: '#4a4a42', jacket: '#4e5a42', hat: '#6e4a3a' };
    case 'foreman': return { skin: '#e0c0a0', hair: '#5e5a4e', shirt: '#e8e2d0', pants: '#3e4a5a', jacket: '#e0862e', hat: '#f0ead8', trim: '#ffd34d' };
    case 'tramp': return { skin, hair: '#4a4a4a', shirt: '#3e3a36', pants: '#32302c', jacket: '#4a423c' };
    case 'granny': return { skin: '#e0c8b0', hair: '#d8d8d8', dress: '#8a5e8e', shirt: '#a87aa8', pants: '#6e5a6e' };
    case 'realtor': return { skin: '#e0c0a0', hair: '#241a10', shirt: '#e8e2d0', pants: '#3e3a48', jacket: '#3e3a48', trim: '#a23e3e' };
    case 'fisher': return { skin: '#d8a880', hair: '#5e5a4e', shirt: '#d8862e', pants: '#5a6a7a', hat: '#c8b23e' };
    case 'shopkeeper': return { skin: '#e8c8a8', hair: '#3a2c1e', shirt: '#4a8a9e', pants: '#3e4a5a' };
    case 'lostdog': return { skin, hair, shirt: '#e8e2d0', pants: '#c8c0b0' };
    default: {
      const shirts = ['#a25a5a', '#5a7aa2', '#7a9e5a', '#9e7aa2', '#c8a25a', '#5a9e9a'];
      const pants = ['#3e4a5a', '#5a4a3e', '#4a4a52', '#6a5a4a'];
      return { skin, hair, shirt: shirts[Math.floor(r() * shirts.length)], pants: pants[Math.floor(r() * pants.length)], jacket: r() > .6 ? '#4a5262' : undefined };
    }
  }
}

function drawDog(ctx: CanvasRenderingContext2D, d: Dog, t: number) {
  ctx.save();
  ctx.translate(Math.round(d.x), Math.round(d.y));
  const flip = d.tx < d.x ? -1 : 1;
  ctx.scale(flip, 1);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 1, 10, 3.5, 0, 0, 7); ctx.fill();
  const wag = Math.sin(t * 10) * 3;
  ctx.fillStyle = '#6e5236';
  ctx.fillRect(-9, -8, 4, 8); ctx.fillRect(5, -8, 4, 8);       // лапы
  ctx.beginPath(); ctx.ellipse(0, -10, 11, 6, 0, 0, 7); ctx.fill(); // тело
  ctx.fillStyle = '#5e4630'; ctx.fillRect(-13, -14 + wag * .3, 4, 7); // хвост
  ctx.fillStyle = '#6e5236';
  ctx.beginPath(); ctx.arc(11, -14, 5.5, 0, 7); ctx.fill();     // голова
  ctx.fillStyle = '#5e4630';
  ctx.beginPath(); ctx.moveTo(8, -19); ctx.lineTo(11, -22); ctx.lineTo(12, -17); ctx.fill(); // ухо
  ctx.fillStyle = '#1a1410'; ctx.fillRect(12, -15, 1.8, 1.8);
  ctx.restore();
}

function drawPile(ctx: CanvasRenderingContext2D, o: WObj, t: number) {
  const r = srand(hash(o.id));
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 4, 26, 8, 0, 0, 7); ctx.fill();
  const base = o.searched ? '#3e3a34' : '#55504a';
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(-24, 2); ctx.quadraticCurveTo(-20, -16, -6, -14);
  ctx.quadraticCurveTo(2, -22, 10, -13); ctx.quadraticCurveTo(24, -14, 24, 2);
  ctx.closePath(); ctx.fill();
  if (!o.searched) {
    const cols = ['#8ab8d8', '#d8dce2', '#c86a5a', '#b8b068', '#7a9e6a', '#e8e2d0'];
    for (let k = 0; k < 10; k++) {
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      const kx = -18 + r() * 36, ky = -12 + r() * 12;
      if (k % 3 === 0) { ctx.fillRect(kx, ky, 4, 7); }
      else { ctx.beginPath(); ctx.arc(kx, ky, 2.4, 0, 7); ctx.fill(); }
    }
    // мухи
    for (let k = 0; k < 3; k++) {
      const a = t * 3 + k * 2.1;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(Math.cos(a) * 14 - 1, -18 + Math.sin(a * 1.7) * 5, 2, 2);
    }
    // восклицательный знак
    const bob = Math.sin(t * 3 + o.x) * 2;
    ctx.fillStyle = '#ffd34d'; ctx.font = '12px "Russo One"'; ctx.textAlign = 'center';
    ctx.fillText('?', 0, -26 + bob);
  }
  ctx.restore();
}

// ==================== СЦЕНА ====================
let darkCanvas: HTMLCanvasElement | null = null;

function drawTrashPile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 16, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#5e4630'; ctx.beginPath(); ctx.arc(0, -6, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#7a5c3e'; ctx.fillRect(-9, -10, 7, 7); ctx.fillRect(3, -13, 6, 6); ctx.fillRect(-3, -2, 7, 5);
  ctx.fillStyle = '#9aa2ac'; ctx.fillRect(-6, -14, 4, 4); ctx.fillRect(6, -4, 4, 3);
  ctx.fillStyle = '#c8cdd4'; ctx.font = '7px "Russo One"'; ctx.textAlign = 'center';
  ctx.fillText('МУСОР', 0, 12);
  ctx.restore();
}
function drawForklift(ctx: CanvasRenderingContext2D, x: number, y: number, carrying: boolean, mounted: boolean, flip = 0) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(flip ? -1 : 1, 1); // разворот в сторону движения
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 2, 22, 7, 0, 0, 7); ctx.fill();
  // корпус
  ctx.fillStyle = '#e0a02e'; rr(ctx, -20, -24, 34, 22, 3); ctx.fill();
  ctx.fillStyle = '#c8881e'; ctx.fillRect(-20, -8, 34, 4);
  // кабина/защита
  ctx.strokeStyle = '#8a6a1e'; ctx.lineWidth = 2;
  ctx.strokeRect(-16, -38, 22, 15);
  // мачта и вилы справа
  ctx.fillStyle = '#8a8f96'; ctx.fillRect(15, -34, 3, 32);
  ctx.fillStyle = '#a8adb4'; ctx.fillRect(18, -8, 18, 3); ctx.fillRect(18, -2, 18, 3);
  // колёса
  ctx.fillStyle = '#1a1e26';
  ctx.beginPath(); ctx.arc(-12, 0, 7, 0, 7); ctx.arc(8, 0, 7, 0, 7); ctx.fill();
  // поддон на вилах — крупный и заметный
  if (carrying) {
    ctx.fillStyle = '#a8834e'; ctx.fillRect(20, -30, 34, 22);
    ctx.strokeStyle = '#7a5c34'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, -24); ctx.lineTo(50, -24);
    ctx.moveTo(24, -17); ctx.lineTo(50, -17);
    ctx.stroke();
    ctx.strokeStyle = '#1a1e26'; ctx.lineWidth = 1; ctx.strokeRect(20, -30, 34, 22);
  }
  // водитель
  if (mounted) {
    ctx.fillStyle = '#e0c0a0'; ctx.beginPath(); ctx.arc(-4, -30, 5, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(-4, -32, 5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#3e6ea2'; rr(ctx, -10, -26, 12, 9, 2); ctx.fill();
  }
  if (flip) ctx.scale(-1, 1); // вернуть текст из зеркала
  ctx.fillStyle = '#c8a86e'; ctx.font = '7px "Russo One"'; ctx.textAlign = 'center';
  ctx.fillText(mounted ? '' : 'ПОГРУЗЧИК', 0, 14);
  ctx.restore();
}

export function drawScene(ctx: CanvasRenderingContext2D, v: View, t: number) {
  const { vw, vh, zoom } = v;
  // 1) полная очистка кадра в устройственных пикселях — иначе остаются
  //    шлейфы от NPC и «просвечивает» мир (красные маячки, улица)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // тёмный фон за границами интерьера, чтобы не было «пустоты»
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.save();
  ctx.scale(zoom, zoom);
  const shX = v.shake > 0 ? (Math.random() - .5) * v.shake * 8 : 0;
  const shY = v.shake > 0 ? (Math.random() - .5) * v.shake * 8 : 0;
  ctx.translate(-v.camX + shX, -v.camY + shY);

  if (v.interior) {
    const ic = v.intCanvases[v.interior.id];
    if (ic) ctx.drawImage(ic, 0, 0);
    // продавец за прилавком
    if (v.interior.kind === 'shop') {
      drawPerson(ctx, 7 * T, 2 * T - 4, 0, t, false, npcOutfit({ id: 'sk', kind: 'shopkeeper', x: 0, y: 0, hx: 0, hy: 0, r: 0, tx: 0, ty: 0, speed: 0, seed: 5, anim: 0, moving: false }));
    }
    // мусор (убранные кучи исчезают) и погрузчик — динамически
    for (const o of v.intObjs) {
      if (o.kind === 'trash') {
        const key = `${v.interior.id}_${o.data ?? o.x}_${o.y}`;
        if (!v.cleanedTrash.includes(key)) drawTrashPile(ctx, o.x, o.y);
      } else if (o.kind === 'forklift' && !v.forkliftMounted) {
        drawForklift(ctx, o.x, o.y, false, false);
      }
    }
    // значок поломки над сломанной техникой
    if (v.brokenAppliances.length) {
      const map: Record<string, string> = { stove: 'stove', fridge: 'fridge', washer: 'washer', sofa: 'sofa' };
      for (const o of v.intObjs) {
        const apId = map[o.kind];
        if (apId && v.brokenAppliances.includes(apId)) {
          const bob = Math.sin(t * 5) * 2;
          ctx.fillStyle = '#ff5a5a'; ctx.font = '14px "Russo One"'; ctx.textAlign = 'center';
          ctx.fillText('!', o.x, o.y - 32 + bob);
          ctx.strokeStyle = 'rgba(255,90,90,.8)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(o.x, o.y - 36 + bob, 9, 0, 7); ctx.stroke();
        }
      }
    }
  } else {
    ctx.drawImage(v.worldCanvas, 0, 0);

// ✅ Отрисовка транспорта игрока на парковке
for (const o of v.world.objects) {
  if (o.kind !== 'vehicle') continue;
  // Показываем только тот транспорт, который куплен
  const owned = v.world.objects.find(vo => vo.id === o.id);
  if (!owned) continue;
  
  const def = VEHICLES[o.data];
  if (!def) continue;
  
  // Проверяем — куплен ли этот транспорт
  // (упрощённо: показываем все, в реальной игре нужно проверять state.vehicles)
  
  ctx.save();
  ctx.translate(o.x, o.y);
  
  if (o.data === 'bike_old') {
    // Велосипед
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-8, 4, 7, 0, 7); ctx.arc(8, 4, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = def.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(0, -8); ctx.lineTo(8, 4); ctx.stroke();
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(-2, -12, 4, 8);
  } else if (o.data === 'scooter_china') {
    // Скутер
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-6, 4, 5, 0, 7); ctx.arc(6, 4, 5, 0, 7); ctx.fill();
    ctx.fillStyle = def.color;
    ctx.fillRect(-8, -8, 16, 10);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(-2, -14, 4, 8);
  } else {
    // Машина
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0, 6, 22, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = def.color;
    ctx.fillRect(-20, -10, 40, 14);
    ctx.fillStyle = '#9ec8e8';
    ctx.fillRect(-12, -8, 24, 6);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-12, 4, 4, 0, 7); ctx.arc(12, 4, 4, 0, 7); ctx.fill();
  }
  
  // Подпись
  ctx.fillStyle = '#ffb52e';
  ctx.font = '7px "Russo One"';
  ctx.textAlign = 'center';
  ctx.fillText(def.icon, 0, -18);
  
  ctx.restore();
}

    for (const o of v.piles) if (o.kind === 'dump') drawPile(ctx, o, t);
  }

  // потерянная собака
  if (v.lostDog) {
    const d: Dog = { x: v.lostDog.x, y: v.lostDog.y, tx: v.lostDog.x + 1, ty: v.lostDog.y, t: 0, state: 'idle' };
    drawDog(ctx, d, t);
    ctx.fillStyle = '#8ee06e'; ctx.font = '11px "Russo One"'; ctx.textAlign = 'center';
    ctx.fillText('!', v.lostDog.x, v.lostDog.y - 26 + Math.sin(t * 4) * 3);
  }

  // сортировка по Y: NPC + собаки + игрок
  type Ent = { y: number; draw: () => void };
  const ents: Ent[] = [];
  const npcList = v.interior ? v.intNpcs : v.npcs;
  for (const n of npcList) {
    if (!v.interior && (Math.abs(n.x - v.px) > vw / zoom / 2 + 80 || Math.abs(n.y - v.py) > vh / zoom / 2 + 80)) continue;
    ents.push({
      y: n.y, draw: () => {
        drawPerson(ctx, n.x, n.y, n.tx > n.x ? 3 : n.tx < n.x ? 2 : 0, n.anim, n.moving, npcOutfit(n));
        if (n.kind === 'foreman') { // метка задания над мастером
          const bob = Math.sin(t * 4) * 3;
          ctx.fillStyle = '#ffd34d'; ctx.font = '13px "Russo One"'; ctx.textAlign = 'center';
          ctx.fillText('!', n.x, n.y - 36 + bob);
        }
        if (n.kind === 'cop') { // мигалка патруля
          if (Math.floor(t * 3) % 2 === 0) {
            ctx.fillStyle = 'rgba(94,110,224,.85)'; ctx.fillRect(n.x - 7, n.y - 35, 5, 3);
            ctx.fillStyle = 'rgba(224,72,62,.85)'; ctx.fillRect(n.x + 2, n.y - 35, 5, 3);
          }
        }
      },
    });
  }
  if (!v.interior) for (const d of v.dogs) ents.push({ y: d.y, draw: () => drawDog(ctx, d, t) });
  // игрок
  if (!v.sleeping) {
    ents.push({
      y: v.py, draw: () => {
        if (v.forkliftMounted) { // едем на погрузчике (разворот по направлению)
          drawForklift(ctx, v.px, v.py, v.carryingType === 'pallet', true, v.forkliftDir);
          return;
        }
        drawPerson(ctx, v.px, v.py, v.dir, v.anim, v.moving, v.outfit);
        if (v.carrying) { // груз над головой: цвет по типу
          const col = v.carryingType === 'beams' ? '#8a6a3e' : v.carryingType === 'alu' ? '#c8d4dc' : '#9aa2ac';
          ctx.fillStyle = col; ctx.fillRect(v.px - 14, v.py - 42, 28, 7);
          ctx.fillStyle = '#e8edf2'; ctx.fillRect(v.px - 14, v.py - 42, 28, 2);
          ctx.strokeStyle = '#1a1e26'; ctx.lineWidth = 1; ctx.strokeRect(v.px - 14, v.py - 42, 28, 7);
        }
      },
    });
  }
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.draw();

  // кроны деревьев поверх
  if (!v.interior) for (const tr of v.world.trees) {
    if (Math.abs(tr.x - v.px) > vw / zoom / 2 + 60) continue;
    ctx.fillStyle = 'rgba(46,86,38,.92)';
    ctx.beginPath(); ctx.arc(tr.x, tr.y - 22, tr.r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(92,138,74,.9)';
    ctx.beginPath(); ctx.arc(tr.x - tr.r * .25, tr.y - 26, tr.r * .6, 0, 7); ctx.fill();
  }

  // стрелки маршрута задания: откуда брать (зелёная) → куда нести (синяя)
  if (v.jobRoute) {
    const mark = (x: number, y: number, color: string, label: string) => {
      const bob = Math.sin(t * 4) * 4;
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      // стрелка-указатель
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 40 + bob); ctx.lineTo(x + 9, y - 40 + bob); ctx.lineTo(x, y - 27 + bob);
      ctx.closePath(); ctx.fill();
      if (label) {
        ctx.font = '9px "Russo One"'; ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 3;
        ctx.strokeText(label, x, y - 46 + bob);
        ctx.fillStyle = color; ctx.fillText(label, x, y - 46 + bob);
      }
    };
    if (v.jobRoute.from.label) mark(v.jobRoute.from.x, v.jobRoute.from.y, '#7dff6a', v.jobRoute.from.label);
    if (v.jobRoute.to && v.carrying) mark(v.jobRoute.to.x, v.jobRoute.to.y, '#5db8ff', v.jobRoute.to.label);
  }

  // всплывающие тексты
  for (const f of v.floats) {
    const a = Math.max(0, 1 - f.t / 1.2);
    ctx.globalAlpha = a;
    ctx.font = '11px "Russo One"'; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3;
    ctx.strokeText(f.text, f.x, f.y - f.t * 26);
    ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - f.t * 26);
    ctx.globalAlpha = 1;
  }

  // маркер взаимодействия
  if (v.nearObj) {
    const bob = Math.sin(t * 5) * 3;
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.moveTo(v.nearObj.x - 6, v.nearObj.y - 44 + bob); ctx.lineTo(v.nearObj.x + 6, v.nearObj.y - 44 + bob); ctx.lineTo(v.nearObj.x, v.nearObj.y - 36 + bob);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // ---- освещение (экранное пространство) ----
  // в интерьерах (завод, квартира) свет фиксированный — время суток и погода не влияют
  const time = v.timeMin;
  let dark = 0;
  if (!v.interior) {
    if (time >= 1260 || time < 300) dark = .8;
    else if (time >= 1140) dark = .8 * ((time - 1140) / 120);
    else if (time < 420) dark = .8 * (1 - (time - 300) / 120);
    if (v.weather === 'rain') dark = Math.max(dark, .25);
  }
  if (dark > .02) {
    if (!darkCanvas) darkCanvas = document.createElement('canvas');
    if (darkCanvas.width !== Math.ceil(vw) || darkCanvas.height !== Math.ceil(vh)) {
      darkCanvas.width = Math.ceil(vw); darkCanvas.height = Math.ceil(vh);
    }
    const dg = darkCanvas.getContext('2d')!;
    dg.globalCompositeOperation = 'source-over';
    dg.clearRect(0, 0, darkCanvas.width, darkCanvas.height);
    dg.fillStyle = `rgba(8,10,30,${dark})`;
    dg.fillRect(0, 0, darkCanvas.width, darkCanvas.height);
    dg.globalCompositeOperation = 'destination-out';
    const hole = (x: number, y: number, r: number, str: number) => {
      const gr = dg.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(0,0,0,${str})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      dg.fillStyle = gr; dg.fillRect(x - r, y - r, r * 2, r * 2);
    };
    const toScr = (wx: number, wy: number): [number, number] => [(wx - v.camX) * v.zoom, (wy - v.camY) * v.zoom];
    hole(...toScr(v.px, v.py - 14), 90 * v.zoom, .55);
    if (!v.interior) for (const l of v.world.lamps) {
      const [sx, sy] = toScr(l.x, l.y - 24);
      if (sx > -100 && sx < vw + 100 && sy > -100 && sy < vh + 100) hole(sx, sy, 110 * v.zoom, .9);
    }
    ctx.drawImage(darkCanvas, 0, 0, vw, vh);
    // тёплые ореолы фонарей
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (!v.interior) for (const l of v.world.lamps) {
      const [sx, sy] = toScr(l.x, l.y - 24);
      if (sx > -100 && sx < vw + 100 && sy > -100 && sy < vh + 100) {
        const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, 70 * v.zoom);
        gr.addColorStop(0, 'rgba(255,200,110,.14)'); gr.addColorStop(1, 'rgba(255,200,110,0)');
        ctx.fillStyle = gr; ctx.fillRect(sx - 70 * v.zoom, sy - 70 * v.zoom, 140 * v.zoom, 140 * v.zoom);
      }
    }
    ctx.restore();
  }

  // погодные частицы
  if (v.particles.length) {
    ctx.save();
    for (const p of v.particles) {
      if (p.kind === 'rain') {
        ctx.strokeStyle = 'rgba(150,190,255,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y + 9); ctx.stroke();
      } else if (p.kind === 'snow') {
        ctx.fillStyle = 'rgba(240,245,255,.85)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 7); ctx.fill();
      } else if (p.kind === 'spark') {
        ctx.globalAlpha = Math.max(0, 1 - p.t);
        ctx.fillStyle = '#ffd34d'; ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
      } else if (p.kind === 'dust') {
        ctx.globalAlpha = Math.max(0, .7 - p.t);
        ctx.fillStyle = '#b8a888'; ctx.beginPath(); ctx.arc(p.x, p.y, 2 + p.t * 3, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = Math.max(0, 1 - p.t);
        ctx.fillStyle = '#9ab8ff'; ctx.font = '12px "Russo One"'; ctx.fillText('z', p.x, p.y);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  // погодные тонировки (внутри помещений — нет)
  if (!v.interior) {
    if (v.weather === 'heat' && !v.roofed) { ctx.fillStyle = 'rgba(255,120,20,.07)'; ctx.fillRect(0, 0, vw, vh); }
    if (v.weather === 'snow') { ctx.fillStyle = 'rgba(200,220,255,.06)'; ctx.fillRect(0, 0, vw, vh); }
  }
  if (v.flash > 0) { ctx.fillStyle = `rgba(255,50,50,${v.flash * .4})`; ctx.fillRect(0, 0, vw, vh); }
}
