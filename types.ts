
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
