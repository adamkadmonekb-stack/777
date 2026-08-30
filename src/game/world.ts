import { ri, TRASH_CANS } from './core';

export const T = 32;
export const MW = 200; // увеличенный размер карты (было 100)
export const MH = 140; // увеличенный размер карты (было 70)

// Координаты главных дорог
export const mainH_y = 50; // главная горизонтальная дорога (проспект Мира)
export const mainV_x = 80; // главная вертикальная дорога (ул. Ленина)

// плитки: 0 трава, 1 асфальт, 2 тротуар, 3 земля, 4 бетон, 5 вода, 6 песок, 7 плитка, 8 разметка жёлтая, 9 разметка белая
export interface Solid { x: number; y: number; w: number; h: number; }
export interface Building {
  x: number; y: number; w: number; h: number; name: string;
  wall: string; roof: string; sign?: string; kind: string; data?: string;
  exitPoint?: { x: number; y: number }; // Точка выхода из здания (где появляется игрок при выходе)
}
export type ObjKind =
  | 'door_shop' | 'recycle' | 'dump' | 'bench' | 'door_shelter' | 'door_church'
  | 'door_soup' | 'door_granny' | 'door_realtor' | 'door_apart'
  | 'kiosk' | 'baraholka' | 'worker' | 'charity_bed' | 'ticket' | 'busstop'
  | 'door_factory' | 'door_workshop' | 'police_station'
  | 'trashcan' | 'theft' | 'vehicle';
export interface WObj {
  id: string; kind: ObjKind; x: number; y: number; data?: string;
  cooldown?: number; searched?: boolean;
}
export interface Npc {
  id: string; kind: 'citizen' | 'cop' | 'tramp' | 'worker' | 'granny' | 'realtor' | 'fisher' | 'lostdog' | 'shopkeeper' | 'foreman';
  x: number; y: number; hx: number; hy: number; r: number;
  tx: number; ty: number; speed: number; seed: number; anim: number; moving: boolean;
  data?: string; phrase?: string; route?: { x: number; y: number }[]; ri?: number; follow?: string;
}
export interface Dog { x: number; y: number; tx: number; ty: number; t: number; state: 'idle' | 'aggro' | 'flee'; }
export interface Lamp { x: number; y: number; }
export interface Tree { x: number; y: number; r: number; }
export type IntObjKind =
  | 'counter' | 'bed' | 'shower' | 'sofa' | 'kitchen' | 'exit' | 'bunk'
  | 'machine' | 'metalpile' | 'warehouse' | 'truck' | 'ramp' | 'desk' | 'bath'
  | 'trash' | 'forklift' | 'pallet'
  | 'stove' | 'fridge' | 'washer' | 'tv' | 'toilet';
export interface InteriorObj { kind: IntObjKind; x: number; y: number; data?: string; }
export interface Interior {
  id: string; kind: 'shop' | 'shelter' | 'apartment' | 'room' | 'factory' | 'workshop';
  w: number; h: number; floor: string; wall: string; data?: string;
  solids: Solid[]; objs: InteriorObj[]; npcs?: Npc[];
  spawn?: { x: number; y: number }; // безопасная точка появления (иначе у двери)
}
export interface World {
  tiles: Uint8Array;
  solids: Solid[];
  buildings: Building[];
  objects: WObj[];
  lamps: Lamp[];
  trees: Tree[];
  npcs: Npc[];
  dogs: Dog[];
  interiors: Record<string, Interior>;
}

const px = (t: number) => t * T;

function buildInteriors(): Record<string, Interior> {
  const res: Record<string, Interior> = {};
  const wallSolids = (w: number, h: number): Solid[] => {
    const s: Solid[] = [];
    const doorCol = Math.floor(w / 2); // дверной проём всегда по центру
    for (let i = 0; i < w; i++) {
      if (i !== doorCol) { s.push({ x: i * T, y: 0, w: T, h: T }); s.push({ x: i * T, y: (h - 1) * T, w: T, h: T }); }
    }
    for (let j = 1; j < h - 1; j++) { s.push({ x: 0, y: j * T, w: T, h: T }); s.push({ x: (w - 1) * T, y: j * T, w: T, h: T }); }
    return s;
  };
  const mk = (id: string, kind: Interior['kind'], floor: string, wall: string, data?: string, w = 15, h = 11): void => {
    const solids = wallSolids(w, h);
    // дверь-выход — по центру нижней стены (у больших цехов не слева, а там, где спавн)
    const objs: InteriorObj[] = [{ kind: 'exit', x: Math.floor(w / 2) * T + 16, y: (h - 1) * T + 16 }];
    const block = (x1: number, y1: number, x2: number, y2: number) =>
      solids.push({ x: x1 * T, y: y1 * T, w: (x2 - x1 + 1) * T, h: (y2 - y1 + 1) * T });
    if (kind === 'shop') {
      block(3, 2, 11, 2); objs.push({ kind: 'counter', x: 7 * T, y: 2 * T + 16, data });
      block(2, 4, 4, 5); block(6, 4, 8, 5); block(10, 4, 12, 5);
      block(2, 7, 4, 8); block(6, 7, 8, 8); block(10, 7, 12, 8);
    } else if (kind === 'shelter') {
      block(2, 2, 3, 8); objs.push({ kind: 'bunk', x: 3 * T + 16, y: 5 * T });
      block(11, 2, 12, 4); block(11, 6, 12, 8);
    } else if (kind === 'apartment') {
      // число комнат задаётся в data ('1'..'5'), планировка масштабируется под размер
      const rooms = parseInt(data ?? '2', 10);
      // ---- главная спальня (слева сверху) ----
      block(2, 2, 4, 3); objs.push({ kind: 'bed', x: 3 * T, y: 3 * T });
      // ---- дополнительные спальни для многокомнатных ----
      for (let r = 1; r < Math.min(rooms, 4); r++) {
        const by = 6 + (r - 1) * 3;
        if (by + 1 >= h - 3) break;
        block(2, by, 3, by + 1); objs.push({ kind: 'bed', x: 2.5 * T, y: (by + 0.5) * T });
      }
      // ---- гостиная: ТВ у стены и диван ----
      const kc0 = w - 10;
      const tvx = Math.min(7, kc0 - 3);
      block(tvx, 2, tvx + 2, 2); objs.push({ kind: 'tv', x: (tvx + 1) * T, y: 2 * T + 16 });
      block(6, h - 4, 8, h - 4); objs.push({ kind: 'sofa', x: 7 * T, y: (h - 4) * T + 28 });
      // ---- кухня (справа сверху), перегородка с проходом ----
      const kc = w - 10; // колонка перегородки кухни
      block(kc, 2, kc, 3); block(kc, 5, kc, 6);
      block(kc + 1, 2, kc + 2, 2); objs.push({ kind: 'stove', x: (kc + 1.5) * T, y: 2 * T + 16 });
      block(kc + 4, 2, kc + 5, 2); objs.push({ kind: 'fridge', x: (kc + 4.5) * T, y: 2 * T + 16 });
      block(w - 3, 2, w - 2, 2); objs.push({ kind: 'kitchen', x: (w - 2.5) * T, y: 2 * T + 16 });
      // ---- ванная (справа снизу) ----
      const bc = w - 10; const bt = h - 5; // колонка и ряд перегородок ванной
      block(bc, bt, bc, bt + 1); block(bc, h - 2, bc, h - 2);
      block(bc + 1, bt - 1, bc + 3, bt - 1); block(bc + 5, bt - 1, w - 2, bt - 1);
      block(bc + 1, h - 2, bc + 3, h - 2); objs.push({ kind: 'bath', x: (bc + 2) * T, y: (h - 2) * T + 16 });
      block(bc + 5, h - 2, bc + 5, h - 2); objs.push({ kind: 'toilet', x: (bc + 5) * T, y: (h - 2) * T + 16 });
      block(w - 3, h - 2, w - 3, h - 2); objs.push({ kind: 'washer', x: (w - 3) * T, y: (h - 2) * T + 16 });
      if (rooms >= 5) { // пентхаус: второй диван и барная стойка
        block(tvx, h - 6, tvx + 2, h - 6); objs.push({ kind: 'sofa', x: (tvx + 1) * T, y: (h - 6) * T + 28 });
        block(kc + 2, 5, kc + 3, 6);
      }
    } else if (kind === 'factory') {
      // 6 станков вдоль верхней стены
      for (const x0 of [4, 10, 16, 22, 28, 34]) {
        block(x0, 2, x0 + 1, 3);
        objs.push({ kind: 'machine', x: (x0 + 1) * T, y: 3 * T + 16, data: 'cut' });
      }
      // стол мастера (прораб) — справа сверху
      block(42, 2, 43, 3); objs.push({ kind: 'desk', x: 43 * T, y: 3 * T + 16 });
      // стопки металла: листы, балки, алюминий
      block(3, 12, 5, 13); objs.push({ kind: 'metalpile', x: 4 * T, y: 13 * T + 22, data : 'sheets' });
      block(9, 12, 11, 13); objs.push({ kind: 'metalpile', x: 10 * T, y: 13 * T + 22, data : 'beams' });
      block(15, 12, 17, 13); objs.push({ kind: 'metalpile', x: 16 * T, y: 13 * T + 22, data : 'alu' });
      // поддоны (для погрузчика)
      block(3, 20, 5, 21); objs.push({ kind: 'pallet', x: 4 * T, y: 21 * T + 22 });
      // два склада
      block(41, 12, 44, 14); objs.push({ kind: 'warehouse', x: 42.5 * T, y: 14 * T + 22, data : 'w1' });
      block(41, 20, 44, 22); objs.push({ kind: 'warehouse', x: 42.5 * T, y: 22 * T + 22, data : 'w2' });
      // два грузовика с пандусами
      block(36, 4, 40, 6); objs.push({ kind: 'truck', x: 38 * T, y: 6 * T + 22 });
      objs.push({ kind: 'ramp', x: 34.6 * T, y: 5 * T + 16 });
      block(36, 16, 40, 18); objs.push({ kind: 'truck', x: 38 * T, y: 18 * T + 22 });
      objs.push({ kind: 'ramp', x: 34.6 * T, y: 17 * T + 16 });
      // погрузчик в центре (к нему подходят, без солида)
      objs.push({ kind: 'forklift', x: 24 * T, y: 17 * T });
      // 8 куч мусора по всему цеху
      const trashPos = [[10, 6], [16, 8], [26, 5], [32, 9], [12, 18], [22, 24], [30, 21], [35, 26]];
      trashPos.forEach((p, i) => objs.push({ kind: 'trash', x: p[0] * T, y: p[1] * T, data: String(i) }));
    } else if (kind === 'workshop') {
      block(3, 2, 4, 3); objs.push({ kind: 'machine', x: 4 * T, y: 3 * T + 16, data: 'cut' });
      block(7, 2, 8, 3); objs.push({ kind: 'machine', x: 8 * T, y: 3 * T + 16, data: 'cut' });
      block(13, 2, 14, 3); objs.push({ kind: 'desk', x: 14 * T, y: 3 * T + 16 });
      block(2, 8, 3, 9); objs.push({ kind: 'metalpile', x: 3 * T - 6, y: 9 * T + 22, data: 'alu' });
      block(12, 8, 14, 9); objs.push({ kind: 'warehouse', x: 13 * T, y: 9 * T + 22 });
    } else { // room
      block(2, 2, 3, 3); objs.push({ kind: 'bed', x: 3 * T, y: 3 * T });
      block(10, 2, 11, 2); block(2, 7, 3, 7);
    }
    const int: Interior = { id, kind, w, h, floor, wall, data, solids, objs };
    // NPC интерьеров
    if (kind === 'factory') {
      int.npcs = [
        { id: 'foreman1', kind: 'foreman', x: 43 * T, y: 4.6 * T, hx: 43 * T, hy: 4.6 * T, r: 26, tx: 43 * T, ty: 4.6 * T, speed: 20, seed: 11, anim: 0, moving: false, phrase: 'Здорово, новенький! Работа есть — было бы здоровье.' },
        { id: 'fwork1', kind: 'worker', x: 12 * T, y: 8 * T, hx: 12 * T, hy: 8 * T, r: 150, tx: 12 * T, ty: 8 * T, speed: 26, seed: 21, anim: 0, moving: false, phrase: 'Тяжело тут, но платят нормально.' },
        { id: 'fwork2', kind: 'worker', x: 22 * T, y: 12 * T, hx: 22 * T, hy: 12 * T, r: 140, tx: 22 * T, ty: 12 * T, speed: 24, seed: 31, anim: 0, moving: false, phrase: 'Опять эти листы таскать...' },
        { id: 'fwork4', kind: 'worker', x: 30 * T, y: 14 * T, hx: 30 * T, hy: 14 * T, r: 120, tx: 30 * T, ty: 14 * T, speed: 25, seed: 61, anim: 0, moving: false, phrase: 'На погрузчике работать — одно удовольствие.' },
      ];
    } else if (kind === 'workshop') {
      int.npcs = [
        { id: 'foreman2', kind: 'foreman', x: 14 * T, y: 4.6 * T, hx: 14 * T, hy: 4.6 * T, r: 24, tx: 14 * T, ty: 4.6 * T, speed: 20, seed: 41, anim: 0, moving: false, phrase: 'С металлом шутки плохи. Каску не забывай!' },
        { id: 'fwork3', kind: 'worker', x: 7 * T, y: 6 * T, hx: 7 * T, hy: 6 * T, r: 70, tx: 7 * T, ty: 6 * T, speed: 24, seed: 51, anim: 0, moving: false, phrase: 'Искры летят — красота!' },
      ];
    }
    // безопасный спавн: у завода и цеха точка у двери попадает в стопки металла —
    // ставим игрока на свободный пятачок ниже по центру
    if (kind === 'factory') int.spawn = { x: 20 * T, y: 26 * T };      // свободный пол у входа
    else if (kind === 'workshop') int.spawn = { x: 7.5 * T, y: 11 * T }; // свободный пол ниже станков
    else if (kind === 'apartment') int.spawn = { x: Math.floor(int.w / 2) * T, y: (int.h - 3) * T }; // у входной двери
    res[id] = int;
  };
  // магазины больше не имеют интерьеров — покупки через витрину-меню у входа
  mk('i_shelter', 'shelter', '#8a7a66', '#5e5040');
  // жильё: каждой ступени — свой интерьер (размер и число комнат растут, палитра богаче)
  mk('i_apt_studio', 'apartment', '#9e8262', '#6e563e', '1', 19, 13); // студия — 1 комната
  mk('i_apt_one',    'apartment', '#b08d62', '#7a5c3a', '2', 21, 14); // 1-комнатная
  mk('i_apt_two',    'apartment', '#bd9a6e', '#856743', '3', 23, 15); // 2-комнатная
  mk('i_apt_three',  'apartment', '#c8a87e', '#8f7248', '4', 25, 16); // 3-комнатная
  mk('i_penthouse',  'apartment', '#d8b98e', '#9e7f52', '5', 27, 17); // пентхаус
  mk('i_room', 'room', '#a8896a', '#6e5a44');
  // завод 48×30 тайлов — все объекты (станки до кол. 35, склады до кол. 44, мусор до строки 26) влезают с запасом
  mk('i_factory', 'factory', '#5e646c', '#3e4248', undefined, 48, 30);
  // цех №2 закрыт для входа (только кража через чёрный вход) — интерьер не создаётся
  return res;
}

// Система зон для проверки размещения зданий
export interface Zone { x: number; y: number; w: number; h: number; type: string; }

export function buildWorld(): World {
  const tiles = new Uint8Array(MW * MH);
  const solids: Solid[] = [];
  const buildings: Building[] = [];
  const objects: WObj[] = [];
  const lamps: Lamp[] = [];
  const trees: Tree[] = [];

  // Координаты новых зданий (авто-район, парк, пруд, разборка)
  const autoSalonX = 150, autoSalonY = 15;      // Автосалон "Премиум"
  const azsX = 130, azsY = mainH_y + 8;         // АЗС "Лукойл"
  const partsX = 166, partsY = 17;              // Автозапчасти "Оригинал"
  const scrapX = 170, scrapY = 35;              // Разборка "У Васи"
  const parkingX = 68, parkingY = 40;           // Парковка у магазинов

// Координаты пруда и парка (нужны для размещения рыбака и собак ниже по коду)
const pondX = 170, pondY = 115;               // Координаты центра парка (для рыбака и собак)
const parkCx = 170, parkCy = 115;             // Центр парка (совпадает с прудом)

// Зоны дорог (для проверки, чтобы здания не стояли на дорогах)
const roadZones: Zone[] = [
  { x: 0, y: 36, w: MW, h: 4, type: 'main_h' },      // Главная горизонтальная (проспект Мира)
  { x: 18, y: 0, w: 3, h: MH, type: 'vert1' },       // Вертикальная 1
  { x: 50, y: 0, w: 3, h: MH, type: 'vert2' },       // Вертикальная 2
  { x: 82, y: 29, w: 3, h: 29, type: 'main_v' },     // Главная вертикальная (ул. Ленина)
];

// ✅ ПРАВИЛЬНАЯ функция проверки пересечения с дорогой
const overlapsRoad = (bx: number, by: number, bw: number, bh: number, margin: number = 2): boolean => {
  for (const road of roadZones) {
    if (bx - margin < road.x + road.w && bx + bw + margin > road.x &&
        by - margin < road.y + road.h && by + bh + margin > road.y) {
      return true;
    }
  }
  return false;
};

// ✅ ПРАВИЛЬНАЯ функция безопасного размещения здания
const safeBld = (x: number, y: number, w: number, h: number, name: string, wall: string, roof: string, kind: string, data?: string, sign?: string) => {
  // Проверяем пересечение с дорогой
  if (overlapsRoad(x, y, w, h, 2)) {
    console.warn(`Здание "${name}" на дороге! Сдвигаем...`);
    // Пытаемся сдвинуть вниз, пока не найдём свободное место
    let newY = y;
    while (overlapsRoad(x, newY, w, h, 2) && newY < MH - h - 5) {
      newY++;
    }
    // Если нашли свободное место, используем его
    if (!overlapsRoad(x, newY, w, h, 2)) {
      y = newY;
    } else {
      console.warn(`Не удалось найти свободное место для "${name}", ставим как есть.`);
    }
  }
  // Вызываем стандартную функцию создания здания с новыми (или старыми) координатами
  bld(x, y, w, h, name, wall, roof, kind, data, sign);
};

  const set = (x: number, y: number, v: number) => { if (x >= 0 && y >= 0 && x < MW && y < MH) tiles[y * MW + x] = v; };
  const rect = (x: number, y: number, w: number, h: number, v: number) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, v);
  };
  const bld = (x: number, y: number, w: number, h: number, name: string, wall: string, roof: string, kind: string, data?: string, sign?: string) => {
    buildings.push({ x, y, w, h, name, wall, roof, kind, data, sign: sign ?? name });
    solids.push({ x: px(x), y: px(y), w: w * T, h: h * T });
  };
  const doorObj = (b: Building, kind: ObjKind, data?: string) =>
    objects.push({ id: kind + '_' + b.x + '_' + b.y, kind, x: px(b.x + b.w / 2), y: px(b.y + b.h) - 6, data });

  // ---- зоны ----
  rect(0, 0, MW, 14, 4);   // заводы — бетон
  rect(0, 14, MW, 15, 0);  // спальный — трава
  rect(0, 29, MW, 16, 2);  // центр — тротуар
  rect(0, 45, MW, 13, 0);  // парк — трава
  rect(0, 58, 34, 12, 3);  // окраина — земля
  rect(34, 58, 34, 12, 2); // вокзал — тротуар
  rect(68, 58, 32, 12, 4); // промзона восток

  // ---- дороги ----
  rect(0, 36, MW, 3, 1); rect(0, 35, MW, 1, 2); rect(0, 39, MW, 1, 2); // проспект
  rect(18, 0, 3, MH, 1); rect(50, 0, 3, MH, 1); rect(82, 29, 3, 29, 1); // вертикальные
  // тропинки в парке
  rect(10, 47, 72, 1, 2); rect(30, 47, 1, 10, 2); rect(70, 48, 1, 9, 2);

  // ---- заводская зона ----
  const factoryB = { x: 8, y: 2, w: 12, h: 6 } as Building;
  buildings.push({ ...factoryB, name: 'ЗАВОД «КРАСНЫЙ ОКТЯБРЬ»', wall: '#6e5a52', roof: '#4a3a34', kind: 'factory', sign: 'ЗАВОД' });
  solids.push({ x: px(factoryB.x), y: px(factoryB.y), w: factoryB.w * T, h: factoryB.h * T });
  doorObj({ ...factoryB, name: '', wall: '', roof: '', kind: '', sign: '' }, 'door_factory');
  const shopB = { x: 30, y: 3, w: 14, h: 6 } as Building;
  buildings.push({ ...shopB, name: 'ЦЕХ №2', wall: '#5e6a72', roof: '#3e4a52', kind: 'factory', sign: 'ЦЕХ №2' });
  solids.push({ x: px(shopB.x), y: px(shopB.y), w: shopB.w * T, h: shopB.h * T });
  // главного входа в цех №2 НЕТ — двери заварены. Работает только чёрный вход (кража)
  objects.push({ id: 'theft', kind: 'theft', x: px(shopB.x + shopB.w) + 8, y: px(shopB.y + shopB.h / 2) });
  safeBld(58, 3, 9, 5, 'СКЛАД', '#72685a', '#4e463a', 'factory');
  const metalB = { x: 86, y: 3, w: 7, h: 4 } as Building;
  buildings.push({ ...metalB, name: 'ПРИЁМ МЕТАЛЛА', wall: '#3e6a8a', roof: '#2a4a62', kind: 'booth', sign: 'МЕТАЛЛОЛОМ' });
  solids.push({ x: px(86), y: px(3), w: 7 * T, h: 4 * T });
  objects.push({ id: 'rec_metal', kind: 'recycle', x: px(89.5), y: px(7) - 6, data: 'metal' });
  const dumpsF = [[24, 10], [47, 6], [63, 10], [74, 4], [92, 10], [26, 3]];
  dumpsF.forEach((d, i) => objects.push({ id: 'dump_f' + i, kind: 'dump', x: px(d[0]), y: px(d[1]), data: 'factory' }));

  // ---- спальный район ----
  // Дома с точками выхода (exitPoint) - где игрок появляется при выходе из подъезда
  const aptA: Building = { x: 6, y: 16, w: 9, h: 6, name: 'ДОМ 1', wall: '#a8835e', roof: '#6e5038', kind: 'apart', data: '0', exitPoint: { x: px(10.5), y: px(22) } };
  const aptB: Building = { x: 22, y: 16, w: 9, h: 6, name: 'ДОМ 2', wall: '#8a94a2', roof: '#5a6472', kind: 'apart', data: '1', exitPoint: { x: px(26.5), y: px(22) } };
  const aptC: Building = { x: 38, y: 16, w: 9, h: 6, name: 'ДОМ 3', wall: '#a2947e', roof: '#6e6250', kind: 'apart', data: '2', exitPoint: { x: px(42.5), y: px(22) } };
  [aptA, aptB, aptC].forEach(b => {
    buildings.push({ ...b, sign: b.name });
    solids.push({ x: px(b.x), y: px(b.y), w: b.w * T, h: b.h * T });
    doorObj(b, 'door_apart', b.data);
  });
  const realtor: Building = { x: 55, y: 16, w: 7, h: 4, name: 'НЕДВИЖИМОСТЬ', wall: '#3e7a8a', roof: '#2a5462', kind: 'office' };
  buildings.push({ ...realtor, sign: 'КВАРТИРЫ' });
  solids.push({ x: px(52), y: px(16), w: 7 * T, h: 4 * T });
  doorObj(realtor, 'door_realtor');
  const granny: Building = { x: 64, y: 16, w: 6, h: 4, name: 'ДОМ БАБУШКИ ЗИНЫ', wall: '#8a6a9e', roof: '#5e4672', kind: 'house' };
  buildings.push({ ...granny, sign: 'КОМНАТЫ' });
  solids.push({ x: px(64), y: px(16), w: 6 * T, h: 4 * T });
  doorObj(granny, 'door_granny');
  // мусорные баки возле домов и по городу (кулдаун 1 мин)
  TRASH_CANS.forEach((tc, i) => objects.push({ id: 'trashcan_' + i, kind: 'trashcan', x: px(tc.x), y: px(tc.y) }));

  // ---- центр ----
  const shops: [number, number, number, string, string, string, string][] = [
    [6, 30, 8, 'ПЯТЁРОЧКА', '#1f7a3d', '#14522a', 'pyaterochka'],
    [22, 30, 7, 'СЕНОД-ХЕНД', '#8a4a9e', '#5e3270', 'secondhand'],
    [32, 30, 7, 'СВЯЗНОЙ', '#e05a2a', '#9e3e1e', 'svyaznoy'],
    [40, 30, 8, 'СТРОЙМАРКЕТ', '#b8860e', '#7a5a0a', 'stroymarket'],
    [56, 30, 6, 'АПТЕКА', '#2a9e6e', '#1e6e4e', 'pharmacy'],
  ];
  shops.forEach(([bx, by, bw, name, wall, roof, id]) => {
    const b: Building = { x: bx, y: by, w: bw, h: 5, name, wall, roof, kind: 'shop', data: id, sign: name };
    buildings.push(b);
    solids.push({ x: px(bx), y: px(by), w: bw * T, h: 5 * T });
    doorObj(b, 'door_shop', id);
  });
  // киоск печати
  const kiosk: Building = { x: 6, y: 41, w: 3, h: 2, name: 'ПЕЧАТЬ', wall: '#4a6a9e', roof: '#32486e', kind: 'kiosk', sign: 'ПЕЧАТЬ' };
  buildings.push(kiosk); solids.push({ x: px(6), y: px(41), w: 3 * T, h: 2 * T });
  objects.push({ id: 'kiosk', kind: 'kiosk', x: px(7.5), y: px(43) - 6 });
  // барахолка — навесы (СДВИНУЛИ ВЛЕВО)
  for (let i = 0; i < 3; i++) {
    // Было 68, стало 56. Чем меньше это число, тем левее будут палатки.
    const sx = 56 + i * 4; 
    const stall: Building = { x: sx, y: 41, w: 3, h: 2, name: 'ТОРГОВАЯ ПАЛАТКА', wall: '#9e7a3e', roof: i % 2 ? '#a23e3e' : '#3e7aa2', kind: 'stall', sign: '' };
    buildings.push(stall); solids.push({ x: px(sx), y: px(41), w: 3 * T, h: 2 * T });
  }
  // Точку взаимодействия (где нажимаешь Е) тоже сдвигаем влево под новые палатки (было 72.5, стало 60.5)
  objects.push({ id: 'baraholka', kind: 'baraholka', x: px(60.5), y: px(43) - 4 });
  // фонтан
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++)
    if (i * i + j * j <= 5) set(44 + i, 43 + j, i * i + j * j <= 2 ? 5 : 6);
  solids.push({ x: px(44) - T, y: px(43) - T, w: 3 * T, h: 3 * T });
  // полицейский участок
  const policeB: Building = { x: 64, y: 30, w: 7, h: 5, name: 'ПОЛИЦИЯ', wall: '#3e5a8a', roof: '#2a3e62', kind: 'police_station', sign: 'УЧАСТОК' };
  buildings.push(policeB); solids.push({ x: px(64), y: px(30), w: 7 * T, h: 5 * T });
  objects.push({ id: 'police_station', kind: 'police_station', x: px(67.5), y: px(35) - 6 });

  // ---- парк ----
  // ✅ ПРУД УДАЛЁН - на его месте теперь парковка
  const pondCx = 170, pondCy = 115;             // Центр парка (бывший пруд)
  
  // ПАРКОВКА НА МЕСТЕ ПРУДА (асфальтированная, 8 мест)
  const parkingPondX = 150, parkingPondY = 95;
  rect(parkingPondX, parkingPondY, 40, 15, 1); // Асфальт

  // Разметка парковочных мест (8 мест по 5 тайлов шириной)
  for (let i = 0; i < 8; i++) {
    const spotX = parkingPondX + i * 5;
    // Белые линии разметки
    for (let k = 0; k < 3; k++) set(spotX + k, parkingPondY + 2, 9);
    for (let k = 0; k < 3; k++) set(spotX + k, parkingPondY + 12, 9);
  }

  // Мусорные кучи в парке (оставляем как были)
  const dumpsP = [[10, 49], [26, 55], [74, 50], [90, 47], [15, 53]];
  dumpsP.forEach((d, i) => objects.push({ id: 'dump_p' + i, kind: 'dump', x: px(d[0]), y: px(d[1]), data: 'park' }));

  // Скамейки в парке (одну сдвинули с 70 на 54, чтобы она не висела в воздухе на месте старого пруда)
  const benchesP = [[14, 47.6], [34, 53.6], [54, 48.6], [88, 52.6], [24, 47.6]];
  benchesP.forEach((b, i) => objects.push({ id: 'bench_p' + i, kind: 'bench', x: px(b[0]), y: px(b[1]) }));

  // ---- юг: окраина / вокзал / восток ----
  safeBld(4, 60, 6, 4, 'ДОМ 7', '#7a6a5a', '#52463a', 'house');
  safeBld(10, 61, 6, 4, 'ДОМ 9', '#6e6a72', '#4a4650', 'house');
  const church: Building = { x: 26, y: 60, w: 6, h: 5, name: 'ЦЕРКОВЬ', wall: '#c8c0d8', roof: '#5a5e9e', kind: 'church', sign: 'ПРИЮТ' };
  buildings.push(church); solids.push({ x: px(26), y: px(60), w: 6 * T, h: 5 * T });
  doorObj(church, 'door_church');
  const soup: Building = { x: 35, y: 60, w: 5, h: 3, name: 'СТОЛОВАЯ', wall: '#a2865e', roof: '#6e5a3e', kind: 'soup', sign: 'СТОЛОВАЯ №1' };
  buildings.push(soup); solids.push({ x: px(35), y: px(60), w: 5 * T, h: 3 * T });
  doorObj(soup, 'door_soup');
// ✅ АВТОВОКЗАЛ перемещён в правый нижний угол, подальше от центральной дороги
const vokzal: Building = { x: 70, y: 85, w: 16, h: 6, name: 'АВТОВОКЗАЛ', wall: '#8a7a62', roof: '#5a5042', kind: 'vokzal', sign: 'АВТОВОКЗАЛ' };
buildings.push(vokzal); 
solids.push({ x: px(70), y: px(85), w: 16 * T, h: 6 * T });

// Касса теперь прямо перед новым зданием вокзала
objects.push({ id: 'ticket', kind: 'ticket', x: px(78), y: px(91) - 8 }); 

// ❌ Остановки с центральной дороги УБРАНЫ, чтобы не мешать движению
// objects.push({ id: 'busstop1', kind: 'busstop', x: px(14), y: px(35) - 8 }); 
// objects.push({ id: 'busstop2', kind: 'busstop', x: px(74), y: px(39.6) + 6 }); 
  const shelter: Building = { x: 62, y: 60, w: 6, h: 4, name: 'НОЧЛЕЖКА', wall: '#7a5e52', roof: '#523e34', kind: 'shelter', sign: 'НОЧЛЕЖКА 100₽' };
  buildings.push(shelter); solids.push({ x: px(62), y: px(60), w: 6 * T, h: 4 * T });
  doorObj(shelter, 'door_shelter');
  const glassB: Building = { x: 35, y: 66, w: 5, h: 2.5, name: 'СТЕКЛОТАРА', wall: '#3e8a5e', roof: '#2a6242', kind: 'booth', sign: 'СТЕКЛОТАРА' };
  buildings.push(glassB); solids.push({ x: px(35), y: px(66), w: 5 * T, h: 2.5 * T });
  objects.push({ id: 'rec_glass', kind: 'recycle', x: px(37.5), y: px(68.5) - 6, data: 'glass' });
  const paperB: Building = { x: 72, y: 62, w: 6, h: 3, name: 'МАКУЛАТУРА', wall: '#8a8a3e', roof: '#62622a', kind: 'booth', sign: 'МАКУЛАТУРА' };
  buildings.push(paperB); solids.push({ x: px(72), y: px(62), w: 6 * T, h: 3 * T });
  objects.push({ id: 'rec_paper', kind: 'recycle', x: px(75), y: px(65) - 6, data: 'paper' });
  const dumpsS = [[8, 67], [22, 67], [60, 68], [86, 61], [93, 66], [79, 68]];
  dumpsS.forEach((d, i) => objects.push({ id: 'dump_s' + i, kind: 'dump', x: px(d[0]), y: px(d[1]), data: i >= 3 ? 'suburb' : 'station' }));
  objects.push({ id: 'bench_s0', kind: 'bench', x: px(40), y: px(59.4) });
  objects.push({ id: 'bench_s1', kind: 'bench', x: px(59), y: px(59.4) });

  // ---- Восточная промзона: дополнительные жилые дома для доставки ----
  const deliveryHomes: [number, number, string][] = [
    [70, 62, 'ДОМ 15'], [78, 62, 'ДОМ 17'], [86, 62, 'ДОМ 19'],
    [70, 70, 'ДОМ 21'], [78, 70, 'ДОМ 23'], [86, 70, 'ДОМ 25'],
    [72, 78, 'ДОМ 27'], [80, 78, 'ДОМ 29'], [88, 78, 'ДОМ 31'],
  ];
  deliveryHomes.forEach(([hx, hy, hname]) => {
    const homeB: Building = { x: hx, y: hy, w: 5, h: 4, name: hname, wall: '#7a6a5a', roof: '#52463a', kind: 'house', exitPoint: { x: px(hx + 2.5), y: px(hy + 5) } };
    buildings.push(homeB);
    solids.push({ x: px(hx), y: px(hy), w: 5 * T, h: 4 * T });
    doorObj(homeB, 'door_apart', 'delivery');
    // Мусорный бак возле каждого дома
    objects.push({ id: 'trashcan_home_' + hx + '_' + hy, kind: 'trashcan', x: px(hx + 6), y: px(hy + 2) });
  });

  // ---- АВТО-РАЙОН (окраина, новые здания) ----
  // Автосалон "Премиум"
  const autoSalonB: Building = { x: autoSalonX, y: autoSalonY, w: 12, h: 8, name: 'АВТОСАЛОН "ПРЕМИУМ"', wall: '#2a3a4a', roof: '#1a2a3a', kind: 'showroom', sign: 'АВТОСАЛОН' };
  buildings.push(autoSalonB); solids.push({ x: px(autoSalonX), y: px(autoSalonY), w: 12 * T, h: 8 * T });
  doorObj(autoSalonB, 'door_shop', 'autosalon');
  // АЗС "Лукойл" с плавным въездом (кривая Безье)
  const azsB: Building = { x: azsX, y: azsY, w: 6, h: 4, name: 'АЗС "ЛУКОЙЛ"', wall: '#8a3e3e', roof: '#6a2e2e', kind: 'gasstation', sign: 'АЗС' };
  buildings.push(azsB); solids.push({ x: px(azsX), y: px(azsY), w: 6 * T, h: 4 * T });
  doorObj(azsB, 'door_shop', 'gasstation');
  // Автозапчасти "Оригинал"
  const partsB: Building = { x: partsX, y: partsY, w: 7, h: 4, name: 'АВТОЗАПЧАСТИ "ОРИГИНАЛ"', wall: '#4a6a8a', roof: '#3a5a7a', kind: 'shop', sign: 'АВТОЗАПЧАСТИ' };
  buildings.push(partsB); solids.push({ x: px(partsX), y: px(partsY), w: 7 * T, h: 4 * T });
  doorObj(partsB, 'door_shop', 'autoparts');
  // Разборка "У Васи" (тёмный район) - мусорная куча убрана от входа (была прямо перед дверью)
  const scrapB: Building = { x: scrapX, y: scrapY, w: 10, h: 6, name: 'РАЗБОРКА "У ВАСИ"', wall: '#3a3a3a', roof: '#2a2a2a', kind: 'scrapyard', sign: 'РАЗБОРКА', exitPoint: { x: px(scrapX + 5), y: px(scrapY + 8) } };
  buildings.push(scrapB); solids.push({ x: px(scrapX), y: px(scrapY), w: 10 * T, h: 6 * T });
  // Мусорная куча перемещена в сторону от входа (минимум 100px = ~3 тайла)
  objects.push({ id: 'scrap_dump1', kind: 'dump', x: px(scrapX + 12), y: px(scrapY + 4), data: 'scrap' });
  objects.push({ id: 'scrap_dump2', kind: 'dump', x: px(scrapX + 8), y: px(scrapY + 10), data: 'scrap' });

// Парковка возле магазинов — скамейки + слоты под транспорт
for (let i = 0; i < 6; i++) {
  const spotX = parkingX + (i % 3) * 4;
  const spotY = parkingY + Math.floor(i / 3) * 3;
  objects.push({ id: 'parking_bench_' + i, kind: 'bench', x: px(spotX), y: px(spotY), data: 'parking' });
}

// ✅ СЛОТЫ ПОД ТРАНСПОРТ ИГРОКА (6 слотов)
// Велосипед — первый слот
objects.push({ id: 'player_bike', kind: 'vehicle' as any, x: px(parkingX + 1), y: px(parkingY + 1), data: 'bike_old' });
// Скутер — второй слот
objects.push({ id: 'player_scooter', kind: 'vehicle' as any, x: px(parkingX + 5), y: px(parkingY + 1), data: 'scooter_china' });
// Лада — третий слот
objects.push({ id: 'player_lada', kind: 'vehicle' as any, x: px(parkingX + 9), y: px(parkingY + 1), data: 'car_lada' });
// Kia — четвёртый слот
objects.push({ id: 'player_kia', kind: 'vehicle' as any, x: px(parkingX + 1), y: px(parkingY + 4), data: 'car_kia' });
// Toyota — пятый слот
objects.push({ id: 'player_toyota', kind: 'vehicle' as any, x: px(parkingX + 5), y: px(parkingY + 4), data: 'car_toyota' });
// Газель — шестой слот
objects.push({ id: 'player_truck', kind: 'vehicle' as any, x: px(parkingX + 9), y: px(parkingY + 4), data: 'truck_gaz' });



  // ---- деревья ----
  const treeSpots: [number, number, number, number][] = [
    [2, 46, 40, 57], [40, 14, 50, 28], [60, 46, 68, 57], [72, 14, 98, 28],
    [2, 14, 6, 28], [2, 30, 5, 34], [76, 46, 98, 57],
  ];
  for (const [x1, y1, x2, y2] of treeSpots) {
    const n = ri(5, 9);
    for (let k = 0; k < n; k++) {
      const tx = ri(x1, x2), ty = ri(y1, y2);
      if (tiles[ty * MW + tx] !== 0) continue;
      trees.push({ x: px(tx) + 16, y: px(ty) + 16, r: ri(16, 24) });
      solids.push({ x: px(tx) + 10, y: px(ty) + 10, w: 12, h: 12 });
    }
  }

  // ---- фонари ----
  for (let i = 4; i < MW; i += 9) { lamps.push({ x: px(i) + 16, y: px(35) - 4 }); lamps.push({ x: px(i + 4) + 16, y: px(40) - 4 }); }
  for (let j = 6; j < MH; j += 10) lamps.push({ x: px(18) - 6, y: px(j) });
  for (let j = 31; j < 58; j += 10) lamps.push({ x: px(82) - 6, y: px(j) });

  // Мусорные баки по городу (интерактивные)
  TRASH_CANS.forEach((tc, i) => objects.push({ id: 'trashcan_' + i, kind: 'trashcan', x: px(tc.x % MW), y: px(tc.y % MH) }));

  // ---- NPC ----
  const npcs: Npc[] = [];
  const citizenSeeds = ['cit1', 'cit2', 'cit3', 'cit4', 'cit5', 'cit6', 'cit7', 'cit8'];
  citizenSeeds.forEach((id, i) => {
    const x = px(ri(20, 180)), y = px(i % 2 ? mainH_y - 5 : mainH_y + 7) + ri(-4, 4);
    npcs.push({ id, kind: 'citizen', x, y, hx: x, hy: y, r: px(30), tx: x, ty: y, speed: 34 + ri(0, 16), seed: ri(0, 999), anim: 0, moving: false });
  });
  // патрули по маршрутам (центр, вокзал, окраина) + напарники следом
  npcs.push({
    id: 'cop1', kind: 'cop', x: px(mainV_x - 10), y: px(mainH_y + 2), hx: px(mainV_x - 10), hy: px(mainH_y + 2), r: px(60), tx: px(mainV_x - 10), ty: px(mainH_y + 2), speed: 30, seed: 7, anim: 0, moving: false, ri: 0,
    route: [{ x: px(mainV_x - 15), y: px(mainH_y + 2) }, { x: px(mainV_x + 10), y: px(mainH_y + 2) }, { x: px(mainV_x + 10), y: px(mainH_y + 6) }, { x: px(mainV_x - 15), y: px(mainH_y + 6) }],
  });
  npcs.push({ id: 'cop1b', kind: 'cop', x: px(mainV_x - 8.8), y: px(mainH_y + 2), hx: px(mainV_x - 8.8), hy: px(mainH_y + 2), r: 0, tx: px(mainV_x - 8.8), ty: px(mainH_y + 2), speed: 30, seed: 8, anim: 0, moving: false, follow: 'cop1' });
  npcs.push({
    id: 'cop2', kind: 'cop', x: px(50), y: px(100), hx: px(50), hy: px(100), r: px(40), tx: px(50), ty: px(100), speed: 28, seed: 13, anim: 0, moving: false, ri: 0,
    route: [{ x: px(40), y: px(100) }, { x: px(70), y: px(100) }, { x: px(70), y: px(97) }, { x: px(40), y: px(97) }],
  });
  npcs.push({ id: 'cop2b', kind: 'cop', x: px(51.2), y: px(100), hx: px(51.2), hy: px(100), r: 0, tx: px(51.2), ty: px(100), speed: 28, seed: 14, anim: 0, moving: false, follow: 'cop2' });
  npcs.push({
    id: 'cop3', kind: 'cop', x: px(140), y: px(75), hx: px(140), hy: px(75), r: px(35), tx: px(140), ty: px(75), speed: 26, seed: 29, anim: 0, moving: false, ri: 0,
    route: [{ x: px(130), y: px(75) }, { x: px(150), y: px(75) }, { x: px(150), y: px(78) }, { x: px(130), y: px(78) }],
  });
  npcs.push({
    id: 'cop4', kind: 'cop', x: px(30), y:  px(25), hx: px(30), hy: px(25), r: px(30), tx: px(30), ty: px(25), speed: 27, seed: 37, anim: 0, moving: false, ri: 0,
    route: [{ x: px(15), y: px(25) }, { x: px(50), y: px(25) }, { x: px(50), y: px(28) }, { x: px(15), y: px(28) }],
  });
  npcs.push({ id: 'cop4b', kind: 'cop', x: px(31.2), y: px(25), hx: px(31.2), hy: px(25), r: 0, tx: px(31.2), ty: px(25), speed: 27, seed: 38, anim: 0, moving: false, follow: 'cop4' });
  const workersPos = [['vasya', autoSalonX + 2.6, autoSalonY + 12.8], ['petya', autoSalonX + 4.2, autoSalonY + 12.8], ['serega', autoSalonX + 5.8, autoSalonY + 12.8], ['kolyan', autoSalonX + 7.4, autoSalonY + 12.8]];
  workersPos.forEach(([wid, wx, wy]) => {
    npcs.push({ id: wid as string, kind: 'worker', x: px(wx as number), y: px(wy as number), hx: px(wx as number), hy: px(wy as number), r: 20, tx: px(wx as number), ty: px(wy as number), speed: 0, seed: ri(0, 999), anim: 0, moving: false, data: wid as string });
    objects.push({ id: 'worker_' + wid, kind: 'worker', x: px(wx as number), y: px(wy as number) - 10, data: wid as string });
  });
  npcs.push({ id: 'granny', kind: 'granny', x: px(mainV_x + 5), y: px(mainH_y - 8), hx: px(mainV_x + 5), hy: px(mainH_y - 8), r: 12, tx: px(mainV_x + 5), ty: px(mainH_y - 8), speed: 0, seed: 3, anim: 0, moving: false });
  npcs.push({ id: 'realtor', kind: 'realtor', x: px(55.5), y: px(26.6), hx: px(55.5), hy: px(26.6), r: 12, tx: px(55.5), ty: px(26.6), speed: 0, seed: 11, anim: 0, moving: false });
  npcs.push({ id: 'fisher', kind: 'fisher', x: px(pondX - 12), y: px(pondY + 8), hx: px(pondX - 12), hy: px(pondY + 8), r: 12, tx: px(pondX - 12), ty: px(pondY + 8), speed: 0, seed: 21, anim: 0, moving: false, phrase: 'Рыбак Михалыч: «Эх, где же пруд...»' });
  for (let i = 0; i < 3; i++) {
    const x = px(ri(20, 180)), y = px(ri(20, 120));
    npcs.push({ id: 'tramp' + i, kind: 'tramp', x, y, hx: x, hy: y, r: px(20), tx: x, ty: y, speed: 26, seed: ri(0, 999), anim: 0, moving: false });
  }

  // ---- собаки ----
  const dogs: Dog[] = [
    { x: px(parkCx - 20), y: px(parkCy), tx: px(parkCx - 20), ty: px(parkCy), t: 0, state: 'idle' },
    { x: px(scrapX + 10), y: px(scrapY + 5), tx: px(scrapX + 10), ty: px(scrapY + 5), t: 0, state: 'idle' },
    { x: px(15), y: px(105), tx: px(15), ty: px(105), t: 0, state: 'idle' },
  ];

  return { tiles, solids, buildings, objects, lamps, trees, npcs, dogs, interiors: buildInteriors() };
}

export function tileAt(world: World, tx: number, ty: number): number {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return 5;
  return world.tiles[ty * MW + tx];
}
export function districtAt(x: number, y: number): string {
  const ty = y / T, tx = x / T;
  
  if (ty < 18) return 'Заводы';
  if (ty < 35) return 'Спальный район';
  if (ty < mainH_y - 8) return 'Центр';
  if (ty < mainH_y + 15 && tx > mainV_x + 20) return 'Парк';
  if (ty > mainH_y + 30 && tx < 60) return 'Окраина';
  if (ty > mainH_y + 30 && tx >= 60 && tx < 100) return 'Вокзал';
  if (tx > 130 && ty < 50) return 'Авто-район';
  if (tx > 160) return 'Разборка';
  return 'Восточная промзона';
}
