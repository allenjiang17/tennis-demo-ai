import React from 'react';

type TournamentResultProps = {
  outcome: 'eliminated' | 'champion';
  tournamentName: string;
  earnings: number;
  onContinue: () => void;
};

const TournamentResult: React.FC<TournamentResultProps> = ({
  outcome,
  tournamentName,
  earnings,
  onContinue,
}) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-3xl mx-auto px-8 py-16 min-h-full flex flex-col items-center justify-center text-center">
      <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
        Tournament Result
      </div>
      <h1 className="mt-3 text-4xl font-orbitron font-black tracking-[0.2em] uppercase">
        {tournamentName}
      </h1>
      <div className="mt-6 text-2xl font-orbitron uppercase tracking-widest">
        {outcome === 'champion' ? 'Champion' : 'Eliminated'}
      </div>
      <div className="mt-4 text-[11px] uppercase tracking-widest text-slate-400">
        Earnings
      </div>
      <div className="mt-2 text-3xl font-orbitron font-bold text-emerald-300">
        {earnings} Credits
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-10 px-6 py-3 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white text-slate-900 hover:scale-[1.02] transition-transform"
      >
        Back To Tournaments
      </button>
    </div>
  </div>
);

export default TournamentResult;
