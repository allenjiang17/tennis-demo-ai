import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Game from './Game';
import Shop from './components/Shop';
import OpponentSelect from './components/OpponentSelect';
import Menu from './components/Menu';
import Rankings from './components/Rankings';
import Settings from './components/Settings';
import TutorialComplete from './components/TutorialComplete';
import ShotShop from './components/ShotShop';
import ShotBoxOpen from './components/ShotBoxOpen';
import Tournaments from './components/Tournaments';
import TournamentResult from './components/TournamentResult';
import Career from './components/Career';
import BlockSummary from './components/BlockSummary';
import { AiProfile, CourtSurface, Loadout, PlayerProfile, PlayerStats, ShopItem, ShotType, TournamentCategory } from './types';
import { SHOP_ITEMS } from './data/shopItems';
import { AI_PROFILES } from './data/aiProfiles';
import { PORTRAITS } from './data/portraits';
import { BASE_PLAYERS } from './data/players';
import { CAREER_TOURNAMENT_DATA } from './data/tournaments';
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

const applyAiProfileModifiers = (stats: PlayerStats, profileId?: string): PlayerStats => {
  if (!profileId) return stats;
  const scale = (value: number, multiplier: number) => Math.max(0, Math.round(value * multiplier));
  const next: PlayerStats = {
    serveFirst: { ...stats.serveFirst },
    serveSecond: { ...stats.serveSecond },
    forehand: { ...stats.forehand },
    backhand: { ...stats.backhand },
    volley: { ...stats.volley },
    athleticism: { ...stats.athleticism },
  };

  switch (profileId) {
    case 'defensive-baseliner': {
      next.forehand.power = scale(next.forehand.power, 1.05);
      next.forehand.spin = scale(next.forehand.spin, 1.05);
      next.backhand.power = scale(next.backhand.power, 1.05);
      next.backhand.spin = scale(next.backhand.spin, 1.05);
      next.athleticism.speed = scale(next.athleticism.speed, 1.2);
      next.volley.control = scale(next.volley.control, 0.6);
      next.volley.accuracy = scale(next.volley.accuracy, 0.6);
      next.serveFirst.power = scale(next.serveFirst.power, 0.9);
      next.serveSecond.power = scale(next.serveSecond.power, 0.9);
      break;
    }
    case 'aggressive-shotmaker': {
      next.forehand.power = scale(next.forehand.power, 1.1);
      next.forehand.spin = scale(next.forehand.spin, 1.1);
      next.backhand.power = scale(next.backhand.power, 1.05);
      next.backhand.spin = scale(next.backhand.spin, 1.05);
      next.forehand.control = scale(next.forehand.control, 0.5);
      next.backhand.control = scale(next.backhand.control, 0.5);

      break;
    }
    case 'serve-volleyer': {
      next.athleticism.speed = scale(next.athleticism.speed, 1.1);
      next.volley.control = scale(next.volley.control, 1.2);
      next.volley.accuracy = scale(next.volley.accuracy, 1.2);
      next.serveFirst.power = scale(next.serveFirst.power, 1.1);
      next.serveSecond.power = scale(next.serveSecond.power, 1.1);
      next.forehand.power = scale(next.forehand.power, 0.8);
      next.forehand.spin = scale(next.forehand.spin, 0.8);
      next.backhand.power = scale(next.backhand.power, 0.8);
      next.backhand.spin = scale(next.backhand.spin, 0.8);
      break;
    }
    case 'counterpuncher': {
      next.backhand.control = scale(next.backhand.control, 1.15);
      next.athleticism.speed = scale(next.athleticism.speed, 1.15);
      next.athleticism.stamina = scale(next.athleticism.stamina, 1.15);
      next.serveFirst.power = scale(next.serveFirst.power, 0.9);
      next.serveSecond.power = scale(next.serveSecond.power, 0.9);
      break;
    }
    case 'power-server': {
      next.serveFirst.power = scale(next.serveFirst.power, 1.15);
      next.serveSecond.power = scale(next.serveSecond.power, 1.15);
      next.forehand.control = scale(next.forehand.control, 0.85);
      next.backhand.control = scale(next.backhand.control, 0.85);
      next.athleticism.speed = scale(next.athleticism.speed, 0.6);
      next.athleticism.stamina = scale(next.athleticism.stamina, 0.6);
      break;
    }
    case 'all-court-artist':
    default:
      break;
  }
  return next;
};

const applyAiDifficultyModifier = (stats: PlayerStats, difficulty: DifficultySetting): PlayerStats => {
  const multiplier = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.15 : 1;
  if (multiplier === 1) return stats;
  const scale = (value: number) => Math.max(0, Math.round(value * multiplier));
  return {
    serveFirst: {
      power: scale(stats.serveFirst.power),
      spin: scale(stats.serveFirst.spin),
      control: scale(stats.serveFirst.control),
      shape: scale(stats.serveFirst.shape),
    },
    serveSecond: {
      power: scale(stats.serveSecond.power),
      spin: scale(stats.serveSecond.spin),
      control: scale(stats.serveSecond.control),
      shape: scale(stats.serveSecond.shape),
    },
    forehand: {
      power: scale(stats.forehand.power),
      spin: scale(stats.forehand.spin),
      control: scale(stats.forehand.control),
      shape: scale(stats.forehand.shape),
    },
    backhand: {
      power: scale(stats.backhand.power),
      spin: scale(stats.backhand.spin),
      control: scale(stats.backhand.control),
      shape: scale(stats.backhand.shape),
    },
    volley: {
      control: scale(stats.volley.control),
      accuracy: scale(stats.volley.accuracy),
    },
    athleticism: {
      speed: scale(stats.athleticism.speed),
      stamina: scale(stats.athleticism.stamina),
    },
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
  championBonus: number;
  image?: string;
  surface: CourtSurface;
  rankingPoints: number[];
  rankingGate: RankingGate;
  block: number;
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
  championBonus: number;
  surface: CourtSurface;
  rankingPoints: number[];
  rankingGate: RankingGate;
  block?: number;
  status: 'active' | 'eliminated' | 'champion';
  rounds: TournamentMatch[][];
};
type TournamentResultState = {
  outcome: 'eliminated' | 'champion';
  tournamentName: string;
  earnings: number;
};
type DifficultySetting = 'easy' | 'medium' | 'hard';
type RankingAward = {
  playerId: string;
  points: number;
};

const formatTournamentRound = (round?: number) => {
  if (round === 1) return 'Round of 16';
  if (round === 2) return 'Quarterfinals';
  if (round === 3) return 'Semifinals';
  if (round === 4) return 'Final';
  return 'Match';
};

const PLAYER_ID = 'player';
const STORAGE_KEYS = {
  wallet: 'tennis.wallet',
  ownedIds: 'tennis.ownedIds',
  loadout: 'tennis.loadout',
  players: 'tennis.players',
  matchesPlayed: 'tennis.matchesPlayed',
  shopStock: 'tennis.shopStock',
  shopStockCycle: 'tennis.shopStockCycle',
  careerBlock: 'tennis.careerBlock',
  careerBlockResolved: 'tennis.careerBlockResolved',
  aiDifficulty: 'tennis.aiDifficulty',
  tutorialComplete: 'tennis.tutorialComplete',
  accessGranted: 'tennis.accessGranted',
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
const SHOP_STOCK_SIZE = 3;
const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getBiasedWinChance = (p1Total: number, p2Total: number) => {
  if (p1Total + p2Total === 0) return 0.5;
  const raw = p1Total / (p1Total + p2Total);
  const exponent = 7;
  const p1 = Math.max(0.001, Math.min(0.999, raw));
  const odds = p1 / (1 - p1);
  const skewed = Math.pow(odds, exponent);
  return skewed / (1 + skewed);
};
const RANKING_POINTS_BY_CATEGORY: Record<TournamentCategory, number[]> = {
  itf: [0, 10, 20, 40, 80],
  pro: [0, 20, 40, 80, 160],
  elite: [0, 40, 80, 160, 320],
  'grand-slam': [0, 80, 160, 320, 640],
};
const RANKING_GATES_BY_CATEGORY: Record<TournamentCategory, RankingGate> = {
  itf: { maxRank: Number.POSITIVE_INFINITY },
  pro: { maxRank: 80 },
  elite: { maxRank: 20 },
  'grand-slam': { maxRank: 8 },
};

const CAREER_CATEGORY_CONFIG: Record<TournamentCategory, {
  tier: DifficultyTier;
  prizes: number[];
  rankingPoints: number[];
  rankingGate: RankingGate;
}> = {
  itf: {
    tier: 'amateur',
    prizes: [10, 20, 40, 120],
    rankingPoints: RANKING_POINTS_BY_CATEGORY.itf,
    rankingGate: RANKING_GATES_BY_CATEGORY.itf,
  },
  pro: {
    tier: 'pro',
    prizes: [80, 160, 320, 960],
    rankingPoints: RANKING_POINTS_BY_CATEGORY.pro,
    rankingGate: RANKING_GATES_BY_CATEGORY.pro,
  },
  elite: {
    tier: 'elite',
    prizes: [640, 1280, 2560, 7680],
    rankingPoints: RANKING_POINTS_BY_CATEGORY.elite,
    rankingGate: RANKING_GATES_BY_CATEGORY.elite,
  },
  'grand-slam': {
    tier: 'elite',
    prizes: [5120, 10240, 20480, 61440],
    rankingPoints: RANKING_POINTS_BY_CATEGORY['grand-slam'],
    rankingGate: RANKING_GATES_BY_CATEGORY['grand-slam'],
  },
};

const buildCareerTournament = (data: {
  id: string;
  name: string;
  category: TournamentCategory;
  description: string;
  surface: CourtSurface;
  image?: string;
  block: number;
}): TournamentDef => {
  const base = CAREER_CATEGORY_CONFIG[data.category];
  return {
    id: data.id,
    name: data.name,
    tier: base.tier,
    category: data.category,
    description: data.description,
    prizes: base.prizes,
    championBonus: 0,
    image: data.image,
    surface: data.surface,
    rankingPoints: base.rankingPoints,
    rankingGate: base.rankingGate,
    block: data.block,
  };
};

const TOURNAMENTS: TournamentDef[] = CAREER_TOURNAMENT_DATA.map(tournament =>
  buildCareerTournament(tournament)
);

const seedTournamentResults = (players: PlayerProfile[]): PlayerProfile[] => {
  const seedRankOrder = players
    .slice()
    .sort((a, b) => (b.seedRanking ?? b.rankingPoints) - (a.seedRanking ?? a.rankingPoints) || a.name.localeCompare(b.name))
    .map(player => player.id);
  const seedRankById = new Map(seedRankOrder.map((id, index) => [id, index + 1]));
  const seeded = players.map(player => ({
    ...player,
    tournamentRankingPoints: {},
    rankingPoints: 0,
  }));
  const byId = new Map(seeded.map(player => [player.id, player]));
  const blockAssignments = new Map<number, Set<string>>();
  const shuffleIds = (ids: string[]) => {
    const copy = ids.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const isEligibleForCategory = (seedRank: number, category: TournamentCategory) => {
    if (category === 'itf') return seedRank >= 64 && seedRank <= 117;
    if (category === 'pro') return seedRank >= 32 && seedRank <= 80;
    if (category === 'elite') return seedRank <= 64;
    if (category === 'grand-slam') return seedRank <= 32;
    return false;
  };
  const eligibleByCategory = new Map<TournamentCategory, string[]>();
  const poolByCategory = new Map<TournamentCategory, string[]>();
  TOURNAMENTS.forEach(tournament => {
    if (eligibleByCategory.has(tournament.category)) return;
    const eligibleIds = seedRankOrder.filter(playerId => {
      if (playerId === PLAYER_ID) return false;
      const seedRank = seedRankById.get(playerId) ?? Number.POSITIVE_INFINITY;
      return isEligibleForCategory(seedRank, tournament.category);
    });
    eligibleByCategory.set(tournament.category, eligibleIds);
    poolByCategory.set(tournament.category, shuffleIds(eligibleIds));
  });
  const getPlayerStatsTotal = (player: PlayerProfile) => {
    const stats = buildPlayerStats(SHOP_ITEMS, player.loadout);
    const serveTotal = stats.serveFirst.power + stats.serveFirst.spin + stats.serveFirst.control + stats.serveFirst.shape
      + stats.serveSecond.power + stats.serveSecond.spin + stats.serveSecond.control + stats.serveSecond.shape;
    const groundTotal = stats.forehand.power + stats.forehand.spin + stats.forehand.control + stats.forehand.shape
      + stats.backhand.power + stats.backhand.spin + stats.backhand.control + stats.backhand.shape;
    const netTotal = stats.volley.control + stats.volley.accuracy;
    const athleticTotal = stats.athleticism.speed + stats.athleticism.stamina;
    return serveTotal + groundTotal + netTotal + athleticTotal;
  };

  const simulateMatch = (playerA: PlayerProfile, playerB: PlayerProfile) => {
    const p1 = getPlayerStatsTotal(playerA);
    const p2 = getPlayerStatsTotal(playerB);
    const bias = getBiasedWinChance(p1, p2);
    return Math.random() < bias ? playerA : playerB;
  };

  TOURNAMENTS.forEach(tournament => {
    const eligibleIds = eligibleByCategory.get(tournament.category) ?? [];
    if (eligibleIds.length === 0) return;
    let pool = poolByCategory.get(tournament.category) ?? shuffleIds(eligibleIds);
    const fieldIds: string[] = [];
    const usedThisTournament = new Set<string>();
    let scannedSincePick = 0;
    let recycled = false;

    while (fieldIds.length < 16) {
      if (pool.length === 0) {
        if (recycled) break;
        pool = shuffleIds(eligibleIds).filter(id => !usedThisTournament.has(id));
        poolByCategory.set(tournament.category, pool);
        scannedSincePick = 0;
        recycled = true;
        if (pool.length === 0) break;
      }

      const candidate = pool.shift();
      if (!candidate) continue;
      if (usedThisTournament.has(candidate)) continue;
      const assigned = blockAssignments.get(tournament.block);
      if (assigned && assigned.has(candidate)) {
        pool.push(candidate);
        scannedSincePick += 1;
        if (scannedSincePick >= pool.length && fieldIds.length < 16) {
          if (recycled) break;
          pool = shuffleIds(eligibleIds).filter(id => !usedThisTournament.has(id));
          poolByCategory.set(tournament.category, pool);
          scannedSincePick = 0;
          recycled = true;
        }
        continue;
      }

      fieldIds.push(candidate);
      usedThisTournament.add(candidate);
      scannedSincePick = 0;
    }

    poolByCategory.set(tournament.category, pool);
    if (fieldIds.length < 16) return;
    const field = fieldIds.map(id => byId.get(id)).filter(Boolean) as PlayerProfile[];
    const assigned = blockAssignments.get(tournament.block) ?? new Set<string>();
    field.forEach(player => assigned.add(player.id));
    blockAssignments.set(tournament.block, assigned);

    const [r16Points, qfPoints, sfPoints, finalPoints, winnerPoints] = tournament.rankingPoints;
    const r16Pairs: Array<[PlayerProfile, PlayerProfile]> = [];
    for (let i = 0; i < field.length; i += 2) {
      if (field[i + 1]) r16Pairs.push([field[i], field[i + 1]]);
    }
    const r16Losers: PlayerProfile[] = [];
    const qfPlayers: PlayerProfile[] = [];
    r16Pairs.forEach(pair => {
      const winner = simulateMatch(pair[0], pair[1]);
      const loser = winner.id === pair[0].id ? pair[1] : pair[0];
      qfPlayers.push(winner);
      r16Losers.push(loser);
    });

    const qfLosers: PlayerProfile[] = [];
    const sfPlayers: PlayerProfile[] = [];
    for (let i = 0; i < qfPlayers.length; i += 2) {
      if (!qfPlayers[i + 1]) break;
      const winner = simulateMatch(qfPlayers[i], qfPlayers[i + 1]);
      const loser = winner.id === qfPlayers[i].id ? qfPlayers[i + 1] : qfPlayers[i];
      sfPlayers.push(winner);
      qfLosers.push(loser);
    }

    const sfLosers: PlayerProfile[] = [];
    const finalPlayers: PlayerProfile[] = [];
    for (let i = 0; i < sfPlayers.length; i += 2) {
      if (!sfPlayers[i + 1]) break;
      const winner = simulateMatch(sfPlayers[i], sfPlayers[i + 1]);
      const loser = winner.id === sfPlayers[i].id ? sfPlayers[i + 1] : sfPlayers[i];
      finalPlayers.push(winner);
      sfLosers.push(loser);
    }

    if (finalPlayers.length < 2) return;
    const winner = simulateMatch(finalPlayers[0], finalPlayers[1]);
    const finalist = winner.id === finalPlayers[0].id ? finalPlayers[1] : finalPlayers[0];

    const award = (playerId: string, points: number | undefined) => {
      if (!points || points <= 0) return;
      const player = byId.get(playerId);
      if (!player) return;
      const history = player.tournamentRankingPoints ?? {};
      history[tournament.id] = points;
      player.tournamentRankingPoints = history;
      player.rankingPoints += points;
    };

    award(winner.id, winnerPoints);
    award(finalist.id, finalPoints);
    sfLosers.forEach(player => award(player.id, sfPoints));
    qfLosers.forEach(player => award(player.id, qfPoints));
    r16Losers.forEach(player => award(player.id, r16Points));
  });

  return seeded;
};

const createInitialPlayers = (): PlayerProfile[] => {
  const fallbackPortraitId = PORTRAITS[0]?.id ?? '';
  const portraitByType = new Map(PORTRAITS.map(portrait => [portrait.name, portrait]));
  const basePlayers = BASE_PLAYERS.map((player, index) => {
    const portrait = portraitByType.get(player.portraitType);
    return {
      ...player,
      seedRanking: player.rankingPoints,
      rankingPoints: 0,
      portraitId: portrait?.id ?? PORTRAITS[index % Math.max(PORTRAITS.length, 1)]?.id ?? fallbackPortraitId,
      aiProfileId: player.aiProfileId ?? AI_PROFILES[index % Math.max(AI_PROFILES.length, 1)]?.id,
    };
  });
  const seededPlayers = seedTournamentResults(basePlayers);
  const defaultPortrait = PORTRAITS[0];
  return [
    {
      id: PLAYER_ID,
      name: 'You',
      gender: defaultPortrait?.gender ?? 'male',
      portraitType: defaultPortrait?.name ?? 'Defensive Baseliner',
      rankingPoints: 0,
      tournamentRankingPoints: {},
      minShotTier: 'amateur',
      loadout: DEFAULT_LOADOUT,
      portraitId: fallbackPortraitId,
      tournamentWins: {},
    },
    ...seededPlayers,
  ];
};

const App: React.FC = () => {
  const [accessGranted, setAccessGranted] = useState(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.accessGranted, false)
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [tutorialCompleted, setTutorialCompleted] = useState(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.tutorialComplete, false)
  );
  const [screen, setScreen] = useState<'menu' | 'player' | 'shot-shop' | 'box-open' | 'opponent' | 'tournaments' | 'tournament-result' | 'game' | 'rankings' | 'settings' | 'career' | 'block-summary' | 'tutorial'>('menu');
  const [tutorialStage, setTutorialStage] = useState<'game' | 'loadout' | 'complete'>('game');
  const [tutorialServeDone, setTutorialServeDone] = useState(false);
  const [tutorialHitCount, setTutorialHitCount] = useState(0);
  const [tutorialPhase, setTutorialPhase] = useState<'ground' | 'volley' | 'dropshot'>('ground');
  const [tutorialTargetsHit, setTutorialTargetsHit] = useState<Set<string>>(new Set());
  const [tutorialWelcomeVisible, setTutorialWelcomeVisible] = useState(false);
  const [showShotShopCallout, setShowShotShopCallout] = useState(false);
  const [wallet, setWallet] = useState(() => loadFromStorage<number>(STORAGE_KEYS.wallet, STARTING_CREDITS));
  const [matchesPlayed, setMatchesPlayed] = useState(() => loadFromStorage<number>(STORAGE_KEYS.matchesPlayed, 0));
  const [shopStockCycle, setShopStockCycle] = useState(() => loadFromStorage<number>(STORAGE_KEYS.shopStockCycle, 0));
  const [shopStock, setShopStock] = useState(() => loadFromStorage<string[]>(STORAGE_KEYS.shopStock, []));
  const [careerBlock, setCareerBlock] = useState(() => loadFromStorage<number>(STORAGE_KEYS.careerBlock, 1));
  const [careerBlockResolved, setCareerBlockResolved] = useState(() => loadFromStorage<number>(STORAGE_KEYS.careerBlockResolved, 0));
  const [aiDifficultySetting, setAiDifficultySetting] = useState<DifficultySetting>(() =>
    loadFromStorage<DifficultySetting>(STORAGE_KEYS.aiDifficulty, 'easy')
  );
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
  const [tournamentOrigin, setTournamentOrigin] = useState<'career' | 'tournaments' | null>(null);
  const [pendingTournamentMatchId, setPendingTournamentMatchId] = useState<string | null>(null);
  const [tournamentEarnings, setTournamentEarnings] = useState(0);
  const [tournamentResult, setTournamentResult] = useState<TournamentResultState | null>(null);
  const [blockResultSummary, setBlockResultSummary] = useState<TournamentResultState | null>(null);
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
        tournamentWins: saved.tournamentWins ?? player.tournamentWins ?? {},
        tournamentRankingPoints: saved.tournamentRankingPoints ?? player.tournamentRankingPoints ?? {},
      };
    });
  });
  const [pendingBox, setPendingBox] = useState<{ item: ShopItem; alreadyOwned: boolean } | null>(null);
  const [blockSummary, setBlockSummary] = useState<{
    block: number;
    rows: Array<{
      id: string;
      name: string;
      rankBefore: number;
      rankAfter: number;
      deltaPoints: number;
      pointsAfter: number;
    }>;
  } | null>(null);
  const [blockSummaryNextScreen, setBlockSummaryNextScreen] = useState<'menu' | 'career' | 'tournament-result'>('career');

  const boxPrices: Record<'starter' | 'standard' | 'premium', number> = {
    starter: 240,
    standard: 12000,
    premium: 36000,
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
    window.localStorage.setItem(STORAGE_KEYS.matchesPlayed, JSON.stringify(matchesPlayed));
    window.localStorage.setItem(STORAGE_KEYS.shopStock, JSON.stringify(shopStock));
    window.localStorage.setItem(STORAGE_KEYS.shopStockCycle, JSON.stringify(shopStockCycle));
    window.localStorage.setItem(STORAGE_KEYS.careerBlock, JSON.stringify(careerBlock));
    window.localStorage.setItem(STORAGE_KEYS.careerBlockResolved, JSON.stringify(careerBlockResolved));
    window.localStorage.setItem(STORAGE_KEYS.aiDifficulty, JSON.stringify(aiDifficultySetting));
    window.localStorage.setItem(STORAGE_KEYS.tutorialComplete, JSON.stringify(tutorialCompleted));
    window.localStorage.setItem(STORAGE_KEYS.accessGranted, JSON.stringify(accessGranted));
  }, [accessGranted, aiDifficultySetting, careerBlock, careerBlockResolved, loadout, matchesPlayed, ownedIds, players, shopStock, shopStockCycle, tutorialCompleted, wallet]);
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
  const playerTournamentWins = playerProfile?.tournamentWins ?? {};

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

  const shopItemsById = useMemo(() => new Map(SHOP_ITEMS.map(item => [item.id, item])), []);

  const rollStockTier = useCallback(() => {
    const roll = Math.random() * 100;

    console.log({roll});
    if (roll < 50) return 'amateur';
    if (roll < 80) return 'pro';
    if (roll < 95) return 'elite';
    return 'legendary';
  }, []);

  const generateShopStock = useCallback(() => {
    const ids: string[] = [];
    const nonUniqueItems = SHOP_ITEMS.filter(item => item.tier !== 'unique');
    if (nonUniqueItems.length === 0) return ids;
    for (let i = 0; i < SHOP_STOCK_SIZE; i += 1) {
      let nextId = '';
      let attempts = 0;
      while (!nextId && attempts < 20) {
        console.log('generating stock item', i, attempts);
        const tier = rollStockTier();
        const tierItems = nonUniqueItems.filter(item => item.tier === tier && !ids.includes(item.id));
        const pool = tierItems.length > 0 ? tierItems : nonUniqueItems.filter(item => !ids.includes(item.id));
        if (pool.length === 0) break;
        nextId = pool[Math.floor(Math.random() * pool.length)].id;
        attempts += 1;
      }
      if (nextId) ids.push(nextId);
    }
    return ids;
  }, [rollStockTier]);

  const getStockCycle = useCallback((count: number) => Math.floor(count / 10), []);

  useEffect(() => {
    const valid = shopStock.length === SHOP_STOCK_SIZE && shopStock.every(id => {
      const item = shopItemsById.get(id);
      return item && item.tier !== 'unique';
    });
    const expectedCycle = getStockCycle(matchesPlayed);
    if (!valid) {
      setShopStock(generateShopStock());
      setShopStockCycle(expectedCycle);
      return;
    }
    if (shopStockCycle !== expectedCycle) {
      setShopStock(generateShopStock());
      setShopStockCycle(expectedCycle);
    }
  }, [generateShopStock, getStockCycle, matchesPlayed, shopItemsById, shopStock, shopStockCycle]);

  const shopStockItems = useMemo(
    () => shopStock.map(id => shopItemsById.get(id)).filter(Boolean) as ShopItem[],
    [shopItemsById, shopStock]
  );

  const rollBoxTier = (tier: 'starter' | 'standard' | 'premium'): ShopItem['tier'] => {
    const weights: Array<{ tier: ShopItem['tier']; weight: number }> =
      tier === 'starter'
        ? [
          { tier: 'amateur', weight: 50 },
          { tier: 'pro', weight: 40 },
          { tier: 'elite', weight: 10 },
        ]
        : tier === 'standard'
          ? [
            { tier: 'pro', weight: 50 },
            { tier: 'elite', weight: 35 },
            { tier: 'legendary', weight: 15 },
            { tier: 'unique', weight: 5 },
          ]
          : [
            { tier: 'elite', weight: 55 },
            { tier: 'legendary', weight: 35 },
            { tier: 'unique', weight: 10 },
          ];
    const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of weights) {
      roll -= entry.weight;
      if (roll <= 0) return entry.tier;
    }
    return weights[weights.length - 1].tier;
  };

  const pickRandomItem = (shot: ShotType, boxTier: 'starter' | 'standard' | 'premium'): ShopItem | null => {
    const tier = rollBoxTier(boxTier);
    const tierItems = SHOP_ITEMS.filter(item => item.shot === shot && item.tier === tier);
    const pool = tierItems.length > 0 ? tierItems : SHOP_ITEMS.filter(item => item.shot === shot);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleBuyBox = (shot: ShotType, boxTier: 'starter' | 'standard' | 'premium') => {
    const price = boxPrices[boxTier];
    if (wallet < price) return;
    const item = pickRandomItem(shot, boxTier);
    if (!item) return;
    setWallet(prev => prev - price);
    setOwnedIds(prev => new Set([...Array.from(prev), item.id]));
    setPendingBox({ item, alreadyOwned: ownedIds.has(item.id) });
    setScreen('box-open');
  };

  const handleBuyStockItem = (item: ShopItem) => {
    if (wallet < item.price) return;
    setWallet(prev => prev - item.price);
    setOwnedIds(prev => new Set([...Array.from(prev), item.id]));
  };

  const handleMatchCompleted = useCallback(() => {
    setMatchesPlayed(prev => {
      const next = prev + 1;
      const nextCycle = getStockCycle(next);
      if (nextCycle !== shopStockCycle) {
        setShopStock(generateShopStock());
        setShopStockCycle(nextCycle);
      }
      return next;
    });
  }, [generateShopStock, getStockCycle, shopStockCycle]);

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
        return rank >= 64;
      });
    }
    if (tournament.category === 'pro') {
      return basePool.filter(player => {
        if (player.id === PLAYER_ID) return true;
        const rank = rankingsById.get(player.id) ?? Number.POSITIVE_INFINITY;
        return rank >= 32 && rank <= 80;
      });
    }
    if (tournament.category === 'elite') {
      return basePool.filter(player => {
        if (player.id === PLAYER_ID) return true;
        const rank = rankingsById.get(player.id) ?? Number.POSITIVE_INFINITY;
        return rank <= 64;
      });
    }
    if (tournament.category === 'grand-slam') {
      return basePool.filter(player => {
        if (player.id === PLAYER_ID) return true;
        const rank = rankingsById.get(player.id) ?? Number.POSITIVE_INFINITY;
        return rank <= 32;
      });
    }
    return basePool;
  };

  const getPlacementPoints = (state: TournamentState) => {
    const awardsByPlayer = new Map<string, number>();
    const [, qfPoints, sfPoints, finalPoints, winnerPoints] = state.rankingPoints;

    state.rounds.forEach(round => {
      round.forEach(match => {
        if (!match.winnerId || !match.player1Id || !match.player2Id) return;
        const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
        if (!loserId) return;
        if (match.round === 2 && qfPoints !== undefined) {
          awardsByPlayer.set(loserId, qfPoints);
        } else if (match.round === 3 && sfPoints !== undefined) {
          awardsByPlayer.set(loserId, sfPoints);
        } else if (match.round === 4 && finalPoints !== undefined) {
          awardsByPlayer.set(loserId, finalPoints);
        }
      });
    });

    const finalWinner = state.rounds[3]?.[0]?.winnerId;
    if (finalWinner && winnerPoints !== undefined) {
      awardsByPlayer.set(finalWinner, winnerPoints);
    }
    return awardsByPlayer;
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
    const bias = getBiasedWinChance(p1, p2);
    return Math.random() < bias ? player1Id : player2Id;
  };

  const createTournamentState = (tournament: TournamentDef, options?: { includePlayer?: boolean }) => {
    const eligiblePlayers = getEligibleAiPool(tournament).filter(player => (
      options?.includePlayer === false ? player.id !== PLAYER_ID : true
    ));
    const shuffledEligible = [...eligiblePlayers];
    for (let i = shuffledEligible.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledEligible[i], shuffledEligible[j]] = [shuffledEligible[j], shuffledEligible[i]];
    }
    let participants = shuffledEligible.slice(0, 16);
    const playerIsEligible = eligiblePlayers.some(player => player.id === PLAYER_ID);
    if (playerIsEligible && !participants.some(player => player.id === PLAYER_ID)) {
      participants[participants.length - 1] = playersById.get(PLAYER_ID) || participants[participants.length - 1];
    }
    if (participants.length < 16) {
      const remaining = [...eligiblePlayers]
        .filter(player => !participants.some(existing => existing.id === player.id));
      while (participants.length < 16 && remaining.length > 0) {
        const next = remaining.shift();
        if (next) participants.push(next);
      }
    }
    const rounds: TournamentMatch[][] = [
      [],
      [],
      [],
      [],
    ];
    for (let i = 0; i < 8; i += 1) {
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
        id: `r16-${i}`,
        round: 1,
        slot: i,
        player1Id,
        player2Id,
        winnerId: null,
        aiProfileId,
        rankingAwarded: false,
      });
    }
    for (let i = 0; i < 4; i += 1) {
      rounds[1].push({ id: `qf-${i}`, round: 2, slot: i, player1Id: null, player2Id: null, winnerId: null, rankingAwarded: false });
    }
    for (let i = 0; i < 2; i += 1) {
      rounds[2].push({ id: `sf-${i}`, round: 3, slot: i, player1Id: null, player2Id: null, winnerId: null, rankingAwarded: false });
    }
    rounds[3].push({ id: 'final', round: 4, slot: 0, player1Id: null, player2Id: null, winnerId: null, rankingAwarded: false });
    const state: TournamentState = {
      id: tournament.id,
      name: tournament.name,
      tier: tournament.tier,
      category: tournament.category,
      prizes: tournament.prizes,
      championBonus: tournament.championBonus,
      surface: tournament.surface,
      rankingPoints: tournament.rankingPoints,
      rankingGate: tournament.rankingGate,
      block: tournament.block,
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

  const computeRanks = useCallback((list: PlayerProfile[]) => {
    const ranked = [...list].sort((a, b) => {
      if (b.rankingPoints !== a.rankingPoints) return b.rankingPoints - a.rankingPoints;
      return a.name.localeCompare(b.name);
    });
    const map = new Map<string, number>();
    ranked.forEach((player, index) => {
      map.set(player.id, index + 1);
    });
    return map;
  }, []);

  const finalizeBlockResults = useCallback((block: number, completedState?: TournamentState, nextScreen: 'career' | 'tournament-result' = 'career') => {
    if (careerBlockResolved === block) return;
    const tournamentsInBlock = TOURNAMENTS.filter(tournament => tournament.block === block);
    if (tournamentsInBlock.length === 0) {
      setCareerBlockResolved(block);
      return;
    }
    const resultsByTournament = new Map<string, Map<string, number>>();
    tournamentsInBlock.forEach(tournament => {
      if (completedState && completedState.id === tournament.id) {
        resultsByTournament.set(tournament.id, getPlacementPoints(completedState));
        return;
      }
      const { state } = createTournamentState(tournament, { includePlayer: false });
      simulateTournamentToEnd(state, 0);
      resultsByTournament.set(tournament.id, getPlacementPoints(state));
    });

    setPlayers(prev => {
      const ranksBefore = computeRanks(prev);
      const nextPlayers = prev.map(player => {
        const history = { ...(player.tournamentRankingPoints ?? {}) };
        let delta = 0;
        let blockPoints = 0;
        tournamentsInBlock.forEach(tournament => {
          const prevPoints = history[tournament.id] ?? 0;
          const nextPoints = resultsByTournament.get(tournament.id)?.get(player.id) ?? 0;
          delta += nextPoints - prevPoints;
          blockPoints += nextPoints;
          if (nextPoints > 0) {
            history[tournament.id] = nextPoints;
          } else {
            delete history[tournament.id];
          }
        });
        return {
          ...player,
          rankingPoints: player.rankingPoints + delta,
          tournamentRankingPoints: history,
          blockPoints,
        };
      });
      const ranksAfter = computeRanks(nextPlayers);
      const rows = nextPlayers.map(player => {
        const prevPlayer = prev.find(p => p.id === player.id);
        const prevPoints = prevPlayer?.rankingPoints ?? 0;
        return {
          id: player.id,
          name: player.name,
          rankBefore: ranksBefore.get(player.id) ?? nextPlayers.length,
          rankAfter: ranksAfter.get(player.id) ?? nextPlayers.length,
          deltaPoints: player.rankingPoints - prevPoints,
          blockPoints: (player as any).blockPoints ?? 0,
          pointsAfter: player.rankingPoints,
        };
      }).sort((a, b) => a.rankAfter - b.rankAfter);
      setBlockSummary({ block, rows });
      setBlockSummaryNextScreen(nextScreen);
      setScreen('block-summary');
      return nextPlayers;
    });

    setCareerBlockResolved(block);
  }, [careerBlockResolved, computeRanks, createTournamentState, simulateTournamentToEnd]);

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

  const forfeitTournament = (state: TournamentState) => {
    const updated: TournamentState = {
      ...state,
      rounds: state.rounds.map(round => round.map(match => ({ ...match }))),
    };
    let pendingMatch: TournamentMatch | null = null;
    for (let roundIndex = 0; roundIndex < updated.rounds.length; roundIndex += 1) {
      const match = updated.rounds[roundIndex].find(m => (m.player1Id === PLAYER_ID || m.player2Id === PLAYER_ID) && !m.winnerId);
      if (match) {
        pendingMatch = match;
        break;
      }
    }
    if (pendingMatch) {
      pendingMatch.winnerId = pendingMatch.player1Id === PLAYER_ID ? pendingMatch.player2Id : pendingMatch.player1Id;
      updated.status = 'eliminated';
      resolveNonPlayerMatches(updated, pendingMatch.round - 1);
      propagateWinners(updated, pendingMatch.round - 1);
      simulateTournamentToEnd(updated, pendingMatch.round);
    } else {
      updated.status = 'eliminated';
      simulateTournamentToEnd(updated, 0);
    }
    return updated;
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
    () => applyAiDifficultyModifier(
      applyAiProfileModifiers(buildPlayerStats(SHOP_ITEMS, aiLoadout), selectedAi?.id),
      aiDifficultySetting
    ),
    [aiDifficultySetting, aiLoadout, selectedAi?.id]
  );
  const nextOpponentName = nextOpponentId ? playersById.get(nextOpponentId)?.name : undefined;
  const nextOpponentPortrait = nextOpponentId ? getPlayerPortraitSrc(nextOpponentId) : undefined;
  const nextOpponentRank = nextOpponentId ? rankingsById.get(nextOpponentId) : undefined;
  const tournamentName = tournamentState?.name ?? 'Exhibition';
  const tournamentRound = tournamentState ? formatTournamentRound(nextTournamentMatch?.round) : 'Match';

  const playerPortrait = useMemo(
    () => getPlayerPortraitSrc(PLAYER_ID),
    [playersById]
  );

  const tutorialTargets = useMemo(() => ([
    { id: 'crosscourt', x: 20, y: 40, radius: 12 },
    { id: 'downline', x: 80, y: 40, radius: 12 },
  ]), []);
  const volleyTargets = useMemo(() => ([
    { id: 'volley-cross', x: 25, y: 65, radius: 11 },
    { id: 'volley-line', x: 75, y: 65, radius: 11 },
  ]), []);
  const dropshotZone = useMemo(() => ({
    xMin: 5,
    xMax: 95,
    yMin: 75,
    yMax: 90,
  }), []);
  const remainingTutorialTargets = tutorialPhase === 'volley'
    ? volleyTargets.filter(target => !tutorialTargetsHit.has(target.id))
    : tutorialTargets.filter(target => !tutorialTargetsHit.has(target.id));

  const beginTutorial = useCallback(() => {
    setTutorialCompleted(false);
    setTutorialStage('game');
    setTutorialServeDone(false);
    setTutorialHitCount(0);
    setTutorialPhase('ground');
    setTutorialTargetsHit(new Set());
    setTutorialWelcomeVisible(true);
    setShowShotShopCallout(false);
    setScreen('tutorial');
  }, []);

  const finishTutorial = useCallback(() => {
    setTutorialCompleted(true);
    setShowShotShopCallout(true);
    setScreen('career');
  }, []);

  const handleTutorialTargetHit = useCallback((id: string, isVolley: boolean) => {
    if (tutorialPhase === 'volley' && !isVolley) return;
    setTutorialTargetsHit(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      if (tutorialPhase === 'dropshot') {
        setTutorialStage('complete');
        return next;
      }
      if (tutorialPhase === 'volley') {
        if (next.size >= volleyTargets.length) {
          setTutorialPhase('dropshot');
          return new Set();
        }
        return next;
      }
      if (next.size >= tutorialTargets.length) {
        setTutorialPhase('volley');
        return new Set();
      }
      return next;
    });
  }, [tutorialPhase, tutorialTargets.length, volleyTargets.length]);

  const tutorialAiProfile = AI_PROFILES[0] ?? selectedAi;
  const tutorialAiLoadout = useMemo(
    () => buildTieredLoadout(tutorialAiProfile, 'amateur'),
    [buildTieredLoadout, tutorialAiProfile]
  );
  const tutorialAiStats = useMemo(() => {
    const base = applyAiDifficultyModifier(
      applyAiProfileModifiers(buildPlayerStats(SHOP_ITEMS, tutorialAiLoadout), tutorialAiProfile?.id),
      'easy'
    );
    return {
      serveFirst: { ...base.serveFirst, power: 35, spin: 90, control: 100, shape: 90 },
      serveSecond: { ...base.serveSecond, power: 35, spin: 90, control: 100, shape: 90 },
      forehand: { ...base.forehand, power: 35, spin: 90, control: 100, shape: 90 },
      backhand: { ...base.backhand, power: 35, spin: 90, control: 100, shape: 90 },
      volley: { ...base.volley, control: 100, accuracy: 100 },
      athleticism: { ...base.athleticism, speed: 100, stamina: 100 },
    };
  }, [tutorialAiLoadout, tutorialAiProfile?.id]);

  if (!accessGranted) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-white font-inter overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.25),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(14,116,144,0.2),transparent_45%)]" />
        <div className="relative z-10 h-full flex items-center justify-center px-8">
          <div className="max-w-md w-full rounded-3xl border border-white/20 bg-black/70 px-8 py-6 text-center shadow-[0_0_28px_rgba(15,23,42,0.85)]">
            <div className="text-[10px] font-orbitron uppercase tracking-widest text-slate-300">
              Access Required
            </div>
            <div className="mt-3 text-2xl font-orbitron uppercase tracking-widest text-white">
              Enter Password
            </div>
            <input
              value={passwordInput}
              onChange={(event) => {
                setPasswordInput(event.target.value);
                setPasswordError('');
              }}
              type="password"
              className="mt-5 w-full rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm font-orbitron uppercase tracking-widest text-white/90 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/60"
              placeholder="Password"
            />
            {passwordError && (
              <div className="mt-3 text-[10px] uppercase tracking-widest text-rose-300">
                {passwordError}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (passwordInput.trim().toLowerCase() === 'vibecode') {
                  setAccessGranted(true);
                  setPasswordInput('');
                  setPasswordError('');
                  return;
                }
                setPasswordError('Incorrect password');
              }}
              className="mt-6 px-6 py-2 rounded-full text-[10px] font-orbitron uppercase tracking-widest border border-emerald-300/70 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'tutorial') {
    if (tutorialStage === 'game') {
      const showTimingTip = tutorialPhase === 'ground' && tutorialHitCount >= 4;
      const showVolleyTip = tutorialPhase === 'volley';
      const showDropshotTip = tutorialPhase === 'dropshot';
      const primaryInstruction = tutorialServeDone ? (
        <>
          <span className="text-emerald-200 font-semibold">Arrow keys</span> to move.
          <br />
          <span className="text-emerald-200 font-semibold">Space</span> to hit the ball.
        </>
      ) : (
        <>
          <span className="text-emerald-200 font-semibold">Arrow keys</span> to aim your serve target.
          <br />
          <span className="text-emerald-200 font-semibold">Space</span> to serve.
        </>
      );
      const timingInstruction = showDropshotTip
        ? (
          <>Press <span className="text-emerald-200 font-semibold">X</span> to execute a dropshot. Aim anywhere in the front court zone.</>
        )
        : showVolleyTip
        ? (
          <>Hit early before the bounce to volley. Direction is controlled by how early you hit it. Try both volley targets.</>
        )
        : showTimingTip
          ? (
            <>Early contact sends it cross-court. Late contact goes down the line. Hit both glowing targets.</>
          )
          : undefined;
      return (
        <Game
          playerStats={playerStats}
          aiStats={tutorialAiStats}
          aiProfile={tutorialAiProfile}
          playerLoadout={loadout}
          aiLoadout={tutorialAiLoadout}
          shopItems={SHOP_ITEMS}
          opponentName="Practice Partner"
          playerPortrait={playerPortrait}
          playerRank={playerRank}
          surface="hardcourt"
          playerName={playerName}
          tournamentName="Practice Court"
          tournamentRound="Tutorial Rally"
          onExit={() => {
            setTutorialCompleted(true);
            setShowShotShopCallout(true);
            setScreen('menu');
          }}
          tutorial={{
            introPopup: {
              visible: tutorialWelcomeVisible,
              onContinue: () => setTutorialWelcomeVisible(false),
              onSkip: finishTutorial,
            },
            onSkip: finishTutorial,
            instructionPrimary: primaryInstruction,
            instructionSecondary: timingInstruction,
            targets: showVolleyTip || showTimingTip ? remainingTutorialTargets : undefined,
            targetMode: showDropshotTip ? 'dropshot' : showVolleyTip ? 'volley' : 'ground',
            dropshotZone: showDropshotTip ? dropshotZone : undefined,
            onPlayerServe: () => setTutorialServeDone(true),
            onPlayerHit: () => setTutorialHitCount(prev => prev + 1),
            onTargetHit: handleTutorialTargetHit,
            disableOpeningServeFaults: true,
          }}
        />
      );
    }

    if (tutorialStage === 'loadout') {
      return (
        <Shop
          items={SHOP_ITEMS}
          wallet={wallet}
          ownedIds={ownedIds}
          loadout={loadout}
          onEquip={handleEquip}
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
          tutorialOverlay={{
            title: 'Loadouts & Stats',
            body: 'Every shot has different power, spin, control, and shape. Visit the Shot Shop to collect upgrades.',
            ctaLabel: 'Continue Tutorial',
            onContinue: () => setTutorialStage('game'),
          }}
        />
      );
    }

    if (tutorialStage === 'complete') {
      return (
        <TutorialComplete
          onFinish={finishTutorial}
        />
      );
    }
  }

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
        playerRank={playerRank}
        opponentRank={tournamentState ? nextOpponentRank : undefined}
        surface={tournamentState?.surface ?? 'grass'}
        playerName={playerName}
        tournamentName={tournamentName}
        tournamentRound={tournamentRound}
        onExit={() => {
          if (!tournamentState) {
            setScreen('player');
            return;
          }
          const completedState = tournamentState.status === 'active'
            ? forfeitTournament(tournamentState)
            : tournamentState;
          if (tournamentOrigin === 'career') {
            finalizeBlockResults(completedState.block ?? careerBlock, completedState, 'career');
            if (completedState.block) {
              setCareerBlock(prev => (prev % 26) + 1);
            }
            setTournamentState(null);
            setTournamentEarnings(0);
            setPendingTournamentMatchId(null);
            setTournamentResult(null);
            setBlockResultSummary(null);
            return;
          }
          setTournamentResult({
            outcome: 'eliminated',
            tournamentName: completedState.name,
            earnings: tournamentEarnings,
          });
          setTournamentState(null);
          setTournamentEarnings(0);
          setPendingTournamentMatchId(null);
          setScreen('tournament-result');
        }}
        onMatchEnd={winner => {
          handleMatchCompleted();
          if (!tournamentState || !pendingTournamentMatchId) {
            setScreen('player');
            return;
          }
          const activeTournamentId = tournamentState.id;
          const activeTournamentBlock = tournamentState.block;
          const finalRoundId = tournamentState.rounds[tournamentState.rounds.length - 1]?.[0]?.id;
          const isChampion = winner === 'player' && finalRoundId === pendingTournamentMatchId;
          console.log('[App] onMatchEnd received', {
            winner,
            pendingTournamentMatchId,
            finalRoundId,
            isChampion,
            tournamentId: tournamentState.id,
            tournamentStatus: tournamentState.status,
          });
          let resultToShow: TournamentResultState | null = null;
          let completedState: TournamentState | null = null;
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
              const prize = updated.prizes[match.round - 1] ?? 0;
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
            if (updated.rounds[3][0].winnerId === PLAYER_ID) updated.status = 'champion';
            console.log('[App] tournament status update', {
              updatedStatus: updated.status,
              winnerId: updated.rounds[3][0].winnerId,
              tournamentId: updated.id,
            });
            const championBonus = 0;
            if (updated.status !== 'active') {
              const addedPrize = winner === 'player' ? (updated.prizes[match.round - 1] ?? 0) : 0;
              resultToShow = {
                outcome: updated.status === 'champion' ? 'champion' : 'eliminated',
                tournamentName: updated.name,
                earnings: tournamentEarnings + addedPrize + championBonus,
              };
              simulateTournamentToEnd(updated, match.round);
              completedState = updated;
            }
            return updated;
          });
            if (resultToShow) {
              finalizeBlockResults(
                activeTournamentBlock ?? careerBlock,
                completedState ?? undefined,
                tournamentOrigin === 'career' ? 'career' : 'tournament-result'
              );
              if (activeTournamentBlock) {
                setCareerBlock(prev => (prev % 26) + 1);
              }
              if (isChampion && activeTournamentId) {
                setPlayers(prev => prev.map(player => {
                  if (player.id !== PLAYER_ID) return player;
                  const wins = player.tournamentWins ?? {};
                  return {
                    ...player,
                    tournamentWins: {
                      ...wins,
                      [activeTournamentId]: (wins[activeTournamentId] ?? 0) + 1,
                    },
                  };
                }));
              }
            setTournamentResult(resultToShow);
            setBlockResultSummary(resultToShow);
            setTournamentState(null);
            setTournamentEarnings(0);
            if (!activeTournamentBlock && tournamentOrigin !== 'career') {
              setScreen('tournament-result');
            }
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
        playerTournamentWins={playerTournamentWins}
        playerRank={playerRank}
        playerPoints={playerPoints}
        onSelectTournament={tournamentId => {
          const tournament = TOURNAMENTS.find(t => t.id === tournamentId);
          if (!tournament) return;
          if (!isPlayerEligibleForTournament(tournament, PLAYER_ID)) return;
          setTournamentEarnings(0);
          const { state } = createTournamentState(tournament);
          setTournamentState(state);
          setTournamentOrigin('tournaments');
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
          if (tournamentState && tournamentOrigin === 'career') {
            const completedState = tournamentState.status === 'active'
              ? forfeitTournament(tournamentState)
              : tournamentState;
            setBlockResultSummary({
              outcome: completedState.status === 'champion' ? 'champion' : 'eliminated',
              tournamentName: completedState.name,
              earnings: tournamentEarnings,
            });
            finalizeBlockResults(completedState.block ?? careerBlock, completedState, 'career');
            if (completedState.block) {
              setCareerBlock(prev => (prev % 26) + 1);
            }
            setTournamentState(null);
            setTournamentEarnings(0);
            setPendingTournamentMatchId(null);
            return;
          }
          setTournamentState(null);
          setTournamentEarnings(0);
          setScreen(tournamentOrigin === 'career' ? 'career' : 'tournaments');
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
      <Settings
        onBack={() => setScreen('menu')}
        aiDifficulty={aiDifficultySetting}
        onAiDifficultyChange={setAiDifficultySetting}
        onViewTutorial={beginTutorial}
      />
    );
  }

  if (screen === 'block-summary' && blockSummary) {
    const playerBlockRow = blockSummary.rows.find(row => row.id === PLAYER_ID);
    const resultSummary = blockResultSummary ? {
      outcome: blockResultSummary.outcome,
      tournamentName: blockResultSummary.tournamentName,
      earnings: blockResultSummary.earnings,
      rankingDelta: playerBlockRow?.deltaPoints ?? 0,
    } : undefined;
    return (
      <BlockSummary
        block={blockSummary.block}
        rows={blockSummary.rows}
        resultSummary={resultSummary}
        onContinue={() => {
          setBlockResultSummary(null);
          setScreen(blockSummaryNextScreen);
        }}
      />
    );
  }

  if (screen === 'career') {
    return (
      <Career
        tournaments={TOURNAMENTS}
        currentBlock={careerBlock}
        playerRank={playerRank}
        playerPoints={playerPoints}
        playerTournamentWins={playerTournamentWins}
        onEnterTournament={tournamentId => {
          const tournament = TOURNAMENTS.find(item => item.id === tournamentId);
          if (!tournament) return;
          if (!isPlayerEligibleForTournament(tournament, PLAYER_ID)) return;
          setTournamentEarnings(0);
          const { state } = createTournamentState(tournament);
          setTournamentState(state);
          setTournamentOrigin('career');
          setScreen('tournaments');
        }}
        onSkipBlock={() => {
          setTournamentResult(null);
          setBlockResultSummary(null);
          finalizeBlockResults(careerBlock, undefined, 'career');
          setCareerBlock(prev => (prev % 26) + 1);
        }}
        onBack={() => setScreen('menu')}
      />
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
        stockItems={shopStockItems}
        ownedIds={ownedIds}
        matchesUntilRefresh={10 - (matchesPlayed % 10)}
        onBuyStockItem={handleBuyStockItem}
        onBuyBox={handleBuyBox}
        onBack={() => setScreen('menu')}
        onPlayerPage={() => setScreen('player')}
        tutorialCallout={showShotShopCallout}
        onDismissTutorialCallout={() => setShowShotShopCallout(false)}
      />
    );
  }

  if (screen === 'box-open' && pendingBox) {
    return (
      <ShotBoxOpen
        item={pendingBox.item}
        alreadyOwned={pendingBox.alreadyOwned}
        onEquip={(item) => {
          if (!ownedIds.has(item.id)) return;
          const slot = item.shot as keyof Loadout;
          setLoadout(prev => ({ ...prev, [slot]: item.id }));
          setPendingBox(null);
          setScreen('player');
        }}
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
      onCareer={() => {
        if (!tutorialCompleted) {
          beginTutorial();
          return;
        }
        if (tournamentState && tournamentOrigin === 'career' && tournamentState.status === 'active') {
          setScreen('tournaments');
        } else {
          setScreen('career');
        }
      }}
      onRankings={() => setScreen('rankings')}
      onSettings={() => setScreen('settings')}
    />
  );
};

export default App;
