import React, { useMemo, useState } from 'react';
import Game from './Game';
import Shop from './components/Shop';
import OpponentSelect from './components/OpponentSelect';
import Menu from './components/Menu';
import Tournaments from './components/Tournaments';
import { AiProfile, Loadout, PlayerStats, ShopItem, ShotType } from './types';
import { SHOP_ITEMS } from './data/shopItems';
import { AI_PROFILES } from './data/aiProfiles';
import { PORTRAITS } from './data/portraits';

const DEFAULT_LOADOUT: Loadout = {
  serveFirst: 'amateur-serve-1',
  serveSecond: 'amateur-serve-1',
  forehand: 'amateur-forehand-1',
  backhand: 'amateur-backhand-1',
  volley: 'amateur-volley-1',
  athleticism: 'amateur-athleticism-1',
};

const buildPlayerStats = (items: ShopItem[], loadout: Loadout): PlayerStats => {
  const byId = new Map(items.map(item => [item.id, item.stats]));
  const serveFirst = byId.get(loadout.serveFirst);
  const serveSecond = byId.get(loadout.serveSecond);
  const forehand = byId.get(loadout.forehand);
  const backhand = byId.get(loadout.backhand);
  const volley = byId.get(loadout.volley);
  const athleticism = byId.get(loadout.athleticism);
  if (!serveFirst || !serveSecond || !forehand || !backhand || !volley || !athleticism) {
    return {
      serveFirst: { power: 50, spin: 50, control: 50, shape: 50 },
      serveSecond: { power: 50, spin: 50, control: 50, shape: 50 },
      forehand: { power: 50, spin: 50, control: 50, shape: 50 },
      backhand: { power: 50, spin: 50, control: 50, shape: 50 },
      volley: { control: 50, accuracy: 50 },
      athleticism: { speed: 50, stamina: 50 },
    };
  }
  return {
    serveFirst: serveFirst as PlayerStats['serveFirst'],
    serveSecond: serveSecond as PlayerStats['serveSecond'],
    forehand: forehand as PlayerStats['forehand'],
    backhand: backhand as PlayerStats['backhand'],
    volley: volley as PlayerStats['volley'],
    athleticism: athleticism as PlayerStats['athleticism'],
  };
};

type DifficultyTier = 'amateur' | 'pro' | 'elite';
type TournamentDef = {
  id: string;
  name: string;
  tier: DifficultyTier;
  description: string;
  prizes: number[];
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
  aiProfileId?: string;
};

type TournamentState = {
  id: string;
  name: string;
  tier: DifficultyTier;
  prizes: number[];
  status: 'active' | 'eliminated' | 'champion';
  rounds: TournamentMatch[][];
};

const TOURNAMENTS: TournamentDef[] = [
  {
    id: 'amateur-circuit',
    name: 'Amateur Circuit',
    tier: 'amateur',
    description: 'Local draws and scrappy matchups.',
    prizes: [100, 250, 600],
  },
  {
    id: 'pro-series',
    name: 'Pro Series',
    tier: 'pro',
    description: 'ATP 250–500 level grind.',
    prizes: [500, 1200, 3000],
  },
  {
    id: 'elite-majors',
    name: 'Elite Majors',
    tier: 'elite',
    description: '1000s and Grand Slams.',
    prizes: [1500, 4000, 10000],
  },
];

const TOURNAMENT_OPPONENTS = [
  'Rublev', 'Pegula', 'Tsitsipas', 'Rybakina', 'Paolini', 'Jabeur', 'Rune', 'Keys',
  'Khachanov', 'Sakkari', 'Zverev', 'Gauff', 'Paul', 'Mertens', 'Krejcikova', 'Pauline',
];

const App: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'shop' | 'opponent' | 'tournaments' | 'game'>('menu');
  const [wallet, setWallet] = useState(5000);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(
    new Set(['amateur-serve-1', 'amateur-forehand-1', 'amateur-backhand-1', 'amateur-volley-1', 'amateur-athleticism-1'])
  );
  const [loadout, setLoadout] = useState<Loadout>(DEFAULT_LOADOUT);
  const [selectedAi, setSelectedAi] = useState<AiProfile>(AI_PROFILES[0]);
  const [difficulty, setDifficulty] = useState<DifficultyTier>('amateur');
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [pendingTournamentMatchId, setPendingTournamentMatchId] = useState<string | null>(null);
  const [playerPortraitId, setPlayerPortraitId] = useState(PORTRAITS[0]?.id ?? '');
  const [playerName, setPlayerName] = useState('You');

  const buildTieredLoadout = useMemo(() => {
    const byId = new Map(SHOP_ITEMS.map(item => [item.id, item]));
    return (profile: AiProfile, tier: DifficultyTier): Loadout => {
      const tierItems = SHOP_ITEMS.filter(item => item.tier === tier);
      const pickTierItem = (shot: ShotType, fallbackId?: string, fallbackIndex = 0) => {
        if (fallbackId) {
          const candidate = byId.get(fallbackId);
          if (candidate && candidate.tier === tier) return candidate.id;
        }
        const match = tierItems.filter(item => item.shot === shot);
        if (match.length === 0) return fallbackId || profile.loadout[shot as keyof Loadout];
        return match[Math.min(fallbackIndex, match.length - 1)].id;
      };

      return {
        serveFirst: pickTierItem('serve', profile.loadout.serveFirst, 0),
        serveSecond: pickTierItem('serve', profile.loadout.serveSecond, 1),
        forehand: pickTierItem('forehand', profile.loadout.forehand),
        backhand: pickTierItem('backhand', profile.loadout.backhand),
        volley: pickTierItem('volley', profile.loadout.volley),
        athleticism: pickTierItem('athleticism', profile.loadout.athleticism),
      };
    };
  }, []);

  const playerStats = useMemo(
    () => buildPlayerStats(SHOP_ITEMS, loadout),
    [loadout]
  );
  const aiStats = useMemo(
    () => buildPlayerStats(SHOP_ITEMS, buildTieredLoadout(selectedAi, difficulty)),
    [buildTieredLoadout, difficulty, selectedAi]
  );

  const handleBuy = (item: ShopItem) => {
    if (ownedIds.has(item.id)) return;
    if (item.price > wallet) return;
    setWallet(prev => prev - item.price);
    setOwnedIds(prev => new Set([...Array.from(prev), item.id]));
  };

  const handleEquip = (item: ShopItem, slot: keyof Loadout) => {
    if (!ownedIds.has(item.id)) return;
    setLoadout(prev => ({ ...prev, [slot]: item.id }));
  };

  const createTournamentState = (tournament: TournamentDef): TournamentState => {
    const pool = [...TOURNAMENT_OPPONENTS];
    const pickOpponent = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0] || 'Challenger';
    const players = ['You', pickOpponent(), pickOpponent(), pickOpponent(), pickOpponent(), pickOpponent(), pickOpponent(), pickOpponent()];
    const portraitPool = [...PORTRAITS.map(p => p.src)];
    const takePortrait = () => portraitPool.splice(Math.floor(Math.random() * portraitPool.length), 1)[0] || PORTRAITS[0]?.src || '';
    const portraitsByPlayer = new Map<string, string>();
    players.forEach(player => {
      portraitsByPlayer.set(
        player,
        player === 'You' ? (PORTRAITS.find(p => p.id === playerPortraitId)?.src || '') : takePortrait()
      );
    });
    for (let i = players.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }
    const rounds: TournamentMatch[][] = [
      [],
      [],
      [],
    ];
    for (let i = 0; i < 4; i += 1) {
      const p1 = players[i * 2];
      const p2 = players[i * 2 + 1];
      rounds[0].push({
        id: `qf-${i}`,
        round: 1,
        slot: i,
        player1: p1,
        player2: p2,
        player1Portrait: portraitsByPlayer.get(p1) || '',
        player2Portrait: portraitsByPlayer.get(p2) || '',
        winner: null,
        aiProfileId: p1 === 'You' || p2 === 'You' ? AI_PROFILES[Math.floor(Math.random() * AI_PROFILES.length)].id : undefined,
      });
    }
    for (let i = 0; i < 2; i += 1) {
      rounds[1].push({ id: `sf-${i}`, round: 2, slot: i, player1: null, player2: null, winner: null });
    }
    rounds[2].push({ id: 'final', round: 3, slot: 0, player1: null, player2: null, winner: null });
    const state: TournamentState = {
      id: tournament.id,
      name: tournament.name,
      tier: tournament.tier,
      prizes: tournament.prizes,
      status: 'active',
      rounds,
    };
    resolveNonPlayerMatches(state, 0);
    propagateWinners(state, 0);
    return state;
  };

  const resolveNonPlayerMatches = (state: TournamentState, roundIndex: number) => {
    const round = state.rounds[roundIndex];
    round.forEach(match => {
      if (match.winner) return;
      if (match.player1 === 'You' || match.player2 === 'You') return;
      if (!match.player1 || !match.player2) return;
      match.winner = Math.random() > 0.5 ? match.player1 : match.player2;
    });
  };

  const propagateWinners = (state: TournamentState, roundIndex: number) => {
    if (roundIndex >= state.rounds.length - 1) return;
    const nextRound = state.rounds[roundIndex + 1];
    for (let i = 0; i < nextRound.length; i += 1) {
      const leftMatch = state.rounds[roundIndex][i * 2];
      const rightMatch = state.rounds[roundIndex][i * 2 + 1];
      nextRound[i].player1 = leftMatch?.winner || null;
      nextRound[i].player2 = rightMatch?.winner || null;
      if ((nextRound[i].player1 === 'You' || nextRound[i].player2 === 'You') && !nextRound[i].aiProfileId) {
        nextRound[i].aiProfileId = AI_PROFILES[Math.floor(Math.random() * AI_PROFILES.length)].id;
      }
    }
  };

  const getNextPlayerMatch = (state: TournamentState | null): TournamentMatch | null => {
    if (!state || state.status !== 'active') return null;
    for (let roundIndex = 0; roundIndex < state.rounds.length; roundIndex += 1) {
      const match = state.rounds[roundIndex].find(m => (m.player1 === 'You' || m.player2 === 'You') && !m.winner);
      if (match) return match;
    }
    return null;
  };

  const nextTournamentMatch = useMemo(
    () => getNextPlayerMatch(tournamentState),
    [tournamentState]
  );

  const playerPortrait = useMemo(
    () => PORTRAITS.find(p => p.id === playerPortraitId)?.src,
    [playerPortraitId]
  );

  if (screen === 'game') {
    return (
      <Game
        playerStats={playerStats}
        aiStats={aiStats}
        aiProfile={selectedAi}
        playerLoadout={loadout}
        aiLoadout={buildTieredLoadout(selectedAi, difficulty)}
        shopItems={SHOP_ITEMS}
        opponentName={tournamentState ? nextTournamentMatch?.player1 === 'You' ? nextTournamentMatch.player2 || 'Opponent' : nextTournamentMatch?.player1 || 'Opponent' : undefined}
        playerPortrait={playerPortrait}
        opponentPortrait={tournamentState ? nextTournamentMatch?.player1 === 'You' ? nextTournamentMatch.player2Portrait : nextTournamentMatch?.player1Portrait : undefined}
        playerName={playerName}
        onExit={() => setScreen(tournamentState ? 'tournaments' : 'shop')}
        onMatchEnd={winner => {
          if (!tournamentState || !pendingTournamentMatchId) {
            setScreen('shop');
            return;
          }
          setTournamentState(prev => {
            if (!prev) return prev;
            const updated: TournamentState = {
              ...prev,
              rounds: prev.rounds.map(round => round.map(match => ({ ...match }))),
            };
            const match = updated.rounds.flat().find(m => m.id === pendingTournamentMatchId);
            if (!match) return prev;
            match.winner = winner === 'player' ? 'You' : (match.player1 === 'You' ? match.player2 : match.player1) || 'Opponent';
            if (winner === 'player') {
              setWallet(prevWallet => prevWallet + updated.prizes[match.round - 1]);
            } else {
              updated.status = 'eliminated';
            }
            resolveNonPlayerMatches(updated, match.round - 1);
            propagateWinners(updated, match.round - 1);
            if (updated.rounds[2][0].winner === 'You') updated.status = 'champion';
            return updated;
          });
          setPendingTournamentMatchId(null);
          setScreen('tournaments');
        }}
      />
    );
  }

  if (screen === 'opponent') {
    return (
      <OpponentSelect
        profiles={AI_PROFILES}
        selectedId={selectedAi.id}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onSelect={profile => {
          setSelectedAi(profile);
          setScreen('game');
        }}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'tournaments') {
    return (
      <Tournaments
        tournaments={TOURNAMENTS}
        tournamentState={tournamentState}
        nextMatchId={nextTournamentMatch?.id || null}
        onSelectTournament={tournamentId => {
          const tournament = TOURNAMENTS.find(t => t.id === tournamentId);
          if (!tournament) return;
          setTournamentState(createTournamentState(tournament));
        }}
        onPlayMatch={matchId => {
          if (!tournamentState) return;
          const match = tournamentState.rounds.flat().find(m => m.id === matchId);
          if (!match || !match.aiProfileId) return;
          const profile = AI_PROFILES.find(p => p.id === match.aiProfileId);
          if (!profile) return;
          setDifficulty(tournamentState.tier);
          setSelectedAi(profile);
          setPendingTournamentMatchId(matchId);
          setScreen('game');
        }}
          onExitTournament={() => {
            setTournamentState(null);
          }}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'shop') {
    return (
      <Shop
        items={SHOP_ITEMS}
        wallet={wallet}
        ownedIds={ownedIds}
        loadout={loadout}
        onBuy={handleBuy}
        onEquip={handleEquip}
        onStart={() => setScreen('opponent')}
        onBack={() => setScreen('menu')}
        portraits={PORTRAITS}
        selectedPortraitId={playerPortraitId}
        onSelectPortrait={setPlayerPortraitId}
        playerName={playerName}
        onPlayerNameChange={setPlayerName}
      />
    );
  }

  return (
    <Menu
      onShop={() => setScreen('shop')}
      onChallenge={() => setScreen('opponent')}
      onTournaments={() => setScreen('tournaments')}
    />
  );
};

export default App;
