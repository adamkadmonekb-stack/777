// ==================== ТИПЫ АЧИВОК ====================
export type AchievementCategory = 'scrap' | 'work' | 'travel' | 'survival' | 'secret' | 'apartment';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  target: number;
  rewardMoney: number;
  rewardRep: number;
  secret?: boolean;
}

// ==================== СПИСОК АЧИВОК (30+) ====================
export const ACHIEVEMENTS: AchievementDef[] = [
  // === СБОР МУСОРА ===
  { id: 'bottle_1', name: '🍾 Первая бутылка', description: 'Соберите свою первую бутылку', category: 'scrap', icon: '', target: 1, rewardMoney: 10, rewardRep: 1 },
  { id: 'bottle_100', name: '🍾 Сборщик бутылок I', description: 'Собрать 100 бутылок', category: 'scrap', icon: '🍾', target: 100, rewardMoney: 200, rewardRep: 5 },
  { id: 'bottle_500', name: '🍾 Сборщик бутылок II', description: 'Собрать 500 бутылок', category: 'scrap', icon: '🍾', target: 500, rewardMoney: 1000, rewardRep: 10 },
  { id: 'bottle_1000', name: '🍾 Король бутылок', description: 'Собрать 1000 бутылок', category: 'scrap', icon: '👑', target: 1000, rewardMoney: 5000, rewardRep: 25 },
  
  { id: 'can_100', name: '🥫 Сборщик банок I', description: 'Собрать 100 банок', category: 'scrap', icon: '🥫', target: 100, rewardMoney: 150, rewardRep: 3 },
  { id: 'can_500', name: '🥫 Сборщик банок II', description: 'Собрать 500 банок', category: 'scrap', icon: '🥫', target: 500, rewardMoney: 750, rewardRep: 8 },
  { id: 'can_1000', name: '🥫 Мастер банок', description: 'Собрать 1000 банок', category: 'scrap', icon: '🏆', target: 1000, rewardMoney: 3000, rewardRep: 15 },
  
  { id: 'paper_50', name: '📰 Сборщик макулатуры I', description: 'Собрать 50 кг макулатуры', category: 'scrap', icon: '', target: 50, rewardMoney: 200, rewardRep: 4 },
  { id: 'paper_200', name: '📰 Сборщик макулатуры II', description: 'Собрать 200 кг макулатуры', category: 'scrap', icon: '', target: 200, rewardMoney: 800, rewardRep: 10 },

  // === РАБОТА ===
  { id: 'first_job', name: '💼 Первая работа', description: 'Устроиться на работу', category: 'work', icon: '💼', target: 1, rewardMoney: 300, rewardRep: 10 },
  { id: 'work_7days', name: '📅 Неделя труда', description: 'Отработать 7 дней', category: 'work', icon: '📅', target: 7, rewardMoney: 500, rewardRep: 8 },
  { id: 'work_30days', name: '📆 Месяц труда', description: 'Отработать 30 дней', category: 'work', icon: '', target: 30, rewardMoney: 2000, rewardRep: 15 },

  // === КВАРТИРА И ЖИЛЬЁ ===
  { id: 'apartment_first', name: '🏠 Первое жильё', description: 'Снимите или купите свою первую квартиру', category: 'apartment', icon: '🏠', target: 1, rewardMoney: 200, rewardRep: 5 },
  { id: 'apartment_sleep_10', name: '😴 Домашний уют', description: 'Поспите в своей квартире 10 раз', category: 'apartment', icon: '', target: 10, rewardMoney: 150, rewardRep: 3 },
  { id: 'apartment_bath_20', name: '🛁 Чистюля', description: 'Примите ванну 20 раз', category: 'apartment', icon: '', target: 20, rewardMoney: 100, rewardRep: 5 },
  { id: 'apartment_cook_15', name: '🍳 Домашний повар', description: 'Приготовьте еду на плите 15 раз', category: 'apartment', icon: '🍳', target: 15, rewardMoney: 120, rewardRep: 4 },
  { id: 'apartment_repair_5', name: '🔧 Мастер на все руки', description: 'Отремонтируйте технику 5 раз', category: 'apartment', icon: '🔧', target: 5, rewardMoney: 300, rewardRep: 8 },
  { id: 'apartment_furniture', name: '🛋️ Обставленный дом', description: 'Купите и установите всю мебель', category: 'apartment', icon: '️', target: 1, rewardMoney: 500, rewardRep: 10 },
  { id: 'apartment_owned', name: '🏡 Собственник', description: 'Купите квартиру в собственность', category: 'apartment', icon: '🏡', target: 1, rewardMoney: 1000, rewardRep: 20 },

  // === ПУТЕШЕСТВИЯ ===
  { id: 'first_travel', name: '🚌 Первое путешествие', description: 'Посетить другой город', category: 'travel', icon: '🚌', target: 1, rewardMoney: 100, rewardRep: 5 },
  { id: 'all_cities', name: '🗺️ Исследователь', description: 'Посетить все 5 городов', category: 'travel', icon: '🗺️', target: 5, rewardMoney: 1000, rewardRep: 20 },

  // === ВЫЖИВАНИЕ ===
  { id: 'first_night', name: '🌙 Первая ночь', description: 'Пережить первую ночь', category: 'survival', icon: '', target: 1, rewardMoney: 50, rewardRep: 3 },
  { id: 'survive_7days', name: '📆 Неделя выживания', description: 'Прожить 7 дней', category: 'survival', icon: '📆', target: 7, rewardMoney: 300, rewardRep: 8 },
  { id: 'capital_10k', name: '💰 Первый капитал', description: 'Накопить 10,000₽', category: 'survival', icon: '', target: 10000, rewardMoney: 500, rewardRep: 10 },
  { id: 'capital_1m', name: '💰 Миллионер', description: 'Накопить 1,000,000₽', category: 'survival', icon: '', target: 1000000, rewardMoney: 0, rewardRep: 50 },

  // === СЕКРЕТНЫЕ ===
  { id: 'steal_workshop', name: '🦹 Ночной гость', description: 'Украсть из Цеха №2', category: 'secret', icon: '🦹', target: 1, rewardMoney: 500, rewardRep: -20, secret: true },
  { id: 'caught_police', name: '👮 Пойман!', description: 'Попасться полиции', category: 'secret', icon: '👮', target: 1, rewardMoney: 0, rewardRep: -10, secret: true },
  { id: 'robbed_sleep', name: '🚨 Ограбление', description: 'Вас ограбили во сне', category: 'secret', icon: '🚨', target: 1, rewardMoney: 100, rewardRep: 0, secret: true },
];

// ==================== КАТЕГОРИИ ====================
export const CATEGORY_META: Record<AchievementCategory, { label: string; color: string }> = {
  scrap: { label: 'Сбор', color: '#8ee06e' },
  work: { label: 'Работа', color: '#ffd34d' },
  travel: { label: 'Путешествия', color: '#5ce0d3' },
  survival: { label: 'Выживание', color: '#ff9d5c' },
  secret: { label: 'Секретные', color: '#c98ae0' },
  apartment: { label: 'Квартира', color: '#a8e0c9' },
};

// ==================== ФУНКЦИИ ПОМОЩНИКИ ====================
export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDef[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getTotalAchievements(): number {
  return ACHIEVEMENTS.length;
}

// ==================== ТРЕКИНГ И СОХРАНЕНИЕ ====================
export interface AchievementProgress {
  current: number;
  unlocked: boolean;
  unlockedAt?: number;
}

let progressMap: Record<string, AchievementProgress> = {};

// Инициализация прогресса
function initProgress() {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('streets_achievements_progress') : null;
  if (saved) {
    try {
      progressMap = JSON.parse(saved);
    } catch (e) {
      console.error('Ошибка загрузки прогресса ачивок:', e);
      progressMap = {};
    }
  }
}

// Сохранение прогресса
export function saveAchievementsProgress() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('streets_achievements_progress', JSON.stringify(progressMap));
  }
}

// Получить прогресс ачивки
export function getAchievementProgress(id: string): AchievementProgress {
  if (!progressMap[id]) {
    progressMap[id] = { current: 0, unlocked: false };
  }
  return progressMap[id];
}

// Обновить прогресс ачивки (возвращает true если разблокирована)
export function updateAchievement(id: string, amount: number = 1): boolean {
  const ach = getAchievement(id);
  if (!ach) return false;
  
  if (!progressMap[id]) {
    progressMap[id] = { current: 0, unlocked: false };
  }
  
  const prog = progressMap[id];
  if (prog.unlocked) return false; // Уже разблокировано
  
  prog.current += amount;
  
  if (prog.current >= ach.target && !prog.unlocked) {
    prog.unlocked = true;
    prog.unlockedAt = Date.now();
    saveAchievementsProgress();
    return true; // Разблокировано!
  }
  
  saveAchievementsProgress();
  return false;
}

// Проверка всех ачивок на автоматическую разблокировку (например, при загрузке сохранения)
export function checkAchievement(id: string, value: number): boolean {
  const ach = getAchievement(id);
  if (!ach) return false;
  
  if (!progressMap[id]) {
    progressMap[id] = { current: 0, unlocked: false };
  }
  
  const prog = progressMap[id];
  if (prog.unlocked) return false;
  
  prog.current = value;
  
  if (prog.current >= ach.target && !prog.unlocked) {
    prog.unlocked = true;
    prog.unlockedAt = Date.now();
    saveAchievementsProgress();
    return true;
  }
  
  saveAchievementsProgress();
  return false;
}

// Получить все прогрессы
export function getAllAchievementsProgress(): Record<string, AchievementProgress> {
  return { ...progressMap };
}

// Инициализировать при импорте
initProgress();
