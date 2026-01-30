import React, { useMemo } from 'react';
import { CourtSurface, PlayerProfile } from '../types';
import { PORTRAITS } from '../data/portraits';

type TournamentCategory = 'itf' | 'pro' | 'elite' | 'grand-slam';
type TournamentDef = {
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
  rankingGate: { maxRank: number; minPoints?: number };
  block: number;
};

type TournamentMatch = {
  id: string;
  round: number;
  slot: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
};

type TournamentState = {
  id: string;
  name: string;
  tier: 'amateur' | 'pro' | 'elite';
  category: TournamentCategory;
  prizes: number[];
  championBonus: number;
  surface: CourtSurface;
  status: 'active' | 'eliminated' | 'champion';
  rounds: TournamentMatch[][];
};

type TournamentsProps = {
  tournaments: TournamentDef[];
  tournamentState: TournamentState | null;
  nextMatchId: string | null;
  players: PlayerProfile[];
  playerTournamentWins: Record<string, number>;
  playerRank: number;
  playerPoints: number;
  onSelectTournament: (tournamentId: string) => void;
  onPlayMatch: (matchId: string) => void;
  onExitTournament: () => void;
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

const categoryOrder: TournamentCategory[] = ['grand-slam', 'elite', 'pro', 'itf'];
const categoryMeta: Record<TournamentCategory, { title: string; subtitle: string }> = {
  itf: { title: 'ITF Circuit', subtitle: 'Open entry events for rising prospects' },
  pro: { title: 'Pro Series', subtitle: 'ATP 250–500 level events' },
  elite: { title: 'Elite Masters', subtitle: 'Masters 1000 level events' },
  'grand-slam': { title: 'Grand Slams', subtitle: 'Top 8 entry only' },
};

const Tournaments: React.FC<TournamentsProps> = ({
  tournaments,
  tournamentState,
  nextMatchId,
  players,
  playerTournamentWins,
  playerRank,
  playerPoints,
  onSelectTournament,
  onPlayMatch,
  onExitTournament,
  onBack,
}) => {
  const playersById = new Map(players.map(player => [player.id, player]));
  const nextMatch = useMemo(() => (
    tournamentState && nextMatchId
      ? tournamentState.rounds.flat().find(match => match.id === nextMatchId) || null
      : null
  ), [nextMatchId, tournamentState]);
  const resolvePlayerId = (playerId: string | null) => {
    if (!playerId) return null;
    if (playersById.has(playerId)) return playerId;
    const matchByName = players.find(
      player => player.name.toLowerCase() === playerId.toLowerCase()
    );
    return matchByName?.id ?? null;
  };
  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return 'TBD';
    const resolvedId = resolvePlayerId(playerId);
    if (resolvedId) return playersById.get(resolvedId)?.name || playerId;
    return playerId;
  };
  const getPlayerPortrait = (playerId: string | null) => {
    if (!playerId) return '';
    const resolvedId = resolvePlayerId(playerId);
    const portraitId = resolvedId ? playersById.get(resolvedId)?.portraitId : undefined;
    return PORTRAITS.find(p => p.id === portraitId)?.src || '';
  };
  const isEligible = (tournament: TournamentDef) => {
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
              Tournaments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right">
              <div className="text-[9px] uppercase tracking-widest text-slate-400">Your Rank</div>
              <div className="text-sm font-orbitron font-bold">#{playerRank}</div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-all"
            >
              Back To Menu
            </button>
          </div>
        </div>

      {!tournamentState ? (
        <div className="mt-10 space-y-10">
          {categoryOrder.map(category => {
            const categoryTournaments = tournaments.filter(tournament => tournament.category === category);
            const meta = categoryMeta[category];
            return (
              <section key={category} className="space-y-4">
                <div>
                  <div className="text-xl font-orbitron uppercase tracking-widest">{meta.title}</div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">{meta.subtitle}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categoryTournaments.map(tournament => {
                    const style = categoryStyles[tournament.category];
                    const eligible = isEligible(tournament);
                    const wins = playerTournamentWins[tournament.id] ?? 0;
                    return (
                      <button
                        key={tournament.id}
                        type="button"
                        disabled={!eligible}
                        onClick={() => onSelectTournament(tournament.id)}
                        className={`rounded-2xl border px-6 py-6 text-left transition-all ${style.bg} ${style.border} ${
                          eligible ? 'hover:scale-[1.01] cursor-pointer' : 'opacity-70 cursor-not-allowed'
                        }`}
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
                        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-300">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border ${style.bg} ${style.text} ${style.border}`}>
                            <span aria-hidden>🏆</span>
                            {wins > 0 ? `${wins}x Champion` : 'No titles yet'}
                          </span>
                        </div>
                        <div className="mt-4 text-[9px] uppercase tracking-widest text-slate-400">
                          {tournament.rankingGate.maxRank === Number.POSITIVE_INFINITY
                            ? 'Entry: Open'
                            : `Entry: Top ${tournament.rankingGate.maxRank}`}
                          {tournament.rankingGate.minPoints !== undefined
                            ? ` • ${tournament.rankingGate.minPoints}+ pts`
                            : ''}
                        </div>
                        {!eligible && tournament.rankingGate.maxRank !== Number.POSITIVE_INFINITY && (
                          <div className="mt-2 text-[9px] uppercase tracking-widest text-rose-300">
                            Rank too low to enter
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {(() => {
            const roundOf16Complete = tournamentState.rounds[0]?.every(match => match.winnerId);
            const roundOffset = roundOf16Complete ? 1 : 0;
            const roundsToShow = tournamentState.rounds.slice(roundOffset);
            const gridColsClass = roundOf16Complete ? 'md:grid-cols-3' : 'md:grid-cols-4';
            return (
              <>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Tournament</div>
                <div className="mt-2 text-2xl font-orbitron font-black uppercase tracking-[0.2em] text-white">
                  {tournamentState.name}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                  {formatRound(nextMatch?.round ?? 1)} • {tournamentState.surface} • Champion Bonus {tournamentState.championBonus ?? 0}
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

          <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
            {roundsToShow.map((round, roundIndex) => (
              <div key={`round-${roundIndex + roundOffset}`} className="space-y-3">
                <div className="text-xs font-orbitron uppercase tracking-widest text-slate-400">
                  {formatRound(roundIndex + 1 + roundOffset)}
                </div>
                {round.map(match => (
                  <div
                    key={match.id}
                    className={`rounded-2xl border px-4 py-3 text-[10px] uppercase tracking-widest ${
                      match.winnerId === 'player' ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        {getPlayerPortrait(match.player1Id) && (
                          <img
                            src={getPlayerPortrait(match.player1Id)}
                            alt={getPlayerName(match.player1Id)}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                        )}
                        {getPlayerName(match.player1Id)}
                      </span>
                      <span className="text-[9px] text-slate-400">vs</span>
                      <span className="flex items-center gap-2">
                        {getPlayerPortrait(match.player2Id) && (
                          <img
                            src={getPlayerPortrait(match.player2Id)}
                            alt={getPlayerName(match.player2Id)}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                        )}
                        {getPlayerName(match.player2Id)}
                      </span>
                    </div>
                    <div className="mt-2 text-[9px] uppercase tracking-widest text-slate-400">
                      Winner: {match.winnerId ? getPlayerName(match.winnerId) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  </div>
);
}

export default Tournaments;
