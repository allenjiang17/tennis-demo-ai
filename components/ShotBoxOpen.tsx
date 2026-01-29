import React, { useState } from 'react';
import { ShopItem } from '../types';

type ShotBoxOpenProps = {
  item: ShopItem;
  alreadyOwned: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

const ShotBoxOpen: React.FC<ShotBoxOpenProps> = ({ item, alreadyOwned, onConfirm, onBack }) => {
  const [opened, setOpened] = useState(false);
  const tierLabel = item.tier.toUpperCase();
  const tierStyle = item.tier === 'special'
    ? 'border-purple-300/70 bg-[linear-gradient(135deg,rgba(196,181,253,0.28),rgba(168,85,247,0.16),rgba(76,29,149,0.26))] shadow-[inset_0_0_0_1px_rgba(196,181,253,0.35),inset_0_0_22px_rgba(168,85,247,0.25)] text-purple-200'
    : item.tier === 'elite'
      ? 'border-sky-400/60 bg-sky-500/10 text-sky-200'
      : item.tier === 'pro'
        ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
        : 'border-slate-400/50 bg-slate-500/10 text-slate-200';

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
      <div className="relative z-10 h-full max-w-4xl mx-auto px-8 py-12 flex flex-col items-center justify-center">
        <div className="w-full flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
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
          {!opened ? (
            <>
              <div className="w-52 h-52 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.45)] flex items-center justify-center">
                <div className="text-xs font-orbitron uppercase tracking-widest text-slate-300">Mystery Box</div>
              </div>
              <button
                type="button"
                onClick={() => setOpened(true)}
                className="mt-8 px-6 py-3 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
              >
                Open Box
              </button>
            </>
          ) : (
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
                {alreadyOwned ? 'Duplicate Found' : 'New Shot Unlocked'}
              </div>
              <div className="mt-4 text-2xl font-orbitron uppercase tracking-widest">{item.player}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">{item.shot}</div>
              <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${tierStyle}`}>
                <span className="text-[10px] font-orbitron uppercase tracking-widest">{tierLabel}</span>
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-300">
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
              {item.perk && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-widest text-purple-200">
                  Perk: {item.perk}
                </div>
              )}
              <button
                type="button"
                onClick={onConfirm}
                className="mt-6 px-6 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/90 hover:bg-white/20 transition-all"
              >
                Add To Collection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShotBoxOpen;
