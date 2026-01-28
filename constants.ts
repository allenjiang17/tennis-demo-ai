
import { ShotQuality } from './types';

export const PHYSICS = {
  BALL_SPEED_BASE: 2600, 
  PLAYER_SPEED: 0.8,      // Movement increment per frame
  HIT_RADIUS: 12,         // Distance units for successful hit
  COURT_BOUNDS: {
    MIN_X: 5, MAX_X: 95,
    MIN_Y: 0, MAX_Y: 180  // Full court lines
  },
  PLAYER_BOUNDS: {
    MIN_X: -10, MAX_X: 110,
    MIN_Y: 72, MAX_Y: 198 // Allow run-off space beyond lines
  }
};

export const MESSAGES = {
  [ShotQuality.PERFECT]: "CRUSHED IT! 🔥",
  [ShotQuality.GOOD]: "SOLID! 👍",
  [ShotQuality.MISS]: "OUT! ❌",
  [ShotQuality.NONE]: "",
};
