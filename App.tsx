import React, { useMemo, useState, useEffect } from 'react';
import Game from './Game';
import Shop from './components/Shop';
import OpponentSelect from './components/OpponentSelect';
import Menu from './components/Menu';
import Rankings from './components/Rankings';
import Settings from './components/Settings';
import ShotShop from './components/ShotShop';
import ShotBoxOpen from './components/ShotBoxOpen';
import Tournaments from './components/Tournaments';
import TournamentResult from './components/TournamentResult';
import { AiProfile, CourtSurface, Loadout, PlayerProfile, PlayerStats, ShopItem, ShotType } from './types';
import { SHOP_ITEMS } from './data/shopItems';
import { AI_PROFILES } from './data/aiProfiles';
import { PORTRAITS } from './data/portraits';
import { BASE_PLAYERS } from './data/players';
import { STARTING_CREDITS } from './constants';

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
type TournamentCategory = 'itf' | 'pro' | 'elite' | 'grand-slam';

type RankingGate = {
  maxRank: number;
  minPoints?: number;
};

type TournamentDef = {
  id: string;
  name: string;
  tier: DifficultyTier;
  category: TournamentCategory;
  description: string;
  prizes: number[];
  image?: string;
  surface: CourtSurface;
  rankingPoints: number[];
  rankingGate: RankingGate;
};

type TournamentMatch = {
  id: string;
  round: number;
  slot: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  aiProfileId?: string;
  rankingAwarded?: boolean;
};

type TournamentState = {
  id: string;
  name: string;
  tier: DifficultyTier;
  category: TournamentCategory;
  prizes: number[];
  surface: CourtSurface;
  rankingPoints: number[];
  rankingGate: RankingGate;
  status: 'active' | 'eliminated' | 'champion';
  rounds: TournamentMatch[][];
};
type TournamentResultState = {
  outcome: 'eliminated' | 'champion';
  tournamentName: string;
  earnings: number;
};
type RankingAward = {
  playerId: string;
  points: number;
};

const PLAYER_ID = 'player';
const STORAGE_KEYS = {
  wallet: 'tennis.wallet',
  ownedIds: 'tennis.ownedIds',
  loadout: 'tennis.loadout',
  players: 'tennis.players',
} as const;

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};
const RANKING_POINTS_BY_TIER: Record<DifficultyTier, number[]> = {
  amateur: [20, 50, 110],
  pro: [80, 180, 360],
  elite: [250, 600, 1400],
};
const RANKING_GATES_BY_CATEGORY: Record<TournamentCategory, RankingGate> = {
  itf: { maxRank: Number.POSITIVE_INFINITY },
  pro: { maxRank: 80 },
  elite: { maxRank: 20 },
  'grand-slam': { maxRank: 8 },
};

const TOURNAMENTS: TournamentDef[] = [
  {
    id: 'itf-monastir',
    name: 'ITF Monastir 15K',
    tier: 'amateur',
    category: 'itf',
    description: 'Hard-court grind in Tunisia.',
    surface: 'hardcourt',
    prizes: [100, 250, 600],
    rankingPoints: RANKING_POINTS_BY_TIER.amateur,
    rankingGate: RANKING_GATES_BY_CATEGORY.itf,
  },
  {
    id: 'itf-sharm',
    name: 'ITF Sharm El Sheikh 15K',
    tier: 'amateur',
    category: 'itf',
    description: 'Desert heat and fast courts.',
    surface: 'hardcourt',
    prizes: [120, 280, 650],
    rankingPoints: RANKING_POINTS_BY_TIER.amateur,
    rankingGate: RANKING_GATES_BY_CATEGORY.itf,
  },
  {
    id: 'itf-antalya',
    name: 'ITF Antalya 15K',
    tier: 'amateur',
    category: 'itf',
    description: 'Coastal wind and long rallies.',
    surface: 'hardcourt',
    prizes: [120, 300, 700],
    rankingPoints: RANKING_POINTS_BY_TIER.amateur,
    rankingGate: RANKING_GATES_BY_CATEGORY.itf,
  },
  {
    id: 'itf-santa',
    name: 'ITF Santa Margherita 25K',
    tier: 'amateur',
    category: 'itf',
    description: 'Clay court tests and tight margins.',
    surface: 'clay',
    prizes: [150, 350, 800],
    rankingPoints: RANKING_POINTS_BY_TIER.amateur,
    rankingGate: RANKING_GATES_BY_CATEGORY.itf,
  },
  {
    id: 'doha-250',
    name: 'Qatar ExxonMobil Open',
    tier: 'pro',
    category: 'pro',
    description: 'ATP 250 on fast hard courts.',
    image: '/tournaments/smalltournament.png',
    surface: 'hardcourt',
    prizes: [500, 1200, 3000],
    rankingPoints: RANKING_POINTS_BY_TIER.pro,
    rankingGate: RANKING_GATES_BY_CATEGORY.pro,
  },
  {
    id: 'acapulco-500',
    name: 'Abierto Mexicano Telcel',
    tier: 'pro',
    category: 'pro',
    description: 'ATP 500 under the lights.',
    image: '/tournaments/smalltournament.png',
    surface: 'hardcourt',
    prizes: [650, 1500, 3600],
    rankingPoints: RANKING_POINTS_BY_TIER.pro,
    rankingGate: RANKING_GATES_BY_CATEGORY.pro,
  },
  {
    id: 'barcelona-500',
    name: 'Barcelona Open Banc Sabadell',
    tier: 'pro',
    category: 'pro',
    description: 'Classic clay-court ATP 500.',
    image: '/tournaments/smalltournament.png',
    surface: 'clay',
    prizes: [700, 1600, 3800],
    rankingPoints: RANKING_POINTS_BY_TIER.pro,
    rankingGate: RANKING_GATES_BY_CATEGORY.pro,
  },
  {
    id: 'queens-500',
    name: 'Cinch Championships',
    tier: 'pro',
    category: 'pro',
    description: 'Grass-court warmup in London.',
    image: '/tournaments/smalltournament.png',
    surface: 'grass',
    prizes: [650, 1500, 3600],
    rankingPoints: RANKING_POINTS_BY_TIER.pro,
    rankingGate: RANKING_GATES_BY_CATEGORY.pro,
  },
  {
    id: 'indian-wells-1000',
    name: 'BNP Paribas Open',
    tier: 'elite',
    category: 'elite',
    description: 'Masters 1000 in the desert.',
    image: '/tournaments/hardcourt.png',
    surface: 'hardcourt',
    prizes: [1500, 4000, 10000],
    rankingPoints: RANKING_POINTS_BY_TIER.elite,
    rankingGate: RANKING_GATES_BY_CATEGORY.elite,
  },
  {
    id: 'miami-open',
    name: 'Miami Open',
    tier: 'elite',
    category: 'elite',
    description: 'Sunshine Swing showdown.',
    image: '/tournaments/hardcourt.png',
    surface: 'hardcourt',
    prizes: [1500, 4200, 10500],
    rankingPoints: RANKING_POINTS_BY_TIER.elite,
    rankingGate: RANKING_GATES_BY_CATEGORY.elite,
  },
  {
    id: 'shanghai-masters',
    name: 'Shanghai Masters',
    tier: 'elite',
    category: 'elite',
    description: 'Fast hard-court Masters 1000.',
    image: '/tournaments/hardcourt.png',
    surface: 'hardcourt',
    prizes: [1600, 4500, 11000],
    rankingPoints: RANKING_POINTS_BY_TIER.elite,
    rankingGate: RANKING_GATES_BY_CATEGORY.elite,
  },
  {
    id: 'french-open',
    name: 'French Open',
    tier: 'elite',
    category: 'grand-slam',
    description: 'Clay-court Grand Slam in Paris.',
    image: '/tournaments/claycourt.png',
    surface: 'clay',
    prizes: [2000, 6000, 15000],
    rankingPoints: RANKING_POINTS_BY_TIER.elite,
    rankingGate: RANKING_GATES_BY_CATEGORY['grand-slam'],
  },
  {
    id: 'wimbledon',
    name: 'Wimbledon',
    tier: 'elite',
    category: 'grand-slam',
    description: 'The Championships on grass.',
    image: '/tournaments/wimbledon.png',
    surface: 'grass',
    prizes: [2000, 6000, 15000],
    rankingPoints: RANKING_POINTS_BY_TIER.elite,
    rankingGate: RANKING_GATES_BY_CATEGORY['grand-slam'],
  },
];

const createInitialPlayers = (): PlayerProfile[] => {
  const fallbackPortraitId = PORTRAITS[0]?.id ?? '';
  const portraitByType = new Map(PORTRAITS.map(portrait => [portrait.name, portrait]));
  const basePlayers = BASE_PLAYERS.map((player, index) => {
    const portrait = portraitByType.get(player.portraitType);
    return {
      ...player,
      portraitId: portrait?.id ?? PORTRAITS[index % Math.max(PORTRAITS.length, 1)]?.id ?? fallbackPortraitId,
      aiProfileId: AI_PROFILES[index % Math.max(AI_PROFILES.length, 1)]?.id,
    };
  });
  const defaultPortrait = PORTRAITS[0];
  return [
    {
      id: PLAYER_ID,
      name: 'You',
      gender: defaultPortrait?.gender ?? 'male',
      portraitType: defaultPortrait?.name ?? 'Defensive Baseliner',
      rankingPoints: 0,
      minShotTier: 'amateur',
      loadout: DEFAULT_LOADOUT,
      portraitId: fallbackPortraitId,
    },
    ...basePlayers,
  ];
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'player' | 'shot-shop' | 'box-open' | 'opponent' | 'tournaments' | 'tournament-result' | 'game' | 'rankings' | 'settings'>('menu');
  const [wallet, setWallet] = useState(() => loadFromStorage<number>(STORAGE_KEYS.wallet, STARTING_CREDITS));
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => {
    const stored = loadFromStorage<string[] | null>(STORAGE_KEYS.ownedIds, null);
    if (!stored) {
      return new Set(['amateur-serve-1', 'amateur-forehand-1', 'amateur-backhand-1', 'amateur-volley-1', 'amateur-athleticism-1']);
    }
    return new Set(stored);
  });
  const [loadout, setLoadout] = useState<Loadout>(() => loadFromStorage<Loadout>(STORAGE_KEYS.loadout, DEFAULT_LOADOUT));
  const [selectedAi, setSelectedAi] = useState<AiProfile>(AI_PROFILES[0]);
  const [difficulty, setDifficulty] = useState<DifficultyTier>('amateur');
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [pendingTournamentMatchId, setPendingTournamentMatchId] = useState<string | null>(null);
  const [tournamentEarnings, setTournamentEarnings] = useState(0);
  const [tournamentResult, setTournamentResult] = useState<TournamentResultState | null>(null);
  const [players, setPlayers] = useState<PlayerProfile[]>(() => {
    const defaults = createInitialPlayers();
    const stored = loadFromStorage<PlayerProfile[] | null>(STORAGE_KEYS.players, null);
    if (!stored) return defaults;
    const storedById = new Map(stored.map(player => [player.id, player]));
    return defaults.map(player => {
      const saved = storedById.get(player.id);
      if (!saved) return player;
      return {
        ...player,
        ...saved,
        loadout: saved.loadout ?? player.loadout,
        rankingPoints: saved.rankingPoints ?? player.rankingPoints,
        minShotTier: saved.minShotTier ?? player.minShotTier,
      };
    });
  });
  const [pendingBox, setPendingBox] = useState<{ item: ShopItem; alreadyOwned: boolean } | null>(null);

  const boxPrices: Record<ShotType, number> = {
    serve: 450,
    forehand: 400,
    backhand: 400,
    volley: 350,
    athleticism: 350,
  };
  const playersById = useMemo(
    () => new Map(players.map(player => [player.id, player])),
    [players]
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.wallet, JSON.stringify(wallet));
    window.localStorage.setItem(STORAGE_KEYS.ownedIds, JSON.stringify(Array.from(ownedIds)));
    window.localStorage.setItem(STORAGE_KEYS.loadout, JSON.stringify(loadout));
    window.localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players));
  }, [loadout, ownedIds, players, wallet]);
  const rankedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      if (b.rankingPoints !== a.rankingPoints) return b.rankingPoints - a.rankingPoints;
      return a.name.localeCompare(b.name);
    });
  }, [players]);
  const rankingsById = useMemo(() => {
    const map = new Map<string, number>();
    rankedPlayers.forEach((player, index) => {
      map.set(player.id, index + 1);
    });
    return map;
  }, [rankedPlayers]);
  const playerProfile = playersById.get(PLAYER_ID);
  const playerName = playerProfile?.name ?? 'You';
  const playerPortraitId = playerProfile?.portraitId ?? PORTRAITS[0]?.id ?? '';
  const playerRank = rankingsById.get(PLAYER_ID) ?? rankedPlayers.length;
  const playerPoints = playerProfile?.rankingPoints ?? 0;

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

  const rollTier = (): ShopItem['tier'] => {
    const roll = Math.random() * 100;
    if (roll < 40) return 'amateur';
    if (roll < 70) return 'pro';
    if (roll < 90) return 'legendary';
    if (roll < 98) return 'elite';
    return 'unique';
  };

  const pickRandomItem = (shot: ShotType): ShopItem | null => {
    const tier = rollTier();
    const tierItems = SHOP_ITEMS.filter(item => item.shot === shot && item.tier === tier);
    const pool = tierItems.length > 0 ? tierItems : SHOP_ITEMS.filter(item => item.shot === shot);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleBuyBox = (shot: ShotType) => {
    const price = boxPrices[shot];
    if (wallet < price) return;
    const item = pickRandomItem(shot);
    if (!item) return;
    setWallet(prev => prev - price);
    setOwnedIds(prev => new Set([...Array.from(prev), item.id]));
    setPendingBox({ item, alreadyOwned: ownedIds.has(item.id) });
    setScreen('box-open');
  };

  const handleEquip = (item: ShopItem, slot: keyof Loadout) => {
    if (!ownedIds.has(item.id)) return;
    setLoadout(prev => ({ ...prev, [slot]: item.id }));
  };

  const updatePlayerProfile = (playerId: string, updates: Partial<PlayerProfile>) => {
    setPlayers(prev => prev.map(player => (player.id === playerId ? { ...player, ...updates } : player)));
  };

  const applyRankingAwards = (awards: RankingAward[]) => {
    if (awards.length === 0) return;
    setPlayers(prev => {
      const awardTotals = new Map<string, number>();
      awards.forEach(({ playerId, points }) => {
        awardTotals.set(playerId, (awardTotals.get(playerId) || 0) + points);
      });
      return prev.map(player => {
        const delta = awardTotals.get(player.id);
        if (!delta) return player;
        return { ...player, rankingPoints: player.rankingPoints + delta };
      });
    });
  };

  const getPlayerPortraitSrc = (playerId: string | null) => {
    if (!playerId) return '';
    const portraitId = playersById.get(playerId)?.portraitId;
    return PORTRAITS.find(p => p.id === portraitId)?.src || '';
  };

  const isPlayerEligibleForTournament = (tournament: TournamentDef, playerId: string) => {
    const rank = rankingsById.get(playerId) ?? Number.POSITIVE_INFINITY;
    if (rank > tournament.rankingGate.maxRank) return false;
    if (tournament.rankingGate.minPoints !== undefined) {
      const points = playersById.get(playerId)?.rankingPoints ?? 0;
      if (points < tournament.rankingGate.minPoints) return false;
    }
    return true;
  };

  const getEligiblePlayersForTournament = (tournament: TournamentDef) => {
    return players.filter(player => isPlayerEligibleForTournament(tournament, player.id));
  };

  const getEligibleAiPool = (tournament: TournamentDef) => {
    const basePool = getEligiblePlayersForTournament(tournament);
    if (tournament.category === 'itf') {
      return basePool.filter(player => {
        if (player.id === PLAYER_ID) return true;
        const rank = rankingsById.get(player.id) ?? Number.POSITIVE_INFINITY;
        return rank >= 60;
      });
    }
    if (tournament.category === 'pro') {
      return basePool.filter(player => {
        if (player.id === PLAYER_ID) return true;
        const rank = rankingsById.get(player.id) ?? Number.POSITIVE_INFINITY;
        return rank >= 15;
      });
    }
    return basePool;
  };

  const collectRankingAwards = (state: TournamentState): RankingAward[] => {
    const awards: RankingAward[] = [];
    state.rounds.forEach(round => {
      round.forEach(match => {
        if (!match.winnerId || match.rankingAwarded) return;
        const points = state.rankingPoints[match.round - 1] ?? 0;
        if (points > 0) {
          awards.push({ playerId: match.winnerId, points });
        }
        match.rankingAwarded = true;
      });
    });
    return awards;
  };

  const getPlayerStatsTotal = (playerId: string) => {
    const loadout = playersById.get(playerId)?.loadout || DEFAULT_LOADOUT;
    const stats = buildPlayerStats(SHOP_ITEMS, loadout);
    const serveTotal = stats.serveFirst.power + stats.serveFirst.spin + stats.serveFirst.control + stats.serveFirst.shape
      + stats.serveSecond.power + stats.serveSecond.spin + stats.serveSecond.control + stats.serveSecond.shape;
    const groundTotal = stats.forehand.power + stats.forehand.spin + stats.forehand.control + stats.forehand.shape
      + stats.backhand.power + stats.backhand.spin + stats.backhand.control + stats.backhand.shape;
    const netTotal = stats.volley.control + stats.volley.accuracy;
    const athleticTotal = stats.athleticism.speed + stats.athleticism.stamina;
    return serveTotal + groundTotal + netTotal + athleticTotal;
  };

  const simulateAiMatch = (player1Id: string, player2Id: string) => {
    const p1 = getPlayerStatsTotal(player1Id);
    const p2 = getPlayerStatsTotal(player2Id);
    const bias = p1 + p2 === 0 ? 0.5 : p1 / (p1 + p2);
    return Math.random() < bias ? player1Id : player2Id;
  };

  const createTournamentState = (tournament: TournamentDef) => {
    const eligiblePlayers = getEligibleAiPool(tournament);
    const shuffledEligible = [...eligiblePlayers];
    for (let i = shuffledEligible.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledEligible[i], shuffledEligible[j]] = [shuffledEligible[j], shuffledEligible[i]];
    }
    let participants = shuffledEligible.slice(0, 8);
    const playerIsEligible = eligiblePlayers.some(player => player.id === PLAYER_ID);
    if (playerIsEligible && !participants.some(player => player.id === PLAYER_ID)) {
      participants[participants.length - 1] = playersById.get(PLAYER_ID) || participants[participants.length - 1];
    }
    if (participants.length < 8) {
      const remaining = [...eligiblePlayers]
        .filter(player => !participants.some(existing => existing.id === player.id));
      while (participants.length < 8 && remaining.length > 0) {
        const next = remaining.shift();
        if (next) participants.push(next);
      }
    }
    const rounds: TournamentMatch[][] = [
      [],
      [],
      [],
    ];
    for (let i = 0; i < 4; i += 1) {
      const p1 = participants[i * 2];
      const p2 = participants[i * 2 + 1];
      const player1Id = p1?.id ?? null;
      const player2Id = p2?.id ?? null;
      let aiProfileId: string | undefined;
      if (player1Id === PLAYER_ID || player2Id === PLAYER_ID) {
        const opponentId = player1Id === PLAYER_ID ? player2Id : player1Id;
        aiProfileId = opponentId ? (playersById.get(opponentId)?.aiProfileId || AI_PROFILES[0]?.id) : AI_PROFILES[0]?.id;
      }
      rounds[0].push({
        id: `qf-${i}`,
        round: 1,
        slot: i,
        player1Id,
        player2Id,
        winnerId: null,
        aiProfileId,
        rankingAwarded: false,
      });
    }
    for (let i = 0; i < 2; i += 1) {
      rounds[1].push({ id: `sf-${i}`, round: 2, slot: i, player1Id: null, player2Id: null, winnerId: null, rankingAwarded: false });
    }
    rounds[2].push({ id: 'final', round: 3, slot: 0, player1Id: null, player2Id: null, winnerId: null, rankingAwarded: false });
    const state: TournamentState = {
      id: tournament.id,
      name: tournament.name,
      tier: tournament.tier,
      category: tournament.category,
      prizes: tournament.prizes,
      surface: tournament.surface,
      rankingPoints: tournament.rankingPoints,
      rankingGate: tournament.rankingGate,
      status: 'active',
      rounds,
    };
    resolveNonPlayerMatches(state, 0);
    propagateWinners(state, 0);
    return { state };
  };

  const resolveNonPlayerMatches = (state: TournamentState, roundIndex: number) => {
    const round = state.rounds[roundIndex];
    round.forEach(match => {
      if (match.winnerId) return;
      if (match.player1Id === PLAYER_ID || match.player2Id === PLAYER_ID) return;
      if (!match.player1Id || !match.player2Id) return;
      match.winnerId = simulateAiMatch(match.player1Id, match.player2Id);
    });
  };

  const simulateTournamentToEnd = (state: TournamentState, startRound: number) => {
    for (let roundIndex = startRound; roundIndex < state.rounds.length; roundIndex += 1) {
      resolveNonPlayerMatches(state, roundIndex);
      propagateWinners(state, roundIndex);
    }
  };

  const propagateWinners = (state: TournamentState, roundIndex: number) => {
    if (roundIndex >= state.rounds.length - 1) return;
    const nextRound = state.rounds[roundIndex + 1];
    for (let i = 0; i < nextRound.length; i += 1) {
      const leftMatch = state.rounds[roundIndex][i * 2];
      const rightMatch = state.rounds[roundIndex][i * 2 + 1];
      nextRound[i].player1Id = leftMatch?.winnerId || null;
      nextRound[i].player2Id = rightMatch?.winnerId || null;
      if ((nextRound[i].player1Id === PLAYER_ID || nextRound[i].player2Id === PLAYER_ID) && !nextRound[i].aiProfileId) {
        const opponentId = nextRound[i].player1Id === PLAYER_ID ? nextRound[i].player2Id : nextRound[i].player1Id;
        nextRound[i].aiProfileId = opponentId ? (playersById.get(opponentId)?.aiProfileId || AI_PROFILES[0]?.id) : AI_PROFILES[0]?.id;
      } else if (nextRound[i].player1Id !== PLAYER_ID && nextRound[i].player2Id !== PLAYER_ID) {
        nextRound[i].aiProfileId = undefined;
      }
    }
  };

  const getNextPlayerMatch = (state: TournamentState | null): TournamentMatch | null => {
    if (!state || state.status !== 'active') return null;
    for (let roundIndex = 0; roundIndex < state.rounds.length; roundIndex += 1) {
      const match = state.rounds[roundIndex].find(m => (m.player1Id === PLAYER_ID || m.player2Id === PLAYER_ID) && !m.winnerId);
      if (match) return match;
    }
    return null;
  };

  const nextTournamentMatch = useMemo(
    () => getNextPlayerMatch(tournamentState),
    [tournamentState]
  );
  const nextOpponentId = useMemo(() => {
    if (!nextTournamentMatch) return null;
    if (nextTournamentMatch.player1Id === PLAYER_ID) return nextTournamentMatch.player2Id;
    if (nextTournamentMatch.player2Id === PLAYER_ID) return nextTournamentMatch.player1Id;
    return null;
  }, [nextTournamentMatch]);
  const nextOpponentProfile = nextOpponentId ? playersById.get(nextOpponentId) : undefined;
  const aiLoadout = useMemo(
    () => (tournamentState && nextOpponentProfile ? nextOpponentProfile.loadout : buildTieredLoadout(selectedAi, difficulty)),
    [buildTieredLoadout, difficulty, nextOpponentProfile, selectedAi, tournamentState]
  );
  const aiStats = useMemo(
    () => buildPlayerStats(SHOP_ITEMS, aiLoadout),
    [aiLoadout]
  );
  const nextOpponentName = nextOpponentId ? playersById.get(nextOpponentId)?.name : undefined;
  const nextOpponentPortrait = nextOpponentId ? getPlayerPortraitSrc(nextOpponentId) : undefined;

  const playerPortrait = useMemo(
    () => getPlayerPortraitSrc(PLAYER_ID),
    [playersById]
  );

  if (screen === 'game') {
    return (
      <Game
        playerStats={playerStats}
        aiStats={aiStats}
        aiProfile={selectedAi}
        playerLoadout={loadout}
        aiLoadout={aiLoadout}
        shopItems={SHOP_ITEMS}
        opponentName={tournamentState ? nextOpponentName || 'Opponent' : undefined}
        playerPortrait={playerPortrait}
        opponentPortrait={tournamentState ? nextOpponentPortrait : undefined}
        surface={tournamentState?.surface ?? 'grass'}
        playerName={playerName}
        onExit={() => setScreen(tournamentState ? 'tournaments' : 'player')}
        onMatchEnd={winner => {
          if (!tournamentState || !pendingTournamentMatchId) {
            setScreen('player');
            return;
          }
          let resultToShow: TournamentResultState | null = null;
          let rankingAwards: RankingAward[] = [];
          setTournamentState(prev => {
            if (!prev) return prev;
            const updated: TournamentState = {
              ...prev,
              rounds: prev.rounds.map(round => round.map(match => ({ ...match }))),
            };
            const match = updated.rounds.flat().find(m => m.id === pendingTournamentMatchId);
            if (!match) return prev;
            if (winner === 'player') {
              match.winnerId = PLAYER_ID;
            } else {
              match.winnerId = match.player1Id === PLAYER_ID ? match.player2Id : match.player1Id;
            }
            if (winner === 'player') {
              const prize = updated.prizes[match.round - 1];
              setWallet(prevWallet => prevWallet + prize);
              setTournamentEarnings(prevEarned => prevEarned + prize);
            } else {
              updated.status = 'eliminated';
            }
            resolveNonPlayerMatches(updated, match.round - 1);
            propagateWinners(updated, match.round - 1);
            if (updated.status === 'eliminated') {
              simulateTournamentToEnd(updated, match.round);
            }
            if (updated.rounds[2][0].winnerId === PLAYER_ID) updated.status = 'champion';
            if (updated.status !== 'active') {
              const addedPrize = winner === 'player' ? updated.prizes[match.round - 1] : 0;
              resultToShow = {
                outcome: updated.status === 'champion' ? 'champion' : 'eliminated',
                tournamentName: updated.name,
                earnings: tournamentEarnings + addedPrize,
              };
              simulateTournamentToEnd(updated, match.round);
              rankingAwards = collectRankingAwards(updated);
            }
            return updated;
          });
          if (rankingAwards.length > 0) applyRankingAwards(rankingAwards);
          if (resultToShow) {
            setTournamentResult(resultToShow);
            setTournamentState(null);
            setTournamentEarnings(0);
            setScreen('tournament-result');
          } else {
            setScreen('tournaments');
          }
          setPendingTournamentMatchId(null);
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
        players={players}
        playerRank={playerRank}
        playerPoints={playerPoints}
        onSelectTournament={tournamentId => {
          const tournament = TOURNAMENTS.find(t => t.id === tournamentId);
          if (!tournament) return;
          if (!isPlayerEligibleForTournament(tournament, PLAYER_ID)) return;
          setTournamentEarnings(0);
          const { state } = createTournamentState(tournament);
          setTournamentState(state);
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
          setTournamentEarnings(0);
        }}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'tournament-result' && tournamentResult) {
    return (
      <TournamentResult
        outcome={tournamentResult.outcome}
        tournamentName={tournamentResult.tournamentName}
        earnings={tournamentResult.earnings}
        onContinue={() => {
          setTournamentResult(null);
          setScreen('tournaments');
        }}
      />
    );
  }

  if (screen === 'rankings') {
    return (
      <Rankings
        players={players}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'settings') {
    return (
      <Settings onBack={() => setScreen('menu')} />
    );
  }

  if (screen === 'player') {
    return (
      <Shop
        items={SHOP_ITEMS}
        wallet={wallet}
        ownedIds={ownedIds}
        loadout={loadout}
        onEquip={handleEquip}
        onStart={() => setScreen('opponent')}
        onBack={() => setScreen('menu')}
        portraits={PORTRAITS}
        selectedPortraitId={playerPortraitId}
        onSelectPortrait={id => {
          const portrait = PORTRAITS.find(item => item.id === id);
          updatePlayerProfile(PLAYER_ID, {
            portraitId: id,
            gender: portrait?.gender ?? (playerProfile?.gender || 'male'),
            portraitType: portrait?.name ?? (playerProfile?.portraitType || 'Defensive Baseliner'),
          });
        }}
        playerName={playerName}
        onPlayerNameChange={name => updatePlayerProfile(PLAYER_ID, { name })}
        rankingPoints={playerPoints}
        rankingRank={playerRank}
      />
    );
  }

  if (screen === 'shot-shop') {
    const ownedCounts = SHOP_ITEMS.reduce<Record<ShotType, number>>((acc, item) => {
      if (ownedIds.has(item.id)) acc[item.shot] += 1;
      return acc;
    }, { serve: 0, forehand: 0, backhand: 0, volley: 0, athleticism: 0 });
    return (
      <ShotShop
        wallet={wallet}
        boxPrices={boxPrices}
        ownedCounts={ownedCounts}
        onBuyBox={handleBuyBox}
        onBack={() => setScreen('menu')}
        onPlayerPage={() => setScreen('player')}
      />
    );
  }

  if (screen === 'box-open' && pendingBox) {
    return (
      <ShotBoxOpen
        item={pendingBox.item}
        alreadyOwned={pendingBox.alreadyOwned}
        onBack={() => {
          setPendingBox(null);
          setScreen('shot-shop');
        }}
      />
    );
  }

  return (
    <Menu
      onPlayerPage={() => setScreen('player')}
      onShotShop={() => setScreen('shot-shop')}
      onChallenge={() => setScreen('opponent')}
      onTournaments={() => setScreen('tournaments')}
      onRankings={() => setScreen('rankings')}
      onSettings={() => setScreen('settings')}
    />
  );
};

export default App;
