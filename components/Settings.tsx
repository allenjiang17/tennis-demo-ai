import React from 'react';

type SettingsProps = {
  aiDifficulty: 'easy' | 'medium' | 'hard';
  onAiDifficultyChange: (value: 'easy' | 'medium' | 'hard') => void;
  onBack: () => void;
  onViewTutorial: () => void;
  devUnlockAllUniques?: boolean;
  onDevUnlockAllUniquesChange?: (value: boolean) => void;
};

const Settings: React.FC<SettingsProps> = ({ aiDifficulty, onAiDifficultyChange, onBack, onViewTutorial, devUnlockAllUniques, onDevUnlockAllUniquesChange }) => {
  const handleReset = () => {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith('tennis.'))
      .forEach(key => window.localStorage.removeItem(key));
    window.location.reload();
  };
  const showDevTools = import.meta.env.DEV;

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
          AI Difficulty
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-500">
          Easy reduces AI stats by 30%. Hard increases AI stats by 15%.
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {(['easy', 'medium', 'hard'] as const).map(level => (
            <button
              key={level}
              type="button"
              onClick={() => onAiDifficultyChange(level)}
              className={`px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
                aiDifficulty === level
                  ? 'border-emerald-300/70 text-emerald-200 bg-emerald-500/10'
                  : 'border-white/20 text-white/70 bg-white/5 hover:bg-white/10'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
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

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
        <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
          Tutorial
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-500">
          Replay the onboarding tutorial and practice the basics.
        </div>
        <button
          type="button"
          onClick={onViewTutorial}
          className="mt-4 px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-emerald-300/60 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
        >
          View Tutorial
        </button>
      </div>

      {showDevTools && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
          <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
            Dev Tools
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-500">
            Enable all unique shots for quick testing.
          </div>
          <button
            type="button"
            onClick={() => onDevUnlockAllUniquesChange?.(!devUnlockAllUniques)}
            className={`mt-4 px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border transition-all ${
              devUnlockAllUniques
                ? 'border-emerald-300/70 text-emerald-200 bg-emerald-500/10'
                : 'border-white/20 text-white/70 bg-white/5 hover:bg-white/10'
            }`}
          >
            {devUnlockAllUniques ? 'Uniques Unlocked' : 'Unlock Uniques'}
          </button>
        </div>
      )}
    </div>
  </div>
  );
};

export default Settings;
