import React from 'react';

type MenuProps = {
  onPlayerPage: () => void;
  onShotShop: () => void;
  onChallenge: () => void;
  onTournaments: () => void;
  onRankings: () => void;
};

const Menu: React.FC<MenuProps> = ({ onPlayerPage, onShotShop, onChallenge, onTournaments, onRankings }) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-4xl mx-auto px-8 py-16 min-h-full flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
        <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-3">
          Main Menu
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-6 w-full justify-center">
        <button
          type="button"
          onClick={onPlayerPage}
          className="w-full md:w-[240px] rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Player Page</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            Equip the shots you own.
          </div>
        </button>
        <button
          type="button"
          onClick={onShotShop}
          className="w-full md:w-[240px] rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Shot Shop</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            Buy boxes and unlock new shots.
          </div>
        </button>
        <button
          type="button"
          onClick={onChallenge}
          className="w-full md:w-[240px] rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Challenge Match</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            Play a single match against a chosen rival.
          </div>
        </button>
        <button
          type="button"
          onClick={onTournaments}
          className="w-full md:w-[240px] rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Tournaments</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            Climb brackets and earn bigger prizes.
          </div>
        </button>
        <button
          type="button"
          onClick={onRankings}
          className="w-full md:w-[240px] rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Rankings</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            See the full player leaderboard.
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default Menu;
