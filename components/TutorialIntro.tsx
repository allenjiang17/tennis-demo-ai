import React from 'react';

type TutorialIntroProps = {
  onStart: () => void;
};

const TutorialIntro: React.FC<TutorialIntroProps> = ({ onStart }) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-hidden">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 h-full flex items-center justify-center px-8">
      <div className="max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl text-center">
        <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
          Tutorial
        </div>
        <h1 className="mt-4 text-4xl md:text-5xl font-orbitron font-black uppercase tracking-[0.25em]">
          Your Goal
        </h1>
        <p className="mt-6 text-sm md:text-base text-slate-300 leading-relaxed">
          Rise from the practice courts to become the greatest Grand Slam champion ever.
          Climb the rankings, unlock legendary shots, and dominate the tour.
        </p>
        <p className="mt-4 text-xs uppercase tracking-widest text-slate-400">
          Let&apos;s learn the basics.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-8 px-8 py-3 rounded-full text-[11px] font-orbitron uppercase tracking-widest border border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
        >
          Start Training
        </button>
      </div>
    </div>
  </div>
);

export default TutorialIntro;
