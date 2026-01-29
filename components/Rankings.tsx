import React from 'react';
import { PlayerProfile } from '../types';
import { PORTRAITS } from '../data/portraits';

type RankingsProps = {
  players: PlayerProfile[];
  onBack: () => void;
};

const Rankings: React.FC<RankingsProps> = ({ players, onBack }) => {
  const sorted = [...players].sort((a, b) => {
    if (b.rankingPoints !== a.rankingPoints) return b.rankingPoints - a.rankingPoints;
    return a.name.localeCompare(b.name);
  });
  const getPortraitSrc = (portraitId?: string) =>
    PORTRAITS.find(p => p.id === portraitId)?.src || '';

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
      <div className="relative z-10 max-w-5xl mx-auto px-8 py-12 pb-20 min-h-full">
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

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
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
                return (
                  <tr
                    key={player.id}
                    className={`border-t border-white/5 ${
                      player.id === 'player' ? 'bg-emerald-500/10 text-emerald-200' : 'text-slate-200'
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
      </div>
    </div>
  );
};

export default Rankings;
