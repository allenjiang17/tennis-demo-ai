import { AiProfile } from '../types';

export const AI_PROFILES: AiProfile[] = [
  {
    id: 'defensive-baseliner',
    name: 'Defensive Baseliner',
    description: 'Stays deep, absorbs pace, mixes targets evenly.',
    loadout: {
      serveFirst: 'hurkacz-serve',
      serveSecond: 'berrettini-serve',
      forehand: 'de-minaur-forehand',
      backhand: 'dimitrov-backhand',
      volley: 'kasatkina-volley',
      athleticism: 'svitolina-athleticism',
    },
    tendencies: {
      awayBias: 0.5,
      homeY: 12,
      dropShotChance: 0.1,
    },
  },
  {
    id: 'aggressive-shotmaker',
    name: 'Aggressive Shotmaker',
    description: 'Rips angles and likes the drop shot.',
    loadout: {
      serveFirst: 'djokovic-serve',
      serveSecond: 'serena-serve',
      forehand: 'alcaraz-forehand',
      backhand: 'sinner-backhand',
      volley: 'federer-volley',
      athleticism: 'sabalenka-athleticism',
    },
    tendencies: {
      awayBias: 0.8,
      homeY: 16,
      dropShotChance: 0.3,
    },
  },
  {
    id: 'serve-volleyer',
    name: 'Serve & Volleyer',
    description: 'Charges the net and goes away from you.',
    loadout: {
      serveFirst: 'special-serena-serve',
      serveSecond: 'djokovic-serve',
      forehand: 'special-nadal-forehand',
      backhand: 'special-medvedev-backhand',
      volley: 'special-federer-volley',
      athleticism: 'special-murray-athleticism',
    },
    tendencies: {
      awayBias: 0.75,
      homeY: 72,
      dropShotChance: 0.1,
    },
  },
  {
    id: 'counterpuncher',
    name: 'Counterpuncher',
    description: 'Absorbs pace, redirects, and waits for errors.',
    loadout: {
      serveFirst: 'berrettini-serve',
      serveSecond: 'hurkacz-serve',
      forehand: 'fritz-forehand',
      backhand: 'swiatek-backhand',
      volley: 'barty-volley',
      athleticism: 'murray-athleticism',
    },
    tendencies: {
      awayBias: 0.4,
      homeY: 18,
      dropShotChance: 0.05,
    },
  },
  {
    id: 'power-server',
    name: 'Power Server',
    description: 'Big serves and flat drives to shorten points.',
    loadout: {
      serveFirst: 'special-serena-serve',
      serveSecond: 'djokovic-serve',
      forehand: 'special-alcaraz-forehand',
      backhand: 'special-medvedev-backhand',
      volley: 'special-federer-volley',
      athleticism: 'tiafoe-athleticism',
    },
    tendencies: {
      awayBias: 0.6,
      homeY: 24,
      dropShotChance: 0.08,
    },
  },
  {
    id: 'all-court-artist',
    name: 'All-Court Artist',
    description: 'Mixes spins, angles, and net approaches.',
    loadout: {
      serveFirst: 'djokovic-serve',
      serveSecond: 'serena-serve',
      forehand: 'nadal-forehand',
      backhand: 'sinner-backhand',
      volley: 'special-henin-volley',
      athleticism: 'special-halep-athleticism',
    },
    tendencies: {
      awayBias: 0.55,
      homeY: 40,
      dropShotChance: 0.18,
    },
  },
];
