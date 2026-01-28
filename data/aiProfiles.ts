import { AiProfile } from '../types';

export const AI_PROFILES: AiProfile[] = [
  {
    id: 'defensive-baseliner',
    name: 'Defensive Baseliner',
    description: 'Stays deep, absorbs pace, mixes targets evenly.',
    loadout: {
      serveFirst: 'sampras-serve',
      serveSecond: 'pro-serve',
      forehand: 'djokovic-backhand',
      backhand: 'henin-backhand',
      athleticism: 'nadal-athleticism',
    },
    tendencies: {
      awayBias: 0.5,
      homeY: 6,
      dropShotChance: 0.1,
    },
  },
  {
    id: 'aggressive-shotmaker',
    name: 'Aggressive Shotmaker',
    description: 'Rips angles and likes the drop shot.',
    loadout: {
      serveFirst: 'sampras-serve',
      serveSecond: 'isner-kick-serve',
      forehand: 'sinner-forehand',
      backhand: 'djokovic-backhand',
      athleticism: 'alcaraz-athleticism',
    },
    tendencies: {
      awayBias: 0.8,
      homeY: 8,
      dropShotChance: 0.3,
    },
  },
  {
    id: 'serve-volleyer',
    name: 'Serve & Volleyer',
    description: 'Charges the net and goes away from you.',
    loadout: {
      serveFirst: 'sampras-serve',
      serveSecond: 'pro-serve',
      forehand: 'federer-forehand',
      backhand: 'henin-backhand',
      athleticism: 'djokovic-athleticism',
    },
    tendencies: {
      awayBias: 0.75,
      homeY: 36,
      dropShotChance: 0.1,
    },
  },
];
