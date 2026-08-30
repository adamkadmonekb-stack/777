// ==================== ТИПЫ ====================
export interface Stats {
  hp: number; energy: number; fatigue: number;
  hunger: number; hygiene: number; mood: number;
}
export type ItemCat = 'food' | 'scrap' | 'mat' | 'tool' | 'cloth' | 'tech' | 'med' | 'val';
export type EquipSlot = 'torso' | 'legs' | 'feet' | 'head';
export interface ItemDef {
  id: string; name: string; cat: ItemCat; stack: number; price: number;
  desc: string; fx?: Partial<Stats>; warm?: boolean; stylish?: number;
  slot?: EquipSlot; color?: string;
  // RPG-статы для экипировки
  warmth?: number; speed?: number; rep?: number; protect?: number; comfort?: number;
  rarity?: 'Обычная' | 'Необычная' | 'Редкая' | 'Эпическая';
}
export const SLOT_META: Record<EquipSlot, { label: string; icon: string }> = {
  torso: { label: 'Торс', icon: 'shirt' },
  legs: { label: 'Ноги', icon: 'pants' },
  feet: { label: 'Обувь', icon: 'boot' },
  head: { label: 'Голова', icon: 'cap' },
};
export interface InvSlot { id: string; qty: number; }
export interface ShopGood { item: string; price: number; tab?: string; }
export interface ShopDef {
  id: string; name: string; kind: string; seller: string; phrase: string;
  wall: string; floor: string; tabs: string[]; goods: ShopGood[];
}
// множитель цен по городу для каждого магазина
export const SHOP_MULT: Record<string, 'food' | 'cloth' | 'tech'> = {
  pyaterochka: 'food', secondhand: 'cloth', svyaznoy: 'tech', stroymarket: 'tech', pharmacy: 'food',
};
export interface BackpackDef { id: number; name: string; slots: number; price: number; desc: string; rep?: number; }
export interface ApartmentDef { id: string; name: string; price: number; rooms: number; desc: string; income: number; }
export interface RecipeDef { id: string; name: string; needs: [string, number][]; out: string; desc: string; }
export interface WorkerDef { id: string; name: string; desc: string; income: number; wage: number; hire: number; minRep: number; }
export interface ApplianceDef { id: string; name: string; part: number; master: number; wear: number; }
export interface QuestDef { id: string; text: string; counter: string; target: number; money: number; rep?: [string, number]; rewardItem?: string; }
export interface InvestmentDef { id: string; name: string; price: number; income: number; desc: string; }

// ==================== ПРЕДМЕТЫ ====================
export const ITEMS: Record<string, ItemDef> = {
  // еда
  bread:    { id:'bread',    name:'Хлеб',            cat:'food', stack:10, price:30,  desc:'Голод +20', fx:{hunger:20} },
  sausage:  { id:'sausage',  name:'Сосиски (уп.)',   cat:'food', stack:10, price:80,  desc:'Голод +35, Здоровье −5', fx:{hunger:35, hp:-5} },
  doshirak: { id:'doshirak', name:'Доширак',         cat:'food', stack:10, price:25,  desc:'Голод +25', fx:{hunger:25} },
  water:    { id:'water',    name:'Вода 0,5 л',      cat:'food', stack:10, price:40,  desc:'Выносливость +15, Голод +5', fx:{energy:15, hunger:5} },
  kolbasa:  { id:'kolbasa',  name:'Колбаса',         cat:'food', stack:5,  price:150, desc:'Голод +50, Здоровье +10', fx:{hunger:50, hp:10} },
  fruit:    { id:'fruit',    name:'Фрукты',          cat:'food', stack:10, price:120, desc:'Голод +30, Здоровье +15', fx:{hunger:30, hp:15} },
  alcohol:  { id:'alcohol',  name:'Алкоголь (деш.)', cat:'food', stack:10, price:90,  desc:'Настроение +40, Здоровье −15', fx:{mood:40, hp:-15, energy:10} },
  energetik:{ id:'energetik',name:'Энергетик',       cat:'food', stack:10, price:70,  desc:'Выносливость +40, Здоровье −5', fx:{energy:40, hp:-5} },
  spoiled:  { id:'spoiled',  name:'Испорченная еда', cat:'food', stack:10, price:0,   desc:'Голод +20. Риск отравления!', fx:{hunger:20} },
  fish:     { id:'fish',     name:'Рыба (улов)',     cat:'food', stack:10, price:100, desc:'Голод +40, Здоровье +10', fx:{hunger:40, hp:10} },
  pelmeni:  { id:'pelmeni',  name:'Пельмени',        cat:'food', stack:5,  price:180, desc:'Голод +60, Настроение +10', fx:{hunger:60, mood:10} },
  // вторсырьё
  can05:  { id:'can05',  name:'Банка 0,5 л',   cat:'scrap', stack:200, price:2,   desc:'Сдать в приём стеклотары' },
  can1:   { id:'can1',   name:'Банка 1 л',     cat:'scrap', stack:200, price:3,   desc:'Сдать в приём стеклотары' },
  wbotl:  { id:'wbotl',  name:'Винная бутылка',cat:'scrap', stack:200, price:5,   desc:'Сдать в приём стеклотары' },
  alu:    { id:'alu',    name:'Алюминий (кг)', cat:'scrap', stack:100, price:80,  desc:'Сдать в приём металла' },
  copper: { id:'copper', name:'Медь (кг)',     cat:'scrap', stack:100, price:350, desc:'Редкая! Сдать в приём металла' },
  iron:   { id:'iron',   name:'Чермет (кг)',   cat:'scrap', stack:100, price:15,  desc:'Сдать в приём металла' },
  cable:  { id:'cable',  name:'Кабели (кг)',   cat:'scrap', stack:100, price:120, desc:'Сдать в приём металла' },
  news:   { id:'news',   name:'Газеты (кг)',   cat:'scrap', stack:100, price:8,   desc:'Сдать в приём макулатуры' },
  card:   { id:'card',   name:'Картон (кг)',   cat:'scrap', stack:100, price:12,  desc:'Сдать в приём макулатуры' },
  book:   { id:'book',   name:'Книги (кг)',    cat:'scrap', stack:100, price:15,  desc:'Сдать в приём макулатуры' },
  mag:    { id:'mag',    name:'Журналы (кг)',  cat:'scrap', stack:100, price:10,  desc:'Сдать в приём макулатуры' },
  // материалы
  branch: { id:'branch', name:'Ветка',         cat:'mat', stack:20, price:5,  desc:'Материал для крафта' },
  rope:   { id:'rope',   name:'Верёвка',       cat:'mat', stack:20, price:15, desc:'Материал для крафта' },
  tape:   { id:'tape',   name:'Скотч',         cat:'mat', stack:20, price:20, desc:'Материал для крафта' },
  lighter:{ id:'lighter',name:'Зажигалка',     cat:'mat', stack:5,  price:40, desc:'Материал для крафта' },
  // инструменты
  stick:  { id:'stick',  name:'Палка',         cat:'tool', stack:1, price:30,  desc:'Отпугивает собак на помойках' },
  hammer: { id:'hammer', name:'Молоток',       cat:'tool', stack:1, price:150, desc:'Находка со свалки' },
  tools:  { id:'tools',  name:'Набор инструментов', cat:'tool', stack:1, price:800, desc:'Нужен для ремонта техники' },
  parts:  { id:'parts',  name:'Запчасти',       cat:'tool', stack:5, price:1500, desc:'Для ремонта холодильника и стиралки' },
  rod:    { id:'rod',    name:'Удочка',        cat:'tool', stack:1, price:400, desc:'Рыбалка в парковом пруду' },
  heater: { id:'heater', name:'Обогреватель (самод.)', cat:'tool', stack:1, price:100, desc:'Согреться ночью. Опасно!' },
  scooter:{ id:'scooter',name:'Самокат (самодел.)', cat:'tool', stack:1, price:500, desc:'Скорость передвижения +35%' },
  // одежда
  tshirt: { id:'tshirt', name:'Футболка б/у',  cat:'cloth', stack:1, price:50,  desc:'Чистая одежда. Гигиена +10', fx:{hygiene:10}, slot:'torso', color:'#8a94a2', comfort:5, rarity:'Обычная' },
  jeans:  { id:'jeans',  name:'Джинсы потёртые',cat:'cloth', stack:1, price:120, desc:'Чистая одежда. Гигиена +10', fx:{hygiene:10}, slot:'legs', color:'#4a6a9e', comfort:5, rarity:'Обычная' },
  wjacket:{ id:'wjacket',name:'Куртка зимняя', cat:'cloth', stack:1, price:400, desc:'Защита от холода. +тепло', warm:true, slot:'torso', color:'#2e4a6e', warmth:25, protect:10, rarity:'Редкая' },
  boots:  { id:'boots',  name:'Ботинки',       cat:'cloth', stack:1, price:250, desc:'Тёплая обувь. +тепло', warm:true, slot:'feet', color:'#5e4632', warmth:10, protect:5, rarity:'Необычная' },
  hat:    { id:'hat',    name:'Шапка',         cat:'cloth', stack:1, price:80,  desc:'Тёплая шапка. +тепло', warm:true, slot:'head', color:'#c25e3e', warmth:10, rarity:'Необычная' },
  nike:   { id:'nike',   name:'Куртка «Найк»', cat:'cloth', stack:1, price:3000, desc:'Репутация +5. Стиль!', stylish:2, slot:'torso', color:'#c23e3e', rep:5, comfort:10, rarity:'Эпическая' },
  suit:   { id:'suit',   name:'Деловой костюм',cat:'cloth', stack:1, price:5000, desc:'Стиль высшего уровня', stylish:3, slot:'torso', color:'#232733', rep:10, comfort:10, rarity:'Эпическая' },
  sneakers:{ id:'sneakers', name:'Кроссовки «Найк»', cat:'cloth', stack:1, price:1800, desc:'Скорость +15%. Репутация +5', slot:'feet', color:'#e8e2d0', speed:15, rep:5, comfort:10, rarity:'Редкая' },
  // техника
  phone1: { id:'phone1', name:'Кнопочный телефон', cat:'tech', stack:1, price:500,  desc:'Звонки и карта' },
  phone2: { id:'phone2', name:'Смартфон б/у',  cat:'tech', stack:1, price:3000,  desc:'Интернет и приложения' },
  phone3: { id:'phone3', name:'Новый смартфон',cat:'tech', stack:1, price:15000, desc:'Статус. Репутация +5', stylish:1 },
  laptop: { id:'laptop', name:'Ноутбук',       cat:'tech', stack:1, price:25000, desc:'Онлайн-подработка: +400 ₽/день' },
  player: { id:'player', name:'Музыкальный плеер', cat:'tech', stack:1, price:500, desc:'Портативный плеер: 10 треков, поднимает настроение' },
  // медицина
  pills:  { id:'pills',  name:'Таблетки',      cat:'med', stack:5, price:150, desc:'Лечит простуду и отравление', fx:{hp:10} },
  bandage:{ id:'bandage',name:'Бинт',          cat:'med', stack:10, price:60, desc:'Здоровье +20', fx:{hp:20} },
  vitamins:{id:'vitamins',name:'Витамины',     cat:'med', stack:5, price:200, desc:'Здоровье +10, Выносливость +15', fx:{hp:10, energy:15} },
  // ценности
  antique:{ id:'antique',name:'Антиквариат',   cat:'val', stack:5, price:900,  desc:'Продать на барахолке' },
  jewel:  { id:'jewel',  name:'Украшение',     cat:'val', stack:5, price:1600, desc:'Продать на барахолке' },
  coin:   { id:'coin',   name:'Редкая монета', cat:'val', stack:20, price:300, desc:'Коллекционный предмет' },
  cardcity:{id:'cardcity',name:'Карточка «История города»', cat:'val', stack:30, price:150, desc:'Коллекционная карточка' },
  wallet: { id:'wallet', name:'Чужой кошелёк', cat:'val', stack:1, price:0,   desc:'Вернуть хозяину или оставить?' },
  passport:{id:'passport',name:'Паспорт',      cat:'val', stack:1, price:2000, desc:'Спасает от штрафов полиции' },
  ring:   { id:'ring',   name:'Кольцо',        cat:'val', stack:1, price:5000, desc:'Сделать предложение' },
  oldphone:{id:'oldphone',name:'Найденный телефон', cat:'val', stack:3, price:300, desc:'Продать на барахолке' },
// Машины
bike_old: { id: 'bike_old', name: 'Старый велосипед', cat: 'tech', stack: 1, price: 500, desc: 'Медленно, но без затрат на бензин' },
scooter_china: { id: 'scooter_china', name: 'Китайский скутер', cat: 'tech', stack: 1, price: 15000, desc: 'Быстро, но ломается' },
car_lada: { id: 'car_lada', name: 'Лада Калина', cat: 'tech', stack: 1, price: 250000, desc: 'Надёжная рабочая лошадка' },
car_kia: { id: 'car_kia', name: 'Kia Rio', cat: 'tech', stack: 1, price: 800000, desc: 'Комфорт и стиль' },
car_toyota: { id: 'car_toyota', name: 'Toyota Camry', cat: 'tech', stack: 1, price: 2500000, desc: 'Статус и надёжность' },
truck_gaz: { id: 'truck_gaz', name: 'Газель', cat: 'tech', stack: 1, price: 600000, desc: 'Нужна для доставки стройматериалов' },
};

// ==================== РЮКЗАКИ ====================
export const BACKPACKS: BackpackDef[] = [
  { id:0, name:'Пакет «Пятёрочка»', slots:5,  price:0,     desc:'Бесплатно. Рвётся через 3 дня' },
  { id:1, name:'Спортивный мешок «Абибас»', slots:10, price:150,  desc:'Дешёвая подделка' },
  { id:2, name:'Городской рюкзак «Найк»',   slots:20, price:800,  desc:'Нормальный' },
  { id:3, name:'Туристический «Декейтер»',  slots:35, price:2500, desc:'Крепкий, водостойкий' },
  { id:4, name:'Брендовый «Рейба»',         slots:50, price:8000, desc:'Статус: +10 к репутации', rep:10 },
  { id:5, name:'Элитный «Луи Витон»',       slots:70, price:25000,desc:'Максимум вместимости' },
];

// ==================== МАГАЗИНЫ ====================
export const SHOPS: ShopDef[] = [
  {
    id:'pyaterochka', name:'«Пятёрочка»', kind:'Продукты', seller:'Кассир Зина',
    phrase:'«Акция на сосиски, берите два!»', wall:'#1f7a3d', floor:'#e8e2d0',
    tabs:['Еда','Напитки'],
    goods:[
      {item:'bread',price:30,tab:'Еда'},{item:'sausage',price:80,tab:'Еда'},{item:'doshirak',price:25,tab:'Еда'},
      {item:'kolbasa',price:150,tab:'Еда'},{item:'fruit',price:120,tab:'Еда'},{item:'pelmeni',price:180,tab:'Еда'},
      {item:'water',price:40,tab:'Напитки'},{item:'energetik',price:70,tab:'Напитки'},{item:'alcohol',price:90,tab:'Напитки'},
    ],
  },
  {
    id:'secondhand', name:'Секонд-хенд «Одежда+»', kind:'Одежда', seller:'Продавец Люда',
    phrase:'«Всё чистое, почти новое!»', wall:'#8a4a9e', floor:'#d9cfe4',
    tabs:['Одежда','Рюкзаки'],
    goods:[
      {item:'tshirt',price:50,tab:'Одежда'},{item:'jeans',price:120,tab:'Одежда'},{item:'wjacket',price:400,tab:'Одежда'},
      {item:'boots',price:250,tab:'Одежда'},{item:'hat',price:80,tab:'Одежда'},{item:'sneakers',price:1800,tab:'Одежда'},{item:'nike',price:3000,tab:'Одежда'},
      {item:'backpack1',price:150,tab:'Рюкзаки'},{item:'backpack2',price:800,tab:'Рюкзаки'},{item:'backpack3',price:2500,tab:'Рюкзаки'},
    ],
  },
  {
    id:'svyaznoy', name:'«Связной»', kind:'Техника', seller:'Консультант Артём',
    phrase:'«Возьмите ещё чехол в подарок?»', wall:'#e05a2a', floor:'#dcdcdc',
    tabs:['Телефоны','Гаджеты'],
    goods:[
      {item:'phone1',price:500,tab:'Телефоны'},{item:'phone2',price:3000,tab:'Телефоны'},{item:'phone3',price:15000,tab:'Телефоны'},
      {item:'laptop',price:25000,tab:'Гаджеты'},{item:'player',price:500,tab:'Гаджеты'},
    ],
  },
  {
    id:'stroymarket', name:'«Строймаркет»', kind:'Запчасти', seller:'Кладовщик Михалыч',
    phrase:'«Инструменты — в третьем ряду»', wall:'#d8a01e', floor:'#cfc8b8',
    tabs:['Инструменты','Материалы'],
    goods:[
      {item:'tools',price:800,tab:'Инструменты'},{item:'hammer',price:150,tab:'Инструменты'},{item:'rod',price:400,tab:'Инструменты'},
      {item:'parts',price:1500,tab:'Материалы'},{item:'tape',price:20,tab:'Материалы'},{item:'rope',price:15,tab:'Материалы'},{item:'lighter',price:40,tab:'Материалы'},
    ],
  },
  {
    id:'pharmacy', name:'Аптека «Вита»', kind:'Лекарства', seller:'Фармацевт Ольга',
    phrase:'«Не болейте, пожалуйста»', wall:'#2a9e6e', floor:'#e6f2ec',
    tabs:['Лекарства'],
    goods:[
      {item:'pills',price:150,tab:'Лекарства'},{item:'bandage',price:60,tab:'Лекарства'},{item:'vitamins',price:200,tab:'Лекарства'},
    ],
  },
{
  id: 'autosalon',
  name: 'Автосалон «Премиум»',
  kind: 'Авто',
  seller: 'Менеджер Алексей',
  phrase: '«У нас лучшие цены на автомобили!»',
  wall: '#2a3a4a',
  floor: '#1a2a3a',
  tabs: ['Велосипеды', 'Скутеры', 'Легковые', 'Грузовые'],
  goods: [
    { item: 'bike_old', price: 500, tab: 'Велосипеды' },
    { item: 'scooter_china', price: 15000, tab: 'Скутеры' },
    { item: 'car_lada', price: 250000, tab: 'Легковые' },
    { item: 'car_kia', price: 800000, tab: 'Легковые' },
    { item: 'car_toyota', price: 2500000, tab: 'Легковые' },
    { item: 'truck_gaz', price: 600000, tab: 'Грузовые' },
  ],
},
];

// ==================== ПРИЁМ ====================
export const RECYCLE = {
  glass: { name:'Приём стеклотары', items:['can05','can1','wbotl'], bonusEvery:100, bonus:50, bonusItem:'can05' },
  metal: { name:'Приём металлолома', items:['alu','copper','iron','cable'], bonusEvery:0, bonus:0, bonusItem:'' },
  paper: { name:'Приём макулатуры', items:['news','card','book','mag'], bonusEvery:0, bonus:0, bonusItem:'' },
};

// ==================== ЖИЛЬЁ ====================
export const APARTMENTS: ApartmentDef[] = [
  { id:'studio', name:'Студия в хрущёвке',   price:150000,   rooms:1, desc:'Маленькая, старая', income:300 },
  { id:'one',    name:'1-комнатная эконом',  price:350000,   rooms:1, desc:'Нормальная', income:600 },
  { id:'two',    name:'2-комнатная стандарт',price:800000,   rooms:2, desc:'Просторная', income:1200 },
  { id:'three',  name:'3-комнатная комфорт', price:2000000,  rooms:3, desc:'Хороший район', income:2500 },
  { id:'pent',   name:'Пентхаус',            price:10000000, rooms:5, desc:'Роскошь, вид на город', income:8000 },
];
// id квартиры → интерьер (у каждой ступени жилья свой внешний вид и число комнат)
export const APT_INTERIORS: Record<string, string> = {
  studio: 'i_apt_studio', one: 'i_apt_one', two: 'i_apt_two', three: 'i_apt_three', pent: 'i_penthouse',
};

// ==================== КРАФТ ====================
export const RECIPES: RecipeDef[] = [
  { id:'stick',   name:'Палка',        needs:[['branch',1],['rope',1]], out:'stick',   desc:'Ветка + верёвка. Отпугивает собак' },
  { id:'box',     name:'Коробка для сна', needs:[['card',2],['tape',1]], out:'boxitem', desc:'Картон + скотч. Сон на улице без штрафа HP' },
  { id:'heater',  name:'Обогреватель', needs:[['can1',2],['lighter',1]], out:'heater', desc:'Банки + зажигалка. Тепло ночью (опасно!)' },
  { id:'scooter', name:'Самокат',      needs:[['iron',3],['rope',1],['tape',2]], out:'scooter', desc:'Чермет + верёвка + скотч. Скорость +35%' },
];
ITEMS['boxitem'] = { id:'boxitem', name:'Коробка для сна', cat:'tool', stack:1, price:20, desc:'Спать на улице без потери здоровья' };

// ==================== РАБОТНИКИ ====================
export const WORKERS: WorkerDef[] = [
  { id:'vasya',  name:'Бомж Вася',      desc:'Собирает банки',           income:200,  wage:100,  hire:100,  minRep:0 },
  { id:'petya',  name:'Бывалый Петя',   desc:'Банки + макулатура',       income:500,  wage:250,  hire:500,  minRep:10 },
  { id:'serega', name:'Профи Серёга',   desc:'Всё + металлолом',         income:1200, wage:600,  hire:1500, minRep:25 },
  { id:'kolyan', name:'Бригадир Колян', desc:'Управляет бригадой',       income:5000, wage:2000, hire:5000, minRep:50 },
];

// ==================== ТЕХНИКА ====================
export const APPLIANCES: ApplianceDef[] = [
  { id:'fridge', name:'Холодильник',      part:1500, master:2000, wear:3.2 },
  { id:'tap',    name:'Кран',             part:200,  master:600,  wear:4.5 },
  { id:'washer', name:'Стиральная машина',part:1200, master:2500, wear:2.2 },
  { id:'stove',  name:'Плита',            part:800,  master:1500, wear:2.8 },
  { id:'sofa',   name:'Диван',            part:3000, master:0,    wear:1.2 },
  { id:'toilet', name:'Унитаз',           part:300,  master:600,  wear:3.6 },
  { id:'bath',   name:'Ванна',            part:500,  master:900,  wear:2.4 },
  { id:'tv',     name:'Телевизор',        part:900,  master:1400, wear:2.0 },
];

// ==================== МУСОРНЫЕ БАКИ ====================
export interface TrashCanDef { x: number; y: number; }
// координаты в тайлах — возле домов, столовой, вокзала и церкви
export const TRASH_CANS: TrashCanDef[] = [
  { x: 16, y: 23 }, { x: 32, y: 23 }, { x: 48, y: 23 }, // дома 1-3
  { x: 12, y: 52 }, { x: 40, y: 52 },                    // столовая / вокзал
  { x: 70, y: 52 }, { x: 88, y: 30 },                    // церковь / окраина
];
// лут из мусорных баков — беднее, чем на свалке
export const TRASHCAN_LOOT: [string, number][] = [
  ['can05', 26], ['wbotl', 16], ['news', 14], ['bread', 9], ['spoiled', 8],
  ['card', 8], ['tshirt', 6], ['iron', 5], ['mag', 4], ['coin', 2], ['wallet', 2],
];

// ==================== КРАЖА НА ЦЕХЕ ====================
export interface TheftDef { id: string; name: string; reward: number; risk: number; desc: string; }
export const THEFT_OPTIONS: TheftDef[] = [
  { id:'scrap',    name:'Металлолом',    reward:100,  risk:0.20, desc:'Старые трубы и обрезки. Почти безопасно.' },
  { id:'copper',   name:'Медный кабель', reward:350,  risk:0.35, desc:'Катушка кабеля за щитовой. Средний риск.' },
  { id:'precious', name:'Драгметаллы',   reward:1500, risk:0.50, desc:'Плата с золотыми контактами. Очень опасно!' },
];

// ==================== ЖИЛЫЕ ДОМА (подъезды) ====================
export interface BuildingAptRef { aptId: string; floor: number; number: string; }
export interface BuildingDef { id: string; name: string; address: string; floors: number; doorsPerFloor: number; apts: BuildingAptRef[]; }
export const BUILDINGS: BuildingDef[] = [
  {
    id: '0', name: 'Дом «Рябина»', address: 'ул. Рябиновая, 3', floors: 5, doorsPerFloor: 4,
    apts: [
      { aptId: 'studio', floor: 1, number: '102' },
      { aptId: 'one', floor: 2, number: '203' },
    ],
  },
  {
    id: '1', name: 'Дом «Центральный»', address: 'пр. Металлургов, 12', floors: 7, doorsPerFloor: 4,
    apts: [
      { aptId: 'two', floor: 3, number: '303' },
      { aptId: 'three', floor: 5, number: '502' },
    ],
  },
  {
    id: '2', name: 'ЖК «Высота»', address: 'наб. Заводская, 1', floors: 9, doorsPerFloor: 4,
    apts: [
      { aptId: 'pent', floor: 9, number: '904' },
    ],
  },
];
export const NEIGHBOR_LINES = [
  'Сосед: «Кто там? Я полицию вызову!»',
  'За дверью залаяла собака. Лучше уйти...',
  'Соседка: «Хлебушка не займёте?»',
  'Тишина. Только телевизор бормочет.',
  'Сосед: «Коммуналку за меня не заплатите?»',
  'Пахнет борщом. Желудок предательски заурчал.',
];

// ==================== ИНВЕСТИЦИИ ====================
export const INVESTMENTS: InvestmentDef[] = [
  { id:'kiosk', name:'Ларёк у вокзала',    price:50000,  income:800,  desc:'Пассивный доход каждый день' },
  { id:'taxi',  name:'Машина (такси)',     price:300000, income:2500, desc:'Водитель приносит долю' },
  { id:'biz',   name:'Сеть ларьков',       price:1500000,income:9000, desc:'Бизнес-империя' },
];

// ==================== РАБОТА НА ЗАВОДЕ ====================
// kind: carry — взять груз у стопки и отнести; cut — мини-игра за станком; trash — убрать кучи мусора.
// carry/drop явно задают, ГДЕ брать и КУДА нести — это исключает ошибки «не то задание».
export type CarryType = 'sheets' | 'beams' | 'alu' | 'pallet';
export type DropType = 'warehouse' | 'truck';
export type JobKind = 'carry' | 'cut' | 'trash';
export interface OneTimeJobDef {
  id: string; name: string; desc: string; dur: number; pay: number; energy: number; risk: number;
  where: 'factory' | 'workshop'; kind: JobKind; carry?: CarryType; drop?: DropType; count?: number;
}
export const ONETIME_JOBS: OneTimeJobDef[] = [
  // --- Завод «Красный Октябрь» ---
  { id: 'wagon',   name: 'Разгрузить вагон',        desc: 'Листы стали со стопок — на склад №1', dur: 2,   pay: 150, energy: 30, risk: 0,  where: 'factory', kind: 'carry', carry: 'sheets', drop: 'warehouse', count: 6 },
  { id: 'cleanf',  name: 'Убрать мусор в цеху',     desc: '8 куч мусора возле станков',          dur: 1,   pay: 80,  energy: 20, risk: 0,  where: 'factory', kind: 'trash', count: 8 },
  { id: 'cutp',    name: 'Нарезать детали',         desc: 'Выточить 5 деталей на станке',        dur: 1.5, pay: 200, energy: 25, risk: 5,  where: 'factory', kind: 'cut', count: 5 },
  { id: 'loadt',   name: 'Загрузить грузовик',      desc: 'Балки через пандус — в кузов',        dur: 2,   pay: 250, energy: 40, risk: 10, where: 'factory', kind: 'carry', carry: 'beams', drop: 'truck', count: 7 },
  { id: 'pallets', name: 'Перевезти поддоны',       desc: 'Погрузчик: поддоны — на склад №2',    dur: 2,   pay: 300, energy: 35, risk: 0,  where: 'factory', kind: 'carry', carry: 'pallet', drop: 'warehouse', count: 5 },
  // --- Цех №2 ---
  { id: 'sort',    name: 'Сортировка металла',      desc: 'Алюминий со стопки — на склад',       dur: 1,   pay: 100, energy: 25, risk: 5,  where: 'workshop', kind: 'carry', carry: 'alu', drop: 'warehouse', count: 5 },
  { id: 'cut',     name: 'Резка металла',           desc: 'Опасно: искры и окалина',            dur: 1,   pay: 200, energy: 30, risk: 30, where: 'workshop', kind: 'cut', count: 5 },
  { id: 'load',    name: 'Погрузка',                desc: 'Листы стали — на склад',              dur: 1,   pay: 150, energy: 30, risk: 10, where: 'workshop', kind: 'carry', carry: 'sheets', drop: 'warehouse', count: 5 },
];
// человекочитаемые названия для подсказок маршрута
export const CARRY_NAME: Record<CarryType, string> = { sheets: 'листы стали', beams: 'балки', alu: 'алюминий', pallet: 'поддоны' };
export const PILE_NAME: Record<CarryType, string> = { sheets: 'Листы стали', beams: 'Балки', alu: 'Алюминий', pallet: 'Поддоны' };
export const DROP_NAME: Record<DropType, string> = { warehouse: 'склад', truck: 'грузовик' };

// ==================== БЕСПЛАТНАЯ КВАРТИРА ====================
// тестовое жильё для старта: 7 дней бесплатно, потом — аренда или выселение
export const FREE_APT = {
  buildingId: '0',    // дом «Рябина»
  number: '101',      // кв. 101, 1-й этаж
  freeDays: 7,
  rentAfter: 150,     // ₽/день после льготного периода
};
export interface PermJobDef { id: string; name: string; desc: string; hours: number; pay: number; energy: number; promos: { days: number; name: string; bonus: number }[]; }
export const PERM_JOBS: PermJobDef[] = [
  { id: 'loader',  name: 'Грузчик',  desc: '8 часов в день на складе', hours: 8,  pay: 500, energy: 50, promos: [{ days: 5, name: 'Старший грузчик', bonus: 200 }, { days: 15, name: 'Бригадир', bonus: 500 }] },
  { id: 'sweeper', name: 'Уборщик',  desc: '6 часов — метла и совок',  hours: 6,  pay: 300, energy: 30, promos: [{ days: 5, name: 'Старший уборщик', bonus: 100 }, { days: 15, name: 'Завхоз', bonus: 300 }] },
  { id: 'guard',   name: 'Сторож',   desc: '12 часов ночью',           hours: 12, pay: 400, energy: 40, promos: [{ days: 5, name: 'Старший смены', bonus: 150 }, { days: 15, name: 'Начальник охраны', bonus: 400 }] },
];

// ==================== ЗАДАНИЯ ====================
export const QUESTS: QuestDef[] = [
  { id:'q_cans',   text:'Найди 50 банок',               counter:'cans',    target:50, money:200 },
  { id:'q_paper',  text:'Сдай 10 кг макулатуры',        counter:'paper',   target:10, money:150 },
  { id:'q_metal',  text:'Сдай 5 кг металла',            counter:'metal',   target:5,  money:250 },
  { id:'q_news',   text:'Доставь газету бабушке',       counter:'deliver', target:1,  money:100, rewardItem:'bread' },
  { id:'q_help',   text:'Помоги бездомному (подай 50 ₽)',counter:'help',   target:1,  money:0,   rep:['homeless',10] },
  { id:'q_dog',    text:'Найди потерянную собаку в парке',counter:'dog',   target:1,  money:500 },
  { id:'q_park',   text:'Уберись в парке',              counter:'clean',   target:1,  money:300 },
  { id:'q_night',  text:'Выживи ночь на улице (до 5 утра)',counter:'night',target:1,  money:150 },
  { id:'q_food',   text:'Поешь горячей еды (обед в столовой)',counter:'eat',target:1,  money:50 },
  { id:'q_fish',   text:'Поймай 3 рыбы',                counter:'fish',    target:3,  money:200 },
];

// ==================== ТАБЛИЦЫ ЛУТА ====================
export const LOOT: Record<string, [string, number, number][]> = {
  // [item, weight, maxQty]
  park:    [['can05',22,3],['can1',12,2],['wbotl',10,2],['news',14,2],['card',10,2],['mag',8,2],
            ['bread',6,1],['spoiled',8,1],['branch',10,2],['rope',6,1],['coin',1,1],['cardcity',2,1],['wallet',2,1]],
  suburb:  [['can05',16,4],['can1',12,3],['iron',14,2],['alu',10,2],['card',12,3],['news',8,2],
            ['spoiled',8,1],['tape',6,1],['lighter',5,1],['jewel',2,1],['oldphone',3,1],['book',6,2],['branch',6,2]],
  factory: [['iron',20,3],['alu',14,2],['cable',12,2],['copper',6,1],['can1',8,2],['hammer',3,1],
            ['tools',2,1],['lighter',4,1],['coin',2,1],['antique',2,1],['branch',4,2]],
  station: [['can05',20,3],['wbotl',14,2],['news',12,2],['mag',10,2],['bread',6,1],['spoiled',10,1],
            ['rope',6,1],['card',8,2],['cardcity',3,1],['oldphone',3,1],['wallet',2,1]],
};

export const SELL_VALS: Record<string, [number, number]> = {
  antique:[700,2200], jewel:[1200,2800], coin:[200,450], cardcity:[100,260],
  oldphone:[150,400], wallet:[0,0], ring:[3500,5500],
};

export const CAT_LABEL: Record<ItemCat, string> = {
  food:'Еда', scrap:'Вторсырьё', mat:'Материалы', tool:'Инструменты',
  cloth:'Одежда', tech:'Техника', med:'Медицина', val:'Ценности',
};
export const CAT_COLOR: Record<ItemCat, string> = {
  food:'#8ee06e', scrap:'#5db8ff', mat:'#d8b25e', tool:'#ff9d5c',
  cloth:'#c98ae0', tech:'#5ce0d3', med:'#ff8a9e', val:'#ffd34d',
};

// ==================== ГОРОДА ====================
export const CITY_PREFIXES = ['Ново', 'Старо', 'Красно', 'Сине', 'Тёмно', 'Свето', 'Миро', 'Градо', 'Верхне', 'Северо'];
export const CITY_SUFFIXES = ['град', 'ск', 'ово', 'ино', 'поль', 'гор', 'ец', 'ов', 'реченск', 'озёрск'];
export type Transport = 'bus' | 'train' | 'plane';
export const TRANSPORT: Record<Transport, { name: string; mult: number; timeLabel: string }> = {
  bus:   { name: 'Автобус', mult: 1,   timeLabel: '~1 день в пути' },
  train: { name: 'Поезд',   mult: 2.2, timeLabel: '~6 часов в пути' },
  plane: { name: 'Самолёт', mult: 4.5, timeLabel: 'почти мгновенно' },
};
export interface CityDef {
  name: string; desc: string; perk: string;
  base: number; // базовая цена билета
  foodMult: number; clothMult: number; techMult: number;
  scrapMult: number; wageMult: number;
  tempOffset: number; danger: number;
}
export const randomCityName = (used: string[]): string => {
  for (let i = 0; i < 50; i++) {
    const n = CITY_PREFIXES[Math.floor(Math.random() * CITY_PREFIXES.length)] +
              CITY_SUFFIXES[Math.floor(Math.random() * CITY_SUFFIXES.length)];
    if (!used.includes(n)) return n;
  }
  return 'Город-' + Math.floor(Math.random() * 99);
};
const PERKS: [string, string][] = [
  ['Приём платит больше за вторсырьё', 'scrap'],
  ['Дешёвая еда в магазинах', 'food'],
  ['Одежда дешевле, чем везде', 'cloth'],
  ['Техника по сниженным ценам', 'tech'],
  ['Работы платят больше', 'wage'],
  ['Тёплый климат — холода редкость', 'warm'],
  ['Спокойный город — меньше опасностей', 'safe'],
];
export function genCities(): CityDef[] {
  const names: string[] = ['Новострой'];
  const cities: CityDef[] = [{
    name: 'Новострой', desc: 'Родной город. С него всё началось.', perk: 'Стартовые цены без наценок',
    base: 0, foodMult: 1, clothMult: 1, techMult: 1, scrapMult: 1, wageMult: 1, tempOffset: 0, danger: 1,
  }];
  const dists = [150, 280, 450, 800];
  for (let i = 0; i < 4; i++) {
    const name = randomCityName(names);
    names.push(name);
    const cold = i >= 2;
    const r = () => 0.8 + Math.random() * 0.45;
    const [perkText, perkId] = PERKS[Math.floor(Math.random() * PERKS.length)];
    const c: CityDef = {
      name,
      desc: cold ? 'Северный город — зимы здесь суровые.' : 'Южный город — тепло и солнечно.',
      perk: perkText, base: dists[i],
      foodMult: r(), clothMult: r(), techMult: r(), scrapMult: r(), wageMult: r(),
      tempOffset: cold ? -(6 + i * 4) : 4 + i * 2,
      danger: 0.7 + Math.random() * 0.8,
    };
    if (perkId === 'scrap') c.scrapMult = 1.45;
    if (perkId === 'food') c.foodMult = 0.7;
    if (perkId === 'cloth') c.clothMult = 0.7;
    if (perkId === 'tech') c.techMult = 0.7;
    if (perkId === 'wage') c.wageMult = 1.5;
    if (perkId === 'warm') c.tempOffset = 8;
    if (perkId === 'safe') c.danger = 0.55;
    cities.push(c);
  }
  return cities;
}

// ==================== МУЗЫКА ====================
export interface TrackDef {
  name: string; genre: string; dur: string;
  bpm: number; root: number; minor: boolean;
  bass: OscillatorType; lead: OscillatorType;
  drums: boolean; pad: boolean; density: number;
}
export const TRACKS: TrackDef[] = [
  { name: 'Ночной город',    genre: 'Ambient',    dur: '3:45', bpm: 70,  root: 45, minor: true,  bass: 'sine',     lead: 'triangle', drums: false, pad: true,  density: 0.35 },
  { name: 'Дождь за окном',  genre: 'Lo-Fi',      dur: '4:12', bpm: 82,  root: 48, minor: true,  bass: 'triangle', lead: 'sine',     drums: true,  pad: true,  density: 0.5 },
  { name: 'Пустые улицы',    genre: 'Chillwave',  dur: '3:28', bpm: 96,  root: 50, minor: true,  bass: 'triangle', lead: 'square',   drums: true,  pad: false, density: 0.55 },
  { name: 'Рассвет',         genre: 'Ambient',    dur: '5:01', bpm: 66,  root: 52, minor: false, bass: 'sine',     lead: 'sine',     drums: false, pad: true,  density: 0.3 },
  { name: 'Метро',           genre: 'Electronic', dur: '2:56', bpm: 118, root: 45, minor: true,  bass: 'sawtooth', lead: 'square',   drums: true,  pad: false, density: 0.7 },
  { name: 'Крыши',           genre: 'Downtempo',  dur: '4:33', bpm: 88,  root: 47, minor: true,  bass: 'sine',     lead: 'triangle', drums: true,  pad: true,  density: 0.45 },
  { name: 'Одиночество',     genre: 'Ambient',    dur: '3:17', bpm: 62,  root: 43, minor: true,  bass: 'sine',     lead: 'sine',     drums: false, pad: true,  density: 0.25 },
  { name: 'Надежда',         genre: 'Uplifting',  dur: '4:48', bpm: 104, root: 50, minor: false, bass: 'triangle', lead: 'triangle', drums: true,  pad: true,  density: 0.6 },
  { name: 'Путь домой',      genre: 'Lo-Fi',      dur: '3:52', bpm: 78,  root: 48, minor: false, bass: 'triangle', lead: 'sine',     drums: true,  pad: true,  density: 0.5 },
  { name: 'Новая жизнь',     genre: 'Inspiring',  dur: '5:20', bpm: 112, root: 52, minor: false, bass: 'triangle', lead: 'square',   drums: true,  pad: true,  density: 0.65 },
];

export const RARITY_COLOR: Record<NonNullable<ItemDef['rarity']>, string> = {
  'Обычная': '#8b97b8', 'Необычная': '#5db8ff', 'Редкая': '#c98ae0', 'Эпическая': '#ffb52e',
};
export function itemStatLines(def: ItemDef): { label: string; value: string; color: string }[] {
  const lines: { label: string; value: string; color: string }[] = [];
  if (def.warmth) lines.push({ label: 'Тепло', value: `+${def.warmth}`, color: '#5db8ff' });
  if (def.speed) lines.push({ label: 'Скорость', value: `+${def.speed}%`, color: '#8ee06e' });
  if (def.rep) lines.push({ label: 'Репутация', value: `+${def.rep}`, color: '#ffb52e' });
  if (def.protect) lines.push({ label: 'Защита', value: `+${def.protect}`, color: '#ff9d5c' });
  if (def.comfort) lines.push({ label: 'Комфорт', value: `+${def.comfort}`, color: '#c98ae0' });
  if (def.fx) {
    for (const k of Object.keys(def.fx) as (keyof Stats)[]) {
      const v = def.fx[k] ?? 0;
      if (!v) continue;
      const names: Record<keyof Stats, string> = { hp: 'Здоровье', energy: 'Выносливость', fatigue: 'Усталость', hunger: 'Голод', hygiene: 'Гигиена', mood: 'Настроение' };
      lines.push({ label: names[k], value: `${v > 0 ? '+' : ''}${v}`, color: v > 0 ? '#8ee06e' : '#ff8a8a' });
    }
  }
  if (def.stylish) lines.push({ label: 'Стиль', value: `+${def.stylish}`, color: '#ffd34d' });
  return lines;
}
// ==================== ТРАНСПОРТ ====================
// ID предметов, которые являются транспортом (не кладутся в рюкзак)
export const VEHICLE_IDS = new Set(['bike_old', 'scooter_china', 'car_lada', 'car_kia', 'car_toyota', 'truck_gaz']);

export interface VehicleDef {
  id: string;
  name: string;
  speedMult: number;  // множитель скорости (1 = пешком)
  needsFuel: boolean;
  fuelCapacity: number;
  fuelConsumption: number; // л/100км
  color: string;
  icon: string;
}

export const VEHICLES: Record<string, VehicleDef> = {
  bike_old:      { id: 'bike_old',      name: 'Старый велосипед', speedMult: 1.6, needsFuel: false, fuelCapacity: 0, fuelConsumption: 0, color: '#8B7355', icon: '🚲' },
  scooter_china: { id: 'scooter_china', name: 'Китайский скутер', speedMult: 2.2, needsFuel: true,  fuelCapacity: 5, fuelConsumption: 2.5, color: '#4a6741', icon: '🛵' },
  car_lada:      { id: 'car_lada',      name: 'Лада Калина',      speedMult: 3.0, needsFuel: true,  fuelCapacity: 50, fuelConsumption: 8,   color: '#c0c0c0', icon: '🚗' },
  car_kia:       { id: 'car_kia',       name: 'Kia Rio',          speedMult: 3.5, needsFuel: true,  fuelCapacity: 50, fuelConsumption: 7,   color: '#ffffff', icon: '' },
  car_toyota:    { id: 'car_toyota',    name: 'Toyota Camry',     speedMult: 4.0, needsFuel: true,  fuelCapacity: 60, fuelConsumption: 9,   color: '#1a1a2e', icon: '🚗' },
  truck_gaz:     { id: 'truck_gaz',     name: 'Газель',           speedMult: 2.8, needsFuel: true,  fuelCapacity: 80, fuelConsumption: 12,  color: '#ffffff', icon: '🚛' },
};

export const fmt = (n: number) => Math.round(n).toLocaleString('ru-RU');
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const ri = (a: number, b: number) => Math.floor(rnd(a, b + 1));
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
