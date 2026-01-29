
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  SCORING = 'SCORING',
  GAME_OVER = 'GAME_OVER'
}

export enum ShotQuality {
  PERFECT = 'PERFECT', // Green zone
  GOOD = 'GOOD',       // Yellow zone
  MISS = 'MISS',       // Out of zone
  NONE = 'NONE'
}

export interface PlayerState {
  score: number;
  name: string;
}

export interface GameState {
  player: PlayerState;
  opponent: PlayerState;
  status: GameStatus;
  isPlayerTurn: boolean;
  lastShotQuality: ShotQuality;
  difficulty: number;
}

export type ShotType = 'serve' | 'forehand' | 'backhand' | 'volley' | 'athleticism';

export type ShotStats = {
  power: number;
  spin: number;
  control: number;
  shape: number;
};

export type VolleyStats = {
  control: number;
  accuracy: number;
};

export type AthleticismStats = {
  speed: number;
  stamina: number;
};

export type PlayerStats = {
  serveFirst: ShotStats;
  serveSecond: ShotStats;
  forehand: ShotStats;
  backhand: ShotStats;
  volley: VolleyStats;
  athleticism: AthleticismStats;
};

export type ShopItem = {
  id: string;
  player: string;
  shot: ShotType;
  stats: ShotStats | VolleyStats | AthleticismStats;
  price: number;
  tier: 'amateur' | 'pro' | 'legendary' | 'elite' | 'unique';
  perk?: string;
  description?: string;
};

export type Loadout = {
  serveFirst: string;
  serveSecond: string;
  forehand: string;
  backhand: string;
  volley: string;
  athleticism: string;
};

export type AiTendencies = {
  awayBias: number;
  homeY: number;
  dropShotChance: number;
  errorModifier: number;
};

export type AiProfile = {
  id: string;
  name: string;
  description: string;
  loadout: Loadout;
  tendencies: AiTendencies;
};

export type CourtSurface = 'grass' | 'hardcourt' | 'clay';

export type PlayerProfile = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  portraitType: string;
  portraitId?: string;
  aiProfileId?: string;
  rankingPoints: number;
  loadout: Loadout;
  minShotTier: ShopItem['tier'];
};
