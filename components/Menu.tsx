import React from 'react';

type MenuProps = {
  onPlayerPage: () => void;
  onShotShop: () => void;
  onChallenge: () => void;
  onTournaments: () => void;
  onRankings: () => void;
  onSettings: () => void;
};

const Menu: React.FC<MenuProps> = ({ onPlayerPage, onShotShop, onChallenge, onTournaments, onRankings, onSettings }) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-5xl mx-auto px-8 py-16 min-h-full">
      <div className="text-center">
        <h1 className="text-5xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
      </div>
      

      <div className="mt-10 space-y-6">
        <button
          type="button"
          onClick={onTournaments}
          className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-0 text-left transition-all hover:scale-[1.01]"
        >
          <div className="flex flex-row items-stretch justify-between">
            <div className="max-w-lg px-12 py-10">
              <div className="mt-2 text-2xl font-orbitron uppercase tracking-widest text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.65)]">
                Tournaments
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-widest text-white/90 drop-shadow-[0_0_14px_rgba(255,255,255,0.5)]">
                Climb brackets and build your ranking points.
              </div>
            </div>
            <div className="relative h-full w-72 border-l border-white/10 bg-black/30 lg:w-96">
              <img
                src="/menu/tournaments.png"
                alt="Tournaments"
                className="h-full w-full object-cover object-[50%_30%] opacity-90 transition-opacity group-hover:opacity-100"
              />
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={onPlayerPage}
          className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-0 text-left transition-all hover:scale-[1.01]"
        >
          <div className="flex flex-row items-stretch justify-between">
            <div className="max-w-lg px-12 py-10">
              <div className="mt-2 text-2xl font-orbitron uppercase tracking-widest text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.65)]">
                Player Page
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-widest text-white/90 drop-shadow-[0_0_14px_rgba(255,255,255,0.5)]">
                Equip your signature shots and set your profile.
              </div>
            </div>
            <div className="relative h-full w-72 border-l border-white/10 bg-black/30 lg:w-96">
              <img
                src="/menu/player-page.png"
                alt="Player Page"
                className="h-full w-full object-cover object-[55%_30%] opacity-90 transition-opacity group-hover:opacity-100"
              />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onShotShop}
          className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-0 text-left transition-all hover:scale-[1.01]"
        >
          <div className="flex flex-row items-stretch justify-between">
            <div className="max-w-lg px-12 py-10">
              <div className="mt-2 text-2xl font-orbitron uppercase tracking-widest text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.65)]">
                Shot Shop
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-widest text-white/90 drop-shadow-[0_0_14px_rgba(255,255,255,0.5)]">
                Buy boxes, unlock rarity, and build your arsenal.
              </div>
            </div>
            <div className="relative h-full w-72 border-l border-white/10 bg-black/30 lg:w-96">
              <img
                src="/menu/shot-shop.png"
                alt="Shot Shop"
                className="h-full w-full object-cover object-[50%_45%] opacity-90 transition-opacity group-hover:opacity-100"
              />
            </div>
          </div>
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          type="button"
          onClick={onRankings}
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Rankings</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            View the full player leaderboard.
          </div>
        </button>
        <button
          type="button"
          onClick={onChallenge}
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Challenge Match</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            Play a single match against a chosen rival.
          </div>
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-left hover:bg-white/10 transition-all"
        >
          <div className="text-sm font-orbitron uppercase tracking-widest">Settings</div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
            Adjust options and preferences.
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default Menu;
