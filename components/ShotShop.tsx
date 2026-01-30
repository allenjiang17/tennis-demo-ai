import React from 'react';
import { AthleticismStats, ShopItem, ShotStats, ShotType, VolleyStats } from '../types';

type ShotShopProps = {
  wallet: number;
  boxPrices: Record<ShotType, number>;
  ownedCounts: Record<ShotType, number>;
  stockItems: ShopItem[];
  ownedIds: Set<string>;
  matchesUntilRefresh: number;
  onBuyStockItem: (item: ShopItem) => void;
  onBuyBox: (shot: ShotType, premium?: boolean) => void;
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

const tierStyles: Record<ShopItem['tier'], { bg: string; border: string; text: string }> = {
  amateur: {
    bg: 'bg-slate-500/15',
    border: 'border-slate-400/40',
    text: 'text-slate-300',
  },
  pro: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-400/40',
    text: 'text-emerald-300',
  },
  legendary: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-300/50',
    text: 'text-purple-200',
  },
  elite: {
    bg: 'bg-sky-500/15',
    border: 'border-sky-400/40',
    text: 'text-sky-300',
  },
  unique: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-300/60',
    text: 'text-yellow-200',
  },
};

const ShotShop: React.FC<ShotShopProps> = ({
  wallet,
  boxPrices,
  ownedCounts,
  stockItems,
  ownedIds,
  matchesUntilRefresh,
  onBuyStockItem,
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

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-orbitron uppercase tracking-widest">
            Daily Shop
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">
            Refreshes in {matchesUntilRefresh} match{matchesUntilRefresh === 1 ? '' : 'es'}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {stockItems.map(item => {
            const tierStyle = tierStyles[item.tier];
            const owned = ownedIds.has(item.id);
            const canAfford = wallet >= item.price && !owned;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border px-5 py-4 ${tierStyle.bg} ${tierStyle.border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-orbitron uppercase tracking-widest">{item.player}</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400">{shotLabels[item.shot]}</div>
                    <div className={`mt-2 text-[9px] font-orbitron uppercase tracking-[0.25em] ${tierStyle.text}`}>
                      {item.tier}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400">Price</div>
                    <div className="text-lg font-orbitron">{item.price}</div>
                  </div>
                </div>
                {item.shot === 'athleticism' ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                    <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                      SPD {(item.stats as AthleticismStats).speed}
                    </div>
                    <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                      STM {(item.stats as AthleticismStats).stamina}
                    </div>
                  </div>
                ) : item.shot === 'volley' ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                    <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                      CTR {(item.stats as VolleyStats).control}
                    </div>
                    <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                      ACC {(item.stats as VolleyStats).accuracy}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                    <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                      PWR {(item.stats as ShotStats).power}
                    </div>
                    <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                      SPN {(item.stats as ShotStats).spin}
                    </div>
                    <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                      CTR {(item.stats as ShotStats).control}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onBuyStockItem(item)}
                  disabled={!canAfford}
                  className={`mt-5 w-full px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                    owned
                      ? 'border-white/10 text-white/40 bg-white/5 cursor-not-allowed'
                      : canAfford
                        ? `${tierStyle.border} ${tierStyle.text} bg-black/20 hover:bg-black/10`
                        : 'border-white/10 text-white/30 bg-white/5 cursor-not-allowed'
                  }`}
                >
                  {owned ? 'Owned' : 'Buy Now'}
                </button>
              </div>
            );
          })}
          {stockItems.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] uppercase tracking-widest text-slate-400">
              Stock is loading. Play matches to refresh.
            </div>
          )}
        </div>
        <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-500">
          Unique cards only appear in mystery draws.
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
        <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
          Mystery Draw
        </div>
        <div className="mt-3 space-y-2 text-[10px] uppercase tracking-widest text-slate-300">
          <div>Standard odds: Amateur 40% • Pro 30% • Elite 20% • Legendary 8% • Unique 2%</div>
          <div className="text-purple-200">Premium odds: Pro 40% • Elite 30% • Legendary 20% • Unique 10%</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(boxPrices) as ShotType[]).map(shotType => {
          const price = boxPrices[shotType];
          const premiumPrice = price * 2;
          const canAfford = wallet >= price;
          const canAffordPremium = wallet >= premiumPrice;
          return (
            <div key={shotType} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
          <div className="text-lg font-orbitron uppercase tracking-widest">{shotLabels[shotType]} Mystery Card</div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                    Owned: {ownedCounts[shotType] || 0}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-400">
                Reveal a random {shotLabels[shotType].toLowerCase()}.
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onBuyBox(shotType)}
                  disabled={!canAfford}
                  className={`w-full px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                    canAfford
                      ? 'border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20'
                      : 'border-white/10 text-white/30 bg-white/5 cursor-not-allowed'
                  }`}
                >
                  Buy Standard ({price} credits)
                </button>
                <button
                  type="button"
                  onClick={() => onBuyBox(shotType, true)}
                  disabled={!canAffordPremium}
                  className={`w-full px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                    canAffordPremium
                      ? 'border-purple-300/70 text-purple-200 bg-purple-500/10 hover:bg-purple-500/20'
                      : 'border-white/10 text-white/30 bg-white/5 cursor-not-allowed'
                  }`}
                >
                  Buy Premium ({premiumPrice} credits)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default ShotShop;
