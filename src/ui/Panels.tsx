import { useEffect, useRef, useState } from 'react';
import type { Game, UIState, Modal } from '../game/engine';
import {
  ITEMS, BACKPACKS, SHOPS, APARTMENTS, RECYCLE, RECIPES, WORKERS, APPLIANCES, INVESTMENTS,
  CAT_COLOR, CAT_LABEL, TRANSPORT, SLOT_META, RARITY_COLOR, itemStatLines, TRACKS,
  ONETIME_JOBS, PERM_JOBS, BUILDINGS, THEFT_OPTIONS, fmt, clamp,
} from '../game/core';
import type { EquipSlot, ItemDef, Transport } from '../game/core';
import { sfx } from '../game/audio';
import { music } from '../game/music';
import { Icon } from './HUD';
import { AchievementsMenu } from '../components/AchievementsMenu';

const Row = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center justify-between gap-2 py-1.5 border-b border-[#2b355066] last:border-0 ${className}`}>{children}</div>
);
const Money = ({ v, className = '' }: { v: number; className?: string }) => (
  <span className={`font-disp ${className}`} style={{ color: '#8ee06e' }}>{fmt(v)} ₽</span>
);

function Panel({ title, sub, onClose, children, w = 560 }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode; w?: number }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-2 md:p-4" style={{ background: 'rgba(6,8,14,.66)' }}>
      <div className="panel pop-in flex flex-col max-h-full" style={{ width: `min(${w}px, 96vw)` }}>
        <div className="flex items-start justify-between px-4 pt-3 pb-2 border-b border-[#2b3550]">
          <div>
            <h2 className="panel-title text-[15px] md:text-lg leading-tight">{title}</h2>
            {sub && <p className="text-[10.5px] mt-0.5" style={{ color: '#8b97b8' }}>{sub}</p>}
          </div>
          <button onClick={() => { sfx.click(); onClose(); }} className="btn btn-ghost btn-sm shrink-0">Esc</button>
        </div>
        <div className="p-3.5 overflow-y-auto scroll-thin" style={{ maxHeight: 'min(74vh, 620px)' }}>{children}</div>
      </div>
    </div>
  );
}

export function ModalRenderer({ ui, game }: { ui: UIState; game: Game }) {
  const m = ui.modal;
  if (!m) return null;
  const close = () => game.closeModal();
  switch (m.kind) {
    case 'intro': return <IntroP onClose={close} />;
    case 'menu': return <MenuP ui={ui} game={game} onClose={close} />;
    case 'inventory': return <InventoryP ui={ui} game={game} onClose={close} />;
    case 'shop': return <ShopP id={m.id} ui={ui} game={game} onClose={close} />;
    case 'recycle': return <RecycleP kindId={m.kindId} ui={ui} game={game} onClose={close} />;
    case 'baraholka': return <BaraholkaP ui={ui} game={game} onClose={close} />;
    case 'sleep': return <SleepP game={game} onClose={close} />;
    case 'realtor': return <RealtorP ui={ui} game={game} onClose={close} />;
    case 'room': return <RoomP ui={ui} game={game} onClose={close} />;
    case 'newspaper': return <NewsP ui={ui} game={game} onClose={close} />;
    case 'phone': return <PhoneP ui={ui} game={game} onClose={close} />;
    case 'workers': return <WorkersP ui={ui} game={game} onClose={close} />;
    case 'craft': return <CraftP ui={ui} game={game} onClose={close} />;
    case 'quests': return <QuestsP ui={ui} game={game} onClose={close} />;
    case 'charity': return <CharityP id={m.id} ui={ui} game={game} onClose={close} />;
    case 'apartment': return <ApartmentP ui={ui} game={game} onClose={close} />;
    case 'event': return m.ev === 'wallet' ? <WalletP game={game} /> : <CrimeP game={game} />;
    case 'mugged': return <MuggedP game={game} />;
    case 'police': return <PoliceP ui={ui} game={game} />;
    case 'hospital': return <HospitalP ui={ui} game={game} onClose={close} />;
    case 'gameover': return <GameOverP ui={ui} game={game} />;
    case 'victory': return <VictoryP ui={ui} game={game} onClose={close} />;
    case 'map': return <MapP ui={ui} onClose={close} />;
    case 'citymap': return <CityMapP ui={ui} game={game} onClose={close} />;
    case 'music': return <MusicP ui={ui} onClose={close} />;
    case 'factory': return <FactoryP id={m.id} ui={ui} game={game} onClose={close} />;
    case 'entrance': return <BuildingP id={m.id} ui={ui} game={game} onClose={close} />;
    case 'theft': return <TheftP game={game} onClose={close} />;
    case 'achievements': return <AchievementsMenu game={game} onClose={close} />;
    default: return null;
  }
}

// ==================== ОТДЕЛЬНЫЕ ПАНЕЛИ ====================
function IntroP({ onClose }: { onClose: () => void }) {
  return (
    <Panel title="Улицы города" sub="Путь наверх · история одного выживания" onClose={onClose} w={620}>
      <div className="text-[12.5px] leading-relaxed space-y-2.5" style={{ color: '#c6cede' }}>
        <p>Вы приехали в большой город за лучшей жизнью, но начали с самого дна: <b style={{ color: '#ffb52e' }}>50 рублей</b> в кармане, пакет вместо рюкзака и лавочка вместо дома.</p>
        <p>Собирайте <b style={{ color: '#5db8ff' }}>банки и макулатуру</b> на свалках, сдавайте их в приём, ешьте, спите и не замёрзните ночью. Купите рюкзак побольше — заработаете больше. Потом комнату, квартиру... а там и до пентхауса недалеко.</p>
        <div className="panel p-2.5" style={{ background: '#12161f' }}>
          <div className="font-disp text-[10px] mb-1.5" style={{ color: '#ffb52e' }}>УПРАВЛЕНИЕ</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <span><b>WASD / стрелки / джойстик</b> — движение</span>
            <span><b>E / кнопка ✋</b> — взаимодействие</span>
            <span><b>Shift</b> — бег</span>
            <span><b>I</b> — рюкзак, <b>M</b> — карта</span>
            <span><b>C</b> — крафт, <b>Q</b> — задания</span>
            <span><b>Esc</b> — меню</span>
          </div>
        </div>
        <p className="text-[11px]" style={{ color: '#8b97b8' }}>Опасайтесь собак у помоек, гопников по ночам и проверок полиции. Здоровье упадёт до нуля — очнётесь в больнице без половины денег.</p>
      </div>
      <button className="btn btn-amber w-full mt-3" onClick={() => { sfx.win(); onClose(); }}>Начать выживание</button>
    </Panel>
  );
}

function MenuP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="Меню" sub={`День ${ui.day} · ${ui.timeStr}`} onClose={onClose} w={480}>
      <div className="space-y-2">
        <button className="btn btn-amber w-full" onClick={() => { if (game.saveGame()) game.toast('Игра сохранена', 'good'); sfx.click(); onClose(); }}>Сохранить игру</button>
        <button className="btn btn-ghost w-full" onClick={() => { game.toggleMute(); }}>{ui.muted ? 'Включить звук' : 'Выключить звук'}</button>
        <button className="btn btn-danger w-full" onClick={() => { if (confirm('Начать новую игру? Прогресс будет потерян.')) { game.deleteSave(); game.newGame(); onClose(); } }}>Новая игра</button>
      </div>
      <div className="panel mt-3 p-2.5 text-[11px] space-y-1" style={{ background: '#12161f', color: '#c6cede' }}>
        <div className="font-disp text-[10px]" style={{ color: '#ffb52e' }}>СТАТИСТИКА</div>
        <Row><span>Дней прожито</span><b>{ui.day}</b></Row>
        <Row><span>Репутация: бездомные / люди / полиция</span><b>{ui.rep.homeless} / {ui.rep.people} / {ui.rep.police}</b></Row>
        <Row><span>Больничных коек</span><b>{ui.hospitalizations}</b></Row>
        <Row><span>Банок сдано за всё время</span><b>{ui.cansSold}</b></Row>
        <Row><span>Семья</span><b>{ui.family ? 'Да' : ui.partner ? 'Есть близкий человек' : 'Пока нет'}</b></Row>
      </div>
    </Panel>
  );
}

function RarityBadge({ r }: { r?: ItemDef['rarity'] }) {
  if (!r) return null;
  return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${RARITY_COLOR[r]}22`, color: RARITY_COLOR[r], border: `1px solid ${RARITY_COLOR[r]}55` }}>{r}</span>;
}

const SLOT_ORDER: EquipSlot[] = ['head', 'torso', 'legs', 'feet'];

function InventoryP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [tab, setTab] = useState<'bag' | 'eq'>('bag');
  const eq = ui.equipped;
  const selDef = sel !== null && ui.inv[sel] ? ITEMS[ui.inv[sel].id] : null;
  const T = ui.eqTotals;
  const repTotal = ui.rep.people + T.rep;

  const statRows: { label: string; icon: string; value: string; bonus?: string; color: string }[] = [
    { label: 'Здоровье', icon: 'heart', value: `${Math.round(ui.stats.hp)}`, color: '#ff5a5a' },
    { label: 'Выносливость', icon: 'bolt', value: `${Math.round(ui.stats.energy)}`, color: '#ffd34d' },
    { label: 'Голод', icon: 'burger', value: `${Math.round(ui.stats.hunger)}`, color: '#ff9d5c' },
    { label: 'Тепло', icon: 'sun', value: `${T.warmth}`, color: '#5db8ff' },
    { label: 'Скорость', icon: 'bolt', value: `${100 + T.speed}%`, bonus: T.speed ? `+${T.speed}%` : undefined, color: '#8ee06e' },
    { label: 'Репутация', icon: 'smile', value: `${repTotal}`, bonus: T.rep ? `+${T.rep}` : undefined, color: '#ffb52e' },
    { label: 'Защита', icon: 'hammer', value: `${T.protect}`, color: '#ff9d5c' },
    { label: 'Комфорт', icon: 'drop', value: `${T.comfort}`, color: '#c98ae0' },
  ];

  return (
    <Panel title={`Инвентарь · ${ui.backpack.name}`} sub={`${ui.backpack.slots} слотов · ${ui.backpack.desc}`} onClose={onClose} w={720}>
      {/* переключатель для мобильных */}
      <div className="flex gap-1.5 mb-3 md:hidden">
        {([['bag', '🎒 Рюкзак'], ['eq', '👤 Экипировка']] as const).map(([k, l]) => (
          <button key={k} onClick={() => { sfx.click(); setTab(k); }} className="flex-1 py-2 rounded-md text-[12px] font-bold"
            style={{ background: tab === k ? '#ffb52e' : '#232c44', color: tab === k ? '#2a1600' : '#8b97b8' }}>{l}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-[230px_1fr] gap-3">
        {/* ===== ЭКИПИРОВКА + СТАТЫ ===== */}
        <div className={`${tab === 'eq' ? 'block' : 'hidden'} md:block`}>
          <div className="panel p-3" style={{ background: '#12161f' }}>
            <div className="font-disp text-[10px] mb-2" style={{ color: '#ffb52e' }}>👤 ЭКИПИРОВКА</div>
            {SLOT_ORDER.map(slot => {
              const id = eq[slot];
              const def = id ? ITEMS[id] : null;
              const meta = SLOT_META[slot];
              return (
                <button key={slot} onClick={() => { if (id) { sfx.click(); game.unequip(slot); } }}
                  className="w-full flex items-center gap-2 p-2 mb-1.5 rounded-md text-left transition-all hover:brightness-125"
                  style={{ background: def ? '#232c44' : '#1a2030', border: `1px solid ${def ? `${RARITY_COLOR[def.rarity ?? 'Обычная']}66` : '#2b3550'}`, cursor: def ? 'pointer' : 'default' }}
                  title={def ? `${def.name} — клик, чтобы снять` : `${meta.label}: пусто`}>
                  <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: def ? (def.color ?? '#3a4560') : '#232c44' }}>
                    {def ? <span className="text-[10px] font-bold" style={{ color: '#0d1017' }}>{meta.label[0]}</span> : <span style={{ color: '#5d6884' }}><Icon n={meta.icon === 'shirt' ? 'burger' : meta.icon === 'pants' ? 'list' : meta.icon === 'boot' ? 'hammer' : 'smile'} size={14} /></span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[9px]" style={{ color: '#5d6884' }}>{meta.label}</span>
                    <span className="block text-[10.5px] font-semibold truncate" style={{ color: def ? '#e9edf6' : '#5d6884' }}>{def ? def.name : 'Пусто'}</span>
                  </span>
                  {def && <span className="text-[9px] shrink-0" style={{ color: '#8b97b8' }}>снять</span>}
                </button>
              );
            })}
            {/* рюкзак */}
            <div className="flex items-center gap-2 p-2 rounded-md" style={{ background: '#1a2030', border: '1px solid #2b3550' }}>
              <span className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: '#3e6ea2' }}><Icon n="bag" size={15} color="#0d1017" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[9px]" style={{ color: '#5d6884' }}>Рюкзак</span>
                <span className="block text-[10.5px] font-semibold truncate" style={{ color: '#e9edf6' }}>{ui.backpack.name} · {ui.backpack.slots}</span>
              </span>
            </div>
          </div>

          <div className="panel p-3 mt-2" style={{ background: '#12161f' }}>
            <div className="font-disp text-[10px] mb-2" style={{ color: '#ffb52e' }}>📊 ХАРАКТЕРИСТИКИ</div>
            {statRows.map(r => (
              <div key={r.label} className="flex items-center gap-1.5 mb-1 last:mb-0">
                <span style={{ color: r.color }}><Icon n={r.icon} size={12} /></span>
                <span className="text-[10px] flex-1" style={{ color: '#c6cede' }}>{r.label}</span>
                <span className="text-[10.5px] font-bold" style={{ color: '#e9edf6' }}>{r.value}</span>
                {r.bonus && <span className="text-[9px] font-bold" style={{ color: '#8ee06e' }}>({r.bonus})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ===== РЮКЗАК ===== */}
        <div className={`${tab === 'bag' ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {ui.inv.length === 0 && <p className="text-[11.5px] col-span-4" style={{ color: '#8b97b8' }}>Пусто. Загляните на свалку!</p>}
            {ui.inv.map((sl, i) => {
              const def = ITEMS[sl.id];
              if (!def) return null;
              const active = sel === i;
              return (
                <button key={i} onClick={() => { sfx.click(); setSel(active ? null : i); }}
                  className="panel p-2 flex flex-col items-center gap-1 text-center transition-all hover:brightness-125"
                  style={{ background: active ? '#2a3550' : '#141926', borderColor: active ? '#ffb52e' : undefined }}
                  title={def.desc}>
                  <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: def.color ?? CAT_COLOR[def.cat] }}>
                    <span className="text-[10px] font-bold" style={{ color: '#0d1017' }}>{def.name[0]}</span>
                  </span>
                  <span className="text-[9px] font-semibold leading-tight" style={{ color: '#e9edf6' }}>{def.name}</span>
                  <span className="flex items-center gap-1">
                    <span className="text-[9px] font-bold" style={{ color: '#8b97b8' }}>×{sl.qty}</span>
                    <RarityBadge r={def.rarity} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* панель выбранного предмета */}
          {selDef && sel !== null && (
            <div className="panel p-3 mt-2 rise" style={{ background: '#12161f', borderColor: `${RARITY_COLOR[selDef.rarity ?? 'Обычная']}55` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12.5px] font-bold" style={{ color: '#e9edf6' }}>{selDef.name}</span>
                <RarityBadge r={selDef.rarity} />
                <span className="ml-auto text-[10px]" style={{ color: '#8b97b8' }}>{CAT_LABEL[selDef.cat]}</span>
              </div>
              <div className="text-[10px] mb-1.5" style={{ color: '#8b97b8' }}>{selDef.desc}</div>
              {itemStatLines(selDef).length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                  {itemStatLines(selDef).map(l => <span key={l.label} className="text-[10px] font-bold" style={{ color: l.color }}>{l.label}: {l.value}</span>)}
                </div>
              )}
              <div className="flex gap-1.5">
                {selDef.slot && <button className="btn btn-teal btn-sm flex-1" onClick={() => { game.equipItem(sel); setSel(null); }}>Надеть</button>}
                {(selDef.cat === 'food' || selDef.cat === 'med' || selDef.id === 'heater') && <button className="btn btn-teal btn-sm flex-1" onClick={() => { game.useItem(sel); setSel(null); }}>Использовать</button>}
                {selDef.id.startsWith('phone') && <button className="btn btn-teal btn-sm flex-1" onClick={() => { game.openPhone(sel); setSel(null); onClose(); }}>📱 Использовать</button>}
                {selDef.id === 'player' && <button className="btn btn-teal btn-sm flex-1" onClick={() => { game.useItem(sel); setSel(null); }}>📻 Включить</button>}
                {(selDef.cat === 'scrap' || selDef.cat === 'val') && <span className="text-[10px] self-center" style={{ color: '#8ee06e' }}>{selDef.price} ₽/шт — сдать в приём</span>}
                <button className="btn btn-ghost btn-sm" onClick={() => { sfx.click(); game.dropItem(sel); setSel(null); }}>Выбросить</button>
              </div>
            </div>
          )}

          {/* рюкзаки на покупку */}
          <div className="mt-3">
            <div className="font-disp text-[10px] mb-1.5" style={{ color: '#ffb52e' }}>РЮКЗАКИ ПОБОЛЬШЕ</div>
            {BACKPACKS.filter(b => b.id > ui.backpack.id).map(b => (
              <Row key={b.id}>
                <div>
                  <div className="text-[11.5px] font-semibold">{b.name} <span style={{ color: '#8b97b8' }}>· {b.slots} слотов</span></div>
                  <div className="text-[9.5px]" style={{ color: '#8b97b8' }}>{b.desc}</div>
                </div>
                <button className="btn btn-amber btn-sm" disabled={ui.money < b.price} onClick={() => { sfx.click(); game.buyBackpack(b.id); }}>{fmt(b.price)} ₽</button>
              </Row>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ShopP({ id, ui, game, onClose }: { id: string; ui: UIState; game: Game; onClose: () => void }) {
  const shop = SHOPS.find(s => s.id === id);
if (!shop) {
  console.error(`Магазин "${id}" не найден!`);
  return <Panel title="Ошибка" sub="Магазин не найден" onClose={onClose}><p>Магазин не найден</p></Panel>;
}
  const sale = ui.sales[id];
  const [tab, setTab] = useState(0);
  const tabs = shop.tabs.length ? shop.tabs : ['Все'];
  const goods = shop.goods.map((g, idx) => ({ g, idx })).filter(x => tabs.length <= 1 || x.g.tab === tabs[tab]);
  const city = ui.cities[ui.cityIndex];
  return (
    <Panel title={shop.name} sub={`${shop.kind} · ${shop.seller}: ${shop.phrase}`} onClose={onClose} w={640}>
      {tabs.length > 1 && (
        <div className="flex gap-1.5 mb-3">
          {tabs.map((t, i) => (
            <button key={t} onClick={() => { sfx.click(); setTab(i); }}
              className="px-3 py-1.5 rounded-md text-[11px] font-bold transition-all"
              style={{
                background: tab === i ? '#ffb52e' : '#232c44', color: tab === i ? '#2a1600' : '#8b97b8',
                border: `1px solid ${tab === i ? '#ffb52e' : '#2b3550'}`,
              }}>{t}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {goods.map(({ g, idx }) => {
          const isBp = g.item.startsWith('backpack');
          const def = isBp ? null : ITEMS[g.item];
          const bp = isBp ? BACKPACKS[parseInt(g.item.replace('backpack', ''), 10)] : null;
          const isSale = sale?.idx === idx;
          const price = game.shopPriceFor(id, idx);
          const color = def ? CAT_COLOR[def.cat] : '#c98ae0';
          const statLines = def ? itemStatLines(def) : [];
          return (
            <div key={idx} className="panel p-2.5 flex flex-col gap-1.5 group relative" style={{ background: '#141926', borderColor: isSale ? '#ff5a5a66' : undefined }}>
              {isSale && <span className="absolute -top-2 -right-1.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded blinker z-10" style={{ background: '#ff5a5a', color: '#fff' }}>−{sale!.pct}%</span>}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[11px] font-semibold truncate" style={{ color: '#e9edf6' }}>{def?.name ?? bp?.name}</span>
              </div>
              <div className="text-[9px] leading-snug" style={{ color: '#8b97b8' }}>{def?.desc ?? `${bp?.slots} слотов · ${bp?.desc}`}</div>
              {statLines.length > 0 && (
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {statLines.slice(0, 2).map(sl => <span key={sl.label} className="text-[8.5px] font-bold" style={{ color: sl.color }}>{sl.label} {sl.value}</span>)}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-auto">
                {isSale && <span className="text-[9px] line-through" style={{ color: '#5d6884' }}>{g.price}</span>}
                <button className="btn btn-amber btn-sm flex-1" disabled={ui.money < price} onClick={() => game.buyGood(id, idx)}>{fmt(price)} ₽</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px]" style={{ color: '#8b97b8' }}>
          {city && city.name !== 'Новострой' && <>Цены в г. {city.name} · </>}Акции меняются каждый день
        </span>
        <span className="text-[11px]">Баланс: <Money v={ui.money} /></span>
      </div>
    </Panel>
  );
}

function RecycleP({ kindId, ui, game, onClose }: { kindId: 'glass' | 'metal' | 'paper'; ui: UIState; game: Game; onClose: () => void }) {
  const rc = RECYCLE[kindId];
  const have = rc.items.map(id => ({ id, qty: ui.inv.filter(s => s.id === id).reduce((a, b) => a + b.qty, 0) })).filter(x => x.qty > 0);
  return (
    <Panel title={rc.name} sub="Всё, что вы принесли в рюкзаке" onClose={onClose} w={520}>
      {have.length === 0 && <p className="text-[12px]" style={{ color: '#8b97b8' }}>Пусто. Сначала найдите что-нибудь на свалке.</p>}
      {have.map(h => (
        <Row key={h.id}>
          <div>
            <div className="text-[12px] font-semibold">{ITEMS[h.id].name} <span style={{ color: '#8b97b8' }}>×{h.qty}</span></div>
            <div className="text-[10px]" style={{ color: '#8ee06e' }}>{ITEMS[h.id].price} ₽/шт · итого {fmt(h.qty * ITEMS[h.id].price)} ₽</div>
          </div>
          <button className="btn btn-teal btn-sm" onClick={() => game.sellRecycle(kindId, h.id)}>Сдать</button>
        </Row>
      ))}
      {kindId === 'glass' && (
        <div className="panel mt-2 p-2 text-[10.5px]" style={{ background: '#12161f', color: '#c6cede' }}>
          Бонус: за каждые 100 банок +50 ₽. Сдано за всё время: <b style={{ color: '#8ee06e' }}>{ui.cansSold}</b> · до бонуса: {100 - (ui.cansSold % 100)}
        </div>
      )}
      <button className="btn btn-amber w-full mt-3" disabled={have.length === 0} onClick={() => game.sellRecycle(kindId)}>Сдать всё ({fmt(have.reduce((a, h) => a + h.qty * ITEMS[h.id].price, 0))} ₽)</button>
    </Panel>
  );
}

function BaraholkaP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  const [tab, setTab] = useState<'sell' | 'buy'>('sell');
  const vals = ['antique', 'jewel', 'coin', 'cardcity', 'oldphone', 'ring', 'wallet']
    .map(id => ({ id, qty: ui.inv.filter(s => s.id === id).reduce((a, b) => a + b.qty, 0) })).filter(x => x.qty > 0);
  return (
    <Panel title="Барахолка" sub="Цены живые: что редкое — то дорогое" onClose={onClose} w={560}>
      <div className="flex gap-1.5 mb-2">
        <button className={`btn btn-sm flex-1 ${tab === 'sell' ? 'btn-amber' : 'btn-ghost'}`} onClick={() => { sfx.click(); setTab('sell'); }}>Продать</button>
        <button className={`btn btn-sm flex-1 ${tab === 'buy' ? 'btn-amber' : 'btn-ghost'}`} onClick={() => { sfx.click(); setTab('buy'); }}>Купить б/у</button>
      </div>
      {tab === 'sell' && (
        <>
          {vals.length === 0 && <p className="text-[12px]" style={{ color: '#8b97b8' }}>Ценностей нет. Ищите на свалках: антиквариат, монеты, украшения...</p>}
          {vals.map(v => (
            <Row key={v.id}>
              <div>
                <div className="text-[12px] font-semibold">{ITEMS[v.id].name} <span style={{ color: '#8b97b8' }}>×{v.qty}</span></div>
                <div className="text-[10px]" style={{ color: '#8ee06e' }}>Сегодня дают: {fmt(game.getBarPrice(v.id))} ₽</div>
              </div>
              <button className="btn btn-teal btn-sm" onClick={() => game.sellValuable(v.id)}>Продать</button>
            </Row>
          ))}
        </>
      )}
      {tab === 'buy' && (
        <>
          {ui.usedOffers.map((o, i) => {
            const isBp = o.item.startsWith('backpack');
            const name = isBp ? BACKPACKS[parseInt(o.item.replace('backpack', ''), 10)].name : ITEMS[o.item]?.name ?? o.item;
            return (
              <Row key={i}>
                <div>
                  <div className="text-[12px] font-semibold">{name}</div>
                  <div className="text-[10px]" style={{ color: '#8b97b8' }}>{isBp ? 'Рюкзак с рук' : ITEMS[o.item]?.desc}</div>
                </div>
                <button className="btn btn-amber btn-sm" disabled={ui.money < o.price} onClick={() => game.buyUsed(i)}>{fmt(o.price)} ₽</button>
              </Row>
            );
          })}
          <p className="text-[10px] mt-2" style={{ color: '#8b97b8' }}>Ассортимент меняется каждый день. Иногда всплывает паспорт и брендовые рюкзаки!</p>
        </>
      )}
    </Panel>
  );
}

function SleepP({ game, onClose }: { game: Game; onClose: () => void }) {
  return (
    <Panel title="Где поспать?" sub="Сон переносит на 7:00 следующего дня" onClose={onClose} w={540}>
      {game.sleepOpts().map(o => (
        <Row key={o.id}>
          <div className={o.available ? '' : 'opacity-40'}>
            <div className="text-[12px] font-semibold">{o.name}</div>
            <div className="text-[10px]" style={{ color: '#8b97b8' }}>{o.desc}</div>
          </div>
          <button className="btn btn-teal btn-sm" disabled={!o.available} onClick={() => game.doSleep(o.id)}>
            {o.price ? `${o.price} ₽` : 'Лечь'}
          </button>
        </Row>
      ))}
    </Panel>
  );
}

function RealtorP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="Агентство «Квартиры»" sub="Риелтор: «Подберём вариант под любой кошелёк»" onClose={onClose} w={560}>
      {ui.aptsDefs.map(a => {
        const owned = ui.ownedApts.includes(a.id);
        return (
          <Row key={a.id}>
            <div>
              <div className="text-[12px] font-semibold">{a.name} {owned && <span style={{ color: '#8ee06e' }}>✓ ваша</span>}</div>
              <div className="text-[10px]" style={{ color: '#8b97b8' }}>{a.rooms} комн. · {a.desc} · аренда {fmt(a.income)} ₽/день</div>
            </div>
            <button className="btn btn-amber btn-sm" disabled={owned || ui.money < a.price} onClick={() => game.buyApartment(a.id)}>{fmt(a.price)} ₽</button>
          </Row>
        );
      })}
      <p className="text-[10px] mt-2" style={{ color: '#8b97b8' }}>Купленные квартиры можно сдавать (доход) или жить в них (вход — жилые дома в спальном районе).</p>
    </Panel>
  );
}

function RoomP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="Дом бабушки Зины" sub="«Заходи, милок. Комната маленькая, зато тёплая»" onClose={onClose} w={480}>
      <p className="text-[12px] mb-2" style={{ color: '#c6cede' }}>Комната с кроватью и душем. 500 ₽ в день, оплата по утрам. Здесь вы спите в тепле и восстанавливаете здоровье.</p>
      {ui.housing === 'room'
        ? <button className="btn btn-teal w-full" onClick={() => { game.toast('Это ваш дом. Лавочка подождёт', 'info'); onClose(); }}>Вы уже снимаете эту комнату</button>
        : <button className="btn btn-amber w-full" disabled={ui.money < 500} onClick={() => { game.rentRoom(); onClose(); }}>Снять комнату — 500 ₽</button>}
      {ui.quests.some(q => q.def.counter === 'deliver' && !q.claimed && q.progress < 1) && (
        <button className="btn btn-teal w-full mt-2" onClick={() => { game.questProgress('deliver', 1); game.toast('Газета доставлена бабушке!', 'good'); }}>Вручить газету (задание)</button>
      )}
    </Panel>
  );
}

function NewsP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  const n = ui.news;
  if (!n) return null;
  return (
    <Panel title="Газета «Из рук в руки»" sub={`Выпуск за день ${ui.day}`} onClose={onClose} w={580}>
      <div className="font-disp text-[10px] mb-1" style={{ color: '#ffb52e' }}>РАБОТА</div>
      {n.jobs.map((j, i) => {
        const taken = n.taken.includes(j.id);
        return (
          <Row key={j.id}>
            <div>
              <div className="text-[12px] font-semibold">{j.title}</div>
              <div className="text-[10px]" style={{ color: '#8b97b8' }}>{j.desc} · выносливость −{j.energy}{j.phone ? ' · могут подарить телефон' : ''}</div>
            </div>
            <button className="btn btn-amber btn-sm" disabled={taken} onClick={() => game.takeJob(i)}>{taken ? 'Сделано' : `+${j.pay} ₽`}</button>
          </Row>
        );
      })}
      <div className="font-disp text-[10px] mt-2 mb-1" style={{ color: '#ffb52e' }}>ЧАСТНЫЕ ОБЪЯВЛЕНИЯ</div>
      {n.sales.map((sl, i) => (
        <Row key={i}>
          <div>
            <div className="text-[12px] font-semibold">Продам: {ITEMS[sl.item].name}</div>
            <div className="text-[10px]" style={{ color: '#8b97b8' }}>{ITEMS[sl.item].desc}</div>
          </div>
          <button className="btn btn-teal btn-sm" disabled={ui.money < sl.price} onClick={() => game.buyNewsSale(i)}>{fmt(sl.price)} ₽</button>
        </Row>
      ))}
      <div className="font-disp text-[10px] mt-2 mb-1" style={{ color: '#ffb52e' }}>ПРОПАВШИЕ</div>
      {n.missing.map((t, i) => <p key={i} className="text-[11px] italic mb-1" style={{ color: '#c6cede' }}>{t}</p>)}
      <div className="font-disp text-[10px] mt-2 mb-1" style={{ color: '#ff5a5a' }}>КРИМИНАЛ</div>
      {n.crime.map((t, i) => <p key={i} className="text-[11px] italic" style={{ color: '#c6cede' }}>{t}</p>)}
    </Panel>
  );
}

function ReactionGame({ onDone }: { onDone: (ms: number) => void }) {
  const [phase, setPhase] = useState<'wait' | 'go' | 'done'>('wait');
  const startRef = useRef(0);
  const timer = useRef(0);
  useEffect(() => {
    timer.current = window.setTimeout(() => { startRef.current = performance.now(); setPhase('go'); }, 800 + Math.random() * 1800);
    return () => clearTimeout(timer.current);
  }, []);
  return (
    <button className={`w-full py-4 rounded-lg font-disp text-sm ${phase === 'go' ? 'shake' : ''}`}
      style={{ background: phase === 'go' ? '#8ee06e' : '#3e4a68', color: phase === 'go' ? '#0a2010' : '#c6cede' }}
      onPointerDown={() => { if (phase === 'go') { setPhase('done'); onDone(Math.round(performance.now() - startRef.current)); } }}>
      {phase === 'wait' ? 'Ждите зелёный сигнал...' : phase === 'go' ? 'ЖМИ!' : 'Готово'}
    </button>
  );
}

function PhoneP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  const [tab, setTab] = useState<'loc' | 'sms' | 'invest' | 'game'>('loc');
  const [res, setRes] = useState<number | null>(null);
  return (
    <Panel title={`Телефон: ${ITEMS[ui.phone ?? 'phone1']?.name ?? 'Телефон'}`} sub={`Связь: 87% · Батарея: ${13 + (ui.day % 4) * 9}%`} onClose={onClose} w={560}>
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {([['loc', '📍 Локация'], ['sms', '💬 Сообщения'], ['invest', '💼 Инвестиции'], ['game', '🎮 Игра']] as const).map(([k, l]) => (
          <button key={k} className={`btn btn-sm flex-1 ${tab === k ? 'btn-teal' : 'btn-ghost'}`} onClick={() => { sfx.click(); setTab(k); setRes(null); }}>{l}</button>
        ))}
      </div>
      {tab === 'loc' && (
        <div>
          <div className="panel p-2.5 mb-2" style={{ background: '#12161f' }}>
            <div className="font-disp text-[11px] mb-0.5" style={{ color: '#5ce0d3' }}>ВЫ НАХОДИТЕСЬ</div>
            <div className="text-[13px] font-bold" style={{ color: '#e9edf6' }}>{ui.district} · г. {ui.cityName}</div>
          </div>
          <div className="font-disp text-[10px] mb-1" style={{ color: '#ffb52e' }}>РЯДОМ С ВАМИ</div>
          {ui.pois.length === 0 && <p className="text-[11px]" style={{ color: '#8b97b8' }}>Поблизости ничего примечательного.</p>}
          {ui.pois.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-[#2b355066] last:border-0">
              <span className="text-[11.5px]" style={{ color: '#c6cede' }}>{p.name}</span>
              <span className="font-disp text-[11px]" style={{ color: p.dist < 50 ? '#8ee06e' : '#8b97b8' }}>{p.dist} м</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'sms' && (
        <div className="space-y-1.5">
          {ui.workers.filter(w => w.st.hired).length === 0 && <p className="text-[11.5px]" style={{ color: '#8b97b8' }}>SMS пока нет. Наймите работников у вокзала.</p>}
          {ui.workers.filter(w => w.st.hired).map(w => (
            <div key={w.def.id} className="panel p-2 text-[11px]" style={{ background: '#12161f', color: '#c6cede' }}>
              <b>{w.def.name}:</b> {w.st.sick ? '«Босс, я заболел, отлежусь...»' : w.st.fed ? '«Спасибо за обед, работаю!»' : '«Жрать охота, босс...»'}
              <span className="float-right" style={{ color: w.st.sick ? '#ff8a8a' : '#8ee06e' }}>{w.st.sick ? 'БОЛЕЕТ' : `+${fmt(w.def.income - w.def.wage)} ₽/д`}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'invest' && (
        <>
          {INVESTMENTS.map(d => {
            const has = ui.investments.includes(d.id);
            return (
              <Row key={d.id}>
                <div>
                  <div className="text-[12px] font-semibold">{d.name} {has && <span style={{ color: '#8ee06e' }}>✓</span>}</div>
                  <div className="text-[10px]" style={{ color: '#8b97b8' }}>{d.desc} · +{fmt(d.income)} ₽/день</div>
                </div>
                <button className="btn btn-amber btn-sm" disabled={has || ui.money < d.price} onClick={() => game.buyInvestment(d.id)}>{fmt(d.price)} ₽</button>
              </Row>
            );
          })}
        </>
      )}
      {tab === 'game' && (
        <div>
          <p className="text-[11px] mb-2" style={{ color: '#8b97b8' }}>Тренажёр реакции. Быстрее 300 мс — настроение вверх!</p>
          <ReactionGame onDone={ms => {
            setRes(ms);
            if (ms < 300) { game.applyFx({ mood: 8 }); game.toast(`Реакция ${ms} мс — отлично! Настроение +8`, 'good'); sfx.quest(); }
            else game.toast(`Реакция ${ms} мс. Бывает`, 'info');
          }} />
          {res !== null && <button className="btn btn-ghost btn-sm w-full mt-2" onClick={() => setRes(null)}>Ещё раз</button>}
        </div>
      )}
    </Panel>
  );
}

function WorkersP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="Бригада" sub="Найдите их у вокзала. Доход приходит каждый день в полдень." onClose={onClose} w={600}>
      {ui.workers.map(w => (
        <Row key={w.def.id} className="items-start">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold">
              {w.def.name}
              {w.st.hired && (w.st.sick ? <span className="ml-2 text-[9px] font-bold px-1.5 rounded" style={{ background: '#ff5a5a33', color: '#ff8a8a' }}>БОЛЕЕТ</span>
                : w.st.fed ? <span className="ml-2 text-[9px] font-bold px-1.5 rounded" style={{ background: '#8ee06e22', color: '#8ee06e' }}>НАКОРМЛЕН</span>
                : <span className="ml-2 text-[9px] font-bold px-1.5 rounded" style={{ background: '#ffd34d22', color: '#ffd34d' }}>ГОЛОДЕН</span>)}
            </div>
            <div className="text-[10px]" style={{ color: '#8b97b8' }}>{w.def.desc} · доход {fmt(w.def.income)} ₽ − зарплата {fmt(w.def.wage)} ₽ · нужна репутация {w.def.minRep}+</div>
          </div>
          <div className="flex gap-1 shrink-0 flex-wrap justify-end">
            {!w.st.hired
              ? <button className="btn btn-amber btn-sm" disabled={ui.money < w.def.hire} onClick={() => game.hireWorker(w.def.id)}>Нанять {fmt(w.def.hire)} ₽</button>
              : <>
                <button className="btn btn-teal btn-sm" disabled={w.st.fed} onClick={() => game.feedWorker(w.def.id)}>Покормить 50 ₽</button>
                {w.st.sick && <button className="btn btn-ghost btn-sm" onClick={() => game.cureWorker(w.def.id)}>Лечить (таблетки)</button>}
                <button className="btn btn-danger btn-sm" onClick={() => game.fireWorker(w.def.id)}>Уволить</button>
              </>}
          </div>
        </Row>
      ))}
      <div className="mt-2 panel p-2.5" style={{ background: '#12161f' }}>
        <Row>
          <div>
            <div className="text-[12px] font-semibold">Помочь бездомному</div>
            <div className="text-[10px]" style={{ color: '#8b97b8' }}>Подать 50 ₽. Репутация среди бездомных +6</div>
          </div>
          <button className="btn btn-teal btn-sm" disabled={ui.money < 50} onClick={() => game.helpHomeless()}>Подать 50 ₽</button>
        </Row>
      </div>
    </Panel>
  );
}

function CraftP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="Крафт" sub="Из мусора можно сделать полезные вещи" onClose={onClose} w={540}>
      {RECIPES.map(r => {
        const ok = r.needs.every(([id, q]) => ui.inv.filter(s => s.id === id).reduce((a, b) => a + b.qty, 0) >= q);
        return (
          <Row key={r.id}>
            <div>
              <div className="text-[12px] font-semibold">{r.name}</div>
              <div className="text-[10px]" style={{ color: '#8b97b8' }}>
                {r.needs.map(([id, q], i) => {
                  const have = ui.inv.filter(s => s.id === id).reduce((a, b) => a + b.qty, 0);
                  return <span key={i} className="mr-2" style={{ color: have >= q ? '#8ee06e' : '#ff8a8a' }}>{ITEMS[id].name} {have}/{q}</span>;
                })}
              </div>
              <div className="text-[10px]" style={{ color: '#c6cede' }}>{r.desc}</div>
            </div>
            <button className="btn btn-amber btn-sm" disabled={!ok} onClick={() => game.craft(r.id)}>Создать</button>
          </Row>
        );
      })}
    </Panel>
  );
}

function QuestsP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  const parkClean = ui.quests.some(q => q.def.counter === 'clean' && !q.claimed && q.progress < 1);
  return (
    <Panel title="Задания дня" sub="Обновляются каждое утро" onClose={onClose} w={540}>
      {ui.quests.map((q, i) => {
        const done = q.progress >= q.def.target;
        return (
          <div key={i} className="mb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold" style={{ color: q.claimed ? '#8b97b8' : '#e9edf6' }}>{q.def.text}</span>
              {q.claimed
                ? <span className="text-[10px] font-bold" style={{ color: '#8ee06e' }}>ПОЛУЧЕНО</span>
                : done
                  ? <button className="btn btn-teal btn-sm" onClick={() => game.claimQuest(i)}>Забрать {q.def.money ? fmt(q.def.money) + ' ₽' : 'награду'}</button>
                  : <span className="text-[10px] font-bold" style={{ color: '#ffd34d' }}>{q.progress}/{q.def.target}</span>}
            </div>
            <div className="bar mt-1"><i style={{ width: `${clamp((q.progress / q.def.target) * 100, 0, 100)}%`, background: done ? '#8ee06e' : '#ffb52e' }} /></div>
          </div>
        );
      })}
      {parkClean && ui.district === 'Парк' && (
        <button className="btn btn-amber w-full mt-2" onClick={() => game.startCleaning('park')}>Убраться в парке (мини-игра)</button>
      )}
      {parkClean && ui.district !== 'Парк' && <p className="text-[10.5px]" style={{ color: '#8b97b8' }}>Для уборки придите в Парк.</p>}
    </Panel>
  );
}

function CharityP({ id, ui, game, onClose }: { id: 'soup' | 'church'; ui: UIState; game: Game; onClose: () => void }) {
  const eatSoup = () => {
    if (ui.flags.soup) {
      if (!game.spend(50)) return;
      game.applyFx({ hunger: 60, mood: 5 });
      game.questProgress('eat', 1);
      game.toast('Горячий обед: голод −60', 'good');
    } else {
      game.state.flags.soup = true;
      game.applyFx({ hunger: 60, mood: 10 });
      game.questProgress('eat', 1);
      game.toast('Бесплатный обед от благотворительного фонда', 'good');
    }
    sfx.eat();
    game.bump();
  };
  const volunteer = () => {
    game.state.time = Math.min(1439, game.state.time + 30);
    game.state.rep.people = clamp(game.state.rep.people + 8, 0, 100);
    game.applyFx({ mood: 10 });
    game.toast('Вы помогли раздать еду. Репутация среди людей +8', 'good');
    sfx.quest();
    game.bump();
  };
  if (id === 'soup') return (
    <Panel title="Столовая №1" sub="«Первое, второе и компот»" onClose={onClose} w={460}>
      <p className="text-[12px] mb-2" style={{ color: '#c6cede' }}>{ui.flags.soup ? 'Бесплатная порция на сегодня уже съедена.' : 'Раз в день здесь кормят бесплатно.'}</p>
      <button className="btn btn-amber w-full" onClick={eatSoup}>{ui.flags.soup ? 'Пообедать за 50 ₽' : 'Получить бесплатный обед'}</button>
    </Panel>
  );
  return (
    <Panel title="Церковь" sub="Здесь помогают, не спрашивая документов" onClose={onClose} w={460}>
      <Row>
        <div><div className="text-[12px] font-semibold">Ночлег в приюте</div><div className="text-[10px]" style={{ color: '#8b97b8' }}>{ui.flags.churchbed ? 'Сегодня место уже занято' : 'Бесплатная ночь, безопасно'}</div></div>
        <button className="btn btn-teal btn-sm" disabled={!!ui.flags.churchbed} onClick={() => game.doSleep('churchbed')}>Лечь спать</button>
      </Row>
      <Row>
        <div><div className="text-[12px] font-semibold">Волонтёрство (30 мин)</div><div className="text-[10px]" style={{ color: '#8b97b8' }}>Репутация среди людей +8, настроение +10</div></div>
        <button className="btn btn-amber btn-sm" onClick={volunteer}>Помочь</button>
      </Row>
    </Panel>
  );
}

function ApartmentP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="Моё жильё" sub="Техника ломается, квартира пачкается — следите за порядком" onClose={onClose} w={620}>
      {ui.apts.map(a => {
        const def = APARTMENTS.find(x => x.id === a.id)!;
        return (
          <div key={a.id} className="panel p-3 mb-2" style={{ background: '#141926' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-disp text-[12px]" style={{ color: '#ffb52e' }}>{def.name}</span>
              <button className={`btn btn-sm ${a.rented ? 'btn-danger' : 'btn-teal'}`} onClick={() => game.toggleRentApt(a.id)}>
                {a.rented ? 'Выселить съёмщиков' : `Сдавать (+${fmt(def.income)} ₽/д)`}
              </button>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10.5px] w-16" style={{ color: '#8b97b8' }}>Чистота</span>
              <div className="bar flex-1"><i style={{ width: `${100 - a.dirt}%`, background: a.dirt > 60 ? '#ff5a5a' : '#5ce0d3' }} /></div>
              <button className="btn btn-ghost btn-sm" onClick={() => game.startCleaning('apt', a.id)}>Убраться</button>
            </div>
            {APPLIANCES.map(ap => {
              const st = a.appliances[ap.id];
              if (!st) return null;
              return (
                <div key={ap.id} className="flex items-center gap-2 py-1 border-t border-[#2b355055]">
                  <span className="text-[10.5px] w-16 shrink-0" style={{ color: st.broken ? '#ff8a8a' : '#c6cede' }}>{ap.name}</span>
                  <div className="bar flex-1"><i style={{ width: `${clamp(st.dur, 0, 100)}%`, background: st.broken ? '#ff5a5a' : st.dur < 30 ? '#ffd34d' : '#8ee06e' }} /></div>
                  {st.broken ? (
                    <span className="flex gap-1">
                      <button className="btn btn-teal btn-sm" onClick={() => game.repairAppliance(a.id, ap.id, false)}>Сам (инструменты{ap.id === 'fridge' || ap.id === 'washer' ? '+запчасти' : ''})</button>
                      {ap.master > 0 && <button className="btn btn-amber btn-sm" disabled={ui.money < ap.master} onClick={() => game.repairAppliance(a.id, ap.id, true)}>Мастер {fmt(ap.master)} ₽</button>}
                      {ap.master === 0 && <button className="btn btn-amber btn-sm" disabled={ui.money < ap.part} onClick={() => { if (game.spend(ap.part)) { a.appliances[ap.id] = { dur: 100, broken: false }; game.toast('Куплен новый диван', 'good'); sfx.win(); game.bump(); } }}>Новый {fmt(ap.part)} ₽</button>}
                    </span>
                  ) : <span className="text-[9.5px] w-10 text-right" style={{ color: '#8b97b8' }}>{Math.round(clamp(st.dur, 0, 100))}%</span>}
                </div>
              );
            })}
          </div>
        );
      })}
    </Panel>
  );
}

function WalletP({ game }: { game: Game }) {
  return (
    <Panel title="Находка" sub="Вы нашли чужой кошелёк с деньгами" onClose={() => game.closeModal()} w={440}>
      <p className="text-[12px] mb-3" style={{ color: '#c6cede' }}>Внутри документы и пачка купюр. Хозяин, наверное, уже ищет...</p>
      <button className="btn btn-teal w-full mb-2" onClick={() => game.resolveWallet(false)}>Вернуть владельцу (+репутация, +100 ₽)</button>
      <button className="btn btn-danger w-full" onClick={() => game.resolveWallet(true)}>Оставить себе (500–1500 ₽, −репутация)</button>
    </Panel>
  );
}
function CrimeP({ game }: { game: Game }) {
  return (
    <Panel title="Подозрительное предложение" sub="Незнакомец в капюшоне шепчет: «Есть работёнка...»" onClose={() => game.closeModal()} w={440}>
      <p className="text-[12px] mb-3" style={{ color: '#c6cede' }}>«Перенесёшь пакет с вокзала на окраину — получишь тысячу. Не тяжело. Не спрашивай, что внутри».</p>
      <button className="btn btn-danger w-full mb-2" onClick={() => game.resolveCrime(true)}>Согласиться (+1000 ₽, криминал)</button>
      <button className="btn btn-teal w-full" onClick={() => game.resolveCrime(false)}>Отказаться (+доверие полиции)</button>
    </Panel>
  );
}
function MuggedP({ game }: { game: Game }) {
  return (
    <Panel title="Ограбление!" sub="«Э, братан... поделись добром»" onClose={() => game.closeModal()} w={440}>
      <p className="text-[12px] mb-3" style={{ color: '#c6cede' }}>Трое окружили вас в темноте. Пахнет жареным.</p>
      <button className="btn btn-danger w-full mb-2" onClick={() => game.muggedChoice(false)}>Отдать 30% денег и часть вещей</button>
      <button className="btn btn-amber w-full" onClick={() => game.muggedChoice(true)}>Драться! (мини-игра)</button>
    </Panel>
  );
}
function PoliceP({ ui, game }: { ui: UIState; game: Game }) {
  const d = ui.docs;
  const hasP = d.passport;
  const allDocs = hasP && d.registration && d.workPermit;
  return (
    <Panel title="👮 Проверка документов" sub="Полицейский: «Предъявите документы!»" onClose={() => game.closeModal()} w={460}>
      {/* чек-лист документов */}
      <div className="panel p-2.5 mb-3" style={{ background: '#12161f' }}>
        <div className="font-disp text-[10px] mb-1" style={{ color: '#ffb52e' }}>ВАШИ ДОКУМЕНТЫ</div>
        {([
          ['Паспорт', d.passport, 'купить на барахолке'],
          ['Прописка', d.registration, 'оформить за 300 ₽ (телефон→?)'],
          ['Разрешение на работу', d.workPermit, 'устроиться на завод'],
        ] as [string, boolean, string][]).map(([name, ok, hint]) => (
          <div key={name} className="flex items-center justify-between text-[11px] py-0.5">
            <span style={{ color: '#c6cede' }}>{ok ? '✅' : '❌'} {name}</span>
            <span style={{ color: ok ? '#8ee06e' : '#8b97b8' }}>{ok ? 'Есть' : `Нет · ${hint}`}</span>
          </div>
        ))}
      </div>

      {allDocs ? (
        <>
          <p className="text-[12px] mb-3" style={{ color: '#8ee06e' }}>Все документы в порядке. Полицейский отдаёт честь.</p>
          <button className="btn btn-teal w-full" onClick={() => game.policeChoice(true)}>Показать документы</button>
        </>
      ) : hasP ? (
        <>
          <p className="text-[12px] mb-3" style={{ color: '#c6cede' }}>Паспорт есть, но не хватает прописки или разрешения на работу.</p>
          <button className="btn btn-teal w-full" onClick={() => game.policeChoice(true)}>Показать паспорт</button>
        </>
      ) : (
        <>
          <p className="text-[12px] mb-3" style={{ color: '#ff8a8a' }}>Паспорта нет! Штраф 500 ₽. Если денег нет — заберут в участок. Паспорт продают на барахолке.</p>
          <button className="btn btn-danger w-full mb-2" disabled={ui.money < 500} onClick={() => game.policeChoice(true)}>Заплатить штраф 500 ₽</button>
          {ui.money < 500 && <button className="btn btn-amber w-full mb-2" onClick={() => game.policeToStation()}>Поехать в участок (−2 ч, −30% денег)</button>}
          <button className="btn btn-ghost w-full" onClick={() => game.policeChoice(false)}>Бежать (−20 выносливости, −10 доверия)</button>
        </>
      )}
    </Panel>
  );
}
function HospitalP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="Больница" sub="Городская больница №3" onClose={onClose} w={460}>
      <p className="text-[12px] space-y-2" style={{ color: '#c6cede' }}>
        Вы очнулись под капельницей. Врач вздыхает: «Ещё день-другой такой жизни — и пришлось бы вас откачивать».<br />
        Потеряно: всё вторсырьё, половина денег. Госпитализация №{ui.hospitalizations} из 5.
      </p>
      <button className="btn btn-amber w-full mt-3" onClick={onClose}>Выписаться (день {ui.day})</button>
    </Panel>
  );
}
function GameOverP({ ui, game }: { ui: UIState; game: Game }) {
  return (
    <Panel title="Конец пути" sub="Пять госпитализаций — организм сдался" onClose={() => { }} w={480}>
      <p className="text-[12px] mb-2" style={{ color: '#c6cede' }}>Вы продержались {ui.day} дней. Город жестокий, но вы попробовали. Может, в следующей жизни повезёт больше?</p>
      <div className="panel p-2.5 mb-3 text-[11px]" style={{ background: '#12161f', color: '#c6cede' }}>
        <Row><span>Дней</span><b>{ui.day}</b></Row>
        <Row><span>Денег на счету</span><b>{fmt(ui.money)} ₽</b></Row>
        <Row><span>Банок сдано</span><b>{ui.cansSold}</b></Row>
        <Row><span>Квартир куплено</span><b>{ui.ownedApts.length}</b></Row>
      </div>
      <button className="btn btn-amber w-full" onClick={() => { game.deleteSave(); game.newGame(); }}>Начать заново</button>
    </Panel>
  );
}
function VictoryP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  return (
    <Panel title="ПУТЬ НАВЕРХ ПРОЙДЕН" sub={`Пентхаус куплен на ${ui.day}-й день`} onClose={onClose} w={500}>
      <p className="text-[13px] leading-relaxed" style={{ color: '#c6cede' }}>
        С лавочки у вокзала — до пентхауса с видом на весь город. Вы прошли путь от пустого пакета «Пятёрочка» до состояния в десять миллионов.
        Город остался прежним, но вы — уже нет.
      </p>
      <div className="panel p-2.5 my-3 text-[11px]" style={{ background: '#12161f', color: '#c6cede' }}>
        <Row><span>Капитал</span><Money v={ui.money} /></Row>
        <Row><span>Квартир</span><b>{ui.ownedApts.length} из 5</b></Row>
        <Row><span>Работников</span><b>{ui.workers.filter(w => w.st.hired).length}</b></Row>
      </div>
      <button className="btn btn-amber w-full" onClick={() => { sfx.win(); onClose(); }}>Играть дальше — город ждёт</button>
    </Panel>
  );
}

function MapP({ ui, onClose }: { ui: UIState; onClose: () => void }) {
  const zones = [
    { name: 'ЗАВОДЫ', d: 'металлолом, медь', x: 0, y: 0, w: 100, h: 20, c: '#6e7278' },
    { name: 'СПАЛЬНЫЙ РАЙОН', d: 'квартиры, агентство, бабушка', x: 0, y: 20, w: 100, h: 21, c: '#5c8a4a' },
    { name: 'ЦЕНТР', d: 'магазины, барахолка, газета', x: 0, y: 41, w: 100, h: 23, c: '#8a8f96' },
    { name: 'ПАРК', d: 'свалки, пруд, собаки', x: 0, y: 64, w: 62, h: 18, c: '#4e7a3e' },
    { name: 'ВОКЗАЛ', d: 'ночлежка, столовая, бригада', x: 34, y: 82, w: 34, h: 18, c: '#8a8072' },
    { name: 'ОКРАИНА', d: 'дешёвое жильё, церковь', x: 0, y: 82, w: 34, h: 18, c: '#7a6a52' },
    { name: 'ПРОМЗОНА', d: 'приём макулатуры, свалки', x: 68, y: 82, w: 32, h: 18, c: '#5e6a72' },
  ];
  return (
    <Panel title="Карта города" sub={`Вы находитесь: ${ui.district}`} onClose={onClose} w={640}>
      <div className="relative w-full" style={{ aspectRatio: '100/58' }}>
        {zones.map(z => (
          <div key={z.name} className="absolute flex flex-col items-center justify-center text-center p-1"
            style={{
              left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%`,
              background: `${z.c}${ui.district === z.name || (ui.district === 'Восточная промзона' && z.name === 'ПРОМЗОНА') ? '' : '55'}`,
              border: ui.district === z.name || (ui.district === 'Восточная промзона' && z.name === 'ПРОМЗОНА') ? '2px solid #ffb52e' : '1px solid #00000066',
              borderRadius: 4,
            }}>
            <span className="font-disp" style={{ fontSize: 'clamp(7px, 1.4vw, 11px)', color: '#12141c' }}>{z.name}</span>
            <span style={{ fontSize: 'clamp(6px, 1.1vw, 9px)', color: '#12141cbb' }}>{z.d}</span>
            {(ui.district === z.name || (ui.district === 'Восточная промзона' && z.name === 'ПРОМЗОНА')) && (
              <span className="absolute w-2.5 h-2.5 rounded-full blinker" style={{ background: '#ffb52e', boxShadow: '0 0 10px #ffb52e', top: 4, right: 4 }} />
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] mt-2" style={{ color: '#8b97b8' }}>Полная навигация откроется в телефоне — а пока просто идите на вывески.</p>
    </Panel>
  );
}

// ==================== КАРТА ГОРОДОВ / ВОКЗАЛ ====================
const TR_ICON: Record<Transport, string> = { bus: 'bus', train: 'train', plane: 'plane' };
function CityMapP({ ui, game, onClose }: { ui: UIState; game: Game; onClose: () => void }) {
  const cur = ui.cityIndex;
  return (
    <Panel title="🗺️ Карта городов" sub={`Вы здесь: ${ui.cities[cur].name} · касса вокзала`} onClose={onClose} w={640}>
      <div className="space-y-2">
        {ui.cities.map((c, i) => {
          const isCur = i === cur;
          return (
            <div key={i} className="panel p-3" style={{ background: isCur ? '#1e2a1e' : '#12161f', borderColor: isCur ? '#8ee06e66' : undefined }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-bold" style={{ color: isCur ? '#8ee06e' : '#e9edf6' }}>{isCur ? '📍' : '🏙️'} {c.name}</span>
                {isCur && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#8ee06e22', color: '#8ee06e' }}>вы здесь</span>}
                {!isCur && c.base > 0 && <span className="ml-auto text-[10px]" style={{ color: '#8b97b8' }}>{c.base} км</span>}
              </div>
              <div className="text-[10px] mb-1.5" style={{ color: '#8b97b8' }}>{c.desc}</div>
              <div className="text-[10px] font-semibold mb-2" style={{ color: '#ffd34d' }}>★ {c.perk}</div>
              {!isCur && (
                <div className="flex gap-1.5">
                  {(['bus', 'train', 'plane'] as Transport[]).map(m => {
                    const p = game.ticketPrice(i, m);
                    const afford = ui.money >= p;
                    return (
                      <button key={m} disabled={!afford} onClick={() => game.startTravel(i, m)}
                        className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md transition-all hover:brightness-125 disabled:opacity-40"
                        style={{ background: '#232c44', border: '1px solid #2b3550' }}
                        title={`${TRANSPORT[m].name} · ${TRANSPORT[m].timeLabel}`}>
                        <Icon n={TR_ICON[m]} size={17} color="#5ce0d3" />
                        <span className="text-[9px] font-bold" style={{ color: '#c6cede' }}>{TRANSPORT[m].name}</span>
                        <span className="text-[9.5px] font-bold" style={{ color: afford ? '#8ee06e' : '#ff8a8a' }}>{fmt(p)} ₽</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px]" style={{ color: '#8b97b8' }}>Автобус дёшев, но едет день · Поезд — несколько часов · Самолёт — мгновенно</span>
        <span className="text-[11px]">Баланс: <Money v={ui.money} /></span>
      </div>
    </Panel>
  );
}

// ==================== МУЗЫКАЛЬНЫЙ ПЛЕЕР ====================
function MusicP({ ui, onClose }: { ui: UIState; onClose: () => void }) {
  const [status, setStatus] = useState(music.getStatus());
  const [showList, setShowList] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setStatus(music.getStatus()), 400);
    return () => clearInterval(iv);
  }, []);
  const cur = TRACKS[status.track];
  return (
    <Panel title="📻 Музыкальный плеер" sub="Портативный плеер — музыка скрашивает будни" onClose={onClose} w={480}>
      {/* текущий трек */}
      <div className="panel p-4 mb-3 text-center" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderColor: '#35d0ba55' }}>
        <div className="text-[34px] mb-1 leading-none">
          <span className={status.isPlaying ? 'inline-block bounce-soft' : 'inline-block opacity-50'}><Icon n="note" size={34} color={status.isPlaying ? '#35d0ba' : '#5d6884'} /></span>
        </div>
        <div className="text-[15px] font-bold" style={{ color: '#e9edf6' }}>{cur.name}</div>
        <div className="text-[10.5px] mt-0.5" style={{ color: '#8b97b8' }}>{cur.genre} · {cur.dur} {status.isPlaying ? '· играет' : '· пауза'}</div>
      </div>
      {/* управление */}
      <div className="flex justify-center items-center gap-3 mb-3">
        <button className="btn btn-ghost w-11 h-11 flex items-center justify-center" onClick={() => { sfx.click(); music.prevTrack(); }} title="Предыдущий">⏮</button>
        <button className="btn btn-teal w-14 h-14 flex items-center justify-center" style={{ fontSize: 20 }} onClick={() => { sfx.click(); music.togglePlay(); }} title="Пауза/играть">
          {status.isPlaying ? '⏸' : '▶'}
        </button>
        <button className="btn btn-ghost w-11 h-11 flex items-center justify-center" onClick={() => { sfx.click(); music.nextTrack(); }} title="Следующий">⏭</button>
      </div>
      {/* громкость */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: '#8b97b8' }}>
          <span>Громкость</span><span>{Math.round(status.volume * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} value={Math.round(status.volume * 100)}
          onChange={e => music.setVolume(parseInt(e.target.value, 10) / 100)} className="w-full" />
      </div>
      <button className="btn btn-ghost w-full mb-2" onClick={() => { sfx.click(); setShowList(v => !v); }}>{showList ? 'Скрыть плейлист' : 'Показать плейлист'}</button>
      {showList && (
        <div className="scroll-thin overflow-y-auto pr-1" style={{ maxHeight: 220 }}>
          {TRACKS.map((t, i) => (
            <button key={i} onClick={() => { sfx.click(); music.playTrack(i); }}
              className="w-full flex items-center justify-between px-2.5 py-2 mb-1 rounded-md text-left transition-all hover:brightness-125"
              style={{ background: i === status.track ? 'rgba(53,208,186,.15)' : 'rgba(0,0,0,.25)', border: `1px solid ${i === status.track ? '#35d0ba55' : 'transparent'}` }}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold w-4" style={{ color: i === status.track ? '#35d0ba' : '#5d6884' }}>{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-semibold truncate" style={{ color: i === status.track ? '#35d0ba' : '#e9edf6' }}>{t.name}</span>
                  <span className="block text-[9px]" style={{ color: '#8b97b8' }}>{t.genre}</span>
                </span>
              </span>
              <span className="text-[9.5px] shrink-0" style={{ color: '#8b97b8' }}>{t.dur}</span>
            </button>
          ))}
        </div>
      )}
      <button className="btn w-full mt-2" onClick={() => { sfx.click(); music.toggleMute(); }}>
        {status.muted ? '🔇 Включить звук' : '🔊 Выключить звук'}
      </button>
    </Panel>
  );
}

function FactoryP({ id, ui, game, onClose }: { id: 'factory' | 'workshop'; ui: UIState; game: Game; onClose: () => void }) {
  const isFactory = id === 'factory';
  const job = ui.job;
  const wageMult = ui.cities[ui.cityIndex]?.wageMult ?? 1;
  return (
    <Panel title={isFactory ? 'Завод «Красный Октябрь»' : 'Цех №2'} sub={isFactory ? 'Мастер Петрович: «Работа есть — было бы здоровье»' : 'Специализированные работы с металлом'} onClose={onClose} w={620}>
      {/* статус работы */}
      <div className="panel p-2.5 mb-3" style={{ background: '#12161f' }}>
        <div className="font-disp text-[10px] mb-1" style={{ color: '#ffb52e' }}>ВАША РАБОТА</div>
        {job.def ? (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[13px] font-bold" style={{ color: '#8ee06e' }}>{job.rank}</span>
              <span className="text-[11px] ml-2" style={{ color: '#8b97b8' }}>стаж: {job.days} дн.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-disp text-[12px]" style={{ color: '#ffd34d' }}>{fmt(Math.round(job.pay * wageMult))} ₽/день</span>
              <button className="btn btn-ghost btn-sm" onClick={() => game.quitFactoryJob()}>Уволиться</button>
            </div>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: '#8b97b8' }}>Вы безработный. Возьмите халтуру или устройтесь на постоянную работу.</span>
        )}
      </div>

      {/* разовые халтуры */}
      <div className="font-disp text-[10px] mb-1.5" style={{ color: '#5db8ff' }}>РАЗОВЫЕ ХАЛТУРЫ</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 mb-3">
        {ONETIME_JOBS.filter(j => j.where === id).map(j => {
          const cd = ui.factoryCooldowns?.[j.id] ?? 0;
          const onCd = cd > 0;
          const h = Math.floor(cd / 60), m = Math.round(cd % 60);
          return (
            <div key={j.id} className="panel p-2 flex flex-col" style={{ background: '#141926', opacity: onCd ? 0.55 : 1 }}>
              <div className="text-[11.5px] font-semibold" style={{ color: '#e9edf6' }}>{j.name}</div>
              <div className="text-[9.5px] mb-1" style={{ color: '#8b97b8' }}>{j.desc}</div>
              <div className="text-[9.5px] mb-1.5" style={{ color: '#8b97b8' }}>
                {j.dur} ч · −{j.energy} выносл.{j.risk > 0 ? ` · риск ${j.risk}%` : ''}
              </div>
              <button className={`btn btn-sm mt-auto ${onCd ? 'btn-ghost' : 'btn-teal'}`} disabled={onCd || ui.stats.energy < j.energy} onClick={() => game.doOneTimeJob(j.id)}>
                {onCd ? `через ${h} ч ${m} мин` : `Взять · +${fmt(Math.round(j.pay * wageMult))} ₽`}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mb-2 px-2 py-1.5 rounded-md" style={{ color: '#ffd34d', background: '#ffb52e14', border: '1px solid #ffb52e33' }}>
        💼 Работа выполняется физически: возьмите задание, несите листы/балки со стопки на склад (или в грузовик), резка — у станка. С грузом вы идёте медленнее!
      </p>

      {/* постоянная работа (только на заводе) */}
      {isFactory && (
        <>
          <div className="font-disp text-[10px] mb-1.5" style={{ color: '#8ee06e' }}>ПОСТОЯННАЯ РАБОТА (зарплата каждый день)</div>
          {PERM_JOBS.map(j => {
            const isCurrent = job.def?.id === j.id;
            return (
              <Row key={j.id} className="items-start">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold" style={{ color: '#e9edf6' }}>
                    {j.name} {isCurrent && <span style={{ color: '#8ee06e' }}>✓ вы здесь</span>}
                  </div>
                  <div className="text-[9.5px]" style={{ color: '#8b97b8' }}>
                    {j.desc} · {j.hours} ч/день · −{j.energy} выносл. Повышения: {j.promos.map(p => `${p.days}д → ${p.name}`).join(', ')}
                  </div>
                </div>
                <button className="btn btn-amber btn-sm shrink-0" disabled={isCurrent} onClick={() => game.hireFactoryJob(j.id)}>
                  {fmt(Math.round(j.pay * wageMult))} ₽/д
                </button>
              </Row>
            );
          })}
        </>
      )}
      <p className="text-[10px] mt-2" style={{ color: '#8b97b8' }}>Постоянная работа даёт разрешение на работу (нужно для полиции). Зарплата приходит в полдень.</p>
    </Panel>
  );
}

// ==================== ПОДЪЕЗД ЖИЛОГО ДОМА ====================
function Door({ num, state, price, owned, onClick }: { num: string; state: 'owned' | 'sale' | 'neighbor'; price?: number; owned?: boolean; onClick: () => void }) {
  const frame = state === 'owned' ? '#8ee06e' : state === 'sale' ? '#ffb52e' : '#3a4560';
  const leaf = state === 'owned' ? '#4e6e4a' : state === 'sale' ? '#6e5a3a' : '#4a3a2c';
  return (
    <button onClick={onClick} className="group flex flex-col items-center transition-transform active:scale-95" style={{ cursor: 'pointer' }}>
      <div className="relative transition-all group-hover:brightness-125"
        style={{ width: 'clamp(64px, 12vw, 92px)', height: 'clamp(92px, 17vw, 132px)', background: '#1a1410', border: `3px solid ${frame}`, borderRadius: '6px 6px 0 0', boxShadow: state !== 'neighbor' ? `0 0 14px ${frame}44` : 'none' }}>
        {/* полотно двери */}
        <div className="absolute" style={{ inset: 5, background: `linear-gradient(160deg, ${leaf}, ${leaf}cc)`, borderRadius: '4px 4px 0 0' }}>
          <div className="absolute" style={{ top: '12%', left: '14%', right: '14%', height: '30%', border: `2px solid rgba(0,0,0,.35)`, borderRadius: 3 }} />
          <div className="absolute" style={{ top: '52%', left: '14%', right: '14%', height: '30%', border: `2px solid rgba(0,0,0,.35)`, borderRadius: 3 }} />
          {/* глазок */}
          <div className="absolute rounded-full" style={{ top: '44%', right: '16%', width: 6, height: 6, background: '#0d1017', border: '1px solid #8b97b8' }} />
          {/* ручка */}
          <div className="absolute rounded-full" style={{ top: '58%', left: '12%', width: 7, height: 7, background: '#d8b23e' }} />
        </div>
        {/* номер */}
        <div className="absolute font-disp" style={{ top: -9, left: '50%', transform: 'translateX(-50%)', background: '#d8dce2', color: '#1a1410', fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>{num}</div>
        {state === 'sale' && <div className="absolute blinker font-disp" style={{ bottom: 6, left: '50%', transform: 'translateX(-50%)', color: '#ffd34d', fontSize: 9 }}>ПРОДАЁТСЯ</div>}
        {state === 'owned' && <div className="absolute font-disp" style={{ bottom: 6, left: '50%', transform: 'translateX(-50%)', color: '#baffae', fontSize: 9 }}>ВАША</div>}
      </div>
      <div className="mt-1.5 text-center">
        {state === 'sale' && <span className="font-disp text-[10px]" style={{ color: '#ffd34d' }}>{fmt(price ?? 0)} ₽</span>}
        {state === 'owned' && <span className="font-disp text-[10px]" style={{ color: '#8ee06e' }}>{owned ? 'ВОЙТИ' : ''}</span>}
        {state === 'neighbor' && <span className="text-[9px]" style={{ color: '#5d6884' }}>соседи</span>}
      </div>
    </button>
  );
}

function BuildingP({ id, ui, game, onClose }: { id: string; ui: UIState; game: Game; onClose: () => void }) {
  const bld = BUILDINGS.find(b => b.id === id) ?? BUILDINGS[0];
  const saleFloor = Math.max(...bld.apts.filter(a => !ui.ownedApts.includes(a.aptId)).map(a => a.floor), 1);
  const [floor, setFloor] = useState(Math.min(bld.floors, saleFloor));
  const floors = Array.from({ length: bld.floors }, (_, i) => bld.floors - i);
  const doorFor = (f: number, idx: number) => {
    const num = `${f}0${idx + 1}`;
    const ref = bld.apts.find(a => a.number === num);
    if (!ref) return { state: 'neighbor' as const, num };
    const def = ui.aptsDefs.find(d => d.id === ref.aptId);
    if (ui.ownedApts.includes(ref.aptId)) return { state: 'owned' as const, num, aptId: ref.aptId };
    return { state: 'sale' as const, num, aptId: ref.aptId, price: def?.price ?? 0 };
  };
  return (
    <Panel title={`Подъезд · ${bld.name}`} sub={`${bld.address} · этажей: ${bld.floors} · лифт работает через раз`} onClose={onClose} w={640}>
      {ui.ownedApts.length > 0 && (
        <div className="panel flex items-center justify-between p-2.5 mb-3" style={{ background: '#12251a', borderColor: '#8ee06e44' }}>
          <span className="text-[11.5px]" style={{ color: '#baffae' }}>У вас есть квартира в этом городе</span>
          <button className="btn btn-teal btn-sm" onClick={() => game.enterOwnedApartment()}>Войти домой</button>
        </div>
      )}
      {/* бесплатная квартира для старта */}
      {ui.freeApt ? (
        <div className="panel flex items-center justify-between p-2.5 mb-3" style={{ background: '#251f12', borderColor: '#ffb52e44' }}>
          <span className="text-[11.5px]" style={{ color: '#ffe0a8' }}>
            Кв. {ui.freeApt.number}: бесплатно ещё {ui.freeApt.daysLeft} дн. (потом {fmt(ui.freeApt.rentAfter)} ₽/день)
          </span>
          <button className="btn btn-amber btn-sm" onClick={() => game.enterOwnedApartment()}>Войти</button>
        </div>
      ) : ui.ownedApts.length === 0 && bld.id === '0' ? (
        <div className="panel flex items-center justify-between p-2.5 mb-3" style={{ background: '#12201f', borderColor: '#5db8ff44' }}>
          <span className="text-[11.5px]" style={{ color: '#b8dcff' }}>Кв. 101 свободна: заселяйтесь бесплатно на 7 дней!</span>
          <button className="btn btn-teal btn-sm" onClick={() => game.moveInFreeApt()}>Заселиться</button>
        </div>
      ) : null}
      <div className="grid grid-cols-[86px_1fr] gap-3">
        {/* лифт */}
        <div>
          <div className="font-disp text-[9px] mb-1.5 text-center" style={{ color: '#8b97b8' }}>ЛИФТ</div>
          <div className="panel p-1.5 scroll-thin overflow-y-auto flex flex-col gap-1" style={{ background: '#12161f', maxHeight: 320 }}>
            {floors.map(f => (
              <button key={f} onClick={() => { sfx.click(); setFloor(f); }}
                className="py-1.5 rounded font-disp text-[11px] transition-all relative"
                style={{
                  background: f === floor ? '#ffb52e' : '#232c44', color: f === floor ? '#2a1600' : '#8b97b8',
                  border: `1px solid ${f === floor ? '#ffb52e' : '#2b3550'}`,
                }}>
                {f}
                {bld.apts.some(a => a.floor === f && !ui.ownedApts.includes(a.aptId)) && f !== floor && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full blinker" style={{ background: '#ffd34d' }} />
                )}
              </button>
            ))}
          </div>
        </div>
        {/* этаж */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-disp text-[12px]" style={{ color: '#e9edf6' }}>ЭТАЖ {floor}</span>
            <span className="text-[9.5px]" style={{ color: '#5d6884' }}>лестничная клетка</span>
          </div>
          <div className="panel p-4" style={{ background: 'linear-gradient(180deg,#2a2f3e,#232838)', border: '1px solid #3a4560' }}>
            {/* стена с окном */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-14 shrink-0" style={{ background: ui.timeMin >= 1320 || ui.timeMin < 360 ? '#141a2e' : '#9ec8e8', border: '3px solid #12141c', borderRadius: 2 }} />
              <div className="h-1.5 flex-1 rounded" style={{ background: '#1a1410' }} />
              <div className="text-[9px]" style={{ color: '#8b97b8' }}>пахнет краской и кошками</div>
            </div>
            <div className="grid grid-cols-4 gap-2 place-items-center">
              {Array.from({ length: bld.doorsPerFloor }, (_, i) => {
                const d = doorFor(floor, i);
                if (d.state === 'neighbor') return <Door key={i} num={d.num} state="neighbor" onClick={() => game.neighborKnock()} />;
                if (d.state === 'owned') return <Door key={i} num={d.num} state="owned" owned onClick={() => game.enterOwnedApartment()} />;
                return <Door key={i} num={d.num} state="sale" price={d.price} onClick={() => game.buyApartment(d.aptId)} />;
              })}
            </div>
          </div>
          <p className="text-[9.5px] mt-2" style={{ color: '#5d6884' }}>
            Кликните по двери: своя — войти, жёлтая — купить, серая — постучать к соседям. Коммуналка списывается каждое утро.
          </p>
        </div>
      </div>
    </Panel>
  );
}

// ==================== КРАЖА НА ЦЕХЕ (чёрный вход) ====================
const THEFT_META: Record<string, { icon: string; blurb: string }> = {
  scrap: { icon: '🔩', blurb: 'Обрезки и стружка. Дёшево, но охрана почти не смотрит.' },
  copper: { icon: '🧡', blurb: 'Катушки меди со склада. Уже интересно — и уже заметнее.' },
  precious: { icon: '💎', blurb: 'Сейф мастера: драгметаллы. Куш огромный, риск — тоже.' },
};
function TheftP({ game, onClose }: { game: Game; onClose: () => void }) {
  return (
    <Panel title="Чёрный вход — Цех №2" sub="Замок сорван, сигнализации нет. Охрана где-то пьёт чай..." onClose={onClose} w={480}>
      <div className="space-y-2 mb-3">
        {THEFT_OPTIONS.map(t => {
          const m = THEFT_META[t.id];
          const riskPct = Math.round(t.risk * 100);
          const riskColor = riskPct <= 20 ? '#8ee06e' : riskPct <= 35 ? '#ffd34d' : '#ff5a5a';
          return (
            <div key={t.id} className="panel p-3 flex items-center gap-3" style={{ background: '#141926' }}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold" style={{ color: '#e9edf6' }}>{t.name}</div>
                <div className="text-[9.5px]" style={{ color: '#8b97b8' }}>{m.blurb}</div>
                <div className="text-[9.5px] mt-0.5">
                  <span style={{ color: '#8ee06e' }}>+{fmt(t.reward)} ₽</span>
                  <span style={{ color: '#5d6884' }}> · </span>
                  <span style={{ color: riskColor }}>риск {riskPct}%</span>
                </div>
              </div>
              <button className="btn btn-danger btn-sm shrink-0" onClick={() => game.attemptTheft(t.id)}>Украсть</button>
            </div>
          );
        })}
      </div>
      <button className="btn btn-ghost w-full" onClick={onClose}>Уйти тихо</button>
      <p className="text-[9px] mt-2 text-center" style={{ color: '#5d6884' }}>
        Поймают — штраф 500 ₽ и конфискация. Без паспорта отвезут в участок на 2 часа.
      </p>
    </Panel>
  );
}
