import React, { useState, useMemo } from 'react';
import type { Game } from '../game/engine';
import { ACHIEVEMENTS, CATEGORY_META, getAchievementsByCategory, getTotalAchievements } from '../data/achievements';
import { sfx } from '../game/audio';

type Filter = 'all' | 'unlocked' | 'locked';
type CategoryFilter = 'all' | 'scrap' | 'work' | 'travel' | 'survival' | 'secret';

export function AchievementsMenu({ game, onClose }: { game: Game; onClose: () => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const achievementsData = game.getAchievementsData();
  const unlockedCount = achievementsData.filter(a => a.unlocked).length;
  const totalCount = getTotalAchievements();

  const filtered = useMemo(() => {
    return achievementsData.filter(ach => {
      // Фильтр по статусу
      if (filter === 'unlocked' && !ach.unlocked) return false;
      if (filter === 'locked' && ach.unlocked) return false;
      // Фильтр по категории
      if (categoryFilter !== 'all' && ach.category !== categoryFilter) return false;
      return true;
    });
  }, [achievementsData, filter, categoryFilter]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#1a1f2e] rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#ffb52e' }}>🏆 Достижения</h2>
          <button onClick={onClose} className="text-[#8b97b8] hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Счётчик */}
        <div className="mb-4 text-sm" style={{ color: '#c6cede' }}>
          Открыто: <span style={{ color: '#8ee06e' }}>{unlockedCount}</span> / {totalCount}
        </div>

        {/* Фильтры статуса */}
        <div className="flex gap-2 mb-3">
          {(['all', 'unlocked', 'locked'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => { sfx.click(); setFilter(f); }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                filter === f ? 'bg-[#ffb52e] text-[#2a1600]' : 'bg-[#2a2f3e] text-[#8b97b8] hover:bg-[#3a3f4e]'
              }`}
            >
              {f === 'all' ? 'Все' : f === 'unlocked' ? 'Открытые' : 'Закрытые'}
            </button>
          ))}
        </div>

        {/* Фильтры категорий */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => { sfx.click(); setCategoryFilter('all'); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
              categoryFilter === 'all' ? 'bg-[#c6cede] text-[#1a1f2e]' : 'bg-[#2a2f3e] text-[#8b97b8] hover:bg-[#3a3f4e]'
            }`}
          >
            Все кат.
          </button>
          {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map(cat => (
            <button
              key={cat}
              onClick={() => { sfx.click(); setCategoryFilter(cat); }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                categoryFilter === cat ? 'ring-2 ring-offset-1 ring-offset-[#1a1f2e]' : ''
              }`}
              style={{
                background: categoryFilter === cat ? CATEGORY_META[cat].color : '#2a2f3e',
                color: categoryFilter === cat ? '#1a1f2e' : CATEGORY_META[cat].color,
                ringColor: CATEGORY_META[cat].color,
              }}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>

        {/* Список ачивок */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#8b97b8' }}>
              Нет достижений для отображения
            </div>
          ) : (
            filtered.map(ach => (
              <AchievementCard key={ach.id} ach={ach} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ ach }: { ach: ReturnType<Game['getAchievementsData']>[number] }) {
  const isUnlocked = ach.unlocked;
  const progress = Math.min(100, Math.round((ach.progress / ach.target) * 100));
  const categoryColor = CATEGORY_META[ach.category].color;

  return (
    <div
      className={`p-3 rounded-lg border transition ${
        isUnlocked ? 'border-[#8ee06e]/30 bg-[#8ee06e]/5' : 'border-[#8b97b8]/20 bg-[#2a2f3e]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0"
          style={{
            background: isUnlocked ? `${categoryColor}22` : '#1a1f2e',
            opacity: isUnlocked ? 1 : 0.5,
          }}
        >
          {ach.icon}
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-bold text-sm truncate"
              style={{ color: isUnlocked ? '#8ee06e' : '#8b97b8' }}
            >
              {ach.name}
            </h3>
            {ach.secret && !isUnlocked && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#c98ae033', color: '#c98ae0' }}>
                ???
              </span>
            )}
          </div>

          <p className="text-xs mb-2" style={{ color: isUnlocked ? '#c6cede' : '#5d6884' }}>
            {isUnlocked || !ach.secret ? ach.description : 'Секретное достижение'}
          </p>

          {/* Прогресс */}
          {!isUnlocked && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: '#8b97b8' }}>
                <span>Прогресс</span>
                <span>{Math.round(ach.progress)} / {ach.target}</span>
              </div>
              <div className="h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${categoryColor}88, ${categoryColor})`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Награды */}
          <div className="flex items-center gap-3 text-[10px]">
            {ach.rewardMoney > 0 && (
              <span style={{ color: '#8ee06e' }}>💰 +{ach.rewardMoney}₽</span>
            )}
            {ach.rewardRep !== 0 && (
              <span style={{ color: ach.rewardRep > 0 ? '#ffd34d' : '#ff5a5a' }}>
                👍 {ach.rewardRep > 0 ? '+' : ''}{ach.rewardRep}
              </span>
            )}
            {isUnlocked && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded" style={{ background: '#8ee06e22', color: '#8ee06e' }}>
                ✓ Разблокировано
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
