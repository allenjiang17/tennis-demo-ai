import React from 'react';
import { AthleticismStats, ShopItem, ShotStats, ShotType, VolleyStats } from '../types';

type ShotShopProps = {
  wallet: number;
  boxPrices: Record<'starter' | 'standard' | 'premium', number>;
  ownedCounts: Record<ShotType, number>;
  stockItems: ShopItem[];
  ownedIds: Set<string>;
  matchesUntilRefresh: number;
  onBuyStockItem: (item: ShopItem) => void;
  onBuyBox: (shot: ShotType, tier: 'starter' | 'standard' | 'premium') => void;
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
}) => {
  return (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 pb-20 min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">Neon Slam</h1>
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(shotLabels) as ShotType[]).map(shotType => {
          const starterPrice = boxPrices.starter;
          const standardPrice = boxPrices.standard;
          const premiumPrice = boxPrices.premium;
          const canAffordStarter = wallet >= starterPrice;
          const canAffordStandard = wallet >= standardPrice;
          const canAffordPremium = wallet >= premiumPrice;
          const tierCards = [
            {
              id: 'starter',
              label: 'Starter',
              price: starterPrice,
              canAfford: canAffordStarter,
              odds: 'Amateur 50% • Pro 40% • Elite 10%',
              tone: 'bg-slate-600/20 text-slate-300/70',
              glow: 'shadow-[0_0_30px_rgba(100,116,139,0.25)]',
            },
            {
              id: 'standard',
              label: 'Standard',
              price: standardPrice,
              canAfford: canAffordStandard,
              odds: 'Pro 50% • Elite 35% • Legendary 15% • Unique 5%',
              tone: 'bg-slate-200/20 text-slate-100/80',
              glow: 'shadow-[0_0_45px_rgba(203,213,225,0.45)]',
            },
            {
              id: 'premium',
              label: 'Premium',
              price: premiumPrice,
              canAfford: canAffordPremium,
              odds: 'Elite 55% • Legendary 35% • Unique 10%',
              tone: 'bg-amber-300/25 text-amber-100/80',
              glow: 'shadow-[0_0_50px_rgba(252,211,77,0.45)]',
            },
          ] as const;
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
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {tierCards.map((tier, index) => (
                  <div key={tier.id} className="flex flex-col items-center gap-3">
                    <div className={`mystery-card mystery-float-${index + 1} ${tier.tone} ${tier.glow}`}>
                      <div className="mystery-card-inner" />
                      <div className="mystery-card-emboss" />
                      <div className="mystery-card-mark">?</div>
                    </div>
                    <div className="text-xs font-orbitron uppercase tracking-widest text-white">
                      {tier.label}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400 text-center">
                      {tier.id === 'starter' && (
                        <>
                          <span className="text-slate-300">Amateur</span> 50% •{' '}
                          <span className="text-emerald-200/80">Pro</span> 40% •{' '}
                          <span className="text-sky-200/80">Elite</span> 10%
                        </>
                      )}
                      {tier.id === 'standard' && (
                        <>
                          <span className="text-emerald-200/80">Pro</span> 50% •{' '}
                          <span className="text-sky-200/80">Elite</span> 35% •{' '}
                          <span className="text-purple-200/70">Legendary</span> 15% •{' '}
                          <span className="text-yellow-200/70">Unique</span> 5%
                        </>
                      )}
                      {tier.id === 'premium' && (
                        <>
                          <span className="text-sky-200/80">Elite</span> 55% •{' '}
                          <span className="text-purple-200/70">Legendary</span> 35% •{' '}
                          <span className="text-yellow-200/70">Unique</span> 10%
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onBuyBox(shotType, tier.id)}
                      disabled={!tier.canAfford}
                      className={`w-full px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                        tier.canAfford
                          ? 'border-white/30 text-white bg-white/10 hover:bg-white/20'
                          : 'border-white/10 text-white/30 bg-white/5 cursor-not-allowed'
                      }`}
                    >
                      Buy
                    </button>
                    <div className="text-[9px] uppercase tracking-widest text-slate-400 text-center">
                      {tier.price} credits
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <style>{`
      .mystery-card {
        width: 120px;
        height: 170px;
        border-radius: 18px;
        border: 2px solid currentColor;
        position: relative;
        transform-style: preserve-3d;
        animation: floatCard 3.6s ease-in-out infinite;
      }
      .mystery-card-inner {
        position: absolute;
        inset: 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02));
      }
      .mystery-card-emboss {
        position: absolute;
        inset: 20px;
        border-radius: 12px;
        background:
          linear-gradient(140deg, rgba(255,255,255,0.28), rgba(255,255,255,0.03)),
          radial-gradient(circle at top left, rgba(255,255,255,0.3), transparent 55%);
        opacity: 0.45;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.35),
          inset 0 -2px 4px rgba(0,0,0,0.4);
      }
      .mystery-card-mark {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        font-family: 'Orbitron', sans-serif;
        font-size: 64px;
        font-weight: 900;
        color: transparent;
        background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.65));
        -webkit-background-clip: text;
        background-clip: text;
        text-shadow:
          0 2px 8px rgba(0,0,0,0.45),
          0 -1px 0 rgba(255,255,255,0.2);
        letter-spacing: 0.1em;
        filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35));
      }
      .mystery-float-1 { animation-delay: 0s; }
      .mystery-float-2 { animation-delay: 0.4s; }
      .mystery-float-3 { animation-delay: 0.8s; }
      @keyframes floatCard {
        0%, 100% { transform: translateY(0px) rotateX(2deg) rotateY(-2deg); }
        50% { transform: translateY(-5px) rotateX(-2deg) rotateY(2deg); }
      }
    `}</style>
  </div>
  );
};

export default ShotShop;
