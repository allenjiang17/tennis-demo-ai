import React, { useMemo, useState } from 'react';
import { PlayerProfile, ShopItem } from '../types';
import { PORTRAITS } from '../data/portraits';
import { SHOP_ITEMS } from '../data/shopItems';

type RankingsProps = {
  players: PlayerProfile[];
  onBack: () => void;
};

const Rankings: React.FC<RankingsProps> = ({ players, onBack }) => {
  const sorted = [...players].sort((a, b) => {
    if (b.rankingPoints !== a.rankingPoints) return b.rankingPoints - a.rankingPoints;
    return a.name.localeCompare(b.name);
  });
  const [selectedId, setSelectedId] = useState<string>(sorted[0]?.id || 'player');
  const selectedPlayer = sorted.find(player => player.id === selectedId) || sorted[0];
  const getPortraitSrc = (portraitId?: string) =>
    PORTRAITS.find(p => p.id === portraitId)?.src || '';
  const itemById = useMemo(() => new Map(SHOP_ITEMS.map(item => [item.id, item])), []);
  const loadoutSlots = selectedPlayer
    ? [
        { label: '1st Serve', id: selectedPlayer.loadout.serveFirst },
        { label: '2nd Serve', id: selectedPlayer.loadout.serveSecond },
        { label: 'Forehand', id: selectedPlayer.loadout.forehand },
        { label: 'Backhand', id: selectedPlayer.loadout.backhand },
        { label: 'Volley', id: selectedPlayer.loadout.volley },
        { label: 'Athleticism', id: selectedPlayer.loadout.athleticism },
      ]
    : [];

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12 pb-20 min-h-full">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
            <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
              Rankings
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
          >
            Back To Menu
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-[11px] uppercase tracking-widest">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-orbitron">Rank</th>
                  <th className="px-6 py-4 font-orbitron">Player</th>
                  <th className="px-6 py-4 font-orbitron text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((player, index) => {
                  const portrait = getPortraitSrc(player.portraitId);
                  const isSelected = player.id === selectedId;
                  return (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedId(player.id)}
                      className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${
                        isSelected
                          ? 'bg-white/10 text-white'
                          : player.id === 'player'
                            ? 'bg-emerald-500/10 text-emerald-200'
                            : 'text-slate-200'
                      }`}
                    >
                      <td className="px-6 py-4 font-orbitron">#{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {portrait ? (
                            <img
                              src={portrait}
                              alt={player.name}
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                          )}
                          <span className="font-orbitron">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-orbitron text-right">{player.rankingPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedPlayer && (
            <aside className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 sticky top-6 h-fit">
              <div className="flex items-center justify-between">
                <div className="text-xs font-orbitron uppercase tracking-widest">{selectedPlayer.name} Loadout</div>
                <div className="text-[9px] uppercase tracking-widest text-slate-400">
                  Min Tier: {selectedPlayer.minShotTier}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 text-[10px] uppercase tracking-widest text-slate-300">
                {loadoutSlots.map(slot => {
                  const item = itemById.get(slot.id) as ShopItem | undefined;
                  const tierStyle = item?.tier === 'unique'
                    ? 'border-yellow-300/70 bg-[linear-gradient(135deg,rgba(253,230,138,0.28),rgba(250,204,21,0.2),rgba(161,98,7,0.35))] shadow-[inset_0_0_0_1px_rgba(254,243,199,0.4),inset_0_0_22px_rgba(250,204,21,0.25)]'
                    : item?.tier === 'elite'
                      ? 'border-sky-300/70 bg-sky-500/15'
                      : item?.tier === 'legendary'
                        ? 'border-purple-300/60 bg-purple-500/10'
                        : item?.tier === 'pro'
                          ? 'border-emerald-400/60 bg-emerald-500/10'
                          : 'border-slate-400/50 bg-slate-500/10';
                  return (
                    <div key={slot.label} className={`rounded-2xl border px-4 py-3 ${tierStyle}`}>
                      <div className="flex items-center justify-between">
                        <span>{slot.label}</span>
                        <span className="text-slate-400">{item?.player || 'Unknown'}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                        <span>{item?.id || slot.id}</span>
                        <span className="text-[8px] font-orbitron uppercase tracking-widest text-slate-300">
                          {item?.tier || 'amateur'}
                        </span>
                      </div>
                      {item?.shot === 'volley' ? (
                        <div className="mt-3 flex gap-2">
                          <span className="bg-black/40 rounded-full px-3 py-1">CTR {(item.stats as any).control}</span>
                          <span className="bg-black/40 rounded-full px-3 py-1">ACC {(item.stats as any).accuracy}</span>
                        </div>
                      ) : item?.shot === 'athleticism' ? (
                        <div className="mt-3 flex gap-2">
                          <span className="bg-black/40 rounded-full px-3 py-1">SPD {(item.stats as any).speed}</span>
                          <span className="bg-black/40 rounded-full px-3 py-1">STM {(item.stats as any).stamina}</span>
                        </div>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <span className="bg-black/40 rounded-full px-3 py-1">PWR {(item?.stats as any)?.power}</span>
                          <span className="bg-black/40 rounded-full px-3 py-1">SPN {(item?.stats as any)?.spin}</span>
                          <span className="bg-black/40 rounded-full px-3 py-1">CTR {(item?.stats as any)?.control}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rankings;
