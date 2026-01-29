import React, { useState } from 'react';
import { Loadout, PlayerStats, ShopItem, ShotType, ShotStats, AthleticismStats, VolleyStats } from '../types';

type ShopProps = {
  items: ShopItem[];
  wallet: number;
  ownedIds: Set<string>;
  loadout: Loadout;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem, slot: keyof Loadout) => void;
  onStart: () => void;
  onBack?: () => void;
  portraits?: { id: string; name: string; src: string }[];
  selectedPortraitId?: string;
  onSelectPortrait?: (id: string) => void;
  playerName?: string;
  onPlayerNameChange?: (name: string) => void;
};

const typeLabel: Record<ShotType, string> = {
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
  elite: {
    bg: 'bg-sky-500/15',
    border: 'border-sky-400/40',
    text: 'text-sky-300',
  },
  special: {
    bg: 'bg-[linear-gradient(135deg,rgba(196,181,253,0.28),rgba(168,85,247,0.16),rgba(76,29,149,0.26))] shadow-[inset_0_0_0_1px_rgba(196,181,253,0.35),inset_0_0_22px_rgba(168,85,247,0.25)]',
    border: 'border-purple-300/70',
    text: 'text-purple-300',
  },
};

const buildStats = (items: ShopItem[], loadout: Loadout): PlayerStats => {
  const byId = new Map(items.map(item => [item.id, item.stats]));
  const serveFirst = byId.get(loadout.serveFirst);
  const serveSecond = byId.get(loadout.serveSecond);
  const forehand = byId.get(loadout.forehand);
  const backhand = byId.get(loadout.backhand);
  const volley = byId.get(loadout.volley);
  const athleticism = byId.get(loadout.athleticism);
  if (!serveFirst || !serveSecond || !forehand || !backhand || !volley || !athleticism) {
    return {
      serveFirst: { power: 50, spin: 50, control: 50, shape: 50 },
      serveSecond: { power: 50, spin: 50, control: 50, shape: 50 },
      forehand: { power: 50, spin: 50, control: 50, shape: 50 },
      backhand: { power: 50, spin: 50, control: 50, shape: 50 },
      volley: { control: 50, accuracy: 50 },
      athleticism: { speed: 50, stamina: 50 },
    };
  }
  return {
    serveFirst: serveFirst as ShotStats,
    serveSecond: serveSecond as ShotStats,
    forehand: forehand as ShotStats,
    backhand: backhand as ShotStats,
    volley: volley as VolleyStats,
    athleticism: athleticism as AthleticismStats,
  };
};

const Shop: React.FC<ShopProps> = ({
  items,
  wallet,
  ownedIds,
  loadout,
  onBuy,
  onEquip,
  onStart,
  onBack,
  portraits,
  selectedPortraitId,
  onSelectPortrait,
  playerName,
  onPlayerNameChange,
}) => {
  const stats = buildStats(items, loadout);
  const [showPortraits, setShowPortraits] = useState(false);
  const selectedPortrait = portraits?.find(portrait => portrait.id === selectedPortraitId);
  const itemsByType: Record<ShotType, ShopItem[]> = {
    serve: items.filter(item => item.shot === 'serve'),
    forehand: items.filter(item => item.shot === 'forehand'),
    backhand: items.filter(item => item.shot === 'backhand'),
    volley: items.filter(item => item.shot === 'volley'),
    athleticism: items.filter(item => item.shot === 'athleticism'),
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
      <style>{`
        @keyframes subtleGlow {
          0%, 100% {
            box-shadow: inset 0 0 0 1px rgba(196,181,253,0.32), inset 0 0 18px rgba(168,85,247,0.2);
          }
          50% {
            box-shadow: inset 0 0 0 1px rgba(196,181,253,0.4), inset 0 0 24px rgba(168,85,247,0.28);
          }
        }
      `}</style>
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-10 pb-20 min-h-full">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
            <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
              Player Page
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
              >
                Back To Menu
              </button>
            )}
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-right">
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
                Credits
              </div>
              <div className="text-2xl font-orbitron font-bold">{wallet}</div>
            </div>
          </div>
        </div>

        {portraits && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
                  Player Portrait
                </div>
                <div className="mt-2 text-lg font-orbitron uppercase tracking-widest">Profile</div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowPortraits(prev => !prev)}
                className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-black/30"
              >
                {selectedPortrait ? (
                  <img src={selectedPortrait.src} alt={selectedPortrait.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] uppercase tracking-widest text-slate-400">
                    Select
                  </div>
                )}
              </button>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Name</div>
                <input
                  value={playerName || ''}
                  onChange={event => onPlayerNameChange?.(event.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-orbitron uppercase tracking-widest text-white/90 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60"
                />
              </div>
            </div>
            {showPortraits && (
              <>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {portraits.map(portrait => (
                    <button
                      key={portrait.id}
                      type="button"
                      onClick={() => {
                        onSelectPortrait?.(portrait.id);
                        setShowPortraits(false);
                      }}
                      className={`rounded-2xl border p-2 transition-all ${
                        portrait.id === selectedPortraitId
                          ? 'border-emerald-400/70 bg-emerald-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-black/30">
                        <img src={portrait.src} alt={portrait.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="mt-2 text-[9px] font-orbitron uppercase tracking-widest text-slate-300">
                        {portrait.name}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-[9px] uppercase tracking-widest text-slate-500">
                  Drop generated portraits into `public/portraits/` with the matching filenames.
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-8">
            {(Object.keys(itemsByType) as ShotType[]).map(shotType => (
              <section key={shotType}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-orbitron uppercase tracking-widest">
                    {typeLabel[shotType]}
                  </h2>
                  <span className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
                    {shotType === 'serve'
                      ? `1st: ${items.find(item => item.id === loadout.serveFirst)?.player || 'None'} • 2nd: ${items.find(item => item.id === loadout.serveSecond)?.player || 'None'}`
                      : `Equipped: ${items.find(item => item.id === loadout[shotType])?.player || 'None'}`}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {itemsByType[shotType].map(item => {
                    const owned = ownedIds.has(item.id);
                    const equipped =
                      shotType === 'serve'
                        ? loadout.serveFirst === item.id || loadout.serveSecond === item.id
                        : loadout[shotType] === item.id;
                    const tierStyle = tierStyles[item.tier];
                    const tierGlowStyle = item.tier === 'special'
                      ? { animation: 'subtleGlow 6s ease-in-out infinite' }
                      : undefined;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-5 py-4 transition-all ${tierStyle.bg} ${tierStyle.border} ${
                          equipped ? 'ring-2 ring-emerald-400/60' : ''
                        }`}
                        style={tierGlowStyle}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-orbitron uppercase tracking-widest">
                              {item.player}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-400">
                              {typeLabel[item.shot]}
                            </div>
                            <div className={`mt-2 text-[9px] font-orbitron uppercase tracking-[0.25em] ${tierStyle.text}`}>
                              {item.tier}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400">
                              Price
                            </div>
                            <div className="text-sm font-orbitron">{item.price}</div>
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
                        {item.shot !== 'serve' && item.shot !== 'athleticism' && item.shot !== 'volley' && (
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
                        {item.perk && (
                          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-widest text-purple-200">
                            Perk: {item.perk}
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
                          ) : shotType === 'serve' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onEquip(item, 'serveFirst')}
                                className={`px-3 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                                  loadout.serveFirst === item.id
                                    ? 'border-emerald-300/70 text-emerald-200'
                                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                {loadout.serveFirst === item.id ? '1st Equipped' : 'Equip 1st'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onEquip(item, 'serveSecond')}
                                className={`px-3 py-1 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                                  loadout.serveSecond === item.id
                                    ? 'border-emerald-300/70 text-emerald-200'
                                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                                }`}
                              >
                                {loadout.serveSecond === item.id ? '2nd Equipped' : 'Equip 2nd'}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onEquip(item, shotType)}
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
                  1st Serve: {items.find(item => item.id === loadout.serveFirst)?.player || 'None'}
                </div>
                <div>
                  2nd Serve: {items.find(item => item.id === loadout.serveSecond)?.player || 'None'}
                </div>
                <div>
                  Forehand: {items.find(item => item.id === loadout.forehand)?.player || 'None'}
                </div>
                <div>
                  Backhand: {items.find(item => item.id === loadout.backhand)?.player || 'None'}
                </div>
                <div>
                  Volley: {items.find(item => item.id === loadout.volley)?.player || 'None'}
                </div>
                <div>
                  Athleticism: {items.find(item => item.id === loadout.athleticism)?.player || 'None'}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  1st PWR {stats.serveFirst.power}
                </div>
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  FH CTR {stats.forehand.control}
                </div>
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  BH CTR {stats.backhand.control}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  SPD {stats.athleticism.speed}
                </div>
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  STM {stats.athleticism.stamina}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  VL CTR {stats.volley.control}
                </div>
                <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                  VL ACC {stats.volley.accuracy}
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
