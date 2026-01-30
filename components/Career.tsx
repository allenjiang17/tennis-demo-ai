import React, { useMemo } from 'react';
import { CourtSurface } from '../types';

type TournamentCategory = 'itf' | 'pro' | 'elite' | 'grand-slam';
type RankingGate = { maxRank: number; minPoints?: number };

type CareerTournament = {
  id: string;
  name: string;
  tier: 'amateur' | 'pro' | 'elite';
  category: TournamentCategory;
  description: string;
  prizes: number[];
  championBonus: number;
  image?: string;
  surface: CourtSurface;
  rankingPoints: number[];
  rankingGate: RankingGate;
  block: number;
};

type CareerProps = {
  tournaments: CareerTournament[];
  currentBlock: number;
  playerRank: number;
  playerPoints: number;
  playerTournamentWins: Record<string, number>;
  onEnterTournament: (tournamentId: string) => void;
  onSkipBlock: () => void;
  onBack: () => void;
};

const categoryStyles: Record<TournamentCategory, { bg: string; text: string; border: string }> = {
  itf: { bg: 'bg-slate-500/15', text: 'text-slate-200', border: 'border-slate-400/40' },
  pro: { bg: 'bg-emerald-500/15', text: 'text-emerald-200', border: 'border-emerald-400/40' },
  elite: { bg: 'bg-sky-500/15', text: 'text-sky-200', border: 'border-sky-400/40' },
  'grand-slam': { bg: 'bg-amber-500/15', text: 'text-amber-200', border: 'border-amber-300/50' },
};

const formatRound = (round: number) => {
  if (round === 1) return 'Round of 16';
  if (round === 2) return 'Quarterfinals';
  if (round === 3) return 'Semifinals';
  return 'Final';
};

const Career: React.FC<CareerProps> = ({
  tournaments,
  currentBlock,
  playerRank,
  playerPoints,
  playerTournamentWins,
  onEnterTournament,
  onSkipBlock,
  onBack,
}) => {
  const baseDate = useMemo(() => new Date(2026, 0, 5), []);
  const blockStart = useMemo(() => {
    const start = new Date(baseDate);
    start.setDate(start.getDate() + (currentBlock - 1) * 14);
    return start;
  }, [baseDate, currentBlock]);
  const blockEnd = useMemo(() => {
    const end = new Date(blockStart);
    end.setDate(end.getDate() + 13);
    return end;
  }, [blockStart]);
  const dateRange = `${blockStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${blockEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const blockTournaments = tournaments.filter(tournament => tournament.block === currentBlock);
  const isEligible = (tournament: CareerTournament) => {
    if (playerRank > tournament.rankingGate.maxRank) return false;
    if (tournament.rankingGate.minPoints !== undefined && playerPoints < tournament.rankingGate.minPoints) {
      return false;
    }
    return true;
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-10 pb-20 min-h-full">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">Neon Slam</h1>
            <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
              Career
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

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
                Block {currentBlock} of 26
              </div>
              <div className="mt-2 text-lg font-orbitron uppercase tracking-widest">
                {dateRange}
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">
                Your rank: #{playerRank} • {playerPoints} pts
              </div>
            </div>
            <button
              type="button"
              onClick={onSkipBlock}
              className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
            >
              Skip To Next Block
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {blockTournaments.map(tournament => {
            const style = categoryStyles[tournament.category];
            const eligible = isEligible(tournament);
            const wins = playerTournamentWins[tournament.id] ?? 0;
            return (
              <div
                key={tournament.id}
                className={`rounded-2xl border px-6 py-6 ${style.bg} ${style.border}`}
              >
                {tournament.image && (
                  <div className="mb-4 h-28 w-full overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <img
                      src={tournament.image}
                      alt={tournament.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className={`text-sm font-orbitron uppercase tracking-widest ${style.text}`}>
                  {tournament.name}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                  {tournament.description}
                </div>
                <div className="mt-4 space-y-2 text-[10px] uppercase tracking-widest text-slate-300">
                  {tournament.prizes.map((prize, index) => {
                    const isFinal = index === tournament.prizes.length - 1;
                    return (
                      <div
                        key={`${tournament.id}-${index}`}
                        className={`rounded-full px-3 py-1 ${isFinal ? `${style.bg} ${style.text} ${style.border} border` : 'bg-black/30'}`}
                      >
                        {formatRound(index + 1)} • {prize} credits
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-[9px] uppercase tracking-widest text-slate-400">
                  Surface: {tournament.surface} • {tournament.rankingGate.maxRank === Number.POSITIVE_INFINITY
                    ? 'Entry: Open'
                    : `Entry: Top ${tournament.rankingGate.maxRank}`}
                  {tournament.rankingGate.minPoints !== undefined
                    ? ` • ${tournament.rankingGate.minPoints}+ pts`
                    : ''}
                </div>
                <div className="mt-3 text-[9px] uppercase tracking-widest text-slate-300">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border ${style.bg} ${style.text} ${style.border}`}>
                    <span aria-hidden>🏆</span>
                    {wins > 0 ? `${wins}x Champion` : 'No titles yet'}
                  </span>
                </div>
                {!eligible && tournament.rankingGate.maxRank !== Number.POSITIVE_INFINITY && (
                  <div className="mt-2 text-[9px] uppercase tracking-widest text-rose-300">
                    Rank too low to enter
                  </div>
                )}
                <button
                  type="button"
                  disabled={!eligible}
                  onClick={() => onEnterTournament(tournament.id)}
                  className={`mt-5 w-full px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 transition-all ${
                    eligible
                      ? 'bg-white/10 text-white/90 hover:bg-white/20'
                      : 'bg-white/5 text-white/40 cursor-not-allowed'
                  }`}
                >
                  Enter Tournament
                </button>
              </div>
            );
          })}
          {blockTournaments.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 text-[10px] uppercase tracking-widest text-slate-400">
              No tournaments scheduled for this block.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Career;
