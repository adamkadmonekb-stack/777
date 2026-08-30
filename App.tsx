import { useEffect, useMemo, useRef, useState } from 'react';
import { Game } from './game/engine';
import type { UIState } from './game/engine';
import { HUD, Icon } from './ui/HUD';
import { ModalRenderer } from './ui/Panels';
import { MinigameRenderer } from './ui/Minigames';
import { initAudio, sfx } from './game/audio';

function Skyline() {
  const buildings = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    w: 34 + ((i * 37) % 46),
    h: 90 + ((i * 83) % 190),
    lit: ((i * 29) % 100) / 100,
    hue: i % 3,
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg,#070a12 0%,#101725 55%,#1c2338 100%)' }}>
      {/* луна */}
      <div className="absolute rounded-full" style={{ width: 70, height: 70, right: '12%', top: '12%', background: 'radial-gradient(circle at 35% 35%, #f5ead0, #d8c8a0)', boxShadow: '0 0 60px 20px rgba(245,234,208,.12)' }} />
      {/* дождь */}
      <div className="absolute inset-0 rain opacity-70" />
      {/* силуэты */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-2">
        {buildings.map((b, i) => (
          <div key={i} className="relative shrink-0" style={{
            width: `${b.w}px`, height: `${b.h}px`,
            background: i % 2 ? '#0b0f1a' : '#0e1320',
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0 12px, rgba(255,181,46,${.05 + b.lit * .12}) 12px 16px), repeating-linear-gradient(90deg, transparent 0 8px, rgba(120,160,220,${.03 + b.lit * .06}) 8px 12px)`,
            borderTop: '2px solid #1c2338',
          }}>
            {i % 4 === 0 && <span className="absolute -top-1.5 left-1/2 w-1.5 h-1.5 rounded-full blinker" style={{ background: '#ff5a5a', boxShadow: '0 0 8px #ff5a5a' }} />}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(180deg, transparent, #070a12)' }} />
    </div>
  );
}

function StartScreen({ ui, onNew, onContinue }: { ui: UIState; onNew: () => void; onContinue: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      <Skyline />
      <div className="relative text-center max-w-xl w-full">
        <div className="font-disp text-[10px] tracking-[.5em] mb-2 rise" style={{ color: '#35d0ba' }}>СИМУЛЯТОР ВЫЖИВАНИЯ</div>
        <h1 className="font-disp neon leading-none rise" style={{ fontSize: 'clamp(34px, 7.5vw, 72px)', color: '#ffb52e' }}>УЛИЦЫ<br />ГОРОДА</h1>
        <div className="font-disp mt-1 rise" style={{ fontSize: 'clamp(14px, 2.6vw, 22px)', color: '#e9edf6', letterSpacing: '.35em' }}>ПУТЬ НАВЕРХ</div>
        <p className="mt-4 text-[12.5px] leading-relaxed rise" style={{ color: '#9aa6c4' }}>
          50 рублей, пакет вместо рюкзака и лавочка вместо дома.<br className="hidden md:block" />
          Собирай банки, сдавай в приём, не замёрзни ночью — и поднимись до пентхауса.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center rise">
          {ui.hasSave && <button className="btn btn-teal px-8 py-3" style={{ fontSize: 15 }} onClick={onContinue}>Продолжить путь</button>}
          <button className="btn btn-amber px-8 py-3" style={{ fontSize: 15 }} onClick={onNew}>{ui.hasSave ? 'Новая игра' : 'Начать путь'}</button>
        </div>
        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-2 text-left rise">
          {[
            { t: 'ИЩИ', d: 'Свалки, мусорки, пруд', i: 'bag', c: '#5db8ff' },
            { t: 'СДАВАЙ', d: 'Банки · медь · макулатура', i: 'list', c: '#8ee06e' },
            { t: 'ОБУСТРОЙСЯ', d: 'Рюкзак · комната · квартира', i: 'map', c: '#ffd34d' },
            { t: 'ВЫБИВАЙСЯ', d: 'Бригада · бизнес · пентхаус', i: 'bolt', c: '#ff9d5c' },
          ].map(s => (
            <div key={s.t} className="hud-chip p-2.5 flex items-start gap-2">
              <span style={{ color: s.c }}><Icon n={s.i} size={18} /></span>
              <div>
                <div className="font-disp text-[11px]" style={{ color: s.c }}>{s.t}</div>
                <div className="text-[9.5px]" style={{ color: '#8b97b8' }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[10px] rise" style={{ color: '#5d6884' }}>
          WASD / джойстик — движение · E — действие · I — рюкзак · M — карта · C — крафт · Q — задания · Esc — меню
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [ui, setUi] = useState<UIState | null>(null);

  useEffect(() => {
    if (!canvasRef.current || gameRef.current) return;
    const g = new Game(canvasRef.current);
    gameRef.current = g;
    g.startLoop();
    setUi(g.getUI());
    const iv = setInterval(() => setUi(g.getUI()), 120);
    return () => { clearInterval(iv); g.stopLoop(); gameRef.current = null; };
  }, []);

  const g = gameRef.current;
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0d1017' }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: 'none' }} />
      {ui && g && ui.started && (
        <>
          <HUD ui={ui} game={g} />
          {ui.modal && ui.modal.kind !== 'minigame' && <ModalRenderer ui={ui} game={g} />}
          {ui.modal && ui.modal.kind === 'minigame' && <MinigameRenderer modal={ui.modal} game={g} />}
          {ui.travel && (
            <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(4,5,10,.9)' }}>
              <div className="text-center max-w-sm px-6">
                <div className="text-[40px] mb-3 bounce-soft inline-block">
                  {ui.travel.mode === 'bus' ? '🚌' : ui.travel.mode === 'train' ? '🚂' : '✈️'}
                </div>
                <div className="font-disp" style={{ color: '#ffb52e', fontSize: 'clamp(18px,3.4vw,28px)' }}>В пути...</div>
                <div className="mt-2 text-[13px]" style={{ color: '#9aa6c4' }}>
                  {ui.cityName} → <b style={{ color: '#e9edf6' }}>{ui.travel.toName}</b>
                </div>
                <div className="mt-4"><div className="bar"><i style={{ width: `${Math.min(100, (ui.travel.t / ui.travel.dur) * 100)}%`, background: '#5ce0d3' }} /></div></div>
                <div className="mt-2 text-[10px]" style={{ color: '#5d6884' }}>Дорога утомляет, но открывает новые возможности</div>
              </div>
            </div>
          )}
          {ui.sleepFade > 0.01 && <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center" style={{ background: `rgba(4,5,10,${Math.min(1, ui.sleepFade)})` }}>
            <span className="font-disp" style={{ color: '#9ab8ff', fontSize: 'clamp(16px,3vw,26px)', opacity: Math.min(1, ui.sleepFade * 1.5) }}>Вы засыпаете...</span>
          </div>}
          {ui.stats.hp < 25 && <div className="absolute inset-0 pointer-events-none dmg-vignette z-20" />}
        </>
      )}
      {ui && g && !ui.started && (
        <StartScreen ui={ui}
          onNew={() => { initAudio(); sfx.win(); g.newGame(); }}
          onContinue={() => { initAudio(); if (!g.loadGame()) g.newGame(); }} />
      )}
    </div>
  );
}
