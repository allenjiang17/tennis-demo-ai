import React from 'react';
import { ShotType } from '../types';

type ShotShopProps = {
  wallet: number;
  boxPrices: Record<ShotType, number>;
  ownedCounts: Record<ShotType, number>;
  onBuyBox: (shot: ShotType) => void;
  onBack: () => void;
  onPlayerPage: () => void;
};

const shotLabels: Record<ShotType, string> = {
  serve: 'Serve',
  forehand: 'Forehand',
  backhand: 'Backhand',
  volley: 'Volley',
  athleticism: 'Athleticism',
};

const ShotShop: React.FC<ShotShopProps> = ({
  wallet,
  boxPrices,
  ownedCounts,
  onBuyBox,
  onBack,
  onPlayerPage,
}) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 pb-20 min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
          <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
            Shot Shop
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPlayerPage}
            className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            Player Page
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            Back To Menu
          </button>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-right">
            <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
              Credits
            </div>
            <div className="text-2xl font-orbitron font-bold">{wallet}</div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-[10px] uppercase tracking-widest text-slate-300">
        Odds per card: Amateur 40% • Pro 30% • Legendary 20% • Elite 8% • Unique 2%
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(boxPrices) as ShotType[]).map(shotType => {
          const price = boxPrices[shotType];
          const canAfford = wallet >= price;
          return (
            <div key={shotType} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
          <div className="text-lg font-orbitron uppercase tracking-widest">{shotLabels[shotType]} Mystery Card</div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                    Owned: {ownedCounts[shotType] || 0}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">Cost</div>
                  <div className="text-lg font-orbitron">{price}</div>
                </div>
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-400">
                Reveal a random {shotLabels[shotType].toLowerCase()}.
              </div>
              <button
                type="button"
                onClick={() => onBuyBox(shotType)}
                disabled={!canAfford}
                className={`mt-5 w-full px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                  canAfford
                    ? 'border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'border-white/10 text-white/30 bg-white/5 cursor-not-allowed'
                }`}
              >
                Buy Mystery Card
              </button>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default ShotShop;
