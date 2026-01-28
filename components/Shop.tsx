import React from 'react';
import { Loadout, PlayerStats, ShopItem, ShotType } from '../types';

type ShopProps = {
  items: ShopItem[];
  wallet: number;
  ownedIds: Set<string>;
  loadout: Loadout;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
  onStart: () => void;
};

const typeLabel: Record<ShotType, string> = {
  serve: 'Serve',
  forehand: 'Forehand',
  backhand: 'Backhand',
};

const buildStats = (items: ShopItem[], loadout: Loadout): PlayerStats => {
  const byId = new Map(items.map(item => [item.id, item.stats]));
  const serve = byId.get(loadout.serve);
  const forehand = byId.get(loadout.forehand);
  const backhand = byId.get(loadout.backhand);
  if (!serve || !forehand || !backhand) {
    return {
      serve: { power: 50, spin: 50, control: 50 },
      forehand: { power: 50, spin: 50, control: 50 },
      backhand: { power: 50, spin: 50, control: 50 },
    };
  }
  return { serve, forehand, backhand };
};

const Shop: React.FC<ShopProps> = ({
  items,
  wallet,
  ownedIds,
  loadout,
  onBuy,
  onEquip,
  onStart,
}) => {
  const stats = buildStats(items, loadout);
  const itemsByType: Record<ShotType, ShopItem[]> = {
    serve: items.filter(item => item.shot === 'serve'),
    forehand: items.filter(item => item.shot === 'forehand'),
    backhand: items.filter(item => item.shot === 'backhand'),
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-10 pb-20 min-h-full">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
            <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
              Shot Shop
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-right">
            <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
              Credits
            </div>
            <div className="text-2xl font-orbitron font-bold">{wallet}</div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-8">
            {(Object.keys(itemsByType) as ShotType[]).map(shotType => (
              <section key={shotType}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-orbitron uppercase tracking-widest">
                    {typeLabel[shotType]}
                  </h2>
                  <span className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
                    Equipped: {items.find(item => item.id === loadout[shotType])?.player || 'None'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {itemsByType[shotType].map(item => {
                    const owned = ownedIds.has(item.id);
                    const equipped = loadout[shotType] === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-5 py-4 transition-all ${
                          equipped ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-orbitron uppercase tracking-widest">
                              {item.player}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400">
                              {typeLabel[item.shot]}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400">
                              Price
                            </div>
                            <div className="text-sm font-orbitron">{item.price}</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                          <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                            PWR {item.stats.power}
                          </div>
                          <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                            SPN {item.stats.spin}
                          </div>
                          <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                            CTR {item.stats.control}
                          </div>
                        </div>
                        {item.shot !== 'serve' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-slate-400">
                              <span>Safe</span>
                              <span>Aggressive</span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-300 to-red-500 relative">
                              <div
                                className="absolute -top-1 h-4 w-1 rounded-full bg-white shadow"
                                style={{ left: `${Math.max(0, Math.min(100, item.stats.shape))}%`, transform: 'translateX(-50%)' }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                          {!owned ? (
                            <button
                              type="button"
                              onClick={() => onBuy(item)}
                              className="px-3 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 hover:bg-white/20 transition-all"
                            >
                              Buy
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onEquip(item)}
                              className={`px-3 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                                equipped
                                  ? 'border-emerald-300/70 text-emerald-200'
                                  : 'border-white/20 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              {equipped ? 'Equipped' : 'Equip'}
                            </button>
                          )}
                          {owned && (
                            <span className="text-[10px] uppercase tracking-widest text-emerald-300/80">
                              Owned
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <h3 className="text-sm font-orbitron uppercase tracking-widest text-slate-300">
                Current Loadout
              </h3>
              <div className="mt-4 space-y-3 text-[10px] uppercase tracking-widest text-slate-400">
                <div>
                  Serve: {items.find(item => item.id === loadout.serve)?.player || 'None'}
                </div>
                <div>
                  Forehand: {items.find(item => item.id === loadout.forehand)?.player || 'None'}
                </div>
                <div>
                  Backhand: {items.find(item => item.id === loadout.backhand)?.player || 'None'}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  Serve PWR {stats.serve.power}
                </div>
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  FH CTR {stats.forehand.control}
                </div>
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  BH CTR {stats.backhand.control}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStart}
              className="w-full px-6 py-4 rounded-full text-sm font-orbitron uppercase tracking-widest border border-white/20 bg-white text-slate-900 hover:scale-[1.02] transition-transform"
            >
              Start Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
