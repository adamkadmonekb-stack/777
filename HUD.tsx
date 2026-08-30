import { useRef, useState } from 'react';
import type { Game, UIState } from '../game/engine';
import { fmt } from '../game/core';
import { initAudio, sfx } from '../game/audio';
import { music } from '../game/music';

export const Icon = ({ n, size = 14, color = 'currentColor' }: { n: string; size?: number; color?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    heart: <path d="M12 21s-8-5.3-8-11a4.7 4.7 0 0 1 8-3.3A4.7 4.7 0 0 1 20 10c0 5.7-8 11-8 11z" fill={color} />,
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill={color} />,
    moon: <path d="M20.5 14A8.5 8.5 0 1 1 10 3.5 7 7 0 0 0 20.5 14z" fill={color} />,
    burger: <><rect x="3" y="5" width="18" height="3.4" rx="1.7" fill={color} /><rect x="3" y="10.3" width="18" height="3.4" rx="1.7" fill={color} opacity=".8" /><rect x="3" y="15.6" width="18" height="3.4" rx="1.7" fill={color} /></>,
    drop: <path d="M12 3s6 7.2 6 11.2a6 6 0 0 1-12 0C6 10.2 12 3 12 3z" fill={color} />,
    smile: <><circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2" /><circle cx="9" cy="10" r="1.4" fill={color} /><circle cx="15" cy="10" r="1.4" fill={color} /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" /></>,
    bag: <><path d="M6 8h12l-1 13H7L6 8z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" /><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke={color} strokeWidth="2" /></>,
    map: <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" /><path d="M9 4v14M15 6v14" stroke={color} strokeWidth="1.4" /></>,
    hammer: <path d="M14 6l4 4-2 2-4-4-8 8-2-2 8-8-2-2 2-2 4 4z" fill={color} />,
    list: <><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke={color} strokeWidth="2" /><path d="M8 9h8M8 12.5h8M8 16h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></>,
    phone: <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 3v11h8V6H8zm3 12.5h2" fill={color} />,
    gear: <><circle cx="12" cy="12" r="3.2" fill="none" stroke={color} strokeWidth="2" /><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22M4.9 4.9l2.5 2.5M16.6 16.6l2.5 2.5M19.1 4.9l-2.5 2.5M7.4 16.6l-2.5 2.5" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    sun: <><circle cx="12" cy="12" r="4.5" fill={color} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    rain: <><path d="M7 15a5 5 0 1 1 1-9.9A6 6 0 0 1 19 8a4 4 0 0 1-1 7.9H7z" fill={color} opacity=".85" /><path d="M8 18l-1.5 3M13 18l-1.5 3M18 18l-1.5 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></>,
    snow: <path d="M12 2v20M4 6l16 12M20 6 4 18M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />,
    heat: <path d="M10 4a2 2 0 0 1 4 0v9.3a4.5 4.5 0 1 1-4 0V4zm2 2v9" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />,
    hand: <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11m0-5.5v-1a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13m0-2a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.9-2.5L4 16a1.8 1.8 0 0 1 2.8-2.2L8 15" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />,
    zzz: <path d="M4 8h6l-6 7h6M13 4h5l-5 6h5M15 15h5l-5 6h5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    music: <><path d="M9 18.5V6l10-2v12.5" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><circle cx="6.5" cy="18.5" r="2.5" fill={color} /><circle cx="16.5" cy="16.5" r="2.5" fill={color} /></>,
    note: <><path d="M10 17V4l9-2v13" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><circle cx="7.5" cy="17" r="2.5" fill={color} /><circle cx="16.5" cy="15" r="2.5" fill={color} /></>,
    bus: <><rect x="4" y="4" width="16" height="13" rx="2.5" fill="none" stroke={color} strokeWidth="1.8" /><path d="M4 11h16M8 4v3M16 4v3" stroke={color} strokeWidth="1.6" /><circle cx="8" cy="19.5" r="1.8" fill={color} /><circle cx="16" cy="19.5" r="1.8" fill={color} /></>,
    train: <><rect x="5" y="3" width="14" height="14" rx="3" fill="none" stroke={color} strokeWidth="1.8" /><path d="M5 10h14" stroke={color} strokeWidth="1.6" /><circle cx="9" cy="14" r="1.2" fill={color} /><circle cx="15" cy="14" r="1.2" fill={color} /><path d="M7 21l2-3M17 21l-2-3" stroke={color} strokeWidth="1.6" strokeLinecap="round" /></>,
    plane: <path d="M10.5 21l2-6.5L19 8a2.2 2.2 0 0 0-3.1-3.1L9.4 11.4 3 13.5l1.5 1.5 4.5-.5 2 2-.5 4.5z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>{paths[n]}</svg>;
};

const BARS: { key: keyof UIState['stats']; name: string; short: string; icon: string; color: string }[] = [
  { key: 'hp', name: 'Здоровье', short: 'ЗДОР', icon: 'heart', color: '#ff5a5a' },
  { key: 'energy', name: 'Выносливость', short: 'ВЫНОС', icon: 'bolt', color: '#ffd34d' },
  { key: 'fatigue', name: 'Усталость', short: 'УСТАЛ', icon: 'zzz', color: '#9ab8ff' },
  { key: 'hunger', name: 'Голод', short: 'ГОЛОД', icon: 'burger', color: '#ff9d5c' },
  { key: 'hygiene', name: 'Гигиена', short: 'ГИГИЕН', icon: 'drop', color: '#5ce0d3' },
  { key: 'mood', name: 'Настроение', short: 'НАСТР', icon: 'smile', color: '#c98ae0' },
];

function SoundChip({ game, ui }: { game: Game; ui: UIState }) {
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState(50);
  return (
    <div className="hud-chip px-2 py-1 flex items-center gap-1.5">
      <button className="cursor-pointer hover:brightness-150 flex items-center" title={ui.muted ? 'Включить звук' : 'Выключить звук'}
        onClick={() => { game.toggleMute(); }}>
        <Icon n="music" size={13} color={ui.muted ? '#5d6884' : '#c6cede'} />
      </button>
      <button className="cursor-pointer text-[9px] font-bold hover:brightness-150" style={{ color: '#8b97b8' }} onClick={() => setOpen(v => !v)}>{ui.muted ? 'выкл' : 'звук'}</button>
      {open && (
        <input type="range" min={0} max={100} value={vol} style={{ width: 60 }}
          onChange={e => { const v = parseInt(e.target.value, 10); setVol(v); music.setVolume(v / 100); }} />
      )}
    </div>
  );
}

export function HUD({ ui, game }: { ui: UIState; game: Game }) {
  const wIcon = ui.weather === 'sun' ? 'sun' : ui.weather === 'rain' ? 'rain' : ui.weather === 'snow' ? 'snow' : 'heat';
  const wName = { sun: 'Ясно', rain: 'Дождь', snow: 'Снег', heat: 'Жара' }[ui.weather];
  const night = ui.timeMin >= 1320 || ui.timeMin < 360;
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* статусы */}
      <div className="absolute top-2 left-2 hud-chip p-2 pointer-events-auto" style={{ width: 'clamp(185px, 25vw, 235px)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-disp text-[10px] tracking-wider" style={{ color: '#ffb52e' }}>СОСТОЯНИЕ</span>
          {ui.ill && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold blinker" style={{ background: '#ff5a5a33', color: '#ff8a8a' }}>{ui.ill === 'cold' ? 'ПРОСТУДА' : 'ОТРАВЛЕНИЕ'}</span>}
        </div>
        {BARS.map(b => (
          <div key={b.key} className="flex items-center gap-1.5 mb-1 last:mb-0" title={b.name}>
            <span style={{ color: b.color }}><Icon n={b.icon} size={13} /></span>
            <span className="text-[8px] font-bold w-9 shrink-0 tracking-wider" style={{ color: '#8b97b8' }}>{b.short}</span>
            <div className="bar flex-1"><i style={{ width: `${Math.round(ui.stats[b.key])}%`, background: `linear-gradient(90deg, ${b.color}88, ${b.color})` }} /></div>
            <span className="text-[10px] font-bold w-6 text-right" style={{ color: ui.stats[b.key] < 25 ? '#ff5a5a' : '#c6cede' }}>{Math.round(ui.stats[b.key])}</span>
          </div>
        ))}
        {ui.partner && <div className="mt-1 text-[10px]" style={{ color: '#c98ae0' }}>{ui.family ? 'Семья — вы не одни' : 'У вас есть близкий человек'}</div>}
      </div>

      {/* деньги и время */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 pointer-events-auto">
        <div className="hud-chip px-3 py-1.5 flex items-center gap-3">
          <span className="font-disp text-[13px]" style={{ color: '#8ee06e' }}>{fmt(ui.money)} ₽</span>
          <span className="font-disp text-[11px]" style={{ color: night ? '#9ab8ff' : '#ffd34d' }}>{ui.timeStr}</span>
        </div>
        <div className="hud-chip px-2.5 py-1 flex items-center gap-2">
          <span style={{ color: '#ffd34d' }}><Icon n={wIcon} size={14} /></span>
          <span className="text-[10px] font-semibold" style={{ color: '#c6cede' }}>{wName}</span>
          <span className="text-[10px] font-bold" style={{ color: '#ffb52e' }}>День {ui.day}</span>
          {night && <span className="text-[9px] px-1.5 rounded font-bold" style={{ background: '#ff5a5a33', color: '#ff8a8a' }}>ОПАСНО</span>}
        </div>
        {ui.hasPhone && (
          <button className="hud-chip px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:brightness-125" onClick={() => { sfx.click(); game.openPhone(); }}>
            <Icon n="phone" size={12} color="#5ce0d3" /><span className="text-[10px] font-semibold" style={{ color: '#5ce0d3' }}>Телефон</span>
          </button>
        )}
        {ui.hasPlayer && (
          <button className="hud-chip px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:brightness-125" onClick={() => { initAudio(); sfx.click(); game.openModal({ kind: 'music' }); }}>
            <Icon n="music" size={12} color="#35d0ba" /><span className="text-[10px] font-semibold" style={{ color: '#35d0ba' }}>Плеер</span>
          </button>
        )}
        <button className="hud-chip px-2.5 py-1 flex items-center gap-1.5 cursor-pointer hover:brightness-125" onClick={() => { initAudio(); sfx.click(); game.openModal({ kind: 'achievements' }); }}>
          <Icon n="trophy" size={12} color="#ffb52e" /><span className="text-[10px] font-semibold" style={{ color: '#ffb52e' }}>Достижения ({ui.achievementsUnlocked}/{ui.achievementsTotal})</span>
        </button>
        <SoundChip game={game} ui={ui} />
      </div>

      {/* тосты */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col gap-1 items-center w-full max-w-md px-4">
        {ui.toasts.map(t => (
          <div key={t.id} className="toast-in hud-chip px-3 py-1.5 text-[11px] font-semibold text-center"
            style={{ color: t.kind === 'good' ? '#8ee06e' : t.kind === 'bad' ? '#ff8a8a' : t.kind === 'money' ? '#8ee06e' : '#c6cede', borderColor: t.kind === 'money' ? '#8ee06e55' : undefined }}>
            {t.text}
          </div>
        ))}
      </div>

      {/* район + подсказка управления */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1.5">
        <div className="hud-chip px-3 py-1.5">
          <span className="font-disp text-[11px]" style={{ color: '#ffb52e' }}>{ui.district}</span>
        </div>
        <div className="hud-chip px-3 py-1 hidden md:block text-[9.5px]" style={{ color: '#8b97b8' }}>
          WASD — движение · Shift — бег · E — действие · I — рюкзак · M — карта · C — крафт · Q — задания
        </div>
      </div>

      {/* трекер заводского задания */}
      {ui.factoryJob && (
        <div className="absolute bottom-2 left-2 hud-chip p-2.5 pointer-events-none" style={{ width: 'clamp(180px, 24vw, 230px)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-disp text-[9px] tracking-wider" style={{ color: '#ffb52e' }}>ЗАДАНИЕ</span>
            <span className="text-[10px] font-bold" style={{ color: '#ffd34d' }}>{ui.factoryJob.progress}/{ui.factoryJob.need}</span>
          </div>
          <div className="text-[11px] font-semibold mb-1" style={{ color: '#e9edf6' }}>{ui.factoryJob.name}</div>
          <div className="bar mb-1.5"><i style={{ width: `${(ui.factoryJob.progress / ui.factoryJob.need) * 100}%`, background: 'linear-gradient(90deg,#5db8ff,#7dff6a)' }} /></div>
          <div className="text-[9px] leading-tight" style={{ color: '#8b97b8' }}>
            {ui.factoryJob.kind === 'cut'
              ? 'Жмите E у станка (жёлтая надпись)'
              : ui.factoryJob.kind === 'trash'
                ? 'Убирайте кучи мусора (E)'
                : ui.factoryJob.carrying
                  ? 'Несите груз к синей метке!'
                  : 'Возьмите груз у зелёной метки'}
          </div>
          <div className="text-[10px] font-bold mt-0.5" style={{ color: '#7dff6a' }}>Награда: +{fmt(ui.factoryJob.pay)} ₽</div>
        </div>
      )}

      {/* подсказка действия */}
      {ui.prompt && (
        <div className="absolute bottom-16 md:bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="hud-chip px-4 py-2 flex items-center gap-2 rise">
            <span className="font-disp text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#ffb52e', color: '#2a1600' }}>E</span>
            <span className="text-[12px] font-semibold" style={{ color: '#ffe8b8' }}>{ui.prompt}</span>
          </div>
        </div>
      )}

      {/* кнопки справа (для мыши) */}
      <div className="absolute bottom-2 right-2 hidden md:flex gap-1.5 pointer-events-auto">
        {[
          { i: 'bag', k: 'I', m: { kind: 'inventory' as const } },
          { i: 'map', k: 'M', m: { kind: 'map' as const } },
          { i: 'hammer', k: 'C', m: { kind: 'craft' as const } },
          { i: 'list', k: 'Q', m: { kind: 'quests' as const } },
          { i: 'gear', k: 'Esc', m: { kind: 'menu' as const } },
        ].map(b => (
          <button key={b.i} title={b.k} onClick={() => { initAudio(); sfx.click(); game.openModal(b.m); }}
            className="hud-chip w-9 h-9 flex items-center justify-center hover:brightness-150 cursor-pointer" style={{ color: '#c6cede' }}>
            <Icon n={b.i} size={16} />
          </button>
        ))}
      </div>

      <TouchControls game={game} ui={ui} />
    </div>
  );
}

export function TouchControls({ game, ui }: { game: Game; ui: UIState }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);
  if (ui.modal) return null;
  const move = (e: React.PointerEvent) => {
    const el = baseRef.current; if (!el || pid.current === null) return;
    const r = el.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    game.setJoy(dx, dy);
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx * 26}%, ${dy * 26}%)`;
  };
  const end = () => { pid.current = null; game.setJoy(0, 0); if (knobRef.current) knobRef.current.style.transform = ''; };
  return (
    <>
      <div className="absolute bottom-6 left-5 touch-only pointer-events-auto"
        onPointerDown={e => { pid.current = e.pointerId; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e); }}
        onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <div ref={baseRef} className="joy-base"><div ref={knobRef} className="joy-knob" /></div>
      </div>
      <div className="absolute bottom-8 right-5 flex flex-col items-end gap-3 touch-only pointer-events-auto">
        <div className="flex gap-2.5">
          <button className="tbtn tbtn-ghost" style={{ width: 48, height: 48 }} onClick={() => { sfx.click(); game.openModal({ kind: 'inventory' }); }}><Icon n="bag" size={20} color="#c6cede" /></button>
          <button className="tbtn tbtn-ghost" style={{ width: 48, height: 48 }} onClick={() => { sfx.click(); game.openModal({ kind: 'map' }); }}><Icon n="map" size={20} color="#c6cede" /></button>
        </div>
        <button className="tbtn" style={{ width: 72, height: 72 }} onPointerDown={() => { initAudio(); game.interact(); }}>
          <Icon n="hand" size={30} color="#2a1600" />
        </button>
      </div>
    </>
  );
}
