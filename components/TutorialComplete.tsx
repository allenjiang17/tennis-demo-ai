import React from 'react';

type TutorialCompleteProps = {
  onFinish: () => void;
};

const TutorialComplete: React.FC<TutorialCompleteProps> = ({ onFinish }) => (
  <div className="h-screen w-screen text-white font-inter">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div className="relative z-10 h-full flex items-center justify-center px-8">
      <div className="max-w-2xl rounded-3xl border border-white/20 bg-black/70 p-10 shadow-[0_0_32px_rgba(15,23,42,0.85)] text-center">
        <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-300">
          Tutorial Complete
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-orbitron font-black uppercase tracking-[0.25em]">
          You&apos;re Ready To Start!
        </h1>
        <p className="mt-6 text-sm md:text-base text-slate-300 leading-relaxed">
          Step into the season, collect better shots, and chase the rankings.
        </p>
        <button
          type="button"
          onClick={onFinish}
          className="mt-8 px-8 py-3 rounded-full text-[11px] font-orbitron uppercase tracking-widest border border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
        >
          Go To Menu
        </button>
      </div>
    </div>
  </div>
);

export default TutorialComplete;
