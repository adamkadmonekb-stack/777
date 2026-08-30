import { useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '../game/engine';
import type { Modal } from '../game/engine';
import { ITEMS, CAT_COLOR } from '../game/core';
import { sfx } from '../game/audio';

function Shell({ title, sub, children, timer, timerMax }: { title: string; sub: string; children: React.ReactNode; timer?: number; timerMax?: number }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3" style={{ background: 'rgba(6,8,14,.78)' }}>
      <div className="panel pop-in p-4" style={{ width: 'min(640px, 96vw)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="panel-title text-[16px]">{title}</h2>
          {timer !== undefined && timerMax !== undefined && (
            <span className="font-disp text-[13px]" style={{ color: timer < timerMax * .3 ? '#ff5a5a' : '#ffd34d' }}>{Math.ceil(timer / 1000)}с</span>
          )}
        </div>
        <p className="text-[11px] mb-2" style={{ color: '#8b97b8' }}>{sub}</p>
        {timer !== undefined && timerMax !== undefined && (
          <div className="bar mb-3"><i style={{ width: `${Math.max(0, (timer / timerMax) * 100)}%`, background: timer < timerMax * .3 ? '#ff5a5a' : '#ffb52e' }} /></div>
        )}
        {children}
      </div>
    </div>
  );
}

const useSpace = (fn: () => void) => {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); ref.current(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
};

// ==================== QTE ====================
function QteGame({ game, data }: { game: Game; data: Record<string, unknown> }) {
  const need = data.need as number;
  const timeMax = (data.time as number) * 1000;
  const qtype = data.qtype as string;
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(timeMax);
  const done = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setLeft(l => {
        if (l <= 50 && !done.current) { done.current = true; setTimeout(() => finish(hitsRef.current), 0); return 0; }
        return l - 50;
      });
    }, 50);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const hitsRef = useRef(0);
  const finish = (h: number) => { game.qteResult(h >= need, qtype); };
  const press = () => {
    if (done.current) return;
    hitsRef.current++;
    setHits(hitsRef.current);
    sfx.punch();
    if (hitsRef.current >= need) { done.current = true; finish(hitsRef.current); }
  };
  useSpace(press);
  const isDog = qtype === 'dog';
  return (
    <Shell title={isDog ? 'СОБАКА!' : 'ДРАКА!'} sub={isDog ? 'Отмахивайтесь! Жмите кнопку или ПРОБЕЛ!' : 'Бейте в ответ! Жмите как можно чаще!'} timer={left} timerMax={timeMax}>
      <div className="bar mb-3"><i style={{ width: `${Math.min(100, (hits / need) * 100)}%`, background: '#8ee06e' }} /></div>
      <button className="btn btn-danger w-full py-6 text-xl shake" onPointerDown={press} style={{ fontSize: 'clamp(18px,4vw,26px)' }}>
        {isDog ? 'ОТМАХИВАТЬСЯ!' : 'БИТЬ!'} ({Math.min(hits, need)}/{need})
      </button>
    </Shell>
  );
}

// ==================== СВАЛКА ====================
function DumpGame({ game, data }: { game: Game; data: Record<string, unknown> }) {
  const pilesN = (data.piles as number) ?? 10;
  const rival = !!data.rival;
  const dumpId = data.dumpId as string;
  const timeMax = rival ? 12000 : 20000;
  const loot = useMemo(() => game.genDumpLoot((data.table as string) ?? 'park', pilesN), [game, data, pilesN]);
  // 0 — куча, 1 — копается, 2 — найдено, 3 — утащил конкурент
  const [st, setSt] = useState<number[]>(() => loot.map(() => 0));
  const [left, setLeft] = useState(timeMax);
  const [rivalHit, setRivalHit] = useState(false);
  const stRef = useRef(st); stRef.current = st;
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    const items = loot.filter((_, i) => stRef.current[i] === 2);
    game.dumpResult(items, dumpId); // закрывает окно
  };

  useEffect(() => {
    const iv = setInterval(() => setLeft(l => Math.max(0, l - 100)), 100);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (left <= 0) finish(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [left]);
  useEffect(() => { if (st.every(v => v === 2 || v === 3)) finish(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [st]);
  useEffect(() => {
    if (!rival) return;
    const t = setTimeout(() => {
      setRivalHit(true);
      setSt(s => s.map(v => (v === 0 && Math.random() < 0.4 ? 3 : v)));
      sfx.fail();
    }, timeMax * 0.55);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const found = st.filter(v => v === 2).length;
  const dig = (i: number) => {
    if (done.current || st[i] !== 0) return;
    sfx.click();
    setSt(s => s.map((v, k) => (k === i ? 1 : v)));
    setTimeout(() => { sfx.pickup(); setSt(s => s.map((v, k) => (k === i ? 2 : v))); }, 260);
  };

  return (
    <Shell title="🔍 Разбор мусора" sub={rival ? 'Конкурент рядом — времени мало!' : 'Кликайте по кучам, пока не кончилось время'} timer={left} timerMax={timeMax}>
      {rivalHit && <p className="text-[11px] font-bold mb-2 blinker" style={{ color: '#ff8a8a' }}>Бомж Толян растащил часть куч!</p>}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {loot.map((item, i) => {
          const v = st[i];
          const def = ITEMS[item];
          const stolen = v === 3;
          return (
            <button key={i} onPointerDown={() => dig(i)} disabled={v !== 0}
              className="relative flex flex-col items-center justify-center rounded-lg overflow-hidden transition-transform active:scale-90"
              style={{
                aspectRatio: '1', pointerEvents: 'auto', cursor: v === 0 ? 'pointer' : 'default',
                background: v === 0 ? 'linear-gradient(160deg,#5a544c,#3d3831)' : v === 1 ? '#6e675e' : stolen ? '#2a2622' : '#1e2436',
                border: `1px solid ${v === 2 ? '#8ee06e88' : v === 3 ? '#ff5a5a55' : '#00000066'}`,
                opacity: stolen ? .55 : 1,
              }}>
              {v === 0 && <>
                <svg width="58%" height="58%" viewBox="0 0 40 30">
                  <path d="M2 28 Q8 8 18 12 Q24 2 32 10 Q39 14 38 28 Z" fill="#46413a" />
                  <circle cx="12" cy="20" r="2.4" fill="#8ab8d8" /><rect x="22" y="16" width="4" height="7" fill="#c86a5a" /><circle cx="30" cy="22" r="2" fill="#d8dce2" />
                </svg>
                <span className="font-disp" style={{ fontSize: 10, color: '#ffd34d' }}>?</span>
              </>}
              {v === 1 && <span className="font-disp text-[10px] blinker" style={{ color: '#e9edf6' }}>…</span>}
              {v === 2 && <>
                <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ background: CAT_COLOR[def.cat] }} />
                <span className="text-[8.5px] font-semibold text-center leading-tight px-0.5" style={{ color: '#e9edf6' }}>{def.name}</span>
              </>}
              {stolen && <span className="font-disp text-[9px]" style={{ color: '#ff8a8a' }}>✕</span>}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] font-bold mb-2 text-center" style={{ color: '#8ee06e' }}>Найдено: {found} / {loot.length} предметов</div>
      <button className="btn btn-amber w-full" onPointerDown={finish}>Забрать найденное и уйти</button>
    </Shell>
  );
}

// ==================== УБОРКА ====================
function CleanGame({ game, data }: { game: Game; data: Record<string, unknown> }) {
  const where = data.where as 'apt' | 'park';
  const aptId = data.aptId as string | undefined;
  const timeMax = 22000;
  const spots = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i, x: 6 + Math.random() * 84, y: 8 + Math.random() * 78, s: 18 + Math.random() * 22,
  })), []);
  const [gone, setGone] = useState<number[]>([]);
  const [left, setLeft] = useState(timeMax);
  const done = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => setLeft(l => Math.max(0, l - 100)), 100);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (left <= 0 && !done.current) { done.current = true; game.cleanResult(false, where, aptId); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  const click = (id: number) => {
    if (done.current || gone.includes(id)) return;
    sfx.click();
    const g = [...gone, id];
    setGone(g);
    if (g.length >= spots.length) { done.current = true; setTimeout(() => game.cleanResult(true, where, aptId), 250); }
  };
  return (
    <Shell title={where === 'apt' ? 'Генеральная уборка' : 'Уборка парка'} sub="Оттирайте всю грязь, пока не вышло время!" timer={left} timerMax={timeMax}>
      <div className="relative rounded-lg overflow-hidden mb-3" style={{ height: 240, background: where === 'apt' ? 'linear-gradient(180deg,#8a7a62,#6e5f4b)' : 'linear-gradient(180deg,#5c8a4a,#4a7038)' }}>
        {spots.map(sp => !gone.includes(sp.id) && (
          <button key={sp.id} onPointerDown={() => click(sp.id)} className="absolute rounded-full transition-all hover:scale-110"
            style={{
              left: `${sp.x}%`, top: `${sp.y}%`, width: sp.s, height: sp.s * .7,
              background: where === 'apt' ? 'radial-gradient(circle,#4a3a28,#3a2c1e)' : 'radial-gradient(circle,#6e675e,#4a453e)',
              border: '2px solid rgba(0,0,0,.35)',
            }} />
        ))}
        <div className="absolute bottom-1.5 right-2 font-disp" style={{ fontSize: 11, color: '#ffffffcc' }}>{gone.length}/{spots.length}</div>
      </div>
    </Shell>
  );
}

// ==================== РЕМОНТ ====================
function RepairGame({ game, data }: { game: Game; data: Record<string, unknown> }) {
  const aptId = data.aptId as string;
  const apId = data.apId as string;
  const [stage, setStage] = useState(0);
  const [miss, setMiss] = useState(0);
  const [zone, setZone] = useState({ pos: 20 + Math.random() * 50, w: 20 });
  const posRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef(1);
  const done = useRef(false);
  const stageRef = useRef(0);
  const missRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      if (!done.current) {
        posRef.current += dirRef.current * 1.6;
        if (posRef.current > 100) { posRef.current = 100; dirRef.current = -1; }
        if (posRef.current < 0) { posRef.current = 0; dirRef.current = 1; }
        const knob = barRef.current?.querySelector('i');
        if (knob) (knob as HTMLElement).style.left = `${posRef.current}%`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const press = () => {
    if (done.current) return;
    const p = posRef.current;
    const hit = p >= zone.pos && p <= zone.pos + zone.w;
    if (hit) {
      sfx.quest();
      const ns = stage + 1;
      stageRef.current = ns;
      if (ns >= 3) { done.current = true; setTimeout(() => game.repairResult(true, aptId, apId), 250); return; }
      setStage(ns);
      setZone({ pos: 10 + Math.random() * 60, w: Math.max(12, 20 - ns * 3) });
    } else {
      sfx.fail();
      const nm = miss + 1;
      missRef.current = nm;
      if (nm >= 3) { done.current = true; setTimeout(() => game.repairResult(false, aptId, apId), 250); return; }
      setMiss(nm);
    }
  };
  useSpace(press);
  return (
    <Shell title="Ремонт техники" sub={`Этап ${stage + 1} из 3 — жмите ПРОБЕЛ или кнопку, когда маркер в зелёной зоне. Промахов: ${miss}/3`}>
      <div ref={barRef} className="relative h-10 rounded-lg mb-3 overflow-hidden" style={{ background: 'linear-gradient(90deg,#2c3550,#232c44)' }}>
        <div className="absolute top-0 h-full rounded" style={{ left: `${zone.pos}%`, width: `${zone.w}%`, background: 'rgba(142,224,110,.4)', border: '1px solid #8ee06e' }} />
        <i className="absolute top-0 h-full w-1" style={{ background: '#ffb52e', left: '0%', boxShadow: '0 0 8px #ffb52e' }} />
      </div>
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2].map(i => <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i < stage ? '#8ee06e' : '#2c3550' }} />)}
      </div>
      <button className="btn btn-amber w-full py-5" onPointerDown={press} style={{ fontSize: 'clamp(16px,3.5vw,22px)' }}>ЗАКРЕПИТЬ ДЕТАЛЬ</button>
    </Shell>
  );
}

// ==================== РЫБАЛКА ====================
function FishGame({ game }: { game: Game }) {
  const [round, setRound] = useState(0);
  const [fish, setFish] = useState(0);
  const [zone, setZone] = useState({ pos: 30, w: 22 });
  const posRef = useRef(0);
  const dirRef = useRef(1.2);
  const barRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const fishRef = useRef(0);
  const roundRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      if (!done.current) {
        posRef.current += dirRef.current;
        if (posRef.current > 100) { posRef.current = 100; dirRef.current = -(1 + Math.random() * 1.6); }
        if (posRef.current < 0) { posRef.current = 0; dirRef.current = 1 + Math.random() * 1.6; }
        const knob = barRef.current?.querySelector('i');
        if (knob) (knob as HTMLElement).style.left = `${posRef.current}%`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const press = () => {
    if (done.current) return;
    const p = posRef.current;
    if (p >= zone.pos && p <= zone.pos + zone.w) { fishRef.current++; setFish(fishRef.current); sfx.quest(); }
    else sfx.fail();
    const nr = round + 1;
    roundRef.current = nr;
    if (nr >= 5) { done.current = true; setTimeout(() => game.fishResult(fishRef.current), 300); return; }
    setRound(nr);
    setZone({ pos: 5 + Math.random() * 65, w: Math.max(12, 22 - nr * 2) });
  };
  useSpace(press);
  return (
    <Shell title="Рыбалка на пруду" sub={`Попытка ${round + 1} из 5 — подсеките, когда поплавок в окне! Поймано: ${fish}`}>
      <div ref={barRef} className="relative h-12 rounded-lg mb-3 overflow-hidden" style={{ background: 'linear-gradient(180deg,#3e6a8a,#2a4a62)' }}>
        <div className="absolute top-0 h-full rounded" style={{ left: `${zone.pos}%`, width: `${zone.w}%`, background: 'rgba(255,211,77,.3)', border: '1px solid #ffd34d' }} />
        <i className="absolute top-1 h-8 w-1.5 rounded" style={{ background: '#ff5a5a', left: '0%' }} />
        <svg className="absolute bottom-1 right-2" width="26" height="16" viewBox="0 0 26 16"><path d="M2 8 Q12 0 20 8 Q12 16 2 8Z" fill="#c8d8e8" /><path d="M20 8l5-4v8z" fill="#c8d8e8" /><circle cx="7" cy="7" r="1.2" fill="#12141c" /></svg>
      </div>
      <button className="btn btn-teal w-full py-5" onPointerDown={press} style={{ fontSize: 'clamp(16px,3.5vw,22px)' }}>ПОДСЕЧЬ!</button>
    </Shell>
  );
}

// ==================== ЗАВОД: ПЕРЕНОСКА МЕТАЛЛА ====================
function CarryGame({ game, data }: { game: Game; data: Record<string, unknown> }) {
  const jobId = data.jobId as string;
  const total = (data.sheets as number) || 6;
  const timeMax = total * 6000;
  const [phase, setPhase] = useState<'pick' | 'carry'>('pick');
  const [delivered, setDelivered] = useState(0);
  const [left, setLeft] = useState(timeMax);
  const [canDrop, setCanDrop] = useState(false);
  const done = useRef(false);
  const delRef = useRef(0);
  useEffect(() => {
    const iv = setInterval(() => setLeft(l => Math.max(0, l - 100)), 100);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (left <= 0 && !done.current) { done.current = true; setTimeout(() => game.factoryJobResult(jobId, false), 200); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  const pick = () => {
    if (phase !== 'pick' || done.current) return;
    sfx.click();
    setPhase('carry');
    setCanDrop(false);
    setTimeout(() => setCanDrop(true), 620); // с грузом идём медленно
  };
  const drop = () => {
    if (phase !== 'carry' || !canDrop || done.current) return;
    sfx.coin();
    const nd = delRef.current + 1;
    delRef.current = nd;
    setDelivered(nd);
    setPhase('pick');
    if (nd >= total) { done.current = true; setTimeout(() => game.factoryJobResult(jobId, true), 300); }
  };
  return (
    <Shell title="Переноска металла" sub={`Лист ${Math.min(delivered + 1, total)} из ${total}. Возьмите лист — и к грузовику. С грузом идти тяжело!`} timer={left} timerMax={timeMax}>
      {/* цех */}
      <div className="relative rounded-lg overflow-hidden mb-3" style={{ height: 120, background: 'linear-gradient(180deg,#3a3f48,#2c3038)', border: '1px solid #4a505a' }}>
        {/* стопка */}
        <div className="absolute" style={{ left: '3%', bottom: 10, width: 64 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="mx-auto" style={{ width: 56 - i * 6, height: 7, marginTop: -2, background: i % 2 ? '#8a929e' : '#a8b0ba', border: '1px solid #1a1e26' }} />
          ))}
          <div className="font-disp text-center mt-1" style={{ fontSize: 8, color: '#8b97b8' }}>СТОПКА</div>
        </div>
        {/* грузовик */}
        <div className="absolute" style={{ right: '3%', bottom: 10, width: 84 }}>
          <svg width="84" height="44" viewBox="0 0 84 44">
            <rect x="2" y="8" width="52" height="24" fill="#5e6a72" stroke="#1a1e26" strokeWidth="2" />
            <rect x="54" y="16" width="22" height="16" fill="#8a4a3e" stroke="#1a1e26" strokeWidth="2" />
            <rect x="58" y="19" width="10" height="8" fill="#9ec8e8" />
            <circle cx="16" cy="36" r="6" fill="#1a1e26" /><circle cx="66" cy="36" r="6" fill="#1a1e26" />
          </svg>
          <div className="font-disp text-center" style={{ fontSize: 8, color: '#8b97b8' }}>ГРУЗОВИК</div>
        </div>
        {/* рабочий с листом */}
        <div className="absolute" style={{
          bottom: 12, left: phase === 'carry' ? '70%' : '8%', transition: 'left .58s cubic-bezier(.4,.1,.6,1)',
        }}>
          <svg width="26" height="40" viewBox="0 0 26 40">
            {phase === 'carry' && <rect x="1" y="2" width="24" height="6" fill="#a8b0ba" stroke="#1a1e26" strokeWidth="1.5" />}
            <circle cx="13" cy="10" r="5" fill="#e0c0a0" />
            <rect x="8" y="3" width="10" height="4" rx="2" fill="#ffd34d" />
            <rect x="7" y="15" width="12" height="14" rx="2" fill="#3e6ea2" />
            <rect x="8" y="29" width="4" height="10" fill="#2c2c38" /><rect x="14" y="29" width="4" height="10" fill="#2c2c38" />
          </svg>
        </div>
        {phase === 'carry' && !canDrop && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 font-disp blinker" style={{ fontSize: 11, color: '#ffd34d' }}>НЕСЁМ... ТЯЖЕЛО</div>
        )}
      </div>
      <div className="bar mb-3"><i style={{ width: `${(delivered / total) * 100}%`, background: 'linear-gradient(90deg,#5db8ff,#8ee06e)' }} /></div>
      <div className="flex gap-2">
        <button className="btn btn-amber flex-1 py-4" disabled={phase !== 'pick'} onPointerDown={pick} style={{ fontSize: 'clamp(14px,3vw,18px)' }}>ВЗЯТЬ ЛИСТ</button>
        <button className={`btn flex-1 py-4 ${canDrop ? 'btn-teal shake' : 'btn-ghost'}`} disabled={phase !== 'carry' || !canDrop} onPointerDown={drop} style={{ fontSize: 'clamp(14px,3vw,18px)' }}>В ГРУЗОВИК</button>
      </div>
      <p className="text-[10px] mt-2 text-center" style={{ color: '#8b97b8' }}>Перенесено: {delivered}/{total} · не успели до конца смены — бригадир не заплатит</p>
    </Shell>
  );
}

// ==================== ЗАВОД: РЕЗКА МЕТАЛЛА ====================
function CutGame({ game, data }: { game: Game; data: Record<string, unknown> }) {
  const jobId = data.jobId as string;
  const total = (data.sheets as number) || 5;
  const timeMax = total * 4500;
  const [cuts, setCuts] = useState(0);
  const [miss, setMiss] = useState(0);
  const [spark, setSpark] = useState(false);
  const [zone, setZone] = useState({ pos: 25 + Math.random() * 40, w: 16 });
  const [left, setLeft] = useState(timeMax);
  const posRef = useRef(0);
  const dirRef = useRef(1.7);
  const barRef = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  const cutsRef = useRef(0);
  const missRef = useRef(0);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      if (!done.current) {
        posRef.current += dirRef.current;
        if (posRef.current > 100) { posRef.current = 100; dirRef.current = -(1.4 + Math.random() * 1.4); }
        if (posRef.current < 0) { posRef.current = 0; dirRef.current = 1.4 + Math.random() * 1.4; }
        const knob = barRef.current?.querySelector('i');
        if (knob) (knob as HTMLElement).style.left = `${posRef.current}%`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const iv = setInterval(() => setLeft(l => Math.max(0, l - 100)), 100);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (left <= 0 && !done.current) { done.current = true; setTimeout(() => game.factoryJobResult(jobId, false), 200); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  const press = () => {
    if (done.current) return;
    const p = posRef.current;
    if (p >= zone.pos && p <= zone.pos + zone.w) {
      sfx.punch();
      setSpark(true); setTimeout(() => setSpark(false), 220);
      const nc = cutsRef.current + 1;
      cutsRef.current = nc;
      setCuts(nc);
      if (nc >= total) { done.current = true; setTimeout(() => game.factoryJobResult(jobId, true), 300); return; }
      setZone({ pos: 8 + Math.random() * 62, w: Math.max(10, 16 - nc) });
    } else {
      sfx.fail();
      const nm = missRef.current + 1;
      missRef.current = nm;
      setMiss(nm);
      if (nm >= 3) { done.current = true; setTimeout(() => game.factoryJobResult(jobId, false), 250); }
    }
  };
  useSpace(press);
  return (
    <Shell title="Резка металла" sub={`Рез ${Math.min(cuts + 1, total)} из ${total} — жмите, когда диск над линией реза! Промахов: ${miss}/3`} timer={left} timerMax={timeMax}>
      <div ref={barRef} className="relative h-12 rounded-lg mb-3 overflow-hidden" style={{ background: 'linear-gradient(180deg,#6e7278,#4a4e56)', border: '1px solid #3a3f48' }}>
        {/* линия реза */}
        <div className="absolute top-0 h-full rounded" style={{ left: `${zone.pos}%`, width: `${zone.w}%`, background: 'rgba(255,157,92,.35)', border: '1px dashed #ff9d5c' }} />
        {/* диск */}
        <i className="absolute top-0 h-full w-1" style={{ background: '#ff5a5a', left: '0%', boxShadow: '0 0 10px #ff5a5a' }} />
        {spark && (
          <span className="absolute top-0 h-full" style={{ left: `${zone.pos + zone.w / 2}%`, width: 26, marginLeft: -13, background: 'radial-gradient(circle, #ffe8a8, #ff9d5c 55%, transparent)', mixBlendMode: 'screen' }} />
        )}
      </div>
      <div className="flex gap-1.5 mb-3">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="h-2 flex-1 rounded-full" style={{ background: i < cuts ? '#ff9d5c' : '#2c3550' }} />
        ))}
      </div>
      <button className="btn btn-danger w-full py-5" onPointerDown={press} style={{ fontSize: 'clamp(16px,3.5vw,22px)' }}>РЕЗАТЬ! (ПРОБЕЛ)</button>
    </Shell>
  );
}

export function MinigameRenderer({ modal, game }: { modal: Modal; game: Game }) {
  if (modal.kind !== 'minigame') return null;
  const d = modal.data;
  switch (modal.game) {
    case 'qte': return <QteGame game={game} data={d} />;
    case 'dump': return <DumpGame game={game} data={d} />;
    case 'clean': return <CleanGame game={game} data={d} />;
    case 'repair': return <RepairGame game={game} data={d} />;
    case 'fish': return <FishGame game={game} />;
    case 'carry': return <CarryGame game={game} data={d} />;
    case 'cut': return <CutGame game={game} data={d} />;
    default: return null;
  }
}
