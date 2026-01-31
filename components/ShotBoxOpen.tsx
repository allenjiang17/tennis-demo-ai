import React, { useState } from 'react';
import { ShopItem } from '../types';

type ShotBoxOpenProps = {
  item: ShopItem;
  alreadyOwned: boolean;
  onBack: () => void;
  onEquip?: (item: ShopItem) => void;
};

const ShotBoxOpen: React.FC<ShotBoxOpenProps> = ({ item, alreadyOwned, onBack, onEquip }) => {
  const [opened, setOpened] = useState(false);
  const handleOpen = () => {
    if (opened) return;
    setOpened(true);
  };
  const tierLabel = item.tier.toUpperCase();
  const tierStyle = item.tier === 'unique'
    ? 'border-yellow-200/90 bg-[linear-gradient(135deg,rgb(232,210,128),rgb(214,176,24),rgb(120,70,6))] shadow-[0_0_160px_rgba(250,204,21,0.9),0_0_80px_rgba(255,220,120,0.65),inset_0_0_0_1px_rgba(255,245,210,0.35),inset_0_0_24px_rgba(250,204,21,0.4)] text-yellow-50'
    : item.tier === 'legendary'
      ? 'border-purple-300/80 bg-[linear-gradient(135deg,rgb(126,34,206),rgb(88,28,135),rgb(59,7,100))] shadow-[0_0_60px_rgba(192,132,252,0.6)] text-purple-50'
      : item.tier === 'elite'
        ? 'border-sky-300/70 bg-sky-500/25 shadow-[0_0_44px_rgba(56,189,248,0.45)] text-sky-100'
        : item.tier === 'pro'
          ? 'border-emerald-300/70 bg-[linear-gradient(135deg,rgb(55,110,92),rgb(32,78,65),rgb(14,54,44))] shadow-[0_0_32px_rgba(16,185,129,0.26)] text-emerald-100'
          : 'border-slate-400/50 bg-slate-500/20 text-slate-200';

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
      <style>{`
        .card-flip {
          transform-style: preserve-3d;
          transition: transform 0.8s ease-in-out;
          transform: rotateY(0deg);
          will-change: transform;
        }
        .card-flip.card-flip-open {
          transform: rotateY(180deg);
        }
      `}</style>
      <div className="relative z-10 h-full max-w-4xl mx-auto px-8 py-12 flex flex-col items-center justify-center">
        <div className="w-full flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-orbitron font-black tracking-[0.3em] italic">Neon Slam</h1>
            <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
              Shot Reveal
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            Back To Shop
          </button>
        </div>

        <div className="mt-12 flex flex-col items-center">
          <div className="relative flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div
                className={`relative w-64 h-80 transition-transform duration-500 ease-out ${
                  opened && item.tier === 'unique' ? '-translate-x-28' : 'translate-x-0'
                }`}
                style={{ perspective: '1200px' }}
              >
                <div className={`absolute inset-0 card-flip ${opened ? 'card-flip-open' : ''}`}>
                <div
                  className="absolute inset-0 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.45)] flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-xs font-orbitron uppercase tracking-widest text-slate-300">Mystery Card</div>
                </div>
                <div
                  className={`absolute inset-0 rounded-3xl border p-6 text-center ${tierStyle}`}
                  style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                >
                  <div className="text-[10px] font-orbitron uppercase tracking-widest text-amber-200/80">
                    {alreadyOwned ? 'Duplicate Found' : 'New Shot Unlocked'}
                  </div>
                  <div className="mt-4 text-2xl font-orbitron uppercase tracking-widest">{item.player}</div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-amber-200/70">{item.shot}</div>
                  <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${tierStyle}`}>
                    <span className="text-[10px] font-orbitron uppercase tracking-widest">{tierLabel}</span>
                  </div>
                  <div className="mt-4 text-[10px] uppercase tracking-widest text-amber-100/90">
                    {item.shot === 'volley' && (
                      <>CTR {(item.stats as any).control} • ACC {(item.stats as any).accuracy}</>
                    )}
                    {item.shot === 'athleticism' && (
                      <>SPD {(item.stats as any).speed} • STM {(item.stats as any).stamina}</>
                    )}
                    {item.shot !== 'volley' && item.shot !== 'athleticism' && (
                      <>PWR {(item.stats as any).power} • SPN {(item.stats as any).spin} • CTR {(item.stats as any).control}</>
                    )}
                  </div>
                  {item.description && (
                    <div className="mt-4 text-[11px] text-white/90">
                      {item.description}
                    </div>
                  )}
                  {item.perk && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-widest text-yellow-200">
                      Perk: {item.perk}
                    </div>
                  )}
                </div>
                </div>
              {item.tier === 'unique' && (
                <div
                  className={`absolute left-full top-0 ml-8 hidden md:block transition-all duration-[1400ms] ${
                    opened
                      ? 'opacity-100 scale-100 ease-out delay-[1300ms]'
                      : 'opacity-0 scale-95 ease-in'
                  }`}
                >
                  <div className={`absolute -inset-6 rounded-[32px] bg-yellow-400/50 blur-3xl transition-all duration-[1600ms] ${
                    opened ? 'opacity-100 scale-110 delay-[1300ms]' : 'opacity-0 scale-90'
                  }`} />
                  <div className="relative h-80 w-56 overflow-hidden rounded-2xl border border-yellow-200/40 bg-black/30 shadow-[0_0_50px_rgba(250,204,21,0.75)]">
                    <img
                      src={`${import.meta.env.BASE_URL}shots/${item.id}.png`}
                      alt="Unique shot"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
            {!opened && (
              <button
                type="button"
                onClick={handleOpen}
                className="mt-8 px-6 py-3 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
              >
                Flip Card
              </button>
            )}
          </div>

          {opened && (
            <div className="mt-6 flex flex-col items-center gap-3 text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
              <div>Added to collection.</div>
              {!alreadyOwned && onEquip && (
                <button
                  type="button"
                  onClick={() => onEquip(item)}
                  className="px-5 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                >
                  Equip Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShotBoxOpen;
