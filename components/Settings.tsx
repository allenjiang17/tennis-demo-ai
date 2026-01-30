import React from 'react';

type SettingsProps = {
  onBack: () => void;
};

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const handleReset = () => {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith('tennis.'))
      .forEach(key => window.localStorage.removeItem(key));
    window.location.reload();
  };

  return (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-4xl mx-auto px-8 py-12 min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">Neon Slam</h1>
          <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
            Settings
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

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
        <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
          Reset Data
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-500">
          Clears all saved tennis data and restarts the game.
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-rose-300/60 text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 transition-all"
        >
          Reset Progress
        </button>
      </div>
    </div>
  </div>
  );
};

export default Settings;
