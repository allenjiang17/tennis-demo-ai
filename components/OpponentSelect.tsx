import React from 'react';
import { AiProfile } from '../types';

type OpponentSelectProps = {
  profiles: AiProfile[];
  selectedId: string;
  difficulty: 'amateur' | 'pro' | 'elite';
  onDifficultyChange: (tier: 'amateur' | 'pro' | 'elite') => void;
  onSelect: (profile: AiProfile) => void;
  onBack: () => void;
};

const OpponentSelect: React.FC<OpponentSelectProps> = ({
  profiles,
  selectedId,
  difficulty,
  onDifficultyChange,
  onSelect,
  onBack,
}) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 pb-20 min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">Neon Slam</h1>
          <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
            Select Opponent
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

      <div className="mt-10 grid grid-cols-1 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">Difficulty Tier</div>
              <div className="mt-2 text-lg font-orbitron uppercase tracking-widest">Choose Your Challenge</div>
            </div>
            <div className="flex items-center gap-2">
              {(['amateur', 'pro', 'elite'] as const).map(tier => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onDifficultyChange(tier)}
                  className={`px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                    difficulty === tier
                      ? 'border-emerald-300/70 text-emerald-200 bg-emerald-500/10'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">
            AI loadouts will use {difficulty} tier shots and stats.
          </div>
        </div>

        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`rounded-2xl border px-6 py-5 transition-all ${
              selectedId === profile.id ? 'border-emerald-400/70 bg-emerald-500/10' : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-xl font-orbitron uppercase tracking-widest">{profile.name}</h2>
                <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">{profile.description}</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                  <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                    Away Bias {Math.round(profile.tendencies.awayBias * 100)}%
                  </div>
                  <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                    Net Push {Math.round((profile.tendencies.homeY / 90) * 100)}%
                  </div>
                  <div className="bg-black/30 rounded-full px-3 py-1 text-center">
                    Drop Shot {Math.round(profile.tendencies.dropShotChance * 100)}%
                  </div>
                </div>
                <div className="mt-4 text-[10px] uppercase tracking-widest text-slate-400">
                  Loadout: {profile.loadout.forehand}, {profile.loadout.backhand}, {profile.loadout.serveFirst}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelect(profile)}
                className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white text-slate-900 hover:scale-[1.02] transition-transform"
              >
                Choose
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default OpponentSelect;
