import React from 'react';
import { CourtSurface } from '../types';

type TournamentTier = 'amateur' | 'pro' | 'elite';
type TournamentDef = {
  id: string;
  name: string;
  tier: TournamentTier;
  description: string;
  prizes: number[];
  image?: string;
  surface: CourtSurface;
};

type TournamentMatch = {
  id: string;
  round: number;
  slot: number;
  player1: string | null;
  player2: string | null;
  player1Portrait?: string;
  player2Portrait?: string;
  winner: string | null;
};

type TournamentState = {
  id: string;
  name: string;
  tier: TournamentTier;
  prizes: number[];
  surface: CourtSurface;
  status: 'active' | 'eliminated' | 'champion';
  rounds: TournamentMatch[][];
};

type TournamentsProps = {
  tournaments: TournamentDef[];
  tournamentState: TournamentState | null;
  nextMatchId: string | null;
  onSelectTournament: (tournamentId: string) => void;
  onPlayMatch: (matchId: string) => void;
  onExitTournament: () => void;
  onBack: () => void;
};

const tierStyles: Record<TournamentTier, { bg: string; text: string; border: string }> = {
  amateur: { bg: 'bg-slate-500/15', text: 'text-slate-200', border: 'border-slate-400/40' },
  pro: { bg: 'bg-emerald-500/15', text: 'text-emerald-200', border: 'border-emerald-400/40' },
  elite: { bg: 'bg-sky-500/15', text: 'text-sky-200', border: 'border-sky-400/40' },
};

const formatRound = (round: number) => {
  if (round === 1) return 'Quarterfinals';
  if (round === 2) return 'Semifinals';
  return 'Final';
};

const tierOrder: TournamentTier[] = ['amateur', 'pro', 'elite'];
const tierMeta: Record<TournamentTier, { title: string; subtitle: string }> = {
  amateur: { title: 'Amateur Circuit', subtitle: 'ITF Futures & rising prospects' },
  pro: { title: 'Pro Series', subtitle: 'ATP 250–500 level events' },
  elite: { title: 'Elite Majors', subtitle: 'Masters 1000 & Grand Slams' },
};

const Tournaments: React.FC<TournamentsProps> = ({
  tournaments,
  tournamentState,
  nextMatchId,
  onSelectTournament,
  onPlayMatch,
  onExitTournament,
  onBack,
}) => (
  <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-y-auto">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
    <div className="relative z-10 max-w-6xl mx-auto px-8 py-10 pb-20 min-h-full">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-orbitron font-black tracking-[0.3em] italic">ACE MASTER</h1>
          <p className="text-xs font-orbitron uppercase tracking-widest text-slate-400 mt-2">
            Tournaments
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

      {!tournamentState ? (
        <div className="mt-10 space-y-10">
          {tierOrder.map(tier => {
            const tierTournaments = tournaments.filter(tournament => tournament.tier === tier);
            const meta = tierMeta[tier];
            return (
              <section key={tier} className="space-y-4">
                <div>
                  <div className="text-xl font-orbitron uppercase tracking-widest">{meta.title}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">{meta.subtitle}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {tierTournaments.map(tournament => {
                    const style = tierStyles[tournament.tier];
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
                          {tournament.prizes.map((prize, index) => (
                            <div key={`${tournament.id}-${index}`} className="bg-black/30 rounded-full px-3 py-1">
                              {formatRound(index + 1)} • {prize} credits
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectTournament(tournament.id)}
                          className="mt-5 w-full px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/90 hover:bg-white/20 transition-all"
                        >
                          Enter Tournament
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-orbitron uppercase tracking-widest">{tournamentState.name}</div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                  Tier: {tournamentState.tier} • Status: {tournamentState.status}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tournamentState.status === 'active' && nextMatchId && (
                  <button
                    type="button"
                    onClick={() => onPlayMatch(nextMatchId)}
                    className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white text-slate-900 hover:scale-[1.02] transition-transform"
                  >
                    Play Next Match
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExitTournament}
                  className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
                >
                  Leave Tournament
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tournamentState.rounds.map((round, roundIndex) => (
              <div key={`round-${roundIndex}`} className="space-y-3">
                <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
                  {formatRound(roundIndex + 1)}
                </div>
                {round.map(match => (
                  <div
                    key={match.id}
                    className={`rounded-2xl border px-4 py-3 text-[10px] uppercase tracking-widest ${
                      match.winner === 'You' ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {match.player1Portrait && (
                          <img
                            src={match.player1Portrait}
                            alt={match.player1 || 'Player'}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                        )}
                        {match.player1 || 'TBD'}
                      </span>
                      <span className="text-[9px] text-slate-400">vs</span>
                      <span className="flex items-center gap-2">
                        {match.player2Portrait && (
                          <img
                            src={match.player2Portrait}
                            alt={match.player2 || 'Player'}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                        )}
                        {match.player2 || 'TBD'}
                      </span>
                    </div>
                    <div className="mt-2 text-[9px] uppercase tracking-widest text-slate-400">
                      Winner: {match.winner || '—'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default Tournaments;
