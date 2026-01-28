
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

export type ShotType = 'serve' | 'forehand' | 'backhand' | 'athleticism';

export type ShotStats = {
  power: number;
  spin: number;
  control: number;
  shape: number;
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
  athleticism: AthleticismStats;
};

export type ShopItem = {
  id: string;
  player: string;
  shot: ShotType;
  stats: ShotStats | AthleticismStats;
  price: number;
};

export type Loadout = {
  serveFirst: string;
  serveSecond: string;
  forehand: string;
  backhand: string;
  athleticism: string;
};
