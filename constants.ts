
import { ShotQuality } from './types';

export const PHYSICS = {
  BALL_SPEED_BASE: 2600, 
  PLAYER_SPEED: 0.8,      // Movement increment per frame
  HIT_RADIUS: 12,         // Distance units for successful hit
  COURT_BOUNDS: {
    MIN_X: 5, MAX_X: 95,
    MIN_Y: 55, MAX_Y: 95  // Player constrained to bottom half
  }
};

export const MESSAGES = {
  [ShotQuality.PERFECT]: "CRUSHED IT! 🔥",
  [ShotQuality.GOOD]: "SOLID! 👍",
  [ShotQuality.MISS]: "OUT! ❌",
  [ShotQuality.NONE]: "",
};
